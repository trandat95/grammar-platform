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

    const excludeList = excludeIds ? String(excludeIds).split(',').filter(Boolean) : [];
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));

    const targetBand = Number(topic.target_score_band || topic.min_target_band || 450);
    let isPreviewMode = false;
    let effectiveLimit = safeLimit;

    if (targetBand >= 550) {
      const { isVip } = await resolveServerUserRole(req);
      if (!isVip) {
        isPreviewMode = true;
        effectiveLimit = Math.min(safeLimit, 4);
      }
    }

    const questions = ToeicRepository.getQuestionsByTopic(topicId, effectiveLimit, excludeList);

    return res.status(200).json({
      success: true,
      isPreviewMode,
      freePreviewLimit: isPreviewMode ? 4 : null,
      topicInfo: topic,
      questions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy bài tập luyện chuyên sâu');
  }
}
