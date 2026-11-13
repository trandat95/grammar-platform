import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';
import { verifyAiTutorServerAccess } from '../../../../lib/toeic/subscription/server-gate';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 40, tier: 'toeic_ai_tutor' })) {
    return;
  }

  // Server-side entitlement check for AI Tutor (Milestone E7.1)
  const authGate = await verifyAiTutorServerAccess(req);
  if (!authGate.allowed) {
    return res.status(403).json({
      success: false,
      code: 'ERR_AI_TUTOR_LIMIT_REACHED',
      error: authGate.reason,
      upgradeRequired: true
    });
  }

  try {
    const { questionId, selectedOption, userMessage = '' } = req.body || {};

    if (!questionId) {
      return res.status(422).json({ success: false, error: 'Thiếu questionId' });
    }

    const question = ToeicRepository.getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: `Không tìm thấy câu hỏi ${questionId}` });
    }

    const aiAnalysis = question.ai_analysis || {};
    const ragContext = aiAnalysis.ai_tutor_rag_context || '';
    const formula = aiAnalysis.micro_rule_formula_vi || '';
    const trap = aiAnalysis.common_trap_warning_vi || '';
    const optAnalysis = selectedOption && aiAnalysis.option_deep_analysis?.[selectedOption];

    // Generate grounded pedagogical response
    let replyMarkdown = `### 🧑‍🏫 Giải Thích Từ AI Gia Sư TOEIC\n\n`;
    replyMarkdown += `**Chủ điểm:** ${aiAnalysis.primary_topic_name_vi || question.primary_grammar_topic_id}\n\n`;

    if (formula) {
      replyMarkdown += `> **Công thức cốt lõi:**\n> \`${formula}\`\n\n`;
    }

    if (optAnalysis) {
      replyMarkdown += `**Phân tích phương án bạn chọn (${selectedOption}):**\n`;
      replyMarkdown += `- ${optAnalysis.ai_feedback_vi}\n`;
      if (optAnalysis.error_pattern_name_vi) {
        replyMarkdown += `- ⚠️ **Mẫu lỗi nhận thức:** *${optAnalysis.error_pattern_name_vi}*\n`;
      }
      replyMarkdown += `\n`;
    }

    if (trap) {
      replyMarkdown += `💡 **Lưu ý bẫy thường gặp:** ${trap}\n\n`;
    }

    if (userMessage) {
      replyMarkdown += `**Về câu hỏi của bạn ("${userMessage.trim()}"):**\n`;
      if (ragContext) {
        replyMarkdown += `${ragContext}\n\n`;
      } else {
        replyMarkdown += `Đáp án đúng là **(${question.correct_answer})**. Hãy đối chiếu thành phần trước và sau chỗ trống để nhận diện chính xác chức năng ngữ pháp yêu cầu.\n\n`;
      }
    } else if (ragContext) {
      replyMarkdown += `**Bối cảnh ngữ pháp chuyên sâu:**\n${ragContext}\n\n`;
    }

    return res.status(200).json({
      success: true,
      questionId,
      replyMarkdown,
      suggestedRule: formula,
      commonTrap: trap
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi kết nối AI Gia Sư');
  }
}
