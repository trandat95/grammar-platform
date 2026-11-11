import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdminWithGuard } from "../../../lib/admin/admin-guard";
import { FUNNEL_STAGES } from "../../../lib/monetization/behavioral-engine";
import { computeAbSignificance } from "../../../lib/monetization/paywall-ab-engine";

/**
 * Milestone 2.12.14: Admin Monetization Revenue (MRR/ARR/LTV), 14-Stage Funnel & A/B Dashboard API
 * Zero-Trust RBAC & Rate-Limited via verifyAdminWithGuard.
 */
export default async function handler(req, res) {
  const adminCtx = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_monetization" });
  if (!adminCtx) return;

  const serverClient = getAdminClient();

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
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    const { action, plan_code, price_vnd, trigger_key, is_active, daily_cap, coupon_code, discount_value } = req.body || {};

    try {
      if (action === "update_plan_price" && plan_code) {
        const { data: updatedPlan, error } = await serverClient
          .from("subscription_plans")
          .update({ price_vnd: Math.max(0, Math.round(Number(price_vnd))), updated_at: new Date().toISOString() })
          .eq("code", plan_code)
          .select()
          .single();
        if (error) throw error;
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
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, paywallConfig: updatedPw });
      }

      if (action === "create_coupon" && coupon_code) {
        const { data: created, error } = await serverClient
          .from("discount_coupons")
          .upsert(
            {
              code: String(coupon_code).trim().toUpperCase(),
              discount_type: "percent",
              discount_value: Math.min(80, Math.max(5, Number(discount_value || 15))),
              is_active: true,
            },
            { onConflict: "code" }
          )
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, coupon: created });
      }

      return res.status(400).json({ success: false, error: `Unsupported admin monetization action '${action}'.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
