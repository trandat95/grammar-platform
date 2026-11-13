/**
 * AI Scoring Engine: IRT 3PL Estimation, Score Conversion & Focus Priority Index (FPI)
 * Matches specification in Section 3.1 verbatim.
 */

/**
 * Convert theta ability (-2.5 to +2.5) to TOEIC score (10 to 990, multiples of 5)
 */
function thetaToToeicScore(theta) {
  const raw = 495 + theta * 195;
  const clamped = Math.max(10, Math.min(990, raw));
  return Math.round(clamped / 5) * 5;
}

/**
 * 1. Ước lượng năng lực Theta (-2.5 -> +2.5) theo mô hình IRT 3PL (EAP - Expected A Posteriori)
 * trên 101 điểm từ -2.5 đến +2.5 và quy đổi ra Điểm TOEIC Dự Đoán (10 -> 990, bội số của 5).
 */
function estimateIRTAbilityAndScore(attempts = [], priorTheta = -0.2) {
  if (!attempts || attempts.length === 0) {
    return { theta: priorTheta, predictedScore: thetaToToeicScore(priorTheta) };
  }

  // Duyệt lưới EAP trên 101 điểm từ -2.5 đến +2.5 (cực kỳ ổn định, không bao giờ phân kỳ)
  let numerator = 0;
  let denominator = 0;

  for (let idx = 0; idx <= 100; idx++) {
    const thetaGrid = -2.5 + idx * 0.05;
    // Prior chuẩn N(priorTheta, 1.0^2)
    let logLikelihood = -0.5 * Math.pow((thetaGrid - priorTheta) / 1.0, 2);

    for (const att of attempts) {
      const irt = att.question?.ai_analysis?.irt_3pl || {
        discrimination_a: 1.2,
        difficulty_b: 0.0,
        guessing_c: 0.25
      };
      const a = irt.discrimination_a;
      const b = irt.difficulty_b;
      const c = irt.guessing_c;

      const isCorrect = (att.selectedOption === att.question?.correct_answer) && !att.usedHint;
      const expTerm = Math.exp(-a * (thetaGrid - b));
      const pCorrect = c + (1 - c) / (1 + expTerm);
      const pClamped = Math.max(1e-6, Math.min(1 - 1e-6, pCorrect));

      logLikelihood += isCorrect ? Math.log(pClamped) : Math.log(1 - pClamped);
    }

    const weight = Math.exp(logLikelihood);
    numerator += thetaGrid * weight;
    denominator += weight;
  }

  const finalTheta = denominator > 0 ? Number((numerator / denominator).toFixed(3)) : priorTheta;
  return {
    theta: finalTheta,
    predictedScore: thetaToToeicScore(finalTheta)
  };
}

/**
 * 2. Tính Điểm Thông Thạo (Mastery Score 0..100), Trạng thái tốc độ (Speed Status)
 * và Chỉ số Ưu tiên Tập trung (Focus Priority Index - FPI) cho một Chủ điểm Ngữ pháp.
 */
function computeTopicMetrics(state, userPredictedScore = 450) {
  const attempted = state.questionsAttempted || 0;
  const correct = state.questionsCorrect || 0;
  const weightInToeic = state.weightInToeic || 2.0;
  const targetBand = state.targetScoreBand || 550;
  const recommendedTimeSec = state.recommendedTimeSec || 12;
  const recentErrorStreak = state.recentErrorStreak || 0;

  if (attempted === 0) {
    const bandDiff = Math.abs(targetBand - userPredictedScore);
    const bandFit = bandDiff <= 150 ? 1.5 : 0.7;
    const baseFpi = 65 * Math.log(1 + weightInToeic) * bandFit;
    return {
      masteryScore: 0,
      accuracyPct: 0,
      avgTimeSec: 0,
      speedStatus: 'WEAK',
      focusPriorityIndex: Number(baseFpi.toFixed(2))
    };
  }

  const accuracyPct = (correct / attempted) * 100;
  const weightedAccuracy = ((state.weightedCorrectSum || correct) / Math.max(1, state.weightedTotalSum || attempted)) * 100;
  const avgTimeSec = (state.totalTimeSec || (attempted * recommendedTimeSec)) / attempted;
  const timeRatio = avgTimeSec / Math.max(5, recommendedTimeSec);

  let speedStatus = 'WEAK';
  let speedMultiplier = 1.0;

  if (accuracyPct >= 75 && timeRatio <= 1.25) {
    speedStatus = 'FAST_ACCURATE';
    speedMultiplier = 1.0;
  } else if (accuracyPct >= 75 && timeRatio > 1.25) {
    speedStatus = 'SLOW_ACCURATE';
    speedMultiplier = 0.85;
  } else if (accuracyPct < 55 && timeRatio < 0.5) {
    speedStatus = 'FAST_GUESSING';
    speedMultiplier = 0.75;
  } else {
    speedStatus = 'WEAK';
    speedMultiplier = 0.9;
  }

  const confidenceFactor = Math.min(1.0, attempted / 6);
  const masteryScore = Number((weightedAccuracy * speedMultiplier * confidenceFactor).toFixed(1));

  // Công thức Focus Priority Index (FPI)
  const bandDiff = Math.abs(targetBand - userPredictedScore);
  const bandFit = bandDiff <= 150 ? 1.5 : bandDiff <= 250 ? 1.0 : 0.6;
  const errorStreakBoost = 1 + 0.2 * Math.min(5, recentErrorStreak);
  const fpi = (100 - masteryScore) * Math.log(1 + weightInToeic) * bandFit * errorStreakBoost;

  return {
    masteryScore,
    accuracyPct: Number(accuracyPct.toFixed(1)),
    avgTimeSec: Number(avgTimeSec.toFixed(1)),
    speedStatus,
    focusPriorityIndex: Number(fpi.toFixed(2))
  };
}

module.exports = {
  thetaToToeicScore,
  estimateIRTAbilityAndScore,
  computeTopicMetrics
};
