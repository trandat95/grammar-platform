import { attachCorrelationId, checkApiRateLimit, sendSafeServerError } from '../../../../lib/api/security-guard';
import { verifyServerSession } from '../../../../lib/supabase/middleware';
import { getAdminClient } from '../../../../lib/supabase/server';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';
import { analyzeUserExamPerformance } from '../../../../lib/toeic/data-science/quadrant-analyzer';
import { computeEmpiricalBayesIrtB } from '../../../../lib/toeic/data-science/irt-calibrator';

/**
 * Phase 3.2 - 3.4: Authoritative Exam Submission, IRT Theta, 4-Quadrant DNA,
 * Crowd Distractor Calibration & Cross-Test Remediation Plan Generator
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed', correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: 'toeic_exam_submit', maxRequests: 30, correlationId });
  if (!rate.allowed) return;

  try {
    const {
      series = 'ETS2024',
      testNum = 1,
      sessionMode = 'exam',
      elapsedSec = 0,
      userAnswers = {},
      questionTimings = {},
    } = req.body || {};

    const s = String(series).toUpperCase();
    const tNum = parseInt(testNum, 10) || 1;
    const testData = ToeicRepository.getTestQuestionsAndPassages(s, tNum, 'full');
    const readingQuestions = (testData?.questions || []).filter(q => q.part >= 5 && q.part <= 7);

    if (readingQuestions.length === 0) {
      return res.status(404).json({ success: false, error: `Không tìm thấy dữ liệu đề ${s} Test ${tNum}`, correlationId });
    }

    const analysis = analyzeUserExamPerformance({
      readingQuestions,
      userAnswers,
      questionTimings,
    });

    const serverClient = getAdminClient();
    const authUser = await verifyServerSession(req);

    // Fetch existing crowd stats for this test's questions
    const qIds = readingQuestions.map(q => q.id);
    const { data: existingStatsRows } = await serverClient
      .from('corpus_item_stats')
      .select('question_id, attempt_count, correct_count, total_time_sec, option_selection_counts, prior_irt_b')
      .in('question_id', qIds);

    const statsMap = new Map((existingStatsRows || []).map(r => [r.question_id, r]));
    const crowdStats = {};

    for (const q of readingQuestions) {
      const st = statsMap.get(q.id);
      if (st) {
        const attempts = Number(st.attempt_count || 0);
        const correct = Number(st.correct_count || 0);
        crowdStats[q.id] = {
          attemptCount: attempts,
          correctRate: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
          optionSelectionCounts: st.option_selection_counts || { A: 0, B: 0, C: 0, D: 0 },
        };
      }
    }

    let examAttemptId = null;
    let remediationPlanId = null;
    let verifiedDelta = null;

    if (authUser?.id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Save exam_attempts
      const { data: attemptRow, error: attemptErr } = await serverClient
        .from('exam_attempts')
        .insert({
          user_id: authUser.id,
          series: s,
          test_number: tNum,
          session_mode: sessionMode === 'practice' ? 'practice' : 'exam',
          total_questions: analysis.total,
          answered_count: analysis.answeredCount,
          correct_count: analysis.correctCount,
          wrong_count: analysis.wrongCount,
          skipped_count: analysis.skippedCount,
          est_reading_score: analysis.estReadingScore,
          theta_estimate: analysis.thetaEstimate,
          elapsed_sec: Math.max(0, Math.round(Number(elapsedSec || 0))),
          fatigue_drop_rate: analysis.fatigue.fatigueDropRate,
          part_breakdown: analysis.partBreakdown,
          user_answers: userAnswers,
          question_timings: questionTimings,
        })
        .select('id')
        .single();

      if (!attemptErr && attemptRow?.id) {
        examAttemptId = attemptRow.id;

        // 2. Save user_error_dna_snapshots
        await serverClient.from('user_error_dna_snapshots').insert({
          user_id: authUser.id,
          exam_attempt_id: examAttemptId,
          weak_topics_ranked: analysis.weakTopicsRanked,
          error_trap_dna: analysis.errorTrapDna,
          skill_quadrant_matrix: analysis.skillQuadrantMatrix,
          potential_score_gain: analysis.potentialScoreGain,
        });

        // 3. Create Cross-Test Remediation Plan (if there are weak topics)
        if (analysis.weakTopicsRanked.length > 0) {
          const nextTestNum = tNum < 10 ? tNum + 1 : 1;
          const { data: planRow } = await serverClient
            .from('remediation_plans')
            .insert({
              user_id: authUser.id,
              source_exam_attempt_id: examAttemptId,
              series: s,
              source_test_number: tNum,
              target_next_test_number: nextTestNum,
              target_topics: analysis.weakTopicsRanked.slice(0, 4),
              prescribed_drill_question_ids: analysis.prescribedDrillQuestionIds,
              prescribed_twin_question_ids: analysis.prescribedTwinQuestionIds,
              completed_question_ids: [],
              progress_percent: 0,
              baseline_reading_score: analysis.estReadingScore,
              target_reading_score: Math.min(495, analysis.estReadingScore + analysis.potentialScoreGain),
              status: 'active',
            })
            .select('id')
            .single();

          if (planRow?.id) {
            remediationPlanId = planRow.id;
          }
        }

        // 4. Verify any active remediation plan targeting this testNum
        const { data: pendingPlan } = await serverClient
          .from('remediation_plans')
          .select('id, baseline_reading_score')
          .eq('user_id', authUser.id)
          .eq('series', s)
          .eq('target_next_test_number', tNum)
          .in('status', ['active', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingPlan?.id) {
          verifiedDelta = analysis.estReadingScore - Number(pendingPlan.baseline_reading_score || 0);
          await serverClient
            .from('remediation_plans')
            .update({
              verification_exam_attempt_id: examAttemptId,
              verified_score_delta: verifiedDelta,
              status: 'verified',
              updated_at: new Date().toISOString(),
            })
            .eq('id', pendingPlan.id);
        }

        // 5. Update crowd stats + Empirical Bayes IRT recalibration for answered questions
        const updates = [];
        for (const q of readingQuestions) {
          const ans = userAnswers[q.id];
          if (!ans) continue;
          const st = statsMap.get(q.id);
          if (!st) continue;

          const newAttempts = Number(st.attempt_count || 0) + 1;
          const isRight = ans === q.correct_answer;
          const newCorrect = Number(st.correct_count || 0) + (isRight ? 1 : 0);
          const spent = Math.max(1, Math.min(300, Math.round(Number(questionTimings[q.id] || q.recommended_time_sec || 20))));
          const newTotalTime = Number(st.total_time_sec || 0) + spent;
          const counts = { ...(st.option_selection_counts || { A: 0, B: 0, C: 0, D: 0 }) };
          if (counts[ans] !== undefined) counts[ans] = Number(counts[ans] || 0) + 1;

          const calibratedB = computeEmpiricalBayesIrtB(st.prior_irt_b, newAttempts, newCorrect);

          updates.push(
            serverClient
              .from('corpus_item_stats')
              .update({
                attempt_count: newAttempts,
                correct_count: newCorrect,
                total_time_sec: newTotalTime,
                avg_time_sec: Number((newTotalTime / newAttempts).toFixed(2)),
                option_selection_counts: counts,
                calibrated_irt_b: calibratedB,
                updated_at: new Date().toISOString(),
              })
              .eq('question_id', q.id)
          );

          // Update live crowdStats in response
          crowdStats[q.id] = {
            attemptCount: newAttempts,
            correctRate: Math.round((newCorrect / newAttempts) * 100),
            optionSelectionCounts: counts,
          };
        }
        if (updates.length > 0) {
          await Promise.allSettled(updates);
        }
      }
    }

    return res.status(200).json({
      success: true,
      persisted: Boolean(examAttemptId),
      examAttemptId,
      remediationPlanId,
      verifiedDelta,
      analysis,
      crowdStats,
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: '/api/toeic/exams/submit',
      err,
      publicMessage: 'Lỗi lưu kết quả và phân tích Data Science.',
    });
  }
}
