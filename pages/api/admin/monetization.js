import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdminWithGuard } from "../../../lib/admin/admin-guard";
import { FUNNEL_STAGES } from "../../../lib/monetization/behavioral-engine";
import { computeAbSignificance } from "../../../lib/monetization/paywall-ab-engine";
import { invalidateMonetizationCatalogCache } from "../monetization/overview";

/**
 * Milestone 2.12.14: Admin Monetization Revenue (MRR/ARR/LTV), 14-Stage Funnel & A/B Dashboard API
 * Zero-Trust RBAC & Rate-Limited via verifyAdminWithGuard.
 */
export default async function handler(req, res) {
  const adminCtx = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_monetization" });
  if (!adminCtx) return;

  const serverClient = getAdminClient(req);

  if (req.method === "GET") {
    try {
      const [
        { data: plans },
        { data: subs },
        { data: txs },
        { data: coupons },
        { data: paywallConfigs },
        { data: abRows },
        { data: convEvents },
        { data: segments },
        { data: profiles },
        { data: sepayGateway },
        { data: sepaySecret },
      ] = await Promise.all([
        serverClient.from("subscription_plans").select("*").order("sort_order", { ascending: true }),
        serverClient.from("user_subscriptions").select("*, plan:subscription_plans(code, billing_cycle, price_vnd)"),
        serverClient.from("payment_transactions").select("*").order("created_at", { ascending: false }).limit(500),
        serverClient.from("discount_coupons").select("*").order("created_at", { ascending: false }),
        serverClient.from("paywall_configs").select("*").order("trigger_key", { ascending: true }),
        serverClient.from("ab_assignments").select("*"),
        serverClient.from("conversion_events").select("user_id, funnel_stage"),
        serverClient.from("user_segments").select("segment, intent_score"),
        serverClient.from("profiles").select("id, role"),
        serverClient.from("payment_gateway_configs").select("*").eq("provider", "sepay").maybeSingle(),
        serverClient.from("payment_gateway_secrets").select("provider, webhook_api_key, updated_at").eq("provider", "sepay").maybeSingle(),
      ]);

      const succeededTxs = (txs || []).filter((t) => t.status === "succeeded");
      const refundedTxs = (txs || []).filter((t) => t.status === "refunded");
      const totalRevenueVnd = succeededTxs.reduce((s, t) => s + Number(t.final_amount_vnd || 0), 0);

      const activeSubs = (subs || []).filter((s) => ["active", "grace_period"].includes(s.status));
      const trialingSubs = (subs || []).filter((s) => s.status === "trialing");
      const canceledSubs = (subs || []).filter((s) => s.status === "canceled");

      // Monthly Recurring Revenue normalization
      const mrrVnd = activeSubs.reduce((sum, s) => {
        const p = Number(s.plan?.price_vnd || 0);
        const cyc = s.plan?.billing_cycle;
        if (cyc === "yearly") return sum + Math.round(p / 12);
        if (cyc === "quarterly") return sum + Math.round(p / 3);
        if (cyc === "lifetime") return sum + Math.round(p / 24);
        return sum + p;
      }, 0);
      const arrVnd = mrrVnd * 12;

      const payingUsersCount = new Set(succeededTxs.map((t) => t.user_id)).size;
      const arppuVnd = payingUsersCount > 0 ? Math.round(totalRevenueVnd / payingUsersCount) : 0;
      const totalSubPool = activeSubs.length + canceledSubs.length;
      const churnRatePercent = totalSubPool > 0 ? Math.round((canceledSubs.length / totalSubPool) * 1000) / 10 : 0;
      const ltvVnd = churnRatePercent > 0 ? Math.round(arppuVnd / (churnRatePercent / 100)) : arppuVnd * 6;
      const totalUsers = (profiles || []).length;
      const conversionRatePercent = totalUsers > 0 ? Math.round((activeSubs.length / totalUsers) * 1000) / 10 : 0;

      // 14-Stage Funnel counts
      const funnelMap = new Map(FUNNEL_STAGES.map((st) => [st, new Set()]));
      for (const ce of convEvents || []) {
        funnelMap.get(ce.funnel_stage)?.add(ce.user_id);
      }
      const funnel = FUNNEL_STAGES.map((stage) => ({
        stage,
        users: funnelMap.get(stage)?.size || 0,
      }));

      // A/B Testing significance calculation
      const ctrlRows = (abRows || []).filter((r) => r.variant_key === "control");
      const trtRows = (abRows || []).filter((r) => r.variant_key === "progress_anchored");
      const abSignificance = computeAbSignificance({
        nA: ctrlRows.length,
        convA: ctrlRows.filter((r) => r.converted).length,
        nB: trtRows.length,
        convB: trtRows.filter((r) => r.converted).length,
      });

      // Segment Distribution
      const segmentCounts = {};
      for (const s of segments || []) {
        segmentCounts[s.segment] = (segmentCounts[s.segment] || 0) + 1;
      }

      return res.status(200).json({
        success: true,
        metrics: {
          totalRevenueVnd,
          mrrVnd,
          arrVnd,
          activeSubscribers: activeSubs.length,
          trialingUsers: trialingSubs.length,
          conversionRatePercent,
          churnRatePercent,
          refundCount: refundedTxs.length,
          arppuVnd,
          ltvVnd,
        },
        funnel,
        abTesting: {
          experimentKey: "paywall_copy_value_v1",
          controlCount: ctrlRows.length,
          treatmentCount: trtRows.length,
          ...abSignificance,
        },
        segmentCounts,
        plans: plans || [],
        coupons: coupons || [],
        paywallConfigs: paywallConfigs || [],
        sepayConfig: {
          bank_code: sepayGateway?.bank_code || "MBBank",
          account_number: sepayGateway?.account_number || "",
          account_name: sepayGateway?.account_name || "",
          va_prefix: sepayGateway?.va_prefix || "GEVIP",
          qr_template: sepayGateway?.qr_template || "compact",
          is_active: sepayGateway?.is_active !== false,
          has_webhook_key: Boolean(sepaySecret?.webhook_api_key?.trim()),
          webhook_key_preview: sepaySecret?.webhook_api_key?.trim()
            ? `${sepaySecret.webhook_api_key.trim().slice(0, 4)}••••••••${sepaySecret.webhook_api_key.trim().slice(-4)}`
            : "",
        },
        sepayTransactions: (txs || []).filter((t) => t.provider === "sepay").slice(0, 12),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    const {
      action,
      plan_code,
      price_vnd,
      compare_at_vnd,
      original_price_vnd,
      trial_days,
      badge_text,
      trigger_key,
      is_active,
      daily_cap,
      coupon_code,
      discount_type,
      discount_value,
      min_amount_vnd,
      max_uses,
      expires_in_days,
    } = req.body || {};

    try {
      if (action === "update_plan_price" && plan_code) {
        const updatePayload = { updated_at: new Date().toISOString() };
        if (price_vnd !== undefined && price_vnd !== null && !Number.isNaN(Number(price_vnd))) {
          updatePayload.price_vnd = Math.max(0, Math.round(Number(price_vnd)));
        }
        const rawCompareAt = compare_at_vnd !== undefined ? compare_at_vnd : original_price_vnd;
        if (rawCompareAt !== undefined && rawCompareAt !== null && !Number.isNaN(Number(rawCompareAt))) {
          updatePayload.compare_at_vnd = Math.max(0, Math.round(Number(rawCompareAt)));
        }
        if (trial_days !== undefined && trial_days !== null && !Number.isNaN(Number(trial_days))) {
          updatePayload.trial_days = Math.min(365, Math.max(0, Math.round(Number(trial_days))));
        }
        if (typeof badge_text === "string") {
          updatePayload.badge_text = badge_text.trim().slice(0, 48) || null;
        }
        if (typeof is_active === "boolean") {
          updatePayload.is_active = is_active;
        }
        const { data: updatedPlan, error } = await serverClient
          .from("subscription_plans")
          .update(updatePayload)
          .eq("code", plan_code)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!updatedPlan) {
          return res.status(403).json({
            success: false,
            error: `Không thể lưu thay đổi cho gói '${plan_code}' (không tìm thấy bản ghi hoặc thiếu quyền RLS).`,
          });
        }
        invalidateMonetizationCatalogCache();
        return res.status(200).json({ success: true, plan: updatedPlan });
      }

      if (action === "toggle_paywall" && trigger_key) {
        const { data: updatedPw, error } = await serverClient
          .from("paywall_configs")
          .update({
            ...(typeof is_active === "boolean" ? { is_active } : {}),
            ...(daily_cap !== undefined ? { daily_cap: Math.max(0, Number(daily_cap)) } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("trigger_key", trigger_key)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!updatedPw) {
          return res.status(403).json({
            success: false,
            error: `Không thể cập nhật paywall '${trigger_key}' (không tìm thấy hoặc thiếu quyền RLS).`,
          });
        }
        return res.status(200).json({ success: true, paywallConfig: updatedPw });
      }

      if (action === "create_coupon" && coupon_code) {
        const normalizedCode = String(coupon_code).trim().toUpperCase();
        if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedCode)) {
          return res.status(400).json({
            success: false,
            error: "Mã giảm giá phải dài 3–32 ký tự và chỉ gồm chữ cái A-Z, số 0-9, '-' hoặc '_'.",
          });
        }
        const normalizedType = discount_type === "fixed_vnd" ? "fixed_vnd" : "percent";
        const parsedDiscount = Number(discount_value);
        const boundedDiscount =
          normalizedType === "percent"
            ? Math.min(90, Math.max(1, Math.round(Number.isFinite(parsedDiscount) ? parsedDiscount : 15)))
            : Math.min(5000000, Math.max(1000, Math.round(Number.isFinite(parsedDiscount) ? parsedDiscount : 20000)));
        const parsedMinAmount = Number(min_amount_vnd);
        const boundedMinAmount = Math.max(0, Math.round(Number.isFinite(parsedMinAmount) ? parsedMinAmount : 0));
        const parsedMaxUses = Number(max_uses);
        const boundedMaxUses = Math.min(1000000, Math.max(1, Math.round(Number.isFinite(parsedMaxUses) ? parsedMaxUses : 1000)));
        const parsedDays = Number(expires_in_days);
        const expiresAt =
          expires_in_days !== undefined && expires_in_days !== null && Number.isFinite(parsedDays) && parsedDays > 0
            ? new Date(Date.now() + Math.min(3650, parsedDays) * 86400000).toISOString()
            : null;

        const { data: created, error } = await serverClient
          .from("discount_coupons")
          .upsert(
            {
              code: normalizedCode,
              discount_type: normalizedType,
              discount_value: boundedDiscount,
              min_amount_vnd: boundedMinAmount,
              max_uses: boundedMaxUses,
              expires_at: expiresAt,
              is_active: typeof is_active === "boolean" ? is_active : true,
            },
            { onConflict: "code" }
          )
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!created) {
          return res.status(403).json({
            success: false,
            error: `Không thể lưu mã giảm giá '${normalizedCode}' (thiếu quyền ghi RLS).`,
          });
        }
        return res.status(200).json({ success: true, coupon: created });
      }

      if (action === "toggle_coupon" && coupon_code) {
        const normalizedCode = String(coupon_code).trim().toUpperCase();
        const { data: updatedCoupon, error } = await serverClient
          .from("discount_coupons")
          .update({ is_active: Boolean(is_active) })
          .eq("code", normalizedCode)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!updatedCoupon) {
          return res.status(404).json({
            success: false,
            error: `Không thể cập nhật trạng thái mã '${normalizedCode}' (không tìm thấy hoặc thiếu quyền RLS).`,
          });
        }
        return res.status(200).json({ success: true, coupon: updatedCoupon });
      }

      if (action === "delete_coupon" && coupon_code) {
        const normalizedCode = String(coupon_code).trim().toUpperCase();
        const { data: existing, error: fetchErr } = await serverClient
          .from("discount_coupons")
          .select("id, code, used_count")
          .eq("code", normalizedCode)
          .maybeSingle();
        if (fetchErr || !existing) {
          return res.status(404).json({ success: false, error: `Không tìm thấy mã giảm giá '${normalizedCode}'.` });
        }
        const { count: refCount } = await serverClient
          .from("user_coupons")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", existing.id);

        if ((existing.used_count || 0) > 0 || (refCount || 0) > 0) {
          const { data: archived, error: archErr } = await serverClient
            .from("discount_coupons")
            .update({ is_active: false })
            .eq("id", existing.id)
            .select()
            .maybeSingle();
          if (archErr) throw archErr;
          if (!archived) {
            return res.status(403).json({
              success: false,
              error: `Không thể tạm dừng mã '${normalizedCode}' (thiếu quyền ghi RLS).`,
            });
          }
          return res.status(200).json({ success: true, softDeactivated: true, coupon: archived });
        }

        const { error: delErr } = await serverClient.from("discount_coupons").delete().eq("id", existing.id);
        if (delErr) throw delErr;
        return res.status(200).json({ success: true, deleted: true, code: normalizedCode });
      }

      if (action === "save_sepay_config") {
        const { bank_code, account_number, account_name, va_prefix, qr_template, webhook_api_key } = req.body || {};
        const cleanAcc = String(account_number || "").replace(/\s+/g, "").trim();
        const cleanBank = String(bank_code || "MBBank").trim();
        if (!cleanAcc || cleanAcc.length < 4) {
          return res.status(400).json({
            success: false,
            error: "Số tài khoản / Virtual Account SePay không hợp lệ (tối thiểu 4 ký tự).",
          });
        }
        const cleanPrefix = String(va_prefix || "GEVIP")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 12) || "GEVIP";
        const allowedTemplate = ["compact", "qronly", "default"].includes(String(qr_template))
          ? String(qr_template)
          : "compact";

        const { data: savedCfg, error: cfgErr } = await serverClient
          .from("payment_gateway_configs")
          .upsert(
            {
              provider: "sepay",
              bank_code: cleanBank,
              account_number: cleanAcc,
              account_name: String(account_name || "").trim().slice(0, 120),
              va_prefix: cleanPrefix,
              qr_template: allowedTemplate,
              is_active: typeof is_active === "boolean" ? is_active : true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "provider" }
          )
          .select()
          .maybeSingle();
        if (cfgErr) throw cfgErr;

        if (typeof webhook_api_key === "string" && webhook_api_key.trim().length > 0) {
          const cleanKey = webhook_api_key.trim();
          if (cleanKey.length < 6) {
            return res.status(400).json({
              success: false,
              error: "SePay Webhook API Key phải có ít nhất 6 ký tự.",
            });
          }
          const { error: secErr } = await serverClient
            .from("payment_gateway_secrets")
            .upsert(
              {
                provider: "sepay",
                webhook_api_key: cleanKey,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "provider" }
            );
          if (secErr) throw secErr;
        }

        invalidateMonetizationCatalogCache();
        return res.status(200).json({ success: true, gateway: savedCfg });
      }

      return res.status(400).json({ success: false, error: `Unsupported admin monetization action '${action}'.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
