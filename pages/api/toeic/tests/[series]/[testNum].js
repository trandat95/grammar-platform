import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../../lib/api/security-guard';
import ToeicRepository from '../../../../../lib/toeic/toeic-repository';
import FlashcardRepository from '../../../../../lib/toeic/flashcard-repository';
import { verifyTestServerAccess } from '../../../../../lib/toeic/subscription/server-gate';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const rate = checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_test_get', correlationId });
  if (!rate.allowed) return;

  try {
    const { series = 'ETS2024', testNum = '1', mode = 'full' } = req.query;

    const s = String(series || '').trim().toUpperCase();
    const tNum = Number.parseInt(String(testNum), 10);
    if (!['ETS2024', 'ETS2026'].includes(s) || !Number.isInteger(tNum) || tNum < 1 || tNum > 10) {
      return res.status(400).json({
        success: false,
        error: 'Tham số bộ đề hoặc số thứ tự đề không hợp lệ.',
        correlationId
      });
    }

    // Server-Side Entitlement Check (E7.1 / E7.8)
    const gateCheck = await verifyTestServerAccess(req, s, tNum);
    if (!gateCheck.allowed) {
      return res.status(gateCheck.statusCode || 403).json({
        success: false,
        error: gateCheck.error,
        message: gateCheck.message,
        isVipRequired: true,
        correlationId
      });
    }

    const testData = ToeicRepository.getTestQuestionsAndPassages(s, tNum, mode);
    if (!testData || (!testData.questions?.length && !testData.passages?.length)) {
      return res.status(404).json({ success: false, error: `Không tìm thấy đề ${series} Test ${testNum}` });
    }

    const enrichedQuestions = (testData.questions || []).map((q) => ({
      ...q,
      matched_flashcards: FlashcardRepository.getMatchedFlashcardsForQuestion(q.id, 3),
    }));

    return res.status(200).json({
      success: true,
      series: s,
      testNumber: tNum,
      mode,
      passageGroups: testData.passageGroups,
      passages: testData.passages,
      questions: enrichedQuestions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy nội dung đề thi TOEIC');
  }
}
