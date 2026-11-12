import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import {
  calculateServerOrderPricing,
  computeSubscriptionEndDate,
  createWebhookSignature,
  normalizePaymentProviderAdapter,
} from "../../../lib/monetization/payment-provider-adapter";
import { resolveUserEntitlement } from "../../../lib/monetization/entitlement-engine";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Milestone 2.12.4 & 2.12.10: Server-Authoritative Subscription Checkout, Free Trial & Transparent Cancel API
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const serverClient = getAdminClient(req);
  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token." });
  }

  const {
    action = "checkout", // checkout | create_sepay_order | start_trial | cancel | upgrade_switch | simulate_failure
    user_id,
    plan_code = "VIP_YEARLY",
    provider = "sepay",
    coupon_code = null,
    idempotency_key,
    cancellation_reason = null,
  } = req.body || {};

  const resolvedUserId = authUser?.id || user_id;
  if (!resolvedUserId || !UUID_REGEX.test(resolvedUserId)) {
    return res.status(400).json({ success: false, error: "Valid authenticated user_id UUID required." });
  }
  if (authUser && user_id && authUser.id !== user_id) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user checkout denied." });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  try {
    // 0. Create Pending SePay VA VietQR Order (Activated strictly by SePay Webhook)
    if (
      action === "create_sepay_order" ||
      ((action === "checkout" || action === "upgrade_switch") && String(provider || "").toLowerCase() === "sepay")
    ) {
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Vui lòng đăng nhập bằng tài khoản Supabase để thanh toán VietQR." });
      }
      const { data: rpcRes, error: rpcErr } = await serverClient.rpc("create_sepay_checkout_order", {
        p_plan_code: plan_code,
        p_coupon_code: coupon_code || null,
        p_idempotency_key: idempotency_key || null,
      });
      if (rpcErr) throw rpcErr;
      if (!rpcRes?.ok) {
        return res.status(Number(rpcRes?.http_status || 400)).json({
          success: false,
          error: rpcRes?.error || "Không thể khởi tạo đơn VietQR SePay.",
        });
      }
      return res.status(200).json({
        success: true,
        pendingPayment: true,
        deduped: Boolean(rpcRes.deduped),
        order_code: rpcRes.order_code,
        transaction: rpcRes.transaction,
        gateway: rpcRes.gateway,
      });
    }

    // 1. Transparent 2-Click Cancel (preserves 100% learning progress)
    if (action === "cancel") {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY && authUser) {
        const { data: rpcCancel, error: rpcCancelErr } = await serverClient.rpc("cancel_active_vip_subscription", {
          p_reason: cancellation_reason || null,
        });
        if (rpcCancelErr) throw rpcCancelErr;
        if (!rpcCancel?.ok) {
          return res.status(Number(rpcCancel?.http_status || 400)).json({
            success: false,
            error: rpcCancel?.error || "Không thể hủy gói VIP.",
          });
        }
        const ent = await resolveUserEntitlement({ serverClient, userId: resolvedUserId });
        return res.status(200).json({
          success: true,
          subscription: rpcCancel.subscription,
          entitlement: ent,
          message: "Đã hủy gói VIP thành công. Toàn bộ lịch sử học tập, Streak, XP và Mastery của bạn được bảo toàn 100%.",
        });
      }

      const { data: activeSub } = await serverClient
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", resolvedUserId)
        .in("status", ["trialing", "active", "grace_period"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activeSub) {
        return res.status(404).json({ success: false, error: "Không tìm thấy gói VIP đang hoạt động để hủy." });
      }

      const { data: canceledSub, error: cancelErr } = await serverClient
        .from("user_subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          canceled_at: nowIso,
          cancellation_reason: cancellation_reason || "USER_SELF_SERVICE_CANCEL",
          updated_at: nowIso,
        })
        .eq("id", activeSub.id)
        .select()
        .single();
      if (cancelErr) throw cancelErr;

      await serverClient.from("subscription_events").insert({
        subscription_id: activeSub.id,
        user_id: resolvedUserId,
        event_type: "SUBSCRIPTION_CANCELED_TRANSPARENT",
        metadata: { reason: cancellation_reason || "user_requested", dataPreserved: true },
      });

      await serverClient.from("profiles").update({ role: "FREE", updated_at: nowIso }).eq("id", resolvedUserId);

      await serverClient.from("behavior_events").insert({
        user_id: resolvedUserId,
        event_category: "monetization",
        event_name: "SUBSCRIPTION_CANCELED",
        metadata: { subscriptionId: activeSub.id, reason: cancellation_reason },
      });

      const ent = await resolveUserEntitlement({ serverClient, userId: resolvedUserId });
      return res.status(200).json({
        success: true,
        subscription: canceledSub,
        entitlement: ent,
        message: "Đã hủy gói VIP thành công. Toàn bộ lịch sử học tập, Streak, XP và Mastery của bạn được bảo toàn 100%.",
      });
    }

    // Load target plan strictly from DB
    const { data: plan } = await serverClient
      .from("subscription_plans")
      .select("*")
      .eq("code", plan_code)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) {
      return res.status(404).json({ success: false, error: `Gói '${plan_code}' không tồn tại hoặc ngừng cung cấp.` });
    }

    // 2. Start Transparent Free Trial (Day 0 -> Day 7)
    if (action === "start_trial") {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY && authUser) {
        const { data: rpcTrial, error: rpcTrialErr } = await serverClient.rpc("start_vip_trial_order", {
          p_plan_code: plan_code,
        });
        if (rpcTrialErr) throw rpcTrialErr;
        if (!rpcTrial?.ok) {
          return res.status(Number(rpcTrial?.http_status || 400)).json({
            success: false,
            error: rpcTrial?.error || "Không thể kích hoạt dùng thử VIP.",
          });
        }
        const entitlement = await resolveUserEntitlement({ serverClient, userId: resolvedUserId });
        return res.status(200).json({
          success: true,
          subscription: rpcTrial.subscription,
          entitlement,
          disclosure: `Bạn đang dùng thử miễn phí ${plan.trial_days} ngày. Sau ${new Date(rpcTrial.subscription.trial_ends_at).toLocaleDateString("vi-VN")}, giá niêm yết là ${Number(plan.price_vnd).toLocaleString()}đ/${plan.billing_cycle}. Bạn có thể hủy bất kỳ lúc nào.`,
        });
      }
      if (Number(plan.trial_days || 0) <= 0) {
        return res.status(400).json({ success: false, error: "Gói đã chọn không áp dụng dùng thử miễn phí." });
      }
      const { data: priorTrial } = await serverClient
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", resolvedUserId)
        .limit(1)
        .maybeSingle();
      if (priorTrial) {
        return res.status(400).json({ success: false, error: "Tài khoản đã từng kích hoạt dùng thử trước đó." });
      }

      const trialEnd = computeSubscriptionEndDate(plan.billing_cycle, now, true, plan.trial_days);
      const { data: subRow, error: subErr } = await serverClient
        .from("user_subscriptions")
        .insert({
          user_id: resolvedUserId,
          plan_id: plan.id,
          status: "trialing",
          provider: "manual",
          current_period_start: nowIso,
          current_period_end: trialEnd.toISOString(),
          trial_ends_at: trialEnd.toISOString(),
        })
        .select()
        .single();
      if (subErr) throw subErr;

      await Promise.all([
        serverClient.from("profiles").update({ role: "VIP", updated_at: nowIso }).eq("id", resolvedUserId),
        serverClient.from("subscription_events").insert({
          subscription_id: subRow.id,
          user_id: resolvedUserId,
          event_type: "TRIAL_STARTED",
          metadata: { trialDays: plan.trial_days, endsAt: trialEnd.toISOString(), postTrialPriceVnd: plan.price_vnd },
        }),
        serverClient.from("conversion_events").insert([
          { user_id: resolvedUserId, funnel_stage: "TRIAL_STARTED", metadata: { planCode: plan.code } },
          { user_id: resolvedUserId, funnel_stage: "SUBSCRIPTION_ACTIVE", metadata: { planCode: plan.code } },
        ]),
        serverClient.from("behavior_events").insert({
          user_id: resolvedUserId,
          event_category: "monetization",
          event_name: "TRIAL_STARTED",
          metadata: { planCode: plan.code },
        }),
      ]);

      const entitlement = await resolveUserEntitlement({ serverClient, userId: resolvedUserId });
      return res.status(200).json({
        success: true,
        subscription: subRow,
        entitlement,
        disclosure: `Bạn đang dùng thử miễn phí ${plan.trial_days} ngày. Sau ${trialEnd.toLocaleDateString("vi-VN")}, giá niêm yết là ${Number(plan.price_vnd).toLocaleString()}đ/${plan.billing_cycle}. Bạn có thể hủy bất kỳ lúc nào.`,
      });
    }

    // 3. Idempotent Paid Checkout / Upgrade Switch
    const txIdemKey = String(idempotency_key || `chk_${resolvedUserId}_${plan.code}_${now.toISOString().slice(0, 16)}`);
    const { data: existingTx } = await serverClient
      .from("payment_transactions")
      .select("*")
      .eq("user_id", resolvedUserId)
      .eq("idempotency_key", txIdemKey)
      .maybeSingle();

    if (existingTx) {
      const ent = await resolveUserEntitlement({ serverClient, userId: resolvedUserId });
      return res.status(200).json({
        success: true,
        deduped: true,
        transaction: existingTx,
        entitlement: ent,
      });
    }

    // Validate Coupon strictly server-side if passed
    let couponObj = null;
    if (coupon_code) {
      const { data: foundCoupon } = await serverClient
        .from("discount_coupons")
        .select("*")
        .eq("code", String(coupon_code).trim().toUpperCase())
        .maybeSingle();
      if (!foundCoupon) {
        return res.status(400).json({ success: false, error: "Mã giảm giá không tồn tại." });
      }
      const { data: alreadyUsed } = await serverClient
        .from("user_coupons")
        .select("id")
        .eq("user_id", resolvedUserId)
        .eq("coupon_id", foundCoupon.id)
        .maybeSingle();
      if (alreadyUsed) {
        return res.status(400).json({ success: false, error: "Bạn đã sử dụng mã giảm giá này." });
      }
      couponObj = foundCoupon;
    }

    const pricing = calculateServerOrderPricing({ plan, coupon: couponObj, now });
    if (pricing.couponError) {
      return res.status(400).json({ success: false, error: pricing.couponError });
    }

    const adapter = normalizePaymentProviderAdapter(provider);
    const isFailedSim = action === "simulate_failure";

    const periodEnd = computeSubscriptionEndDate(plan.billing_cycle, now, false);
    const externalTxId = `${adapter.key.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    let activeSub = null;
    if (!isFailedSim) {
      // Cancel/supersede older active sub on upgrade switch
      await serverClient
        .from("user_subscriptions")
        .update({ status: "canceled", updated_at: nowIso })
        .eq("user_id", resolvedUserId)
        .in("status", ["trialing", "active", "grace_period"]);

      const { data: newSub, error: subInsErr } = await serverClient
        .from("user_subscriptions")
        .insert({
          user_id: resolvedUserId,
          plan_id: plan.id,
          status: "active",
          provider: adapter.key,
          current_period_start: nowIso,
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();
      if (subInsErr) throw subInsErr;
      activeSub = newSub;
    }

    const { data: paymentTx, error: txErr } = await serverClient
      .from("payment_transactions")
      .insert({
        user_id: resolvedUserId,
        subscription_id: activeSub?.id || null,
        plan_id: plan.id,
        provider: adapter.key,
        idempotency_key: txIdemKey,
        amount_vnd: pricing.basePrice,
        discount_vnd: pricing.discountVnd,
        final_amount_vnd: pricing.finalPrice,
        coupon_code: pricing.couponApplied,
        status: isFailedSim ? "failed" : "succeeded",
        provider_tx_id: externalTxId,
        metadata: { adapter: adapter.label, billingCycle: plan.billing_cycle },
      })
      .select()
      .single();
    if (txErr) throw txErr;

    if (isFailedSim) {
      return res.status(402).json({
        success: false,
        paymentFailed: true,
        transaction: paymentTx,
        error: "Thanh toán chưa hoàn tất (cổng thanh toán từ chối). Quyền tài khoản không thay đổi.",
      });
    }

    if (couponObj) {
      await Promise.all([
        serverClient.from("user_coupons").insert({
          user_id: resolvedUserId,
          coupon_id: couponObj.id,
          payment_tx_id: paymentTx.id,
        }),
        serverClient
          .from("discount_coupons")
          .update({ used_count: Number(couponObj.used_count || 0) + 1 })
          .eq("id", couponObj.id),
      ]);
    }

    // Record idempotent webhook audit trail + activate VIP role & funnel telemetry
    const webhookPayload = { external_event_id: externalTxId, user_id: resolvedUserId, status: "succeeded", tx_id: paymentTx.id };
    await Promise.all([
      serverClient.from("profiles").update({ role: "VIP", updated_at: nowIso }).eq("id", resolvedUserId),
      serverClient.from("subscription_events").insert({
        subscription_id: activeSub.id,
        user_id: resolvedUserId,
        event_type: action === "upgrade_switch" ? "SUBSCRIPTION_UPGRADED" : "SUBSCRIPTION_ACTIVATED",
        metadata: { planCode: plan.code, amountVnd: pricing.finalPrice, provider: adapter.key },
      }),
      serverClient.from("payment_webhook_events").upsert(
        {
          provider: adapter.key,
          external_event_id: externalTxId,
          signature_valid: true,
          payload_hash: createWebhookSignature(webhookPayload).slice(0, 24),
          payload: webhookPayload,
          processing_status: "processed",
          processed_at: nowIso,
        },
        { onConflict: "provider,external_event_id", ignoreDuplicates: true }
      ),
      serverClient.from("conversion_events").insert([
        { user_id: resolvedUserId, funnel_stage: "PAYMENT", metadata: { planCode: plan.code, finalPrice: pricing.finalPrice } },
        { user_id: resolvedUserId, funnel_stage: action === "upgrade_switch" ? "UPGRADE" : "SUBSCRIPTION_ACTIVE", metadata: { planCode: plan.code } },
      ]),
      serverClient.from("behavior_events").insert({
        user_id: resolvedUserId,
        event_category: "monetization",
        event_name: "SUBSCRIPTION_PURCHASED",
        metadata: { planCode: plan.code, provider: adapter.key, finalPrice: pricing.finalPrice },
      }),
      serverClient
        .from("ab_assignments")
        .update({ converted: true })
        .eq("user_id", resolvedUserId)
        .eq("experiment_key", "paywall_copy_value_v1"),
    ]);

    const entitlement = await resolveUserEntitlement({ serverClient, userId: resolvedUserId });

    return res.status(200).json({
      success: true,
      deduped: false,
      transaction: paymentTx,
      subscription: activeSub,
      entitlement,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
