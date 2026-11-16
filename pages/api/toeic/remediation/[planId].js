import { attachCorrelationId, checkApiRateLimit, isValidUuid, sendSafeServerError } from '../../../../lib/api/security-guard';
import { verifyServerSession } from '../../../../lib/supabase/middleware';
import { getAdminClient } from '../../../../lib/supabase/server';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';
import { hasVipPrivilege } from '../../../../lib/toeic/subscription/toeic-entitlement';

/**
 * Phase 3.3: Cross-Test Remediation Plan API
 * GET: Load remediation plan + hydrated questions + DNA snapshot (Free = 3 preview questions, VIP = all)
 * POST: Mark a prescribed question as completed & update progress_percent
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const rate = checkApiRateLimit(req, res, { keyPrefix: 'toeic_remediation', maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để xem lộ trình vá lỗ hổng cá nhân hóa.', correlationId });
  }

  const { planId } = req.query;
  if (!isValidUuid(planId)) {
    return res.status(400).json({ success: false, error: 'Invalid planId UUID.', correlationId });
  }

  const serverClient = getAdminClient();

  try {
    const { data: profile } = await serverClient
      .from('profiles')
      .select('role, status')
      .eq('id', authUser.id)
      .maybeSingle();

    const isVip = profile?.status === 'ACTIVE' && hasVipPrivilege(profile?.role || 'FREE');

    const { data: plan, error: planErr } = await serverClient
      .from('remediation_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    if (planErr || !plan) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lộ trình vá lỗ hổng.', correlationId });
    }

    if (plan.user_id !== authUser.id && profile?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Không có quyền truy cập lộ trình của người khác.', correlationId });
    }

    if (req.method === 'GET') {
      const { data: dnaSnapshot } = await serverClient
        .from('user_error_dna_snapshots')
        .select('*')
        .eq('exam_attempt_id', plan.source_exam_attempt_id)
        .maybeSingle();

      const allPrescribedIds = [
        ...(Array.isArray(plan.prescribed_drill_question_ids) ? plan.prescribed_drill_question_ids : []),
        ...(Array.isArray(plan.prescribed_twin_question_ids) ? plan.prescribed_twin_question_ids : []),
      ];

      // Free users get 3 preview questions; VIP gets full prescribed set
      const allowedIds = isVip ? allPrescribedIds : allPrescribedIds.slice(0, 3);
      const drillSet = new Set(plan.prescribed_drill_question_ids || []);

      const questions = allowedIds
        .map(qId => {
          const q = ToeicRepository.getQuestionById(qId);
          if (!q) return null;
          return {
            ...q,
            remediationType: drillSet.has(qId) ? 'MICRO_DRILL' : 'TWIN_QUESTION',
          };
        })
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        isVip,
        totalPrescribedCount: allPrescribedIds.length,
        lockedCount: Math.max(0, allPrescribedIds.length - allowedIds.length),
        plan,
        dnaSnapshot,
        questions,
        correlationId,
      });
    }

    if (req.method === 'POST') {
      const { questionId } = req.body || {};
      if (!questionId) {
        return res.status(400).json({ success: false, error: 'questionId required.', correlationId });
      }

      const allPrescribed = [
        ...(Array.isArray(plan.prescribed_drill_question_ids) ? plan.prescribed_drill_question_ids : []),
        ...(Array.isArray(plan.prescribed_twin_question_ids) ? plan.prescribed_twin_question_ids : []),
      ];
      if (!isVip && allPrescribed.indexOf(questionId) >= 3) {
        return res.status(403).json({ success: false, isVipRequired: true, error: 'Nâng cấp VIP để luyện tiếp toàn bộ lộ trình.', correlationId });
      }

      const completed = new Set(Array.isArray(plan.completed_question_ids) ? plan.completed_question_ids : []);
      completed.add(questionId);
      const completedArr = Array.from(completed);
      const totalCount = Math.max(1, allPrescribed.length);
      const progressPercent = Math.min(100, Math.round((completedArr.length / totalCount) * 100));
      const nextStatus = progressPercent >= 100 && plan.status === 'active' ? 'completed' : plan.status;

      await serverClient
        .from('remediation_plans')
        .update({
          completed_question_ids: completedArr,
          completed_questions_count: completedArr.length,
          total_prescribed_questions: allPrescribed.length,
          progress_percent: progressPercent,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      return res.status(200).json({
        success: true,
        completedQuestionIds: completedArr,
        progressPercent,
        status: nextStatus,
        correlationId,
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed', correlationId });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: '/api/toeic/remediation/[planId]',
      err,
      publicMessage: 'Lỗi xử lý lộ trình vá lỗ hổng.',
    });
  }
}
