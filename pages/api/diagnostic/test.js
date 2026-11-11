/**
 * API: GET /api/diagnostic/test
 * Returns the 30-question diagnostic test blueprint and questions.
 * Anti-Tampering: Strips correct_answer and internal pedagogy to prevent client-side cheating.
 */

import { DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_TOPICS } from "../../../lib/diagnostic/diagnostic.blueprint";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Sanitize questions: only return stem, options, topic, and difficulty
    const sanitizedQuestions = DIAGNOSTIC_QUESTIONS.map((q) => ({
      id: q.id,
      index: q.index,
      topic: q.topic,
      topic_vi: q.topic_vi,
      difficulty: q.difficulty,
      stem: q.stem,
      options: q.options,
      chapter_number: q.chapter_number,
    }));

    return res.status(200).json({
      success: true,
      test: {
        id: "a0000000-0000-0000-0000-000000000001",
        title: "Comprehensive Grammar Diagnostic Placement Assessment",
        description: "Bài kiểm tra chẩn đoán toàn diện 30 câu hỏi đánh giá trình độ ngữ pháp đầu vào và thiết lập lộ trình học tập cá nhân hóa.",
        total_questions: sanitizedQuestions.length,
        time_limit_seconds: 1200, // 20 minutes
        topics: DIAGNOSTIC_TOPICS,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error("Diagnostic test load error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while loading diagnostic test",
    });
  }
}
