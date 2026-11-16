import ToeicRepository from '../toeic-repository';
import { estimateThetaAndScore, computeFatigueDrop } from './irt-calibrator';

/**
 * Phase 3.3: 4-Quadrant Speed × Accuracy Analyzer & Cross-Test Remediation Plan Generator
 */
export function analyzeUserExamPerformance({
  readingQuestions = [],
  userAnswers = {},
  questionTimings = {},
}) {
  const topicMap = new Map();
  const trapMap = new Map();
  const irtItems = [];
  const wrongQuestionIds = [];
  const twinCandidatesSet = new Set();

  let answeredCount = 0;
  let correctCount = 0;

  const partStats = {
    5: { total: 0, answered: 0, correct: 0 },
    6: { total: 0, answered: 0, correct: 0 },
    7: { total: 0, answered: 0, correct: 0 },
  };

  for (const q of readingQuestions) {
    const p = q.part === 5 || q.part === 6 || q.part === 7 ? q.part : 5;
    partStats[p].total += 1;

    const ans = userAnswers[q.id];
    const hasAnswered = Boolean(ans);
    const isCorrect = hasAnswered && ans === q.correct_answer;

    if (hasAnswered) {
      answeredCount += 1;
      partStats[p].answered += 1;
      if (isCorrect) {
        correctCount += 1;
        partStats[p].correct += 1;
      } else {
        wrongQuestionIds.push(q.id);
        const sims = q.ai_analysis?.similar_question_ids;
        if (Array.isArray(sims)) {
          sims.forEach(sid => twinCandidatesSet.add(sid));
        }
      }
    }

    const irt = q.ai_analysis?.irt_3pl || {};
    irtItems.push({
      a: Number(irt.discrimination_a || 1.2),
      b: Number(irt.difficulty_b || 0.0),
      c: Number(irt.guessing_c ?? 0.25),
      isCorrect,
    });

    const topicId = q.primary_grammar_topic_id || q.ai_analysis?.primary_topic_id || `PART_${p}`;
    const topicName = q.ai_analysis?.primary_topic_name_vi || `Chủ điểm Part ${p}`;
    const recTime = Number(q.recommended_time_sec || (p === 5 ? 15 : 45));
    const spent = Number(questionTimings[q.id] || recTime);

    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        topicId,
        topicName,
        part: p,
        total: 0,
        answered: 0,
        correct: 0,
        wrongOrSkipped: 0,
        totalTimeSec: 0,
        totalRecTimeSec: 0,
        wrongNumbers: [],
      });
    }

    const tStat = topicMap.get(topicId);
    tStat.total += 1;
    tStat.totalTimeSec += spent;
    tStat.totalRecTimeSec += recTime;
    if (hasAnswered) tStat.answered += 1;
    if (isCorrect) {
      tStat.correct += 1;
    } else {
      tStat.wrongOrSkipped += 1;
      tStat.wrongNumbers.push(q.number);
    }

    if (hasAnswered && !isCorrect) {
      const optAna = q.ai_analysis?.option_deep_analysis?.[ans];
      const trapCode = optAna?.error_pattern_code || 'ERR_COGNITIVE_TRAP';
      const trapName = optAna?.error_pattern_name_vi || q.ai_analysis?.common_trap_warning_vi;
      if (trapName) {
        if (!trapMap.has(trapCode)) {
          trapMap.set(trapCode, { code: trapCode, name: trapName, count: 0, numbers: [] });
        }
        const tr = trapMap.get(trapCode);
        tr.count += 1;
        tr.numbers.push(q.number);
      }
    }
  }

  const total = readingQuestions.length;
  const wrongCount = answeredCount - correctCount;
  const skippedCount = total - answeredCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const { theta, estReadingScore } = estimateThetaAndScore(irtItems);
  const fatigue = computeFatigueDrop(readingQuestions, userAnswers);

  // Classify each topic into 4 Quadrants (Accuracy x SpeedRatio)
  const skillQuadrantMatrix = {
    CRITICAL_GAP: [],  // Sai nhiều (<60%) + Chậm (speedRatio >= 1.0)
    TRAP_PRONE: [],    // Sai nhiều (<60%) + Nhanh (speedRatio < 1.0)
    SLOW_FLUENCY: [],  // Đúng (>=60%) + Chậm (speedRatio > 1.15)
    MASTERED: [],      // Đúng (>=60%) + Nhanh (speedRatio <= 1.15)
  };

  for (const t of topicMap.values()) {
    const accPct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
    const speedRatio = Number((t.totalTimeSec / Math.max(1, t.totalRecTimeSec)).toFixed(2));
    const entry = {
      topicId: t.topicId,
      topicName: t.topicName,
      part: t.part,
      accuracy: accPct,
      speedRatio,
      correct: t.correct,
      total: t.total,
      wrongOrSkipped: t.wrongOrSkipped,
      wrongNumbers: t.wrongNumbers,
      estPointsLost: Math.max(5, Math.round(((t.wrongOrSkipped / Math.max(1, total)) * 495) / 5) * 5),
    };

    if (accPct < 60 && speedRatio >= 1.0) {
      skillQuadrantMatrix.CRITICAL_GAP.push(entry);
    } else if (accPct < 60 && speedRatio < 1.0) {
      skillQuadrantMatrix.TRAP_PRONE.push(entry);
    } else if (accPct >= 60 && speedRatio > 1.15) {
      skillQuadrantMatrix.SLOW_FLUENCY.push(entry);
    } else {
      skillQuadrantMatrix.MASTERED.push(entry);
    }
  }

  const weakTopicsRanked = Array.from(topicMap.values())
    .filter(t => t.wrongOrSkipped > 0)
    .sort((a, b) => b.wrongOrSkipped - a.wrongOrSkipped)
    .slice(0, 5)
    .map(t => ({
      topicId: t.topicId,
      topicName: t.topicName,
      part: t.part,
      total: t.total,
      wrongOrSkipped: t.wrongOrSkipped,
      wrongNumbers: t.wrongNumbers,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      estPointsLost: Math.max(5, Math.round(((t.wrongOrSkipped / Math.max(1, total)) * 495) / 5) * 5),
    }));

  const errorTrapDna = Array.from(trapMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const potentialScoreGain = Math.min(495 - estReadingScore, Math.max(15, (wrongCount + skippedCount) * 4));

  // Build prescribed Micro-Drill (up to 12) + Twin Questions (up to 8) from ToeicRepository
  const prescribedDrillQuestionIds = [];
  const usedDrillSet = new Set(readingQuestions.map(q => q.id));

  for (const wt of weakTopicsRanked.slice(0, 3)) {
    const candidates = ToeicRepository.getQuestionsByTopic(wt.topicId, 5, Array.from(usedDrillSet));
    for (const c of candidates) {
      if (prescribedDrillQuestionIds.length < 12 && !usedDrillSet.has(c.id)) {
        prescribedDrillQuestionIds.push(c.id);
        usedDrillSet.add(c.id);
      }
    }
  }

  const prescribedTwinQuestionIds = [];
  for (const sid of twinCandidatesSet) {
    if (prescribedTwinQuestionIds.length >= 8) break;
    if (!usedDrillSet.has(sid)) {
      const twinQ = ToeicRepository.getQuestionById(sid);
      if (twinQ) {
        prescribedTwinQuestionIds.push(twinQ.id);
        usedDrillSet.add(twinQ.id);
      }
    }
  }

  return {
    total,
    answeredCount,
    correctCount,
    wrongCount,
    skippedCount,
    accuracy,
    estReadingScore,
    thetaEstimate: theta,
    potentialScoreGain,
    fatigue,
    partBreakdown: {
      p5: partStats[5],
      p6: partStats[6],
      p7: partStats[7],
    },
    weakTopicsRanked,
    errorTrapDna,
    skillQuadrantMatrix,
    wrongQuestionIds,
    prescribedDrillQuestionIds,
    prescribedTwinQuestionIds,
  };
}
