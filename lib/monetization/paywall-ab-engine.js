/**
 * Milestone 2.12.8, 2.12.9 & 2.12.11:
 * Contextual Smart Paywall Engine (6 Triggers + Frequency Capping),
 * Ethical Anti-Dark-Pattern Validator & Persistent A/B Testing (Z-Score Significance)
 */

export const PAYWALL_TRIGGER_KEYS = [
  "post_placement",
  "vip_feature_click",
  "milestone_100_q",
  "mastery_90",
  "mistake_overload",
  "post_daily_challenge",
];

/**
 * Evaluates Anti-Spam Frequency Capping before showing a Contextual Smart Paywall.
 */
export function evaluateSmartPaywallEligibility({
  hasVipAccess = false,
  config = null,
  recentImpressions = [],
  isMidFreeExercise = false,
  now = new Date(),
} = {}) {
  if (hasVipAccess) {
    return { shouldShow: false, reason: "ALREADY_VIP" };
  }
  if (isMidFreeExercise) {
    return { shouldShow: false, reason: "NO_INTERRUPT_MID_FREE_EXERCISE" };
  }
  if (config && config.is_active === false) {
    return { shouldShow: false, reason: "TRIGGER_DISABLED_BY_ADMIN" };
  }

  const dailyCap = Number(config?.daily_cap ?? 2);
  const cooldownMinutes = Number(config?.cooldown_minutes ?? 60);

  const dayStartMs = now.getTime() - 24 * 60 * 60 * 1000;
  const shownLast24h = (recentImpressions || []).filter(
    (imp) => new Date(imp.created_at).getTime() >= dayStartMs && imp.action_taken === "shown"
  );
  if (shownLast24h.length >= dailyCap) {
    return { shouldShow: false, reason: "DAILY_FREQUENCY_CAP_REACHED" };
  }

  const lastDismissed = (recentImpressions || [])
    .filter((imp) => imp.action_taken === "dismissed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (lastDismissed) {
    const minsSince = (now.getTime() - new Date(lastDismissed.created_at).getTime()) / (60 * 1000);
    if (minsSince < cooldownMinutes) {
      return {
        shouldShow: false,
        reason: "DISMISS_COOLDOWN_ACTIVE",
        retryAfterMinutes: Math.ceil(cooldownMinutes - minsSince),
      };
    }
  }

  return { shouldShow: true, reason: "ELIGIBLE" };
}

/**
 * Deterministic Persistent A/B Variant Assignment (Hash(experimentKey + userId) % variants.length).
 */
export function assignDeterministicAbVariant(experimentKey = "paywall_copy_value_v1", userId = "guest", variants = ["control", "progress_anchored"]) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : ["control", "progress_anchored"];
  const seed = `${experimentKey}:${userId}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = Math.abs(hash) % list.length;
  return list[idx];
}

/**
 * Two-proportion Z-test comparing conversion rates between Variant A (control) & Variant B (treatment).
 */
export function computeAbSignificance({ nA = 0, convA = 0, nB = 0, convB = 0 } = {}) {
  if (nA <= 0 || nB <= 0) {
    return { zScore: 0, pApproxSignificant: false, rateA: 0, rateB: 0, liftPercent: 0 };
  }
  const rateA = convA / nA;
  const rateB = convB / nB;
  const pooled = (convA + convB) / (nA + nB);
  const se = Math.sqrt(Math.max(1e-9, pooled * (1 - pooled) * (1 / nA + 1 / nB)));
  const zScore = Math.round(((rateB - rateA) / se) * 100) / 100;
  const liftPercent = rateA > 0 ? Math.round(((rateB - rateA) / rateA) * 1000) / 10 : rateB > 0 ? 100 : 0;

  return {
    zScore,
    pApproxSignificant: Math.abs(zScore) >= 1.96 && nA >= 15 && nB >= 15,
    rateA: Math.round(rateA * 1000) / 10,
    rateB: Math.round(rateB * 1000) / 10,
    liftPercent,
  };
}

/**
 * Anti-Dark-Patterns Campaign Validator (FTC Compliance).
 */
export function validateEthicalCampaign(campaign = {}) {
  const text = `${campaign.title_vi || ""} ${campaign.description_vi || ""}`.toLowerCase();
  const forbiddenPatterns = ["mất streak", "xóa tiến độ", "auto reset", "fake countdown"];
  const violation = forbiddenPatterns.find((p) => text.includes(p));
  if (violation) {
    return { valid: false, reason: `ETHICAL_VIOLATION_DARK_PATTERN:${violation}` };
  }
  if (campaign.is_ethical_verified === false) {
    return { valid: false, reason: "NOT_ETHICALLY_VERIFIED" };
  }
  return { valid: true };
}
