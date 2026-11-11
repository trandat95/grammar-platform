/**
 * Milestone 2.5.10 & 2.9.1: Intelligent Spaced Repetition Engine (SM-2 / FSRS Hybrid)
 * - 5-state Memory State Machine: New | Learning | Review | Relearning | Mastered
 * - Response-time & history weighted stability / retrievability model
 * - Retention checkpoints: 1 -> 3 -> 7 -> 14 -> 30 days
 */

export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30];

export const MEMORY_STATES = {
  NEW: "New",
  LEARNING: "Learning",
  REVIEW: "Review",
  RELEARNING: "Relearning",
  MASTERED: "Mastered",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates next scheduled review, SM-2 ease/stability/retrievability, and 5-state memory transition.
 */
export function calculateNextReview(
  existingCard = null,
  isCorrect = false,
  qualityRating = null,
  now = new Date(),
  options = {}
) {
  const { responseTimeMs = 0, difficultyWeight = 3 } = options;
  const prevEase = Number(existingCard?.ease_factor || 2.5);
  const prevConsecutive = Number(existingCard?.consecutive_correct || 0);
  const prevReps = Number(existingCard?.repetitions || 0);
  const prevState = existingCard?.memory_state || MEMORY_STATES.NEW;
  const prevStability = Number(existingCard?.stability_score || 1.0);
  const prevHistory = Array.isArray(existingCard?.correct_history) ? existingCard.correct_history : [];

  // Derive quality grade (0..5) factoring response speed when explicit rating omitted
  let derivedQ = isCorrect ? 4 : 1;
  if (qualityRating !== null && qualityRating !== undefined) {
    derivedQ = Math.max(0, Math.min(5, Number(qualityRating)));
  } else if (isCorrect && responseTimeMs > 0) {
    if (responseTimeMs <= 7000) derivedQ = 5;
    else if (responseTimeMs <= 20000) derivedQ = 4;
    else derivedQ = 3; // hesitating correct recall
  } else if (!isCorrect && responseTimeMs > 25000) {
    derivedQ = 0;
  }

  let nextEase = prevEase + (0.1 - (5 - derivedQ) * (0.08 + (5 - derivedQ) * 0.02));
  nextEase = Math.max(1.3, Math.round(nextEase * 100) / 100);

  let nextConsecutive = 0;
  let nextReps = 0;
  let intervalDays = 1;
  let status = "learning";
  let memoryState = MEMORY_STATES.LEARNING;
  let stabilityScore = 1.0;

  if (!isCorrect || derivedQ < 3) {
    nextConsecutive = 0;
    nextReps = 0;
    intervalDays = 1;
    status = "learning";
    // Transition to Relearning if learner previously passed this concept/question
    const hadPriorSuccess =
      prevState === MEMORY_STATES.REVIEW ||
      prevState === MEMORY_STATES.MASTERED ||
      prevConsecutive > 0 ||
      prevHistory.some((h) => h === true || h?.ok === true);
    memoryState = hadPriorSuccess ? MEMORY_STATES.RELEARNING : MEMORY_STATES.LEARNING;
    stabilityScore = Math.max(0.8, Math.round(prevStability * 0.45 * 100) / 100);
  } else {
    nextConsecutive = prevConsecutive + 1;
    nextReps = prevReps + 1;

    if (nextConsecutive <= SPACED_REPETITION_INTERVALS.length) {
      intervalDays = SPACED_REPETITION_INTERVALS[nextConsecutive - 1];
    } else {
      const prevInterval = Number(existingCard?.interval_days || 30);
      intervalDays = Math.min(90, Math.round(prevInterval * Math.min(nextEase, 2.0)));
    }

    const stabilityGain = 1 + (derivedQ / 5) * (difficultyWeight / 3);
    stabilityScore = Math.min(90, Math.round(Math.max(intervalDays, prevStability * stabilityGain) * 100) / 100);

    const fastStableMastery = nextConsecutive >= SPACED_REPETITION_INTERVALS.length && (responseTimeMs <= 0 || responseTimeMs <= 22000);
    if (fastStableMastery) {
      status = "mastered";
      memoryState = MEMORY_STATES.MASTERED;
    } else if (nextConsecutive >= 2) {
      status = "due";
      memoryState = MEMORY_STATES.REVIEW;
    } else {
      status = "learning";
      memoryState = MEMORY_STATES.LEARNING;
    }
  }

  // Ebbinghaus Retrievability estimate right after review = ~0.95-1.0, decays via exp(-t/S)
  const retrievabilityScore = isCorrect ? (derivedQ >= 4 ? 0.99 : 0.92) : 0.4;
  const nextReviewAt = new Date(now.getTime() + intervalDays * MS_PER_DAY);

  const nextHistory = [
    ...prevHistory,
    { ok: Boolean(isCorrect), ms: Math.max(0, Math.round(Number(responseTimeMs || 0))), at: now.toISOString() },
  ].slice(-20);

  return {
    ease_factor: nextEase,
    interval_days: intervalDays,
    repetitions: nextReps,
    consecutive_correct: nextConsecutive,
    last_reviewed_at: now.toISOString(),
    next_review_at: nextReviewAt.toISOString(),
    status,
    memory_state: memoryState,
    response_time_ms: Math.max(0, Math.round(Number(responseTimeMs || 0))),
    correct_history: nextHistory,
    difficulty_rating: Math.max(1, Math.min(5, Number(difficultyWeight || 3))),
    stability_score: stabilityScore,
    retrievability_score: retrievabilityScore,
    is_fully_mastered: memoryState === MEMORY_STATES.MASTERED,
  };
}

/**
 * Summarizes daily queue status for learner notifications & review banners.
 */
export function getDailyDueSummary(cards = [], now = new Date()) {
  const nowMs = now.getTime();
  const dueCards = [];
  const stateBreakdown = { New: 0, Learning: 0, Review: 0, Relearning: 0, Mastered: 0 };
  let masteredCount = 0;
  let overdueCount = 0;

  for (const card of cards) {
    const mState = card.memory_state || (card.status === "mastered" ? "Mastered" : "Learning");
    if (stateBreakdown[mState] !== undefined) stateBreakdown[mState] += 1;

    if (card.status === "mastered" || mState === MEMORY_STATES.MASTERED) {
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

  dueCards.sort((a, b) => new Date(a.next_review_at || 0).getTime() - new Date(b.next_review_at || 0).getTime());

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
    stateBreakdown,
    dueCards,
    prompt,
  };
}

/**
 * Milestone 2.9.2: Generates Ebbinghaus Forgetting Curve checkpoints (1 -> 3 -> 7 -> 14 -> 30 days)
 * + Short-term Learning, Long-term Retention (>= 14d), and Consistency Index.
 */
export function calculateForgettingCurve(srCards = [], now = new Date()) {
  const cards = srCards || [];
  const avgStability =
    cards.length > 0
      ? cards.reduce((sum, c) => sum + Number(c.stability_score || c.interval_days || 2), 0) / cards.length
      : 4.5;

  const checkpoints = SPACED_REPETITION_INTERVALS.map((day) => {
    // Compare observed accuracy at interval >= day vs Ebbinghaus curve exp(-day / (avgStability * 2.5))
    const matchingAtHorizon = cards.filter((c) => Number(c.interval_days || 1) >= day);
    const predicted = Math.round(Math.exp(-day / Math.max(3, avgStability * 2.8)) * 100);
    let observed = null;

    if (matchingAtHorizon.length > 0) {
      let okTotal = 0;
      let countTotal = 0;
      for (const c of matchingAtHorizon) {
        const hist = Array.isArray(c.correct_history) ? c.correct_history : [];
        if (hist.length > 0) {
          okTotal += hist.filter((h) => h === true || h?.ok === true).length;
          countTotal += hist.length;
        } else {
          okTotal += c.status === "mastered" || (c.consecutive_correct || 0) > 0 ? 1 : 0;
          countTotal += 1;
        }
      }
      if (countTotal > 0) {
        observed = Math.round((okTotal / countTotal) * 100);
      }
    }

    return {
      day,
      label: `${day} ngày`,
      predictedRetention: Math.max(40, Math.min(99, predicted)),
      observedRetention: observed,
      cardsAtHorizon: matchingAtHorizon.length,
    };
  });

  // Short-term Learning vs Long-term Retention (>= 14d) vs Consistency Index
  let shortOk = 0;
  let shortTot = 0;
  let longOk = 0;
  let longTot = 0;
  let consistencySum = 0;
  let consistencySamples = 0;

  for (const c of cards) {
    const hist = Array.isArray(c.correct_history) ? c.correct_history : [];
    const ok = hist.filter((h) => h === true || h?.ok === true).length;
    const tot = hist.length;
    if (tot > 0) {
      if (Number(c.interval_days || 1) >= 14) {
        longOk += ok;
        longTot += tot;
      } else {
        shortOk += ok;
        shortTot += tot;
      }
      consistencySum += (ok / tot) * 100;
      consistencySamples += 1;
    }
  }

  return {
    checkpoints,
    shortTermLearning: shortTot > 0 ? Math.round((shortOk / shortTot) * 100) : 0,
    longTermRetention: longTot > 0 ? Math.round((longOk / longTot) * 100) : 0,
    consistencyIndex: consistencySamples > 0 ? Math.round(consistencySum / consistencySamples) : 0,
    evaluatedAt: now.toISOString(),
  };
}
