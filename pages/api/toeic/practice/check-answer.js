import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_check_answer' })) {
    return;
  }

  try {
    const { questionId, selectedOption, timeSpentSec = 12, usedHint = false } = req.body || {};

    if (!questionId || !selectedOption) {
      return res.status(422).json({ success: false, error: 'Thiếu questionId hoặc selectedOption' });
    }

    const question = ToeicRepository.getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: `Không tìm thấy câu hỏi ${questionId}` });
    }

    const isCorrect = (selectedOption === question.correct_answer) && !usedHint;
    const aiAnalysis = question.ai_analysis || {};

    const optionFeedback = aiAnalysis.option_deep_analysis?.[selectedOption] || {
      text: question.options?.[selectedOption] || '',
      is_correct: isCorrect,
      pos_or_role: 'N/A',
      error_pattern_code: null,
      ai_feedback_vi: isCorrect ? 'Đáp án chính xác!' : 'Đáp án chưa chính xác.'
    };

    const twinQuestions = ToeicRepository.getTwinQuestions(questionId, 3);

    return res.status(200).json({
      success: true,
      questionId,
      isCorrect,
      correctAnswer: question.correct_answer,
      optionFeedback,
      xray: aiAnalysis.sentence_xray || null,
      solvingSteps: aiAnalysis.solving_steps_vi || [],
      wordFamilyMatrix: aiAnalysis.word_family_matrix || [],
      collocationHighlights: aiAnalysis.collocation_highlights || [],
      linkedVocabulary: aiAnalysis.linked_vocabulary || [],
      twinQuestions
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi kiểm tra câu trả lời');
  }
}
