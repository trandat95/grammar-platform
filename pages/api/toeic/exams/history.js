import { attachCorrelationId, checkApiRateLimit, sendSafeServerError } from '../../../../lib/api/security-guard';
import { verifyServerSession } from '../../../../lib/supabase/middleware';
import { getAdminClient } from '../../../../lib/supabase/server';

/**
 * Phase 3.4: Exam History & Cross-Test Score Trajectory API
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed', correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: 'toeic_exam_history', maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized', correlationId });
  }

  try {
    const serverClient = getAdminClient();
    const [attemptsRes, plansRes, masteryRes] = await Promise.all([
      serverClient
        .from('exam_attempts')
        .select('id, client_attempt_id, series, test_number, session_mode, status, total_questions, answered_count, correct_count, est_reading_score, theta_estimate, elapsed_sec, fatigue_drop_rate, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true })
        .limit(20),
      serverClient
        .from('remediation_plans')
        .select('id, series, source_test_number, target_next_test_number, total_prescribed_questions, completed_questions_count, progress_percent, baseline_reading_score, target_reading_score, verified_score_delta, verification_status, status, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10),
      serverClient
        .from('user_topic_mastery')
        .select('topic_id, topic_name, part, total_attempts, answered_attempts, correct_attempts, accuracy, avg_time_sec, speed_ratio, mastery_score, confidence_score, confidence_level, quadrant_state, previous_quadrant_state, state_history, updated_at')
        .eq('user_id', authUser.id)
        .order('mastery_score', { ascending: true }),
    ]);

    return res.status(200).json({
      success: true,
      attempts: attemptsRes.data || [],
      plans: plansRes.data || [],
      topicMastery: masteryRes.data || [],
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: '/api/toeic/exams/history',
      err,
      publicMessage: 'Lỗi tải lịch sử bài thi.',
    });
  }
}
