/**
 * Milestone 2.10.1 & 2.10.2: Server-Authoritative XP & Level Progression Engine
 * Anti-Abuse: Rejects farming repeated Mastered items; thresholds match Section 8B.2.
 */

export const XP_REWARDS = {
  QUESTION_COMPLETED: 5,
  QUESTION_CORRECT_BONUS: 5,
  QUIZ_COMPLETED: 20,
  QUIZ_HIGH_ACCURACY_BONUS: 20, // >= 90% accuracy
  DAILY_REVIEW_COMPLETED: 30,
  DAILY_CHALLENGE: 50,
  MASTER_TOPIC: 100, // First time reaching >= 90% mastery
  WEEKLY_GOAL: 150,
};

/**
 * Canonical Database/Spec Level Tiers (Section 8B.2):
 * Lv 1-5: 0-500 XP (Beginner)
 * Lv 6-10: 501-1,500 XP (Grammar Explorer)
 * Lv 11-20: 1,501-5,000 XP (Grammar Fighter)
 * Lv 21-30: 5,001-12,000 XP (Grammar Expert)
 * Lv 31-40: 12,001-25,000 XP (Grammar Master)
 * Lv 41+: 25,001+ XP (Grammar Legend)
 */
export const LEVEL_BANDS = [
  { minLevel: 1, maxLevel: 5, minXp: 0, maxXp: 500, stepXp: 100, title: "Beginner", icon: "🌱" },
  { minLevel: 6, maxLevel: 10, minXp: 501, maxXp: 1500, stepXp: 200, title: "Grammar Explorer", icon: "🧭" },
  { minLevel: 11, maxLevel: 20, minXp: 1501, maxXp: 5000, stepXp: 350, title: "Grammar Fighter", icon: "⚔️" },
  { minLevel: 21, maxLevel: 30, minXp: 5001, maxXp: 12000, stepXp: 700, title: "Grammar Expert", icon: "🎓" },
  { minLevel: 31, maxLevel: 40, minXp: 12001, maxXp: 25000, stepXp: 1300, title: "Grammar Master", icon: "👑" },
  { minLevel: 41, maxLevel: 999, minXp: 25001, maxXp: Infinity, stepXp: 2000, title: "Grammar Legend", icon: "💎" },
];

export function calculateLevelProgress(rawTotalXp = 0) {
  const totalXp = Math.max(0, Math.floor(Number(rawTotalXp || 0)));

  let band = LEVEL_BANDS[0];
  for (const b of LEVEL_BANDS) {
    if (totalXp >= b.minXp && totalXp <= b.maxXp) {
      band = b;
      break;
    }
  }

  const offsetInBand = Math.max(0, totalXp - band.minXp);
  const levelsGainedInBand = Math.floor(offsetInBand / band.stepXp);
  const rawLevel = band.minLevel + levelsGainedInBand;
  const level = band.maxLevel < 999 ? Math.min(band.maxLevel, rawLevel) : rawLevel;

  const currentLevelFloorXp = band.minXp + (level - band.minLevel) * band.stepXp;
  const isEndOfBand = band.maxLevel < 999 && level === band.maxLevel;
  const nextBand = isEndOfBand ? LEVEL_BANDS[LEVEL_BANDS.indexOf(band) + 1] : null;
  const nextLevelXp = nextBand ? nextBand.minXp : currentLevelFloorXp + band.stepXp;

  const span = Math.max(1, nextLevelXp - currentLevelFloorXp);
  const xpIntoLevel = Math.max(0, totalXp - currentLevelFloorXp);
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / span) * 100));

  return {
    totalXp,
    level,
    title: band.title,
    badgeIcon: band.icon,
    currentLevelFloorXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel: span,
    xpRemaining: Math.max(0, nextLevelXp - totalXp),
    progressPercent,
  };
}

/**
 * Anti-Farming Eligibility Check (2.10.1 & 8D.1):
 * Prevents earning repeated XP by spamming already-Mastered questions not due for review.
 */
export function evaluateQuestionXpEligibility({
  existingSrCard = null,
  isCorrect = false,
  now = new Date(),
} = {}) {
  const isFirstSeen = !existingSrCard;
  const memoryState = existingSrCard?.memory_state || "New";
  const nextReviewMs = existingSrCard?.next_review_at ? new Date(existingSrCard.next_review_at).getTime() : 0;
  const isDueReview = Boolean(existingSrCard && nextReviewMs <= now.getTime());

  // Already mastered & reviewed early -> 0 XP anti-gaming block
  if (!isFirstSeen && memoryState === "Mastered" && !isDueReview) {
    return {
      eligible: false,
      baseXp: 0,
      correctBonusXp: 0,
      totalXp: 0,
      reason: "ANTI_FARM_MASTERED_NOT_DUE",
    };
  }

  // Answered too recently (< 12h) for non-due Learning/Review item -> block spam farming
  if (!isFirstSeen && !isDueReview && existingSrCard?.last_reviewed_at) {
    const hoursSince = (now.getTime() - new Date(existingSrCard.last_reviewed_at).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 12 && memoryState !== "Relearning") {
      return {
        eligible: false,
        baseXp: 0,
        correctBonusXp: 0,
        totalXp: 0,
        reason: "ANTI_FARM_COOLDOWN_12H",
      };
    }
  }

  const baseXp = XP_REWARDS.QUESTION_COMPLETED;
  const correctBonusXp = isCorrect ? XP_REWARDS.QUESTION_CORRECT_BONUS : 0;
  return {
    eligible: true,
    baseXp,
    correctBonusXp,
    totalXp: baseXp + correctBonusXp,
    reason: isFirstSeen ? "NEW_QUESTION" : isDueReview ? "DUE_REVIEW" : "RELEARNING_PRACTICE",
  };
}
