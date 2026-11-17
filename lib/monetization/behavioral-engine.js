/**
 * Milestone 2.12.6 & 2.12.7: Behavioral Psychology, 23-Event Tracking,
 * 9-Segment User Classification & Purchase Intent Scoring (0-100)
 * Strict Ethical Rule: Intent Score NEVER alters plan pricing between learners.
 */

export const BEHAVIOR_EVENT_CATALOG = {
  // Learning Events (8)
  LESSON_STARTED: "learning",
  LESSON_COMPLETED: "learning",
  QUESTION_ANSWERED: "learning",
  QUIZ_COMPLETED: "learning",
  PLACEMENT_COMPLETED: "learning",
  SR_REVIEW_COMPLETED: "learning",
  ADAPTIVE_MIX_STARTED: "learning",
  MISTAKE_RESOLVED: "learning",
  // Engagement Events (6)
  DASHBOARD_VIEWED: "engagement",
  GAMIFICATION_VIEWED: "engagement",
  CHALLENGE_ACCEPTED: "engagement",
  STREAK_RECOVERED: "engagement",
  PRICING_VIEWED: "engagement",
  REPORT_PREVIEWED: "engagement",
  // Monetization Events (9)
  PAYWALL_VIEWED: "monetization",
  VIP_FEATURE_CLICKED: "monetization",
  COUPON_APPLIED: "monetization",
  TRIAL_STARTED: "monetization",
  CHECKOUT_STARTED: "monetization",
  CHECKOUT_ABANDONED: "monetization",
  SUBSCRIPTION_PURCHASED: "monetization",
  SUBSCRIPTION_CANCELED: "monetization",
  SUBSCRIPTION_RENEWED: "monetization",
};

export const FUNNEL_STAGES = [
  "VISITOR",
  "REGISTRATION",
  "FIRST_LEARNING",
  "PLACEMENT_TEST",
  "VIP_DISCOVERY",
  "PAYWALL",
  "CHECKOUT",
  "PAYMENT",
  "TRIAL_STARTED",
  "SUBSCRIPTION_ACTIVE",
  "FEATURE_ADOPTION",
  "RENEWAL",
  "UPGRADE",
  "RETENTION",
];

export const BEHAVIORAL_SEGMENTS = [
  "New Explorer",
  "Active Learner",
  "High Performer",
  "Struggling Learner",
  "Exam-Oriented",
  "Power User",
  "Dormant User",
  "Purchase Intent",
  "Churn Risk",
];

/**
 * Classifies learner into one of the 9 canonical Behavioral Segments.
 */
export function classifyBehavioralSegment({
  daysSinceLastActive = 0,
  totalAnswered = 0,
  overallAccuracy = 0,
  quizzesCompleted = 0,
  hasPlacementTest = false,
  intentScore = 0,
  hasActiveSub = false,
  isCanceledPending = false,
} = {}) {
  if (hasActiveSub && (isCanceledPending || daysSinceLastActive >= 14)) {
    return "Churn Risk";
  }
  if (!hasActiveSub && intentScore >= 55) {
    return "Purchase Intent";
  }
  if (daysSinceLastActive >= 14 && totalAnswered > 0) {
    return "Dormant User";
  }
  if (totalAnswered >= 150 && overallAccuracy >= 75) {
    return "Power User";
  }
  if (quizzesCompleted >= 5 && overallAccuracy >= 70) {
    return "Exam-Oriented";
  }
  if (totalAnswered >= 20 && overallAccuracy < 55) {
    return "Struggling Learner";
  }
  if (totalAnswered >= 30 && overallAccuracy >= 82) {
    return "High Performer";
  }
  if (totalAnswered >= 10 || hasPlacementTest) {
    return "Active Learner";
  }
  return "New Explorer";
}

/**
 * Computes Purchase Intent Score (0-100) cleanly for contextual UX personalization only.
 */
export function calculatePurchaseIntentScore({
  pricingViews = 0,
  vipFeatureClicks = 0,
  paywallClicks = 0,
  checkoutStarted = 0,
  hasPlacementTest = false,
  streakDays = 0,
  totalAnswered = 0,
} = {}) {
  let score = 0;
  score += Math.min(20, Number(pricingViews || 0) * 10);
  score += Math.min(25, Number(vipFeatureClicks || 0) * 12);
  score += Math.min(15, Number(paywallClicks || 0) * 15);
  score += Math.min(25, Number(checkoutStarted || 0) * 25);
  if (hasPlacementTest) score += 10;
  if (Number(streakDays || 0) >= 3) score += 5;
  if (Number(totalAnswered || 0) >= 50) score += 5;

  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  let intentBand = "Low";
  if (bounded >= 80) intentBand = "Very High";
  else if (bounded >= 60) intentBand = "High";
  else if (bounded >= 40) intentBand = "Medium";
  else if (bounded >= 20) intentBand = "Warm";

  return { intentScore: bounded, intentBand };
}

/**
 * Generates positive Progress Principle, Goal Gradient & Endowed Progress copy backed by real metrics.
 * Strictly prohibits dark-pattern streak-loss threats or fake progress.
 */
export function buildPsychologicalMessaging({
  masteredChaptersCount = 0,
  totalAnswered = 0,
  overallAccuracy = 0,
  streakDays = 0,
  segment = "Active Learner",
} = {}) {
  const remainingChapters = Math.max(0, 12 - Number(masteredChaptersCount || 0));

  const progressHighlight =
    masteredChaptersCount > 0
      ? `Bạn đã nắm vững ${masteredChaptersCount}/12 chuyên đề ngữ pháp với độ chính xác ${overallAccuracy}%.`
      : `Bạn đã hoàn thành ${totalAnswered} câu hỏi thực hành và duy trì chuỗi ${streakDays} ngày học tập.`;

  const goalGradientHint =
    remainingChapters > 0
      ? `Đạt ${Math.round(((12 - remainingChapters) / 12) * 100)}% bản đồ 12 chuyên đề — Chỉ còn ${remainingChapters} chuyên đề nữa để chạm danh hiệu Grammar Master!`
      : "Bạn đã mở khóa nền tảng 12 chuyên đề — Sẵn sàng nâng cấp lên bộ thử thách Master không giới hạn.";

  let personalizedHook = "Mở khóa toàn bộ 2,939 câu hỏi, AI Coach & Lộ trình thích ứng để rút ngắn 50% thời gian ôn thi.";
  if (segment === "Struggling Learner") {
    personalizedHook = "Lộ trình bù đắp Root Cause & Spaced Repetition FSRS sẽ tập trung đúng điểm yếu để kéo Accuracy lên trên 80%.";
  } else if (segment === "Exam-Oriented" || segment === "High Performer") {
    personalizedHook = "Mở khóa Quiz không giới hạn, Đề Thích Ứng 50/30/20 nâng cao và Xuất báo cáo chuyên sâu.";
  }

  return {
    progressHighlight,
    goalGradientHint,
    personalizedHook,
    selfDeterminationNote: "Toàn quyền chọn chuyên đề, tốc độ học & hủy gói chỉ với 2 chạm mà vẫn giữ nguyên 100% lịch sử học tập.",
  };
}

/* ============================================================================
 * M4.7: FTC-SAFE UX & CONVERSION ANALYTICS ENGINE (LEARNING_ANALYTICS_SCHEMA)
 * ============================================================================ */

export const ANALYTICS_SCHEMA_VERSION = "1.0";
export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const UTC_PLUS_7_OFFSET_MS = 7 * 60 * 60 * 1000;

export const M47_ANALYTICS_EVENTS = {
  EXERCISE_STARTED: "exercise_started",
  EXERCISE_COMPLETED: "exercise_completed",
  QUESTION_ANSWERED: "question_answered",
  DIAGNOSTIC_STARTED: "diagnostic_started",
  DIAGNOSTIC_COMPLETED: "diagnostic_completed",
  LEARNING_SESSION_HEARTBEAT: "learning_session_heartbeat",
  PAYWALL_VIEWED: "paywall_viewed",
  CHECKOUT_INITIATED: "checkout_initiated",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
};

const SENSITIVE_PII_KEYS = new Set([
  "email",
  "user_email",
  "phone",
  "sdt",
  "phone_number",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "password",
  "secret",
  "cookie",
  "user_answer",
  "answer_text",
  "raw_input",
  "submitted_text",
  "essay",
  "full_name",
]);

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const JWT_OR_BEARER_RE = /(?:^bearer\s+|\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{3,})/i;
const PHONE_RE = /(?:\+84|0)[35789]\d{8}\b/;

const FORBIDDEN_DARK_PATTERN_FLAGS = [
  "fake_timer",
  "fake_urgency",
  "shame_copy",
  "confirmshaming",
  "hidden_cancel",
  "forced_continuity",
  "unequal_pricing_by_intent",
];

/**
 * Strips PII (emails, phones, tokens) and personal free-text answers from analytics properties.
 */
export function sanitizeAnalyticsProperties(rawProps = {}) {
  if (!rawProps || typeof rawProps !== "object" || Array.isArray(rawProps)) return {};
  const clean = {};
  for (const [key, val] of Object.entries(rawProps)) {
    const lowerKey = String(key || "").toLowerCase().trim();
    if (!lowerKey || SENSITIVE_PII_KEYS.has(lowerKey)) continue;
    if (val === undefined) continue;
    if (val === null || typeof val === "number" || typeof val === "boolean") {
      clean[key] = val;
      continue;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (EMAIL_RE.test(trimmed) || JWT_OR_BEARER_RE.test(trimmed) || PHONE_RE.test(trimmed)) {
        continue;
      }
      clean[key] = trimmed.slice(0, 120);
      continue;
    }
    if (Array.isArray(val)) {
      clean[key] = val
        .slice(0, 12)
        .filter((item) => typeof item === "number" || typeof item === "boolean" || (typeof item === "string" && !EMAIL_RE.test(item) && !JWT_OR_BEARER_RE.test(item)));
    }
  }
  return clean;
}

/**
 * Verifies FTC Anti-Dark-Pattern compliance for paywall / conversion telemetry payloads.
 */
export function validateFtcSafePaywallPayload(payload = {}) {
  const violations = [];
  if (!payload || typeof payload !== "object") return { safe: true, violations };

  for (const flag of FORBIDDEN_DARK_PATTERN_FLAGS) {
    if (payload[flag] === true || payload?.properties?.[flag] === true) {
      violations.push(flag);
    }
  }
  if (typeof payload.variant === "string" && /dark_pattern|sham(?:e|ing)|fake|guilt/i.test(payload.variant)) {
    violations.push("prohibited_variant_name");
  }
  if (typeof payload?.properties?.variant === "string" && /dark_pattern|sham(?:e|ing)|fake|guilt/i.test(payload.properties.variant)) {
    violations.push("prohibited_variant_name");
  }
  return { safe: violations.length === 0, violations };
}

/**
 * Formats an ISO timestamp or Date to a YYYY-MM-DD cohort key in UTC+7.
 */
export function toUtcPlus7DateKey(dateInput = new Date()) {
  const ms =
    typeof dateInput === "number"
      ? dateInput
      : dateInput instanceof Date
      ? dateInput.getTime()
      : Date.parse(dateInput || Date.now());
  const safeMs = Number.isFinite(ms) ? ms : Date.now();
  return new Date(safeMs + UTC_PLUS_7_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Formats an ISO timestamp strictly in UTC+7 (+07:00).
 */
export function toUtcPlus7Iso(dateInput = new Date()) {
  const ms =
    typeof dateInput === "number"
      ? dateInput
      : dateInput instanceof Date
      ? dateInput.getTime()
      : Date.parse(dateInput || Date.now());
  const safeMs = Number.isFinite(ms) ? ms : Date.now();
  return `${new Date(safeMs + UTC_PLUS_7_OFFSET_MS).toISOString().slice(0, 19)}+07:00`;
}

function generateAnalyticsUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAnalyticsPlatform() {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function isTrackingConsentGranted() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem("grammar_analytics_consent") !== "false";
  } catch {
    return true;
  }
}

function getOrCreateAnalyticsSessionId() {
  if (typeof window === "undefined") return generateAnalyticsUuid();
  try {
    const existing = window.sessionStorage.getItem("grammar_analytics_session_id");
    if (existing) return existing;
    const created = generateAnalyticsUuid();
    window.sessionStorage.setItem("grammar_analytics_session_id", created);
    return created;
  } catch {
    return generateAnalyticsUuid();
  }
}

/**
 * Builds canonical M4.7 analytics event object matching LEARNING_ANALYTICS_SCHEMA.md.
 */
export function buildCanonicalAnalyticsEvent({
  event_name,
  user_id = null,
  session_id = null,
  platform = null,
  feature = "grammar_study",
  properties = {},
  event_id = null,
  timestamp = null,
} = {}) {
  const safeName = String(event_name || "learning_activity").trim().toLowerCase();
  const safeId = event_id || generateAnalyticsUuid();
  return {
    event_name: safeName,
    event_version: ANALYTICS_SCHEMA_VERSION,
    event_id: safeId,
    event_type: safeName.toUpperCase(),
    idempotency_key: safeId,
    user_id: user_id || null,
    session_id: session_id || getOrCreateAnalyticsSessionId(),
    timestamp: timestamp || toUtcPlus7Iso(),
    platform: platform || getAnalyticsPlatform(),
    feature: String(feature || "grammar_study").slice(0, 64),
    properties: sanitizeAnalyticsProperties(properties),
  };
}

/**
 * Emits a canonical M4.7 telemetry event over existing /api/learning/events for signed-in users.
 * Never leaks guest errors or personal free-text answers.
 */
export function emitLearningAnalyticsEvent({
  userId = null,
  authToken = null,
  eventName,
  feature = "grammar_study",
  properties = {},
  eventId = null,
} = {}) {
  if (typeof window === "undefined" || !userId || !authToken || !eventName) return;
  if (!isTrackingConsentGranted()) return;

  const canonical = buildCanonicalAnalyticsEvent({
    event_name: eventName,
    user_id: userId,
    feature,
    properties,
    event_id: eventId,
  });

  if (!validateFtcSafePaywallPayload(canonical).safe) return;

  fetch("/api/learning/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      user_id: userId,
      events: [
        {
          ...canonical,
          question_id: properties?.question_id || null,
          concept_id: properties?.concept_id || null,
          is_correct: typeof properties?.result === "string" ? properties.result === "correct" : null,
          response_time_ms: Number(properties?.duration_ms || 0),
          device_id: canonical.platform,
          payload: canonical,
        },
      ],
    }),
  }).catch(() => {});
}

function medianOfSorted(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return Math.round(sorted[mid]);
}

/**
 * Computes all 8 Core KPIs defined in LEARNING_ANALYTICS_SCHEMA.md strictly in UTC+7.
 */
export function computeEightCoreKpis({
  learningLogs = [],
  behaviorEvents = [],
  profiles = [],
  subscriptions = [],
  nowMs = Date.now(),
} = {}) {
  let exercisesStarted = 0;
  let exercisesCompleted = 0;
  let diagnosticsStarted = 0;
  let diagnosticsSubmitted = 0;
  let mobileAttempted = 0;
  let mobileSucceeded = 0;

  const answerDurationsAll = [];
  const answerDurationsTextInput = [];
  const answerDurationsMc = [];

  let paywallViews = 0;
  let checkoutInitiated = 0;
  const variantStats = {};

  const sessionEventsByUser = new Map();
  const userActiveDates = new Map();

  for (const row of learningLogs || []) {
    const evType = String(row.event_type || row.payload?.event_name || "").toUpperCase();
    const props = row.payload?.properties || row.payload || {};
    const platform = String(props.platform || row.payload?.platform || row.device_id || "").toLowerCase();
    const tsMs = Date.parse(row.created_at || row.payload?.timestamp || nowMs);
    const validTs = Number.isFinite(tsMs) ? tsMs : nowMs;
    const dateKey = toUtcPlus7DateKey(validTs);

    if (row.user_id) {
      if (!userActiveDates.has(row.user_id)) userActiveDates.set(row.user_id, new Set());
      userActiveDates.get(row.user_id).add(dateKey);

      if (!sessionEventsByUser.has(row.user_id)) sessionEventsByUser.set(row.user_id, []);
      sessionEventsByUser.get(row.user_id).push(validTs);
    }

    if (evType === "EXERCISE_STARTED" || evType === "LESSON_STARTED") exercisesStarted += 1;
    if (evType === "EXERCISE_COMPLETED" || evType === "LESSON_COMPLETED") exercisesCompleted += 1;
    if (evType === "DIAGNOSTIC_STARTED") diagnosticsStarted += 1;
    if (evType === "DIAGNOSTIC_COMPLETED" || evType === "PLACEMENT_COMPLETED") diagnosticsSubmitted += 1;

    if (evType === "QUESTION_ANSWERED") {
      const dur = Number(row.response_time_ms || props.duration_ms || 0);
      if (dur > 0 && dur <= 300000) {
        answerDurationsAll.push(dur);
        const qType = String(props.question_type || "").toLowerCase();
        if (qType === "multiple_choice") answerDurationsMc.push(dur);
        else if (qType === "text_input" || qType === "multi_blank") answerDurationsTextInput.push(dur);
      }

      if (platform === "mobile") {
        mobileAttempted += 1;
        if (props.touch_success !== false && typeof row.is_correct === "boolean") {
          mobileSucceeded += 1;
        } else if (props.touch_success === true) {
          mobileSucceeded += 1;
        }
      }
    }

    if (evType === "PAYWALL_VIEWED") {
      paywallViews += 1;
      const vKey = String(props.variant || "control");
      if (!variantStats[vKey]) variantStats[vKey] = { views: 0, checkouts: 0 };
      variantStats[vKey].views += 1;
    }

    if (evType === "CHECKOUT_INITIATED" || evType === "CHECKOUT_STARTED") {
      checkoutInitiated += 1;
      const vKey = String(props.variant || "control");
      if (!variantStats[vKey]) variantStats[vKey] = { views: 0, checkouts: 0 };
      variantStats[vKey].checkouts += 1;
    }
  }

  for (const bev of behaviorEvents || []) {
    const name = String(bev.event_name || "").toUpperCase();
    const variant = String(bev.metadata?.variant || bev.metadata?.variantKey || "control");
    if (name === "PAYWALL_VIEWED") {
      // Count behavior_events paywall impressions only when not already logged via canonical learning_event_logs
      if (paywallViews === 0) {
        paywallViews += 1;
        if (!variantStats[variant]) variantStats[variant] = { views: 0, checkouts: 0 };
        variantStats[variant].views += 1;
      }
    } else if (name === "CHECKOUT_STARTED" && checkoutInitiated === 0) {
      checkoutInitiated += 1;
      if (!variantStats[variant]) variantStats[variant] = { views: 0, checkouts: 0 };
      variantStats[variant].checkouts += 1;
    }
  }

  // Session duration clamping idle gaps <= 15 minutes
  let totalValidSessionMs = 0;
  let activeSessionsCount = 0;
  for (const timestamps of sessionEventsByUser.values()) {
    const sorted = timestamps.sort((a, b) => a - b);
    let sessionCountForUser = sorted.length > 0 ? 1 : 0;
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap <= SESSION_IDLE_TIMEOUT_MS) {
        totalValidSessionMs += Math.max(0, gap);
      } else {
        sessionCountForUser += 1;
      }
    }
    activeSessionsCount += sessionCountForUser;
  }

  // D7 / D14 UTC+7 cohort retention
  let cohortUsers = 0;
  let d7Retained = 0;
  let d14Retained = 0;
  for (const prof of profiles || []) {
    if (!prof?.id || !prof?.created_at) continue;
    const regMs = Date.parse(prof.created_at);
    if (!Number.isFinite(regMs)) continue;
    const d0Key = toUtcPlus7DateKey(regMs);
    const d7Key = toUtcPlus7DateKey(regMs + 7 * 86400000);
    const d14Key = toUtcPlus7DateKey(regMs + 14 * 86400000);
    const daysSet = userActiveDates.get(prof.id);
    if (daysSet && (daysSet.has(d0Key) || daysSet.size > 0)) {
      cohortUsers += 1;
      if (daysSet.has(d7Key)) d7Retained += 1;
      if (daysSet.has(d14Key)) d14Retained += 1;
    }
  }

  // Free-to-VIP Conversion (explicitly separating SePay Paid vs Admin Grant)
  const paidVipUsers = new Set();
  const grantVipUsers = new Set();
  for (const sub of subscriptions || []) {
    if (!sub?.user_id) continue;
    if (sub.status !== "active" && sub.status !== "trialing") continue;
    if (sub.provider === "sepay" || sub.provider === "stripe" || sub.provider === "vnpay") {
      paidVipUsers.add(sub.user_id);
    } else {
      grantVipUsers.add(sub.user_id);
    }
  }
  const eligibleBase = (profiles || []).filter((p) => p.role === "FREE" || p.role === "VIP").length;
  const totalVipProfiles = (profiles || []).filter((p) => p.role === "VIP").length;

  const variantBreakdown = {};
  for (const [k, st] of Object.entries(variantStats)) {
    const views = st.views || 0;
    const checkouts = st.checkouts || 0;
    variantBreakdown[k] = {
      views,
      checkouts,
      abandonment_percent: views > 0 ? Math.max(0, Math.round(((views - checkouts) / views) * 1000) / 10) : 0,
    };
  }

  return {
    timezone: "UTC+7",
    exercise_completion_rate: {
      started: exercisesStarted,
      completed: exercisesCompleted,
      rate_percent: exercisesStarted > 0 ? Math.min(100, Math.round((exercisesCompleted / exercisesStarted) * 1000) / 10) : 0,
    },
    question_answer_time: {
      median_ms: medianOfSorted(answerDurationsAll),
      median_text_input_ms: medianOfSorted(answerDurationsTextInput),
      median_multiple_choice_ms: medianOfSorted(answerDurationsMc),
      sample_count: answerDurationsAll.length,
    },
    mobile_interaction_success: {
      attempted_touch: mobileAttempted,
      successful_touch: mobileSucceeded,
      rate_percent: mobileAttempted > 0 ? Math.round((mobileSucceeded / mobileAttempted) * 1000) / 10 : 100,
    },
    diagnostic_completion_rate: {
      started: diagnosticsStarted,
      submitted_30q: diagnosticsSubmitted,
      rate_percent: diagnosticsStarted > 0 ? Math.min(100, Math.round((diagnosticsSubmitted / diagnosticsStarted) * 1000) / 10) : 0,
    },
    learning_session_duration: {
      total_valid_minutes: Math.round((totalValidSessionMs / 60000) * 10) / 10,
      avg_session_minutes: activeSessionsCount > 0 ? Math.round((totalValidSessionMs / activeSessionsCount / 60000) * 10) / 10 : 0,
      active_sessions_count: activeSessionsCount,
      idle_cap_minutes: 15,
    },
    retention_d7_d14: {
      cohort_users: cohortUsers,
      d7_retained: d7Retained,
      d7_rate_percent: cohortUsers > 0 ? Math.round((d7Retained / cohortUsers) * 1000) / 10 : 0,
      d14_retained: d14Retained,
      d14_rate_percent: cohortUsers > 0 ? Math.round((d14Retained / cohortUsers) * 1000) / 10 : 0,
    },
    free_to_vip_conversion: {
      eligible_base: eligibleBase,
      total_vip: totalVipProfiles,
      sepay_paid_count: paidVipUsers.size,
      admin_grant_count: grantVipUsers.size,
      conversion_percent: eligibleBase > 0 ? Math.round((totalVipProfiles / eligibleBase) * 1000) / 10 : 0,
      sepay_conversion_percent: eligibleBase > 0 ? Math.round((paidVipUsers.size / eligibleBase) * 1000) / 10 : 0,
    },
    paywall_abandonment: {
      paywall_views: paywallViews,
      checkout_initiated: checkoutInitiated,
      abandonment_percent: paywallViews > 0 ? Math.max(0, Math.round(((paywallViews - checkoutInitiated) / paywallViews) * 1000) / 10) : 0,
      by_variant: variantBreakdown,
    },
  };
}
