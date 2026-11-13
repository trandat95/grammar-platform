import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_practice_drill' })) {
    return;
  }

  try {
    const { topicId, limit = 15, excludeIds = '' } = req.query;

    if (!topicId) {
      return res.status(422).json({ success: false, error: 'Thiếu tham số topicId' });
    }

    const topic = ToeicRepository.getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: `Không tìm thấy chủ điểm ${topicId}` });
    }

    const excludeList = excludeIds ? excludeIds.split(',') : [];
    const questions = ToeicRepository.getQuestionsByTopic(topicId, parseInt(limit, 10) || 15, excludeList);

    return res.status(200).json({
      success: true,
      topicInfo: topic,
      questions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy bài tập luyện chuyên sâu');
  }
}
