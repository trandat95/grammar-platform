import crypto from 'crypto';
import { attachCorrelationId, checkApiRateLimit, isValidUuid, sendSafeServerError } from '../../../../lib/api/security-guard';
import { verifyServerSession } from '../../../../lib/supabase/middleware';
import { getAdminClient } from '../../../../lib/supabase/server';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';
import FlashcardRepository from '../../../../lib/toeic/flashcard-repository';
import { buildQueuedSrsPayload } from '../../../../lib/toeic/flashcard-fsrs';
import { resolveServerUserRole } from '../../../../lib/toeic/subscription/server-gate';
import { FREE_TIER_LIMITS } from '../../../../lib/toeic/subscription/toeic-entitlement';
import { analyzeUserExamPerformance } from '../../../../lib/toeic/data-science/quadrant-analyzer';
import { DS_THRESHOLDS } from '../../../../lib/toeic/data-science/threshold-config';

/**
 * Phase 3 Enhanced (DS-001 through DS-012):
 * Zero-Trust Authoritative Exam Submission using Atomic PostgreSQL RPC `submit_toeic_exam_atomic`.
 * - Frontend only supplies raw { clientAttemptId, series, testNum, sessionMode, elapsedSec, userAnswers, questionTimings }.
 * - Server computes all grading, IRT 2PL MAP theta, 4-Quadrant Matrix, Confidence Levels & Remediation Plan.
 * - Enforces Crowd Intelligence sample size gates (<20 hidden, 20-49 preliminary, >=50 verified).
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
      clientAttemptId,
      series = 'ETS2024',
      testNum = 1,
      sessionMode = 'exam',
      status = 'submitted',
      elapsedSec = 0,
      userAnswers = {},
      questionTimings = {},
    } = req.body || {};

    const s = String(series).toUpperCase();
    const tNum = parseInt(testNum, 10) || 1;
    const safeClientAttemptId = isValidUuid(clientAttemptId) ? clientAttemptId : crypto.randomUUID();
    const safeMode = sessionMode === 'practice' ? 'practice' : 'exam';
    const safeStatus = ['in_progress', 'submitted', 'abandoned', 'expired'].includes(status) ? status : 'submitted';

    const testData = ToeicRepository.getTestQuestionsAndPassages(s, tNum, 'full');
    const readingQuestions = (testData?.questions || []).filter(q => q.part >= 5 && q.part <= 7);

    if (readingQuestions.length === 0) {
      return res.status(404).json({ success: false, error: `Không tìm thấy dữ liệu đề ${s} Test ${tNum}`, correlationId });
    }

    // Server-authoritative analysis (never trusts client score or correctness)
    const analysis = analyzeUserExamPerformance({
      readingQuestions,
      userAnswers: typeof userAnswers === 'object' && userAnswers !== null ? userAnswers : {},
      questionTimings: typeof questionTimings === 'object' && questionTimings !== null ? questionTimings : {},
    });

    const serverClient = getAdminClient();
    const authUser = await verifyServerSession(req);

    // Cross-Link Step 4: Collect matching TOEIC Flashcards from wrong answers
    const recommendedFlashcardsMap = new Map();
    for (const wrongQId of analysis.wrongQuestionIds || []) {
      const matched = FlashcardRepository.getMatchedFlashcardsForQuestion(wrongQId, 2);
      for (const fc of matched) {
        if (!recommendedFlashcardsMap.has(fc.id)) {
          recommendedFlashcardsMap.set(fc.id, { ...fc, source_question_id: wrongQId });
        }
        if (recommendedFlashcardsMap.size >= 12) break;
      }
      if (recommendedFlashcardsMap.size >= 12) break;
    }
    const recommendedFlashcards = [...recommendedFlashcardsMap.values()];

    let examAttemptId = null;
    let remediationPlanId = null;
    let verifiedDelta = null;
    let verificationStatus = null;
    let deduped = false;

    if (authUser?.id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const nextTestNum = tNum < 10 ? tNum + 1 : 1;
      const totalPrescribed = analysis.prescribedDrillQuestionIds.length + analysis.prescribedTwinQuestionIds.length;

      const remediationPayload = analysis.weakTopicsRanked.length > 0
        ? {
            target_next_test_number: nextTestNum,
            target_topics: analysis.weakTopicsRanked.slice(0, 4),
            prescribed_drill_question_ids: analysis.prescribedDrillQuestionIds,
            prescribed_twin_question_ids: analysis.prescribedTwinQuestionIds,
            total_prescribed_questions: totalPrescribed,
            target_reading_score: Math.min(495, analysis.estReadingScore + analysis.potentialScoreGain),
            baseline_mastery_score: analysis.baselineMasteryScore,
          }
        : null;

      // Execute Atomic PostgreSQL Transaction (DS-004)
      const { data: rpcRes, error: rpcErr } = await serverClient.rpc('submit_toeic_exam_atomic', {
        p_user_id: authUser.id,
        p_client_attempt_id: safeClientAttemptId,
        p_series: s,
        p_test_number: tNum,
        p_session_mode: safeMode,
        p_status: safeStatus,
        p_total_questions: analysis.total,
        p_answered_count: analysis.answeredCount,
        p_correct_count: analysis.correctCount,
        p_wrong_count: analysis.wrongCount,
        p_skipped_count: analysis.skippedCount,
        p_est_reading_score: analysis.estReadingScore,
        p_theta_estimate: analysis.thetaEstimate,
        p_elapsed_sec: Math.max(0, Math.round(Number(elapsedSec || 0))),
        p_fatigue_drop_rate: analysis.fatigue.fatigueDropRate,
        p_part_breakdown: analysis.partBreakdown,
        p_user_answers: userAnswers || {},
        p_question_timings: questionTimings || {},
        p_attempt_items: analysis.attemptItems,
        p_weak_topics_ranked: analysis.weakTopicsRanked,
        p_error_trap_dna: analysis.errorTrapDna,
        p_skill_quadrant_matrix: analysis.skillQuadrantMatrix,
        p_potential_score_gain: analysis.potentialScoreGain,
        p_topic_mastery_updates: analysis.topicMasteryUpdates,
        p_remediation_plan: remediationPayload,
      });

      if (rpcErr) {
        console.error('[submit_toeic_exam_atomic] RPC error:', rpcErr);
      } else if (rpcRes?.ok) {
        examAttemptId = rpcRes.exam_attempt_id || null;
        remediationPlanId = rpcRes.remediation_plan_id || null;
        verifiedDelta = rpcRes.verified_delta ?? null;
        verificationStatus = rpcRes.verification_status || null;
        deduped = Boolean(rpcRes.deduped);
      }

      // Cross-Link Step 4: Auto-queue recommended flashcards into user_toeic_flashcard_srs (LEARNING/RELEARNING)
      if (recommendedFlashcards.length > 0 && !deduped) {
        try {
          const { isVip } = await resolveServerUserRole(req);
          const { data: existingSrs } = await serverClient
            .from('user_toeic_flashcard_srs')
            .select('*')
            .eq('user_id', authUser.id);

          const existingMap = new Map((existingSrs || []).map(r => [Number(r.flashcard_id), r]));
          let trackedCount = existingMap.size;
          const srsUpserts = [];

          for (const recFc of recommendedFlashcards) {
            const existing = existingMap.get(Number(recFc.id)) || null;
            if (!existing && !isVip && trackedCount >= FREE_TIER_LIMITS.maxSrsCards) continue;
            const fullFc = FlashcardRepository.getById(recFc.id);
            if (!fullFc) continue;
            const queued = buildQueuedSrsPayload({
              existingRecord: existing,
              flashcard: fullFc,
              sourceContext: 'EXAM_REMEDIATION',
              sourceQuestionId: recFc.source_question_id || null,
            });
            srsUpserts.push({
              user_id: authUser.id,
              flashcard_id: fullFc.id,
              srs_state: queued.srs_state,
              reps: queued.reps,
              lapses: queued.lapses,
              ease_factor: queued.ease_factor,
              stability: queued.stability,
              difficulty: queued.difficulty,
              interval_days: queued.interval_days,
              source_context: queued.source_context,
              source_question_id: queued.source_question_id,
              due_at: queued.due_at,
              last_reviewed_at: queued.last_reviewed_at,
            });
            if (!existing) trackedCount += 1;
          }

          if (srsUpserts.length > 0) {
            await serverClient
              .from('user_toeic_flashcard_srs')
              .upsert(srsUpserts, { onConflict: 'user_id,flashcard_id' });
          }
        } catch (fcErr) {
          console.warn('[exams/submit] flashcard auto-queue warning:', fcErr?.message || fcErr);
        }
      }
    }

    // Fetch updated Crowd Intelligence with Sample-Size Gating (Section 2.1)
    const qIds = readingQuestions.map(q => q.id);
    const { data: statsRows } = await serverClient
      .from('corpus_item_stats')
      .select('question_id, answered_count, correct_count, exam_attempt_count, exam_correct_count, option_selection_counts, calibration_status')
      .in('question_id', qIds);

    const crowdStats = {};
    const { MIN_VISIBLE, PRELIMINARY_MAX, HIGH_CONFIDENCE } = DS_THRESHOLDS.CROWD_SAMPLE;

    for (const st of statsRows || []) {
      const answered = Number(st.answered_count || 0);
      if (answered < MIN_VISIBLE) {
        crowdStats[st.question_id] = {
          visible: false,
          sampleTier: 'insufficient',
          attemptCount: answered,
          correctRate: null,
          optionSelectionCounts: null,
        };
        continue;
      }

      const correct = Number(st.correct_count || 0);
      const sampleTier = answered <= PRELIMINARY_MAX
        ? 'preliminary'
        : answered >= HIGH_CONFIDENCE
        ? 'high_confidence'
        : 'verified';

      crowdStats[st.question_id] = {
        visible: true,
        sampleTier,
        attemptCount: answered,
        correctRate: Math.round((correct / answered) * 100),
        optionSelectionCounts: st.option_selection_counts || { A: 0, B: 0, C: 0, D: 0 },
        calibrationStatus: st.calibration_status || 'prior_only',
      };
    }

    return res.status(200).json({
      success: true,
      persisted: Boolean(examAttemptId),
      deduped,
      clientAttemptId: safeClientAttemptId,
      examAttemptId,
      remediationPlanId,
      verifiedDelta,
      verificationStatus,
      analysis,
      crowdStats,
      recommendedFlashcards,
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
