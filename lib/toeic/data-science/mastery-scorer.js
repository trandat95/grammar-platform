import { DS_THRESHOLDS } from './threshold-config.js';

/**
 * Mastery Scorer & 4-Quadrant Classifier (Phase 3 Review Section 5)
 * Distinguishes:
 * - CRITICAL_GAP: Accuracy < 60% & Speed Ratio > 1.3 (Knowledge Gap)
 * - TRAP_PRONE:   Accuracy < 60% & Speed Ratio <= 1.3 (Cognitive Trap)
 * - SLOW_FLUENCY: Accuracy >= 60% & Speed Ratio > 1.3 (Low Fluency)
 * - MASTERED:     Accuracy >= 80% & Speed Ratio <= 1.3 (Mastered; 60-79% fast defaults to developing/TRAP_PRONE or SLOW_FLUENCY)
 */
export function classifyQuadrantAndMastery({ answeredAccuracyPct = 0, speedRatio = 1.0, evidenceCount = 0 }) {
  const { LOW_ACCURACY_PCT, HIGH_ACCURACY_PCT, SLOW_SPEED_RATIO } = DS_THRESHOLDS.QUADRANT;
  const isSlow = speedRatio > SLOW_SPEED_RATIO;

  let quadrantState = 'CRITICAL_GAP';
  let diagnosisType = 'KNOWLEDGE_GAP';

  if (answeredAccuracyPct < LOW_ACCURACY_PCT) {
    if (isSlow) {
      quadrantState = 'CRITICAL_GAP';
      diagnosisType = 'KNOWLEDGE_GAP';
    } else {
      quadrantState = 'TRAP_PRONE';
      diagnosisType = 'COGNITIVE_TRAP';
    }
  } else if (answeredAccuracyPct >= HIGH_ACCURACY_PCT && !isSlow) {
    quadrantState = 'MASTERED';
    diagnosisType = 'MASTERED';
  } else if (isSlow) {
    quadrantState = 'SLOW_FLUENCY';
    diagnosisType = 'LOW_FLUENCY';
  } else {
    // 60% - 79% accuracy with normal/fast speed: still susceptible to traps
    quadrantState = 'TRAP_PRONE';
    diagnosisType = 'DEVELOPING_TRAP_PRONE';
  }

  // Composite Mastery Score (0..100): 75% accuracy weight + 25% speed efficiency weight, scaled by confidence
  const speedEfficiency = Math.max(0, Math.min(100, (1.5 - Math.min(1.5, Math.max(0.5, speedRatio))) * 100));
  const rawMastery = 0.75 * answeredAccuracyPct + 0.25 * speedEfficiency;
  const evidenceDampener = Math.min(1.0, Math.max(0.35, evidenceCount / 5));
  const masteryScore = Number((rawMastery * evidenceDampener).toFixed(2));

  return {
    quadrantState,
    diagnosisType,
    masteryScore,
  };
}
