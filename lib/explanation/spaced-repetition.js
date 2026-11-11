/**
 * Milestone 2.5.10: Intelligent Spaced Repetition Scheduler (SM-2 Variant)
 * Supports canonical review intervals: 1 -> 3 -> 7 -> 14 -> 30 days.
 */

export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates the next scheduled review timestamp & card state using an SM-2 variant
 * calibrated to 1 -> 3 -> 7 -> 14 -> 30 day retention checkpoints.
 *
 * @param {Object} existingCard - Prior record (optional for first encounter)
 * @param {boolean} isCorrect - Whether learner answered accurately
 * @param {number} qualityRating - SM-2 quality grade 0..5 (default 4 if correct, 1 if incorrect)
 * @param {Date} now - Reference timestamp
 */
export function calculateNextReview(existingCard = null, isCorrect = false, qualityRating = null, now = new Date()) {
  const prevEase = Number(existingCard?.ease_factor || 2.5);
  const prevConsecutive = Number(existingCard?.consecutive_correct || 0);
  const prevReps = Number(existingCard?.repetitions || 0);

  const q = qualityRating !== null && qualityRating !== undefined
    ? Math.max(0, Math.min(5, Number(qualityRating)))
    : (isCorrect ? 4 : 1);

  // SM-2 Ease Factor adjustment
  let nextEase = prevEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  nextEase = Math.max(1.3, Math.round(nextEase * 100) / 100);

  let nextConsecutive = 0;
  let nextReps = 0;
  let intervalDays = 1;
  let status = "learning";

  if (!isCorrect || q < 3) {
    // Lapse / failed recall: reset cycle back to 1-day reinforcement
    nextConsecutive = 0;
    nextReps = 0;
    intervalDays = 1;
    status = "learning";
  } else {
    nextConsecutive = prevConsecutive + 1;
    nextReps = prevReps + 1;

    if (nextConsecutive <= SPACED_REPETITION_INTERVALS.length) {
      intervalDays = SPACED_REPETITION_INTERVALS[nextConsecutive - 1];
    } else {
      // Beyond 30 days, scale conservatively by ease factor
      const prevInterval = Number(existingCard?.interval_days || 30);
      intervalDays = Math.min(90, Math.round(prevInterval * Math.min(nextEase, 2.0)));
    }

    if (nextConsecutive >= SPACED_REPETITION_INTERVALS.length) {
      status = "mastered";
    } else if (nextConsecutive >= 2) {
      status = "due";
    } else {
      status = "learning";
    }
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * MS_PER_DAY);

  return {
    ease_factor: nextEase,
    interval_days: intervalDays,
    repetitions: nextReps,
    consecutive_correct: nextConsecutive,
    last_reviewed_at: now.toISOString(),
    next_review_at: nextReviewAt.toISOString(),
    status,
    is_fully_mastered: status === "mastered",
  };
}

/**
 * Summarizes daily queue status for learner notifications & review banners.
 */
export function getDailyDueSummary(cards = [], now = new Date()) {
  const nowMs = now.getTime();
  const dueCards = [];
  let masteredCount = 0;
  let overdueCount = 0;

  for (const card of cards) {
    if (card.status === "mastered") {
      masteredCount += 1;
      continue;
    }
    const nextMs = card.next_review_at ? new Date(card.next_review_at).getTime() : 0;
    if (nextMs <= nowMs) {
      dueCards.push(card);
      if (nowMs - nextMs > 2 * MS_PER_DAY) {
        overdueCount += 1;
      }
    }
  }

  dueCards.sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());

  const dueCount = dueCards.length;
  const prompt =
    dueCount > 0
      ? `Bạn có ${dueCount} câu hỏi cần ôn tập hôm nay để duy trì trí nhớ dài hạn.`
      : "Tuyệt vời! Hôm nay bạn đã hoàn thành toàn bộ lịch ôn tập ngắt quãng.";

  return {
    dueCount,
    overdueCount,
    masteredCount,
    totalTracked: cards.length,
    dueCards,
    prompt,
  };
}
