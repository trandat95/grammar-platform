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
