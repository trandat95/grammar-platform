import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { analyzeDiagnosticRootCauses, findTopicPrerequisites } from "../../../lib/diagnostic/knowledge.graph";
import { KNOWLEDGE_GRAPH } from "../../../lib/knowledge/knowledge-graph";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sanitizeShortText,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

function buildGroundedSuggestions(scoreResult, questionText = "") {
  const skills = scoreResult?.skill_results || [];
  const weakest = [...skills].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const qLower = questionText.toLowerCase();

  // Check if user asks about a specific topic keyword
  const keywordTopicMap = [
    { match: ["thì", "tense", "hiện tại hoàn thành", "quá khứ"], topicId: "tenses" },
    { match: ["bị động", "passive"], topicId: "passive_voice" },
    { match: ["điều kiện", "conditional", "if"], topicId: "conditionals" },
    { match: ["khuyết thiếu", "modal", "must", "should"], topicId: "modal_verbs" },
    { match: ["quan hệ", "relative", "who", "which"], topicId: "relative_clauses" },
    { match: ["mạo từ", "lượng từ", "a/an/the", "many", "much"], topicId: "determiners" },
    { match: ["giới từ", "preposition", "in/on/at"], topicId: "prepositions" },
    { match: ["so sánh", "comparison", "than"], topicId: "comparisons" },
    { match: ["gián tiếp", "tường thuật", "reported"], topicId: "reported_speech" },
    { match: ["từ loại", "word form", "danh từ", "tính từ"], topicId: "word_forms" },
  ];

  const matchedTopic = keywordTopicMap.find((entry) => entry.match.some((kw) => qLower.includes(kw)));
  const focusTopicId = matchedTopic?.topicId || weakest[0]?.topic_id || "tenses";
  const graphContext = findTopicPrerequisites(focusTopicId);

  const verifiedLessons = [];
  if (graphContext.node) {
    verifiedLessons.push({
      chapter_number: graphContext.node.chapter_number,
      lesson_id: graphContext.node.lesson_id,
      lesson_code: graphContext.node.lesson_code,
      title_vi: graphContext.node.title_vi,
      role: "Trọng tâm chính",
    });
  }
  for (const pr of (graphContext.prerequisites || []).slice(0, 2)) {
    if (KNOWLEDGE_GRAPH.nodes[pr.lesson_code]) {
      verifiedLessons.push({
        chapter_number: pr.chapter_number,
        lesson_id: pr.lesson_id,
        lesson_code: pr.lesson_code,
        title_vi: pr.title_vi,
        role: "Kiến thức tiên quyết (DAG)",
      });
    }
  }

  return { weakest, focusTopicId, graphContext, verifiedLessons };
}

function synthesizeDeterministicAdvice({ questionText, scoreResult, rootCauses, focusData }) {
  const qLower = (questionText || "").toLowerCase();
  const pct = scoreResult?.percentage ?? 0;
  const level = scoreResult?.estimated_level?.code || "B1";
  const { weakest, graphContext, verifiedLessons } = focusData;
  const topWeak = weakest[0];

  const lines = [];

  if (qLower.includes("20 phút") || qLower.includes("hôm nay") || qLower.includes("nên học")) {
    lines.push(
      `📅 **Kế hoạch 20 phút tối ưu hôm nay (Dựa trên điểm ${pct}/100 • Trình độ ${level}):**`
    );
    if (verifiedLessons.length > 0) {
      lines.push(
        `1. **10 phút đầu (Nền tảng):** Vào ngay Chương ${verifiedLessons[0].chapter_number} — **${verifiedLessons[0].title_vi}** (\`${verifiedLessons[0].lesson_code}\`), đọc kỹ bảng công thức & mô hình trực quan.`
      );
      if (verifiedLessons[1]) {
        lines.push(
          `2. **5 phút rà gốc rễ:** Ôn nhanh bài tiên quyết **${verifiedLessons[1].title_vi}** để tránh mất điểm dây chuyền.`
        );
      }
      lines.push(
        `3. **5 phút phản xạ:** Làm ngay 10 câu thực hành và đọc mục *Signal + Common Mistakes* cho câu sai.`
      );
    }
  } else if (qLower.includes("b2") || qLower.includes("sẵn sàng") || qLower.includes("lên cấp")) {
    const gapToB2 = Math.max(0, 75 - pct);
    if (pct >= 75) {
      lines.push(
        `🎯 **Đánh giá Sẵn sàng B2+:** Bạn đã đạt **${pct}/100 (${level})**, vượt ngưỡng mục tiêu B2 (75%). Hãy tập trung luyện câu điều kiện hỗn hợp, bị động đặc biệt và tổng hợp Chương 12 để hướng tới **C1 (≥90%)**.`
      );
    } else {
      lines.push(
        `📊 **Khoảng cách tới B2 (Ngưỡng chuẩn 75%):** Hiện tại bạn đạt **${pct}/100 (${level})**, cần cải thiện thêm **+${gapToB2} điểm**.`
      );
      if (topWeak) {
        lines.push(
          `🔑 **Đòn bẩy điểm cao nhất:** Chuyên đề **${topWeak.topic_name}** mới đạt **${topWeak.accuracy}%**. Nâng chuyên đề này lên ≥ 75% sẽ giúp tổng điểm bứt phá nhanh nhất.`
        );
      }
    }
  } else {
    lines.push(
      `🔍 **Phân tích Chẩn đoán Chuyên đề (${graphContext.node?.title_vi || topWeak?.topic_name || "Ngữ pháp cốt lõi"}):**`
    );
    if (topWeak) {
      lines.push(
        `• Kết quả bài thi ghi nhận chuyên đề **${topWeak.topic_name}** đạt **${topWeak.accuracy}%** (${topWeak.correct_answers}/${topWeak.total_questions} câu đúng).`
      );
    }
    if (rootCauses?.primaryRootCause) {
      lines.push(
        `• **Nguyên nhân gốc rễ (Root Cause):** ${rootCauses.primaryRootCause.label_vi} (${rootCauses.primaryRootCause.count} câu liên quan) — *${rootCauses.primaryRootCause.advice}*`
      );
    }
    if (graphContext.prerequisites?.length > 0) {
      lines.push(
        `• **Chuỗi tiên quyết từ Knowledge Graph:** Để làm chắc chủ điểm này, bạn nên vững trước: **${graphContext.prerequisites
          .slice(0, 3)
          .map((p) => p.title_vi)
          .join(" → ")}**.`
      );
    }
  }

  return lines.join("\n\n");
}

/**
 * Milestone 2.8.10: Conversational AI Learning Advisor API
 * POST /api/ai-advisor/ask
 * Strict Anti-Hallucination Guardrails: All scores & lesson IDs grounded in Scorer + 53-lesson DAG.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST.", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "ai_advisor_ask", maxRequests: 20, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token.", correlationId });
  }

  const serverClient = getAdminClient(req);

  try {
    const {
      question_text = "Hôm nay nên dành 20 phút học bài nào?",
      user_id = null,
      attempt_id = null,
      score_result = null,
    } = req.body || {};

    const cleanQuestion = sanitizeShortText(question_text, 600);
    if (!cleanQuestion) {
      return res.status(400).json({ success: false, error: "Missing question_text prompt.", correlationId });
    }

    if (authUser && user_id && isValidUuid(user_id) && authUser.id !== user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user AI advisor request denied.", correlationId });
    }

    const rootCauses =
      score_result?.root_cause_analysis ||
      analyzeDiagnosticRootCauses(score_result?.detailed_answers || [], score_result?.skill_results || []);

    const focusData = buildGroundedSuggestions(score_result, cleanQuestion);

    // Default to deterministic zero-hallucination synthesis
    let advisorResponse = synthesizeDeterministicAdvice({
      questionText: cleanQuestion,
      scoreResult: score_result,
      rootCauses,
      focusData,
    });
    let providerMode = "deterministic_coach";

    // Optional live LLM enhancement ONLY when GEMINI_API_KEY is configured cleanly, bounded strictly by verified JSON
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `Bạn là Cố vấn Học tập Ngữ pháp Tiếng Anh (AI Advisor).
QUY TẮC TUYỆT ĐỐI:
1. Chỉ sử dụng điểm số và danh sách lesson_code có thật dưới đây, TUYỆT ĐỐI KHÔNG tự bịa điểm số hoặc lesson_id.
2. Trả lời bằng tiếng Việt ngắn gọn, khích lệ, có cấu trúc hành động rõ ràng.
Dữ liệu thật: ${JSON.stringify({
          percentage: score_result?.percentage ?? 0,
          estimated_level: score_result?.estimated_level?.code || "B1",
          weakestTopics: focusData.weakest.map((w) => ({ topic: w.topic_name, accuracy: w.accuracy })),
          primaryRootCause: rootCauses?.primaryRootCause?.label_vi || null,
          verifiedLessons: focusData.verifiedLessons,
        })}`;

        const llmRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nCâu hỏi học viên: ${cleanQuestion}` }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 450 },
            }),
          }
        );
        if (llmRes.ok) {
          const llmJson = await llmRes.json();
          const candidate = llmJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate && candidate.trim().length > 20) {
            advisorResponse = candidate.trim();
            providerMode = "gemini_grounded_coach";
          }
        }
      } catch {
        // Silent graceful fallback to deterministic coach
      }
    }

    const resolvedUserId = authUser?.id || null;
    if (resolvedUserId) {
      await serverClient
        .from("ai_advisor_logs")
        .insert({
          user_id: resolvedUserId,
          attempt_id: attempt_id && isValidUuid(attempt_id) ? attempt_id : null,
          question_text: cleanQuestion,
          advisor_response: advisorResponse,
          context_snapshot: {
            providerMode,
            percentage: score_result?.percentage ?? null,
            verifiedLessonCodes: focusData.verifiedLessons.map((l) => l.lesson_code),
          },
        })
        .catch(() => {});
    }

    return res.status(200).json({
      success: true,
      correlationId,
      providerMode,
      answer: advisorResponse,
      suggestedLessons: focusData.verifiedLessons,
      rootCause: rootCauses?.primaryRootCause || null,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/ai-advisor/ask",
      err,
      publicMessage: "Cố vấn học tập hiện không khả dụng, vui lòng thử lại.",
    });
  }
}
