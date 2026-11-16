import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';
import { resolveServerUserRole } from '../../../../lib/toeic/subscription/server-gate';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const rate = checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_practice_drill', correlationId });
  if (!rate.allowed) return;

  try {
    const { topicId, limit = 15, excludeIds = '' } = req.query;

    if (!topicId) {
      return res.status(422).json({ success: false, error: 'Thiếu tham số topicId' });
    }

    const topic = ToeicRepository.getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: `Không tìm thấy chủ điểm ${topicId}` });
    }

    const targetBand = Number(topic.target_score_band || topic.min_target_band || 450);
    if (targetBand >= 550) {
      const { isVip } = await resolveServerUserRole(req);
      if (!isVip) {
        return res.status(403).json({
          success: false,
          locked: true,
          isVipRequired: true,
          triggerId: 'TRG_08_GRAMMAR_TARGET_550',
          upgradeRequired: true,
          topicInfo: topic,
          questions: [],
          error: 'Chuyên đề mục tiêu 550–900+ yêu cầu tài khoản VIP.',
          correlationId
        });
      }
    }

    const excludeList = excludeIds ? String(excludeIds).split(',').filter(Boolean) : [];
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const questions = ToeicRepository.getQuestionsByTopic(topicId, safeLimit, excludeList);

    return res.status(200).json({
      success: true,
      topicInfo: topic,
      questions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy bài tập luyện chuyên sâu');
  }
}
