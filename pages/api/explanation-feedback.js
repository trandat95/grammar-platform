import { supabaseServer } from "../../lib/supabase/server";
import { supabase } from "../../lib/supabase/client";
import { FEEDBACK_ERROR_CATEGORIES } from "../../lib/explanation/explanation.schema";

export default async function handler(req, res) {
  const dbClient = supabaseServer || supabase;

  // POST: Submit feedback
  if (req.method === "POST") {
    try {
      const {
        user_id,
        question_id,
        explanation_id,
        explanation_version = 1,
        feedback_type,
        error_category,
        comment,
      } = req.body;

      if (!question_id || !feedback_type) {
        return res.status(400).json({ error: "Missing required fields: question_id and feedback_type." });
      }

      if (!["helpful", "report_error"].includes(feedback_type)) {
        return res.status(400).json({ error: "Invalid feedback_type. Must be 'helpful' or 'report_error'." });
      }

      if (feedback_type === "report_error" && error_category) {
        if (!FEEDBACK_ERROR_CATEGORIES.includes(error_category)) {
          return res.status(400).json({ error: `Invalid error_category. Must be one of: ${FEEDBACK_ERROR_CATEGORIES.join(", ")}` });
        }
      }

      // Check for duplicate feedback if user_id is provided
      if (user_id) {
        const { data: existing } = await dbClient
          .from("explanation_feedback")
          .select("id")
          .eq("user_id", user_id)
          .eq("question_id", question_id)
          .eq("explanation_version", explanation_version)
          .eq("feedback_type", feedback_type)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            error: "Bạn đã gửi phản hồi cho lời giải này rồi.",
            isDuplicate: true,
          });
        }
      }

      // Insert feedback
      const { data, error } = await dbClient
        .from("explanation_feedback")
        .insert([
          {
            user_id: user_id || null,
            question_id,
            explanation_id: explanation_id || null,
            explanation_version,
            feedback_type,
            error_category: error_category || null,
            comment: comment || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("[Feedback Insert Error]:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: feedback_type === "helpful" ? "Cảm ơn bạn đã đánh giá lời giải hữu ích!" : "Đã tiếp nhận báo lỗi lời giải. Ban biên tập sẽ rà soát ngay!",
        feedback: data,
      });
    } catch (err) {
      console.error("[API Feedback Error]:", err);
      return res.status(500).json({ error: "Lỗi hệ thống khi gửi phản hồi." });
    }
  }

  // GET: Check feedback status
  if (req.method === "GET") {
    try {
      const { user_id, question_id } = req.query;
      if (!user_id || !question_id) {
        return res.status(400).json({ error: "Missing user_id or question_id parameter." });
      }

      const { data, error } = await dbClient
        .from("explanation_feedback")
        .select("*")
        .eq("user_id", user_id)
        .eq("question_id", question_id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ feedbackHistory: data || [] });
    } catch (err) {
      return res.status(500).json({ error: "Lỗi hệ thống khi tra cứu phản hồi." });
    }
  }

  return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}
