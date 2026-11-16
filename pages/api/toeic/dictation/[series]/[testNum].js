import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../../lib/api/security-guard';
import ToeicRepository from '../../../../../lib/toeic/toeic-repository';
import { verifyDictationServerAccess } from '../../../../../lib/toeic/subscription/server-gate';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const rate = checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_dictation_get', correlationId });
  if (!rate.allowed) return;

  try {
    const { series = 'ETS2026', testNum = '1' } = req.query;

    const s = String(series || '').trim().toUpperCase();
    const tNum = Number.parseInt(String(testNum), 10);
    if (!['ETS2024', 'ETS2026'].includes(s) || !Number.isInteger(tNum) || tNum < 1 || tNum > 10) {
      return res.status(400).json({
        success: false,
        error: 'Tham số bộ đề hoặc số thứ tự đề không hợp lệ.',
        correlationId
      });
    }

    // Server-Side Entitlement Check (Test 01 is Free, Tests 02-10 require VIP)
    const gateCheck = await verifyDictationServerAccess(req, s, tNum);
    if (!gateCheck.allowed) {
      return res.status(gateCheck.statusCode || 403).json({
        success: false,
        error: gateCheck.error,
        message: gateCheck.message,
        isVipRequired: true,
        correlationId
      });
    }

    const tracks = ToeicRepository.getDictationTracks(s, tNum);
    if (!tracks || tracks.length === 0) {
      return res.status(404).json({ success: false, error: `Không tìm thấy dữ liệu nghe chép chính tả cho ${series} Test ${testNum}` });
    }

    return res.status(200).json({
      success: true,
      series: s,
      testNumber: tNum,
      totalTracks: tracks.length,
      tracks
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy nội dung nghe chép chính tả');
  }
}
