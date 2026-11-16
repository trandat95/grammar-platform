import ToeicRepository from '../toeic-repository.js';
import { estimateThetaAndScore, computeFatigueDrop } from './irt-calibrator.js';
import { calculateAccuracyMetrics } from './accuracy-calculator.js';
import { calculateSpeedMetrics } from './speed-analyzer.js';
import { calculateConfidenceMetrics } from './confidence-calculator.js';
import { classifyQuadrantAndMastery } from './mastery-scorer.js';

function resolveErrorCategory(errorCode = '') {
  const code = String(errorCode).toUpperCase();
  if (code.includes('POS') || code.includes('SVA') || code.includes('TENSE') || code.includes('PRON')) {
    return 'GRAMMAR_CONFUSION';
  }
  if (code.includes('PREP') || code.includes('CONJ') || code.includes('COHERENCE')) {
    return 'STRUCTURAL_DISCOURSE_TRAP';
  }
  if (code.includes('VOC') || code.includes('COLLOCATION')) {
    return 'LEXICAL_TRAP';
  }
  return 'COMPREHENSION_INFERENCE_TRAP';
}

/**
 * Phase 3.3 & 3.4 Enhanced:
 * Orchestrates modular accuracy, speed, confidence, 4-quadrant mastery,
 * relational item telemetry (DS-001), topic mastery updates (DS-002), and Error DNA (DS-006).
 */
export function analyzeUserExamPerformance({
  readingQuestions = [],
  userAnswers = {},
  questionTimings = {},
}) {
  const topicMap = new Map();
  const trapMap = new Map();
  const irtItems = [];
  const attemptItems = [];
  const wrongQuestionIds = [];
  const twinCandidatesSet = new Set();

  let answeredCount = 0;
  let correctCount = 0;

  const partStats = {
    5: { total: 0, answered: 0, correct: 0 },
    6: { total: 0, answered: 0, correct: 0 },
    7: { total: 0, answered: 0, correct: 0 },
  };

  readingQuestions.forEach((q, idx) => {
    const p = q.part === 5 || q.part === 6 || q.part === 7 ? q.part : 5;
    partStats[p].total += 1;

    const rawAns = userAnswers[q.id];
    const selectedOption = ['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : null;
    const hasAnswered = Boolean(selectedOption);
    const isSkipped = !hasAnswered;
    const isCorrect = hasAnswered && selectedOption === q.correct_answer;

    const recTime = Number(q.recommended_time_sec || (p === 5 ? 15 : 45));
    const rawTime = Number(questionTimings[q.id] || 0);
    const spentSec = rawTime > 0 ? Math.min(600, Math.round(rawTime)) : 0;

    const topicId = q.primary_grammar_topic_id || q.ai_analysis?.primary_topic_id || `PART_${p}`;
    const topicName = q.ai_analysis?.primary_topic_name_vi || `Chủ điểm Part ${p}`;

    let errorPatternCode = null;
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
        const optAna = q.ai_analysis?.option_deep_analysis?.[selectedOption];
        errorPatternCode = optAna?.error_pattern_code || 'ERR_COGNITIVE_TRAP';
        const trapName = optAna?.error_pattern_name_vi || q.ai_analysis?.common_trap_warning_vi;
        if (trapName) {
          if (!trapMap.has(errorPatternCode)) {
            trapMap.set(errorPatternCode, {
              error_category: resolveErrorCategory(errorPatternCode),
              error_code: errorPatternCode,
              code: errorPatternCode,
              name: trapName,
              frequency: 0,
              count: 0,
              numbers: [],
            });
          }
          const tr = trapMap.get(errorPatternCode);
          tr.frequency += 1;
          tr.count += 1;
          tr.numbers.push(q.number);
        }
      }
    }

    // DS-001: Relational exam_attempt_items row
    attemptItems.push({
      question_id: q.id,
      part: p,
      topic_id: topicId,
      selected_option: selectedOption,
      correct_option: q.correct_answer,
      is_correct: isCorrect,
      is_skipped: isSkipped,
      time_spent_sec: spentSec,
      question_position: idx + 1,
      error_pattern_code: errorPatternCode,
    });

    const irt = q.ai_analysis?.irt_3pl || {};
    irtItems.push({
      a: Number(irt.discrimination_a || 1.2),
      b: Number(irt.difficulty_b || 0.0),
      c: Number(irt.guessing_c ?? 0.25),
      isCorrect,
    });

    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        topicId,
        topicName,
        part: p,
        total: 0,
        answered: 0,
        correct: 0,
        wrongOrSkipped: 0,
        timedAttemptCount: 0,
        totalTimeSec: 0,
        totalExpectedForTimedSec: 0,
        wrongNumbers: [],
      });
    }

    const tStat = topicMap.get(topicId);
    tStat.total += 1;
    if (hasAnswered) {
      tStat.answered += 1;
      if (spentSec > 0) {
        tStat.timedAttemptCount += 1;
        tStat.totalTimeSec += spentSec;
        tStat.totalExpectedForTimedSec += recTime;
      } else {
        tStat.timedAttemptCount += 1;
        tStat.totalTimeSec += recTime;
        tStat.totalExpectedForTimedSec += recTime;
      }
    }
    if (isCorrect) {
      tStat.correct += 1;
    } else {
      tStat.wrongOrSkipped += 1;
      tStat.wrongNumbers.push(q.number);
    }
  });

  const total = readingQuestions.length;
  const wrongCount = answeredCount - correctCount;
  const skippedCount = total - answeredCount;
  const overallAcc = calculateAccuracyMetrics({ correctCount, answeredCount, totalCount: total });

  const { theta, standardError, estReadingScore } = estimateThetaAndScore(irtItems);
  const fatigue = computeFatigueDrop(readingQuestions, userAnswers);

  const skillQuadrantMatrix = {
    CRITICAL_GAP: [],
    TRAP_PRONE: [],
    SLOW_FLUENCY: [],
    MASTERED: [],
  };

  const topicMasteryUpdates = [];
  const allTopicsSummary = [];

  for (const t of topicMap.values()) {
    const acc = calculateAccuracyMetrics({
      correctCount: t.correct,
      answeredCount: t.answered,
      totalCount: t.total,
    });
    const spd = calculateSpeedMetrics({
      totalTimeSec: t.totalTimeSec,
      timedAttemptCount: t.timedAttemptCount,
      totalExpectedTimeSec: t.totalExpectedForTimedSec,
    });
    const conf = calculateConfidenceMetrics(t.answered);
    const quad = classifyQuadrantAndMastery({
      answeredAccuracyPct: t.answered > 0 ? acc.answeredAccuracyPct : 0,
      speedRatio: spd.speedRatio,
      evidenceCount: t.answered,
    });

    const estPointsLost = Math.max(5, Math.round(((t.wrongOrSkipped / Math.max(1, total)) * 495) / 5) * 5);

    const entry = {
      topic_id: t.topicId,
      topicId: t.topicId,
      topicName: t.topicName,
      part: t.part,
      accuracy: Number((acc.answeredAccuracyRatio).toFixed(2)),
      answeredAccuracyPct: acc.answeredAccuracyPct,
      totalAccuracyPct: acc.totalAccuracyPct,
      attempt_count: t.answered,
      evidence_count: conf.evidenceCount,
      confidence_level: conf.confidenceLevel,
      confidence_score: conf.confidenceScore,
      speedRatio: spd.speedRatio,
      avgTimeSec: spd.avgTimeSec,
      masteryScore: quad.masteryScore,
      quadrantState: quad.quadrantState,
      diagnosisType: quad.diagnosisType,
      correct: t.correct,
      total: t.total,
      wrongOrSkipped: t.wrongOrSkipped,
      wrongNumbers: t.wrongNumbers,
      est_points_lost: estPointsLost,
      estPointsLost,
    };

    skillQuadrantMatrix[quad.quadrantState].push(entry);
    allTopicsSummary.push(entry);

    if (t.answered > 0) {
      topicMasteryUpdates.push({
        topic_id: t.topicId,
        topic_name: t.topicName,
        part: t.part,
        total_attempts: t.total,
        answered_attempts: t.answered,
        correct_attempts: t.correct,
        accuracy: acc.answeredAccuracyPct,
        total_time_sec: t.totalTimeSec,
        avg_time_sec: spd.avgTimeSec,
        speed_ratio: spd.speedRatio,
        mastery_score: quad.masteryScore,
        confidence_score: conf.confidenceScore,
        confidence_level: conf.confidenceLevel,
        quadrant_state: quad.quadrantState,
      });
    }
  }

  const weakTopicsRanked = allTopicsSummary
    .filter(t => t.wrongOrSkipped > 0)
    .sort((a, b) => b.wrongOrSkipped - a.wrongOrSkipped)
    .slice(0, 5);

  const errorTrapDna = Array.from(trapMap.values())
    .map(tr => ({
      ...tr,
      recurrence_rate: wrongCount > 0 ? Number((tr.frequency / wrongCount).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 4);

  const potentialScoreGain = Math.min(495 - estReadingScore, Math.max(15, (wrongCount + skippedCount) * 4));

  // Build prescribed Micro-Drill (up to 12) + Twin Questions (up to 8)
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

  const baselineMasteryScore = allTopicsSummary.length > 0
    ? Number((allTopicsSummary.reduce((acc, x) => acc + x.masteryScore, 0) / allTopicsSummary.length).toFixed(2))
    : 0;

  return {
    total,
    answeredCount,
    correctCount,
    wrongCount,
    skippedCount,
    accuracy: Math.round(overallAcc.totalAccuracyPct),
    answeredAccuracyPct: overallAcc.answeredAccuracyPct,
    estReadingScore,
    thetaEstimate: theta,
    thetaStandardError: standardError,
    potentialScoreGain,
    baselineMasteryScore,
    fatigue,
    partBreakdown: {
      p5: partStats[5],
      p6: partStats[6],
      p7: partStats[7],
    },
    attemptItems,
    topicMasteryUpdates,
    weakTopicsRanked,
    errorTrapDna,
    skillQuadrantMatrix,
    wrongQuestionIds,
    prescribedDrillQuestionIds,
    prescribedTwinQuestionIds,
  };
}
