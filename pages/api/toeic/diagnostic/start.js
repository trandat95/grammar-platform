import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import DiagnosticSelector from '../../../../lib/ai-engine/diagnostic-selector';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_diagnostic_start' })) {
    return;
  }

  try {
    const { userId, targetScore = 650 } = req.body || {};
    const sessionId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const questions = DiagnosticSelector.getStage1();

    return res.status(200).json({
      success: true,
      sessionId,
      stage: 1,
      targetScore,
      questions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Không thể khởi tạo bài kiểm tra chẩn đoán');
  }
}
