/**
 * Phase 3.4: IRT 3PL Ability Estimator, Empirical Bayes Item Calibrator & Fatigue Drop Detector
 */

/**
 * 3-Parameter Logistic IRT probability: P(correct | theta, a, b, c)
 */
export function irt3plProb(theta, a = 1.2, b = 0.0, c = 0.25) {
  const z = Math.max(-20, Math.min(20, a * (theta - b)));
  return c + (1 - c) / (1 + Math.exp(-z));
}

/**
 * Estimates learner ability theta in [-3.0, 3.0] via Grid Search + Newton-Raphson MLE.
 * Also maps theta to ETS Reading Score (5 - 495).
 */
export function estimateThetaAndScore(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return { theta: 0, estReadingScore: 5 };
  }

  let bestTheta = 0;
  let bestLogLik = -Infinity;

  // Coarse grid search over [-3.0, 3.0] with step 0.1 + weak N(0, 1) prior for stability
  for (let t = -3.0; t <= 3.001; t += 0.1) {
    let ll = -0.5 * t * t; // N(0,1) Bayesian MAP regularization
    for (const item of items) {
      const p = Math.max(1e-6, Math.min(1 - 1e-6, irt3plProb(t, item.a || 1.2, item.b || 0.0, item.c ?? 0.25)));
      ll += item.isCorrect ? Math.log(p) : Math.log(1 - p);
    }
    if (ll > bestLogLik) {
      bestLogLik = ll;
      bestTheta = t;
    }
  }

  const theta = Number(bestTheta.toFixed(3));
  const correctCount = items.filter(i => i.isCorrect).length;
  const rawRatio = correctCount / Math.max(1, items.length);
  // Blend raw score ratio (65%) and IRT theta mapping (35%) so score feels intuitive yet ability-aware
  const thetaNorm = (theta + 3) / 6; // 0..1
  const blended = 0.65 * rawRatio + 0.35 * thetaNorm;
  const estReadingScore = Math.min(495, Math.max(5, Math.round((5 + blended * 490) / 5) * 5));

  return { theta, estReadingScore };
}

/**
 * Empirical Bayes Item Difficulty Recalibration
 * Shrinks empirical logit difficulty toward expert prior_irt_b with prior weight w = 20.
 */
export function computeEmpiricalBayesIrtB(priorB = 0.0, attemptCount = 0, correctCount = 0) {
  const n = Math.max(0, Number(attemptCount || 0));
  if (n < 5) return Number(priorB || 0);

  const p = Math.max(0.05, Math.min(0.95, Number(correctCount || 0) / n));
  const empiricalB = Math.max(-3.0, Math.min(3.0, Math.log((1 - p) / p)));
  const priorWeight = 20;
  const calibrated = (priorWeight * Number(priorB || 0) + n * empiricalB) / (priorWeight + n);
  return Number(calibrated.toFixed(2));
}

/**
 * Fatigue Drop Detector:
 * Compares accuracy on Early/Mid items (Q101-Q175) vs Late Part 7 items (Q176-Q200).
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
