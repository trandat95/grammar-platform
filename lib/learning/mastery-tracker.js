/**
 * Milestone 2.5.9 & 2.5.11: Real-Time Concept Mastery Tracker & Knowledge Decay
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DECAY_GRACE_DAYS = 14;
export const DECAY_WEEKLY_RATE_PERCENT = 5;
export const DECAY_MIN_FLOOR = 50;

/**
 * Applies Ebbinghaus-aligned Knowledge Decay:
 * If a learner has not reviewed a concept 14+ days past its scheduled due date,
 * mastery drops by 5% per overdue week, floored at 50% (for scores above 50).
 *
 * @param {number} currentScore - Raw mastery score (0..100)
 * @param {string|Date|null} nextReviewAt - Scheduled review due date
 * @param {Date} now - Reference evaluation date
 * @returns {{ decayedScore: number, decayPenalty: number, daysOverdue: number }}
 */
export function applyKnowledgeDecay(currentScore, nextReviewAt, now = new Date()) {
  const baseScore = Math.max(0, Math.min(100, Number(currentScore || 0)));
  if (!nextReviewAt || baseScore <= DECAY_MIN_FLOOR) {
    return { decayedScore: Math.round(baseScore * 100) / 100, decayPenalty: 0, daysOverdue: 0 };
  }

  const dueMs = new Date(nextReviewAt).getTime();
  const daysOverdue = Math.max(0, (now.getTime() - dueMs) / MS_PER_DAY);

  if (daysOverdue <= DECAY_GRACE_DAYS) {
    return { decayedScore: Math.round(baseScore * 100) / 100, decayPenalty: 0, daysOverdue: Math.round(daysOverdue) };
  }

  const overdueWeeks = (daysOverdue - DECAY_GRACE_DAYS) / 7;
  const rawPenalty = overdueWeeks * DECAY_WEEKLY_RATE_PERCENT;
  const decayedScore = Math.max(DECAY_MIN_FLOOR, baseScore - rawPenalty);
  const actualPenalty = Math.max(0, baseScore - decayedScore);

  return {
    decayedScore: Math.round(decayedScore * 100) / 100,
    decayPenalty: Math.round(actualPenalty * 100) / 100,
    daysOverdue: Math.round(daysOverdue),
  };
}

/**
 * Computes Mastery(C) in [0, 100] from real-time concept attempt counters & retention interval.
 */
export function calculateConceptMasteryScore({
  attempts = 0,
  correct_attempts = 0,
  consecutive_correct = 0,
  interval_days = 1,
  next_review_at = null,
  now = new Date(),
}) {
  const total = Math.max(0, Number(attempts || 0));
  if (total === 0) return { masteryScore: 0, masteryStatus: "learning", decayPenalty: 0, daysOverdue: 0 };

  const accuracyRatio = Math.min(1, Math.max(0, Number(correct_attempts || 0) / total));
  const streakBonus = Math.min(1, Number(consecutive_correct || 0) / 5);
  const durabilityBonus = Math.min(1, Number(interval_days || 1) / 30);

  // Sample-size dampening so 1 lucky right answer doesn't hit 100% instantly
  const confidenceWeight = Math.min(1, total / 3);
  const rawScore =
    (accuracyRatio * 55 + streakBonus * 25 + durabilityBonus * 20) * (0.65 + 0.35 * confidenceWeight);

  const bounded = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
  const decay = applyKnowledgeDecay(bounded, next_review_at, now);

  let masteryStatus = "learning";
  if (decay.decayedScore >= 85 && consecutive_correct >= 3) {
    masteryStatus = "mastered";
  } else if (decay.decayedScore >= 55) {
    masteryStatus = "developing";
  }

  return {
    masteryScore: decay.decayedScore,
    masteryStatus,
    decayPenalty: decay.decayPenalty,
    daysOverdue: decay.daysOverdue,
  };
}
