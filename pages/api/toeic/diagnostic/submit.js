import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import { estimateIRTAbilityAndScore, computeTopicMetrics } from '../../../../lib/ai-engine/scoring-engine';
import { generateOrUpdateUserRoadmap } from '../../../../lib/ai-engine/roadmap-generator';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_diagnostic_submit' })) {
    return;
  }

  try {
    const { sessionId, userId = 'guest_user', responses = [], targetScore = 650 } = req.body || {};

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(422).json({ success: false, error: 'Thiếu danh sách câu trả lời responses' });
    }

    const taxonomy = ToeicRepository.getTaxonomy();
    const errorCatalog = ToeicRepository.getErrorPatterns();
    const errorMap = new Map(errorCatalog.map(e => [e.code, e]));

    // Prepare attempt items with full questions
    const attempts = [];
    const topicStats = {};
    const detectedErrors = {};
    let totalCorrect = 0;
    let totalTimeSec = 0;
    let part5Count = 0;
    let part5TimeSec = 0;

    for (const resp of responses) {
      const q = ToeicRepository.getQuestionById(resp.questionId);
      if (!q) continue;

      const isCorrect = resp.selectedOption === q.correct_answer && !resp.usedHint;
      if (isCorrect) totalCorrect++;

      const timeSpent = Number(resp.timeSpentSec) || q.recommended_time_sec || 12;
      totalTimeSec += timeSpent;

      if (q.part === 5) {
        part5Count++;
        part5TimeSec += timeSpent;
      }

      const attemptItem = {
        question: q,
        selectedOption: resp.selectedOption || null,
        timeSpentSec: timeSpent,
        usedHint: !!resp.usedHint
      };
      attempts.push(attemptItem);

      // Accumulate topic metrics
      const topicId = q.primary_grammar_topic_id;
      if (topicId) {
        if (!topicStats[topicId]) {
          topicStats[topicId] = {
            topicId,
            weightInToeic: q.ai_analysis?.skill_weight_vector?.G1_POS || 2.0,
            targetScoreBand: q.target_score_band || 550,
            recommendedTimeSec: q.recommended_time_sec || 12,
            questionsAttempted: 0,
            questionsCorrect: 0,
            weightedCorrectSum: 0,
            weightedTotalSum: 0,
            totalTimeSec: 0,
            recentErrorStreak: 0
          };
        }
        const s = topicStats[topicId];
        s.questionsAttempted++;
        s.totalTimeSec += timeSpent;
        s.weightedTotalSum += (q.difficulty_level || 2);

        if (isCorrect) {
          s.questionsCorrect++;
          s.weightedCorrectSum += (q.difficulty_level || 2);
          s.recentErrorStreak = 0;
        } else {
          s.recentErrorStreak++;
        }
      }

      // Detect error pattern if wrong option selected
      if (!isCorrect && resp.selectedOption && q.ai_analysis?.option_deep_analysis) {
        const optAnalysis = q.ai_analysis.option_deep_analysis[resp.selectedOption];
        const errCode = optAnalysis?.error_pattern_code;
        if (errCode) {
          if (!detectedErrors[errCode]) {
            detectedErrors[errCode] = {
              code: errCode,
              name_vi: optAnalysis.error_pattern_name_vi || errorMap.get(errCode)?.name_vi || errCode,
              description_vi: errorMap.get(errCode)?.description_vi || '',
              remediation_action_vi: errorMap.get(errCode)?.remediation_action_vi || '',
              occurrence_count: 0,
              question_ids: []
            };
          }
          detectedErrors[errCode].occurrence_count++;
          detectedErrors[errCode].question_ids.push(q.id);
        }
      }
    }

    // Run IRT Ability Estimation
    const { theta, predictedScore } = estimateIRTAbilityAndScore(attempts);

    // Compute metrics for all 24 topics
    const topicMasteryList = [];
    const radarGroupScores = {
      G1_POS: { totalScore: 0, count: 0 },
      G2_VERB: { totalScore: 0, count: 0 },
      G3_PRON: { totalScore: 0, count: 0 },
      G4_CONN: { totalScore: 0, count: 0 },
      G5_MOD: { totalScore: 0, count: 0 },
      G6_VOC_COH: { totalScore: 0, count: 0 },
      G7_READING: { totalScore: 0, count: 0 },
      G8_LISTENING: { totalScore: 0, count: 0 }
    };

    for (const t of taxonomy) {
      const state = topicStats[t.id] || {
        topicId: t.id,
        weightInToeic: t.weight_in_toeic,
        targetScoreBand: t.target_score_band,
        recommendedTimeSec: t.recommended_time_sec,
        questionsAttempted: 0,
        questionsCorrect: 0,
        weightedCorrectSum: 0,
        weightedTotalSum: 0,
        totalTimeSec: 0,
        recentErrorStreak: 0
      };

      const metrics = computeTopicMetrics(state, predictedScore);
      const masteryItem = {
        grammar_topic_id: t.id,
        topic_name_vi: t.name_vi,
        topic_name_en: t.name_en,
        group_code: t.group_code,
        category: t.category,
        target_score_band: t.target_score_band,
        weight_in_toeic: t.weight_in_toeic,
        mastery_score: metrics.masteryScore,
        accuracy_pct: metrics.accuracyPct,
        avg_time_sec: metrics.avgTimeSec,
        speed_status: metrics.speedStatus,
        focus_priority_index: metrics.focusPriorityIndex,
        questions_attempted: state.questionsAttempted,
        questions_correct: state.questionsCorrect
      };
      topicMasteryList.push(masteryItem);

      if (radarGroupScores[t.group_code]) {
        radarGroupScores[t.group_code].totalScore += metrics.masteryScore;
        radarGroupScores[t.group_code].count++;
      }
    }

    // Calculate Radar Axes (0..100)
    const radarAxes = {};
    for (const groupCode in radarGroupScores) {
      const g = radarGroupScores[groupCode];
      radarAxes[groupCode] = g.count > 0 ? Number((g.totalScore / g.count).toFixed(1)) : 0;
    }

    // Top Focus Topics sorted by FPI descending
    const topFocusTopics = [...topicMasteryList]
      .sort((a, b) => b.focus_priority_index - a.focus_priority_index)
      .slice(0, 3);

    // List of detected error patterns sorted by count
    const detectedErrorPatterns = Object.values(detectedErrors).sort((a, b) => b.occurrence_count - a.occurrence_count);

    // Generate 7-Milestone Roadmap
    const milestones = generateOrUpdateUserRoadmap(
      { predicted_toeic_score: predictedScore },
      topicMasteryList
    );

    const avgPart5TimeSec = part5Count > 0 ? Number((part5TimeSec / part5Count).toFixed(1)) : 14.5;

    return res.status(200).json({
      success: true,
      sessionId,
      userId,
      predictedScore,
      targetScore,
      theta,
      totalQuestions: attempts.length,
      correctCount: totalCorrect,
      overallAccuracy: Number(((totalCorrect / Math.max(1, attempts.length)) * 100).toFixed(1)),
      avgPart5TimeSec,
      radarAxes,
      topFocusTopics,
      detectedErrorPatterns,
      milestones,
      topicMasteryList
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi chấm điểm bài kiểm tra chẩn đoán');
  }
}
