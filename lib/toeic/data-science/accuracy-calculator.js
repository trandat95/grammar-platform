/**
 * Accuracy Calculator (Phase 3 Review Section 5)
 * Explicitly separates Answered Accuracy from Total Test Accuracy (accounting for skipped items).
 */

export function calculateAccuracyMetrics({ correctCount = 0, answeredCount = 0, totalCount = 0 }) {
  const safeCorrect = Math.max(0, Number(correctCount || 0));
  const safeAnswered = Math.max(0, Number(answeredCount || 0));
  const safeTotal = Math.max(0, Number(totalCount || 0));

  const answeredAccuracyPct = safeAnswered > 0 ? Number(((safeCorrect / safeAnswered) * 100).toFixed(2)) : 0;
  const totalAccuracyPct = safeTotal > 0 ? Number(((safeCorrect / safeTotal) * 100).toFixed(2)) : 0;

  return {
    answeredAccuracyPct,
    totalAccuracyPct,
    answeredAccuracyRatio: safeAnswered > 0 ? Number((safeCorrect / safeAnswered).toFixed(4)) : 0,
  };
}
