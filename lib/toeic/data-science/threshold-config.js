/**
 * Centralized Data Science Threshold Configuration (Phase 3 Review Section 2, 5 & 6)
 * All operational cutoffs are configurable here rather than hardcoded across modules.
 */

export const DS_THRESHOLDS = {
  // Crowd Intelligence Display Gates (Section 2.1)
  CROWD_SAMPLE: {
    MIN_VISIBLE: 20,       // < 20 attempts: do not display distractor rate
    PRELIMINARY_MAX: 49,   // 20-49: display with "Dữ liệu sơ bộ" badge
    VERIFIED_MIN: 50,      // >= 50: display verified crowd stats
    HIGH_CONFIDENCE: 100,  // >= 100: eligible for advanced analytics
  },

  // 4-Quadrant Mastery Matrix Thresholds (Section 5)
  QUADRANT: {
    LOW_ACCURACY_PCT: 60,     // < 60% answered accuracy -> Gap or Trap
    HIGH_ACCURACY_PCT: 80,    // >= 80% answered accuracy -> Slow Fluency or Mastered
    SLOW_SPEED_RATIO: 1.30,   // > 1.3x expected time -> Slow (Critical Gap or Slow Fluency)
  },

  // Confidence Level Cutoffs by Answered Evidence Count (Section 2.3 A / DS-006)
  CONFIDENCE: {
    LOW_MAX_EVIDENCE: 4,      // 1-4 answered questions -> LOW confidence
    MEDIUM_MAX_EVIDENCE: 14,  // 5-14 answered questions -> MEDIUM confidence
    HIGH_MIN_EVIDENCE: 15,    // >= 15 answered questions -> HIGH confidence
  },

  // IRT Calibration Sample Size Gates (Section 6 / DS-009 — Exam attempts only)
  IRT_CALIBRATION: {
    PRIOR_ONLY_MAX: 49,       // < 50 exam attempts -> keep prior_irt_b
    MONITORING_MAX: 99,       // 50-99 -> monitoring only
    EXPERIMENTAL_MAX: 299,    // 100-299 -> experimental calibration
    CALIBRATED_MIN: 300,      // >= 300 -> official calibration eligible
    PRIOR_WEIGHT: 50,         // Empirical Bayes shrinkage weight
  },
};
