import { DS_THRESHOLDS } from './threshold-config.js';

/**
 * Phase 3.5 (Section 6 / DS-009):
 * 2PL Primary IRT Ability Estimator, Sample-Gated Calibration & Fatigue Drop Detector
 */

/**
 * 2-Parameter Logistic IRT model: P(X=1 | theta, a, b) = 1 / (1 + exp(-a * (theta - b)))
 */
export function irt2plProb(theta, a = 1.2, b = 0.0) {
  const z = Math.max(-20, Math.min(20, a * (theta - b)));
  return 1 / (1 + Math.exp(-z));
}

/**
 * 3-Parameter Logistic IRT model (used only when sample size is large enough for guessing parameter c)
 */
export function irt3plProb(theta, a = 1.2, b = 0.0, c = 0.25) {
  const z = Math.max(-20, Math.min(20, a * (theta - b)));
  return c + (1 - c) / (1 + Math.exp(-z));
}

/**
 * Estimates learner ability theta in [-3.0, 3.0] using 2PL MAP (Bayesian Maximum A Posteriori with N(0,1) prior)
 * and maps to calibrated ETS Reading Score scale (5 - 495).
 */
export function estimateThetaAndScore(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return { theta: 0, standardError: 1.0, estReadingScore: 5 };
  }

  let bestTheta = 0;
  let bestLogLik = -Infinity;

  for (let t = -3.0; t <= 3.001; t += 0.05) {
    let ll = -0.5 * t * t; // N(0,1) prior
    for (const item of items) {
      const a = Number(item.a || 1.2);
      const b = Number(item.b || 0.0);
      const p = Math.max(1e-6, Math.min(1 - 1e-6, irt2plProb(t, a, b)));
      ll += item.isCorrect ? Math.log(p) : Math.log(1 - p);
    }
    if (ll > bestLogLik) {
      bestLogLik = ll;
      bestTheta = t;
    }
  }

  // Fisher Information I(theta) = sum(a_i^2 * P_i * (1 - P_i)) + 1 (from N(0,1) prior)
  let fisherInfo = 1.0;
  for (const item of items) {
    const a = Number(item.a || 1.2);
    const b = Number(item.b || 0.0);
    const p = irt2plProb(bestTheta, a, b);
    fisherInfo += a * a * p * (1 - p);
  }
  const standardError = Number((1 / Math.sqrt(Math.max(1e-4, fisherInfo))).toFixed(4));
  const theta = Number(bestTheta.toFixed(3));

  // Calibrated ETS Reading Score conversion table approximation (piecewise linear + logistic anchor)
  const correctCount = items.filter(i => i.isCorrect).length;
  const rawRatio = correctCount / Math.max(1, items.length);
  const thetaSigmoid = 1 / (1 + Math.exp(-0.9 * theta));
  const compositeRatio = 0.70 * rawRatio + 0.30 * thetaSigmoid;
  const estReadingScore = Math.min(495, Math.max(5, Math.round((5 + compositeRatio * 490) / 5) * 5));

  return { theta, standardError, estReadingScore };
}

/**
 * Sample-Size Gated IRT Difficulty Calibration (DS-005 & DS-009):
 * Strictly uses EXAM attempts only (never Practice attempts).
 * - < 50 exam attempts: 'prior_only' (keeps prior_irt_b untouched)
 * - 50-99:              'monitoring' (keeps prior_irt_b, computes SE)
 * - 100-299:            'experimental' (Empirical Bayes shrinkage w=50)
 * - >= 300:             'calibrated' (Full Empirical Bayes calibration)
 */
export function evaluateItemCalibration({ priorA = 1.2, priorB = 0.0, examAttemptCount = 0, examCorrectCount = 0 }) {
  const n = Math.max(0, Number(examAttemptCount || 0));
  const k = Math.max(0, Math.min(n, Number(examCorrectCount || 0)));
  const { PRIOR_ONLY_MAX, MONITORING_MAX, EXPERIMENTAL_MAX, PRIOR_WEIGHT } = DS_THRESHOLDS.IRT_CALIBRATION;

  if (n <= PRIOR_ONLY_MAX) {
    return {
      calibratedA: Number(priorA || 1.2),
      calibratedB: Number(priorB || 0.0),
      irtSampleSize: n,
      irtStandardError: null,
      calibrationStatus: 'prior_only',
    };
  }

  const p = Math.max(0.05, Math.min(0.95, k / n));
  const empiricalB = Math.max(-3.0, Math.min(3.0, Math.log((1 - p) / p)));
  const se = Number((1 / Math.sqrt(Math.max(1, n * p * (1 - p)))).toFixed(5));

  if (n <= MONITORING_MAX) {
    return {
      calibratedA: Number(priorA || 1.2),
      calibratedB: Number(priorB || 0.0),
      irtSampleSize: n,
      irtStandardError: se,
      calibrationStatus: 'monitoring',
    };
  }

  const calibratedB = Number(
    ((PRIOR_WEIGHT * Number(priorB || 0.0) + n * empiricalB) / (PRIOR_WEIGHT + n)).toFixed(3)
  );
  const calibrationStatus = n <= EXPERIMENTAL_MAX ? 'experimental' : 'calibrated';

  return {
    calibratedA: Number(priorA || 1.2),
    calibratedB,
    irtSampleSize: n,
    irtStandardError: se,
    calibrationStatus,
  };
}

/**
 * Legacy helper alias for backwards compatibility
 */
export function computeEmpiricalBayesIrtB(priorB = 0.0, examAttemptCount = 0, examCorrectCount = 0) {
  return evaluateItemCalibration({ priorB, examAttemptCount, examCorrectCount }).calibratedB;
}

/**
 * Fatigue Drop Detector (Q101-175 vs Q176-200)
 */
export function computeFatigueDrop(readingQuestions = [], userAnswers = {}) {
  const early = readingQuestions.filter(q => (q.number || 0) <= 175 && userAnswers[q.id]);
  const late = readingQuestions.filter(q => (q.number || 0) > 175 && userAnswers[q.id]);

  if (early.length < 5 || late.length < 3) {
    return {
      fatigueDropRate: 0,
      earlyAccuracy: early.length ? Math.round((early.filter(q => userAnswers[q.id] === q.correct_answer).length / early.length) * 100) : 0,
      lateAccuracy: late.length ? Math.round((late.filter(q => userAnswers[q.id] === q.correct_answer).length / late.length) * 100) : 0,
      hasFatigueWarning: false,
      coachingTip: null,
    };
  }

  const earlyAcc = (early.filter(q => userAnswers[q.id] === q.correct_answer).length / early.length) * 100;
  const lateAcc = (late.filter(q => userAnswers[q.id] === q.correct_answer).length / late.length) * 100;
  const drop = Number((earlyAcc - lateAcc).toFixed(2));

  return {
    fatigueDropRate: Math.max(0, drop),
    earlyAccuracy: Math.round(earlyAcc),
    lateAccuracy: Math.round(lateAcc),
    hasFatigueWarning: drop >= 15,
    coachingTip:
      drop >= 15
        ? `Độ chính xác tụt ${Math.round(drop)}% ở 25 câu cuối Part 7 (Q176–200). Gợi ý: rút ngắn Part 5 xuống ≤ 10 phút và Part 6 ≤ 8 phút để dành trọn 57 phút cho Part 7.`
        : null,
  };
}
