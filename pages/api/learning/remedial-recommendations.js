import { supabaseServer } from "../../../lib/supabase/server";
import { supabase } from "../../../lib/supabase/client";
import { generateRemedialRecommendation } from "../../../lib/explanation/remedial-engine";
import quizData from "../../../data/ui/quiz_bank.json";
import previewData from "../../../data/ui/preview_data.json";

const isValidUUID = (id) =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default async function handler(req, res) {
  const dbClient = supabaseServer || supabase;

  // POST: Generate & save remedial recommendation
  if (req.method === "POST") {
    try {
      const { user_id, question_id, selected_answer, correct_answer } = req.body;

      if (!question_id) {
        return res.status(400).json({ error: "Missing required 'question_id'." });
      }

      // Server-side authoritative question lookup
      let authorQuestion = null;
      for (const topic of quizData.topics || []) {
        const found = topic.questions?.find((q) => q.id === question_id);
        if (found) {
          authorQuestion = found;
          break;
        }
      }

      if (!authorQuestion) {
        return res.status(404).json({ error: `Question ${question_id} not found.` });
      }

      const realCorrectAnswer = Array.isArray(authorQuestion.answers) ? authorQuestion.answers[0] : (authorQuestion.answer || correct_answer);

      // Generate recommendation
      const recommendation = generateRemedialRecommendation(
        authorQuestion,
        selected_answer,
        realCorrectAnswer,
        previewData,
        {}
      );

      // If user_id is provided and is a valid UUID, persist into remedial_recommendations table
      if (isValidUUID(user_id)) {
        await dbClient.from("remedial_recommendations").insert([
          {
            user_id,
            question_id,
            concept_id: recommendation.detected_error,
            lesson_id: recommendation.lesson_id,
            lesson_title: recommendation.lesson_title,
            detected_error: recommendation.detected_error,
            knowledge_gap: recommendation.knowledge_gap,
            reason: recommendation.reason,
            recommendation_type: recommendation.recommendation_type,
            difficulty: recommendation.difficulty,
            confidence: recommendation.confidence,
            status: "suggested",
          },
        ]);
      }

      return res.status(200).json({ recommendation });
    } catch (err) {
      console.error("[Remedial Engine POST Error]:", err);
      return res.status(500).json({ error: "Lỗi hệ thống khi sinh lộ trình củng cố." });
    }
  }

  // GET: Fetch recommendations for user
  if (req.method === "GET") {
    try {
      const { user_id, status } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: "Missing required 'user_id' parameter." });
      }

      let query = dbClient
        .from("remedial_recommendations")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ recommendations: data || [] });
    } catch (err) {
      return res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách khuyến nghị." });
    }
  }

  // PATCH: Update recommendation status
  if (req.method === "PATCH") {
    try {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: "Missing required 'id' or 'status'." });
      }

      const validStatuses = ["suggested", "accepted", "dismissed", "in_progress", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const updateData = { status };
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await dbClient
        .from("remedial_recommendations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, updated: data });
    } catch (err) {
      return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật trạng thái khuyến nghị." });
    }
  }

  return res.status(405).json({ error: "Method not allowed. Use GET, POST, or PATCH." });
}
