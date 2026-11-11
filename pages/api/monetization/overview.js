import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { resolveUserEntitlement } from "../../../lib/monetization/entitlement-engine";
import {
  BEHAVIOR_EVENT_CATALOG,
  classifyBehavioralSegment,
  calculatePurchaseIntentScore,
  buildPsychologicalMessaging,
} from "../../../lib/monetization/behavioral-engine";
import {
  evaluateSmartPaywallEligibility,
  assignDeterministicAbVariant,
  validateEthicalCampaign,
} from "../../../lib/monetization/paywall-ab-engine";
import { calculateServerOrderPricing } from "../../../lib/monetization/payment-provider-adapter";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Milestone 2.12: Monetization Overview, Behavioral Psychology, Paywall Capping & Coupon Validator API
 */
export default async function handler(req, res) {
  const serverClient = getAdminClient();
  const authUser = await verifyServerSession(req);

  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token." });
  }

  if (req.method === "GET") {
    const requestedUserId = authUser?.id || req.query?.user_id || null;
    if (authUser && req.query?.user_id && authUser.id !== req.query.user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user monetization read denied." });
    }

    try {
      const [{ data: plans }, { data: features }, { data: campaigns }, { data: paywallConfigs }, { data: experiments }] =
        await Promise.all([
          serverClient.from("subscription_plans").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
          serverClient.from("feature_entitlements").select("*").order("sort_order", { ascending: true }),
          serverClient.from("pricing_campaigns").select("*").eq("is_active", true),
          serverClient.from("paywall_configs").select("*").eq("is_active", true),
          serverClient.from("ab_experiments").select("*").eq("is_active", true),
        ]);

      const ethicalCampaigns = (campaigns || []).filter((c) => validateEthicalCampaign(c).valid);
      const mainExp = (experiments || [])[0] || {
        experiment_key: "paywall_copy_value_v1",
        variants: ["control", "progress_anchored"],
      };

      if (!requestedUserId || !UUID_REGEX.test(requestedUserId)) {
        const guestVariant = assignDeterministicAbVariant(mainExp.experiment_key, "guest", mainExp.variants);
        return res.status(200).json({
          success: true,
          guestMode: true,
          entitlement: { effectiveRole: "FREE", hasVipAccess: false, subscription: null, features: {} },
          plans: plans || [],
          features: features || [],
          campaigns: ethicalCampaigns,
          paywallConfigs: paywallConfigs || [],
          abVariant: { experiment_key: mainExp.experiment_key, variant_key: guestVariant },
          psychology: buildPsychologicalMessaging({ masteredChaptersCount: 0, totalAnswered: 0, streakDays: 1 }),
          segment: { segment: "New Explorer", intentScore: 0, intentBand: "Low" },
          notifications: [],
          transactions: [],
          marketingOptOut: false,
        });
      }

      const [
        entitlement,
        { data: segRow },
        { data: txRows },
        { data: notifRows },
        { data: progRows },
        { data: streakRow },
        { data: abRow },
      ] = await Promise.all([
        resolveUserEntitlement({ serverClient, userId: requestedUserId }),
        serverClient.from("user_segments").select("*").eq("user_id", requestedUserId).maybeSingle(),
        serverClient
          .from("payment_transactions")
          .select("id, provider, amount_vnd, discount_vnd, final_amount_vnd, coupon_code, status, created_at, plan:subscription_plans(name_vi, billing_cycle)")
          .eq("user_id", requestedUserId)
          .order("created_at", { ascending: false })
          .limit(20),
        serverClient
          .from("notification_campaigns")
          .select("*")
          .eq("user_id", requestedUserId)
          .order("created_at", { ascending: false })
          .limit(10),
        serverClient.from("user_concept_progress").select("attempts, correct_attempts, mastery_score").eq("user_id", requestedUserId),
        serverClient.from("user_streaks").select("current_streak").eq("user_id", requestedUserId).maybeSingle(),
        serverClient
          .from("ab_assignments")
          .select("*")
          .eq("experiment_key", mainExp.experiment_key)
          .eq("user_id", requestedUserId)
          .maybeSingle(),
      ]);

      // Persistent A/B Assignment
      let variantKey = abRow?.variant_key;
      if (!variantKey) {
        variantKey = assignDeterministicAbVariant(mainExp.experiment_key, requestedUserId, mainExp.variants);
        await serverClient.from("ab_assignments").upsert(
          { experiment_key: mainExp.experiment_key, user_id: requestedUserId, variant_key: variantKey },
          { onConflict: "experiment_key,user_id", ignoreDuplicates: true }
        );
      }

      const totalAttempts = (progRows || []).reduce((s, r) => s + Number(r.attempts || 0), 0);
      const totalCorrect = (progRows || []).reduce((s, r) => s + Number(r.correct_attempts || 0), 0);
      const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const masteredConceptsCount = (progRows || []).filter((r) => Number(r.mastery_score || 0) >= 75).length;

      const marketingOptOut = (notifRows || []).some((n) => n.marketing_opt_out === true);

      return res.status(200).json({
        success: true,
        guestMode: false,
        entitlement,
        plans: plans || [],
        features: features || [],
        campaigns: ethicalCampaigns,
        paywallConfigs: paywallConfigs || [],
        abVariant: { experiment_key: mainExp.experiment_key, variant_key: variantKey },
        psychology: buildPsychologicalMessaging({
          masteredChaptersCount: Math.min(12, Math.floor(masteredConceptsCount / 2)),
          totalAnswered: totalAttempts,
          overallAccuracy,
          streakDays: streakRow?.current_streak || 1,
          segment: segRow?.segment || "Active Learner",
        }),
        segment: segRow
          ? { segment: segRow.segment, intentScore: segRow.intent_score, intentBand: segRow.intent_band }
          : { segment: "Active Learner", intentScore: 15, intentBand: "Low" },
        notifications: marketingOptOut ? [] : (notifRows || []).filter((n) => n.status !== "dismissed"),
        transactions: txRows || [],
        marketingOptOut,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    const { action, user_id, event_name, session_id, metadata = {}, trigger_key, action_taken, plan_code, coupon_code, opt_out } =
      req.body || {};
    const resolvedUserId = authUser?.id || user_id;

    if (authUser && user_id && authUser.id !== user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user mutation denied." });
    }

    try {
      // Coupon Validation (works cleanly for checkout UI preview)
      if (action === "validate_coupon") {
        if (!plan_code || !coupon_code) {
          return res.status(400).json({ success: false, error: "Cần chọn gói VIP và nhập mã giảm giá." });
        }
        const [{ data: plan }, { data: coupon }] = await Promise.all([
          serverClient.from("subscription_plans").select("*").eq("code", plan_code).maybeSingle(),
          serverClient.from("discount_coupons").select("*").eq("code", String(coupon_code).trim().toUpperCase()).maybeSingle(),
        ]);
        if (!plan) return res.status(404).json({ success: false, error: "Gói VIP không tồn tại." });
        if (!coupon) return res.status(400).json({ success: false, error: "Mã giảm giá không hợp lệ hoặc không tồn tại." });

        if (resolvedUserId && UUID_REGEX.test(resolvedUserId)) {
          const { data: redeemed } = await serverClient
            .from("user_coupons")
            .select("id")
            .eq("user_id", resolvedUserId)
            .eq("coupon_id", coupon.id)
            .maybeSingle();
          if (redeemed) {
            return res.status(400).json({ success: false, error: "Bạn đã sử dụng mã giảm giá này trước đó." });
          }
        }

        const pricing = calculateServerOrderPricing({ plan, coupon });
        if (pricing.couponError) {
          return res.status(400).json({ success: false, error: pricing.couponError });
        }
        return res.status(200).json({ success: true, pricing });
      }

      if (!resolvedUserId || !UUID_REGEX.test(resolvedUserId)) {
        return res.status(400).json({ success: false, error: "Valid user_id UUID required." });
      }

      if (action === "track_event") {
        const category = BEHAVIOR_EVENT_CATALOG[event_name] || "engagement";
        await serverClient.from("behavior_events").insert({
          user_id: resolvedUserId,
          session_id: session_id || null,
          event_category: category,
          event_name: event_name || "PRICING_VIEWED",
          metadata,
        });

        // Record conversion funnel milestone when applicable
        const funnelMap = {
          PRICING_VIEWED: "VIP_DISCOVERY",
          VIP_FEATURE_CLICKED: "VIP_DISCOVERY",
          PAYWALL_VIEWED: "PAYWALL",
          CHECKOUT_STARTED: "CHECKOUT",
          PLACEMENT_COMPLETED: "PLACEMENT_TEST",
        };
        if (funnelMap[event_name]) {
          await serverClient.from("conversion_events").insert({
            user_id: resolvedUserId,
            session_id: session_id || null,
            funnel_stage: funnelMap[event_name],
            metadata: { event_name, ...metadata },
          });
        }

        // Trigger helpful Abandoned Checkout notification respecting opt-out
        if (event_name === "CHECKOUT_ABANDONED") {
          const { data: optRow } = await serverClient
            .from("notification_campaigns")
            .select("id")
            .eq("user_id", resolvedUserId)
            .eq("marketing_opt_out", true)
            .limit(1)
            .maybeSingle();
          if (!optRow) {
            await serverClient.from("notification_campaigns").insert({
              user_id: resolvedUserId,
              campaign_key: "abandoned_checkout_followup",
              channel: "in_app",
              title_vi: "Trải nghiệm 7 ngày Dùng thử Miễn phí không rủi ro",
              body_vi: "Bạn có thể kích hoạt dùng thử VIP 7 ngày và hủy chỉ với 2 chạm bất kỳ lúc nào trước ngày gia hạn.",
              status: "sent",
            });
          }
        }

        // Recompute Segment + Purchase Intent Score (0-100)
        const [{ data: recentEvs }, { data: progRows }, { data: streakRow }, ent] = await Promise.all([
          serverClient.from("behavior_events").select("event_name").eq("user_id", resolvedUserId).limit(200),
          serverClient.from("user_concept_progress").select("attempts, correct_attempts").eq("user_id", resolvedUserId),
          serverClient.from("user_streaks").select("current_streak").eq("user_id", resolvedUserId).maybeSingle(),
          resolveUserEntitlement({ serverClient, userId: resolvedUserId }),
        ]);

        const evNames = (recentEvs || []).map((e) => e.event_name);
        const totalAnswered = (progRows || []).reduce((s, r) => s + Number(r.attempts || 0), 0);
        const totalCorrect = (progRows || []).reduce((s, r) => s + Number(r.correct_attempts || 0), 0);
        const acc = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

        const intent = calculatePurchaseIntentScore({
          pricingViews: evNames.filter((n) => n === "PRICING_VIEWED").length,
          vipFeatureClicks: evNames.filter((n) => n === "VIP_FEATURE_CLICKED").length,
          paywallClicks: evNames.filter((n) => n === "PAYWALL_VIEWED").length,
          checkoutStarted: evNames.filter((n) => n === "CHECKOUT_STARTED").length,
          hasPlacementTest: evNames.includes("PLACEMENT_COMPLETED"),
          streakDays: streakRow?.current_streak || 0,
          totalAnswered,
        });

        const segment = classifyBehavioralSegment({
          totalAnswered,
          overallAccuracy: acc,
          hasPlacementTest: evNames.includes("PLACEMENT_COMPLETED"),
          intentScore: intent.intentScore,
          hasActiveSub: ent.hasVipAccess,
          isCanceledPending: Boolean(ent.subscription?.cancel_at_period_end),
        });

        await serverClient.from("user_segments").upsert(
          {
            user_id: resolvedUserId,
            segment,
            intent_score: intent.intentScore,
            intent_band: intent.intentBand,
            signals: { lastEvent: event_name },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        return res.status(200).json({ success: true, segment, ...intent });
      }

      if (action === "check_paywall") {
        const [{ data: config }, { data: impressions }, ent, { data: abRow }] = await Promise.all([
          serverClient.from("paywall_configs").select("*").eq("trigger_key", trigger_key || "vip_feature_click").maybeSingle(),
          serverClient
            .from("paywall_impressions")
            .select("*")
            .eq("user_id", resolvedUserId)
            .eq("trigger_key", trigger_key || "vip_feature_click")
            .order("created_at", { ascending: false })
            .limit(20),
          resolveUserEntitlement({ serverClient, userId: resolvedUserId }),
          serverClient
            .from("ab_assignments")
            .select("variant_key")
            .eq("experiment_key", "paywall_copy_value_v1")
            .eq("user_id", resolvedUserId)
            .maybeSingle(),
        ]);

        const eligibility = evaluateSmartPaywallEligibility({
          hasVipAccess: ent.hasVipAccess,
          config,
          recentImpressions: impressions || [],
          isMidFreeExercise: Boolean(metadata?.isMidFreeExercise),
        });

        const variantKey = abRow?.variant_key || assignDeterministicAbVariant("paywall_copy_value_v1", resolvedUserId);

        if (action_taken === "dismissed" || action_taken === "clicked_cta" || eligibility.shouldShow) {
          await serverClient.from("paywall_impressions").insert({
            user_id: resolvedUserId,
            trigger_key: trigger_key || "vip_feature_click",
            variant_key: variantKey,
            action_taken: action_taken || "shown",
          });
        }

        return res.status(200).json({
          success: true,
          ...eligibility,
          config,
          variantKey,
        });
      }

      if (action === "toggle_marketing_opt_out") {
        await serverClient.from("notification_campaigns").insert({
          user_id: resolvedUserId,
          campaign_key: "marketing_preference_update",
          channel: "in_app",
          title_vi: opt_out ? "Đã tắt thông báo ưu đãi" : "Đã bật thông báo học tập & ưu đãi",
          body_vi: opt_out ? "Bạn sẽ không nhận thông báo tiếp thị cá nhân hóa." : "Bạn sẽ nhận nhắc nhở mục tiêu học tập.",
          status: opt_out ? "unsubscribed" : "dismissed",
          marketing_opt_out: Boolean(opt_out),
        });
        return res.status(200).json({ success: true, marketingOptOut: Boolean(opt_out) });
      }

      return res.status(400).json({ success: false, error: `Unsupported action '${action}'.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
