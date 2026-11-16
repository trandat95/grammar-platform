/**
 * Speed Analyzer (Phase 3 Review Section 2.1 & Section 5)
 * Speed Ratio = Actual Average Time / Expected Recommended Time (computed strictly over timed_attempt_count).
 */

export function calculateSpeedMetrics({ totalTimeSec = 0, timedAttemptCount = 0, totalExpectedTimeSec = 0 }) {
  const safeTimedCount = Math.max(0, Number(timedAttemptCount || 0));
  const safeTotalTime = Math.max(0, Number(totalTimeSec || 0));
  const safeExpected = Math.max(1, Number(totalExpectedTimeSec || 1));

  const avgTimeSec = safeTimedCount > 0 ? Number((safeTotalTime / safeTimedCount).toFixed(2)) : 0;
  const avgExpectedSec = safeTimedCount > 0 ? Number((safeExpected / safeTimedCount).toFixed(2)) : safeExpected;
  const speedRatio = safeTimedCount > 0 && avgExpectedSec > 0
    ? Number((avgTimeSec / avgExpectedSec).toFixed(2))
    : 1.0;

  return {
    avgTimeSec,
    avgExpectedSec,
    speedRatio,
  };
}
