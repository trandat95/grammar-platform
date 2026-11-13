import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../../lib/api/security-guard';
import ToeicRepository from '../../../../../lib/toeic/toeic-repository';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_test_get' })) {
    return;
  }

  try {
    const { series = 'ETS2024', testNum = '1', mode = 'full' } = req.query;

    const s = String(series).toUpperCase();
    const tNum = parseInt(testNum, 10) || 1;

    const testData = ToeicRepository.getTestQuestionsAndPassages(s, tNum, mode);
    if (!testData || (!testData.questions?.length && !testData.passages?.length)) {
      return res.status(404).json({ success: false, error: `Không tìm thấy đề ${series} Test ${testNum}` });
    }

    return res.status(200).json({
      success: true,
      series: s,
      testNumber: tNum,
      mode,
      passageGroups: testData.passageGroups,
      passages: testData.passages,
      questions: testData.questions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy nội dung đề thi TOEIC');
  }
}
