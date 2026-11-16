import { DS_THRESHOLDS } from './threshold-config.js';

/**
 * Confidence Calculator (Phase 3 Review Section 2.3 A / DS-006)
 * Prevents over-diagnosing a learner when evidence_count is too small (e.g. 2/2 wrong).
 */
export function calculateConfidenceMetrics(evidenceCount = 0) {
  const n = Math.max(0, Number(evidenceCount || 0));
  const { LOW_MAX_EVIDENCE, MEDIUM_MAX_EVIDENCE, HIGH_MIN_EVIDENCE } = DS_THRESHOLDS.CONFIDENCE;

  let confidenceLevel = 'LOW';
  if (n >= HIGH_MIN_EVIDENCE) {
    confidenceLevel = 'HIGH';
  } else if (n > LOW_MAX_EVIDENCE && n <= MEDIUM_MAX_EVIDENCE) {
    confidenceLevel = 'MEDIUM';
  }

  // Smooth saturation curve 0..100 reaching ~85% at n=15 and 100% at n>=20
  const confidenceScore = Number(Math.min(100, (n / 20) * 100).toFixed(2));

  return {
    evidenceCount: n,
    confidenceLevel,
    confidenceScore,
  };
}
