import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import DiagnosticSelector from '../../../../lib/ai-engine/diagnostic-selector';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_diagnostic_stage' })) {
    return;
  }

  try {
    const { sessionId, stage, responses = [], previousQuestionIds = [] } = req.body || {};

    if (!stage || !responses) {
      return res.status(422).json({ success: false, error: 'Thiếu thông tin stage hoặc responses' });
    }

    // Determine correct / incorrect responses
    let correctCount = 0;
    const incorrectIds = [];
    const answeredIds = [];

    for (const resp of responses) {
      const q = ToeicRepository.getQuestionById(resp.questionId);
      if (q) {
        answeredIds.push(q.id);
        const isCorrect = resp.selectedOption === q.correct_answer;
        if (isCorrect) {
          correctCount++;
        } else {
          incorrectIds.push(q.id);
        }
      }
    }

    const allExcludeIds = [...new Set([...previousQuestionIds, ...answeredIds])];

    if (stage === 1) {
      // Transition to Stage 2: Adaptive Difficulty Branching
      const stage2Questions = DiagnosticSelector.getStage2(correctCount, allExcludeIds);
      return res.status(200).json({
        success: true,
        sessionId,
        stage: 2,
        stage1Score: { correct: correctCount, total: responses.length },
        questions: stage2Questions
      });
    } else if (stage === 2) {
      // Transition to Stage 3: Targeted Weakness Verification (6 Twin Questions) + 1 Part 7 Passage (4 questions)
      const stage3Data = DiagnosticSelector.getStage3(incorrectIds, allExcludeIds);
      return res.status(200).json({
        success: true,
        sessionId,
        stage: 3,
        stage2Score: { correct: correctCount, total: responses.length },
        questions: stage3Data.questions,
        passage: stage3Data.passage
      });
    } else {
      return res.status(400).json({ success: false, error: 'Stage không hợp lệ' });
    }
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi chuyển chặng bài kiểm tra chẩn đoán');
  }
}
