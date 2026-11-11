/**
 * Milestone 2.12.1 & 2.12.3: Authoritative Server-Side Entitlement & Access Verification
 * Ensures FREE vs VIP permissions can NEVER be bypassed via LocalStorage or client state.
 */

export const DEFAULT_FEATURE_KEYS = [
  "unlimited_exercises",
  "unlimited_quizzes",
  "diagnostic_root_cause",
  "ai_advisor_full",
  "advanced_mastery_radar",
  "fsrs_unlimited_sr",
  "pdf_exam_export",
];

/**
 * Pure check for whether a subscription row is still actively granting VIP access.
 */
export function isSubscriptionEntitled(subRow, now = new Date()) {
  if (!subRow) return false;
  if (!["trialing", "active", "grace_period"].includes(subRow.status)) {
    return false;
  }
  const endMs = subRow.current_period_end ? new Date(subRow.current_period_end).getTime() : 0;
  if (!endMs || endMs <= now.getTime()) {
    // Grace period check if card failed
    const graceMs = subRow.grace_period_ends_at ? new Date(subRow.grace_period_ends_at).getTime() : 0;
    return subRow.status === "grace_period" && graceMs > now.getTime();
  }
  return true;
}

/**
 * Resolves authoritative entitlement map for a user from Supabase tables (`profiles`, `user_subscriptions`, `plan_entitlements`).
 */
export async function resolveUserEntitlement({ serverClient, userId, now = new Date() }) {
  if (!serverClient || !userId) {
    return {
      effectiveRole: "FREE",
      hasVipAccess: false,
      subscription: null,
      features: Object.fromEntries(DEFAULT_FEATURE_KEYS.map((k) => [k, false])),
    };
  }

  const [{ data: profile }, { data: subs }, { data: featureRows }] = await Promise.all([
    serverClient.from("profiles").select("id, role, status").eq("id", userId).maybeSingle(),
    serverClient
      .from("user_subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    serverClient.from("feature_entitlements").select("*").order("sort_order", { ascending: true }),
  ]);

  if (profile?.role === "ADMIN" && profile?.status === "ACTIVE") {
    return {
      effectiveRole: "ADMIN",
      hasVipAccess: true,
      subscription: (subs || [])[0] || null,
      features: Object.fromEntries((featureRows || []).map((f) => [f.feature_key, true])),
    };
  }

  const latestSub = (subs || [])[0] || null;
  let activeSub = (subs || []).find((s) => isSubscriptionEntitled(s, now)) || null;

  // Auto-expire stale subscription cleanly and revoke VIP role if expired
  if (!activeSub && latestSub && ["trialing", "active", "grace_period"].includes(latestSub.status)) {
    await serverClient
      .from("user_subscriptions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("id", latestSub.id);

    await serverClient.from("subscription_events").insert({
      subscription_id: latestSub.id,
      user_id: userId,
      event_type: "SUBSCRIPTION_EXPIRED",
      metadata: { expiredAt: now.toISOString() },
    });

    if (profile?.role === "VIP") {
      await serverClient.from("profiles").update({ role: "FREE", updated_at: now.toISOString() }).eq("id", userId);
    }
  }

  // Note: profiles.role === 'VIP' set manually by Admin grants VIP even without external payment gateway row
  const manualAdminGrantedVip = profile?.role === "VIP" && profile?.status === "ACTIVE" && (!latestSub || latestSub.status !== "expired");
  const hasVipAccess = Boolean(activeSub || manualAdminGrantedVip);
  const effectiveRole = hasVipAccess ? "VIP" : "FREE";

  const featureMap = {};
  for (const f of featureRows || []) {
    featureMap[f.feature_key] = hasVipAccess;
  }
  for (const k of DEFAULT_FEATURE_KEYS) {
    if (featureMap[k] === undefined) featureMap[k] = hasVipAccess;
  }

  return {
    effectiveRole,
    hasVipAccess,
    subscription: activeSub || latestSub,
    features: featureMap,
  };
}

/**
 * Reusable guard for protected VIP-only Serverless API endpoints (returns 403 for FREE users).
 */
export async function assertVipEntitlement({ serverClient, userId, featureKey = "pdf_exam_export" }) {
  const ent = await resolveUserEntitlement({ serverClient, userId });
  if (!ent.hasVipAccess || (featureKey && !ent.features[featureKey])) {
    return {
      allowed: false,
      status: 403,
      entitlement: ent,
      error: `Tính năng '${featureKey}' yêu cầu gói VIP hoặc ADMIN hợp lệ.`,
    };
  }
  return { allowed: true, status: 200, entitlement: ent };
}
