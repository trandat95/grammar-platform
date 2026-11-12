import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { generateRemedialRecommendation } from "../../../lib/explanation/remedial-engine";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sendSafeServerError,
} from "../../../lib/api/security-guard";
import quizData from "../../../data/ui/quiz_bank.json";
import previewData from "../../../data/ui/preview_data.json";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (!["GET", "POST", "PATCH"].includes(req.method)) {
    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    return res.status(405).json({ error: "Method not allowed. Use GET, POST, or PATCH.", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "remedial_recommendations",
    maxRequests: 60,
    correlationId,
  });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ error: "Invalid or expired Bearer session token.", correlationId });
  }

  const dbClient = getAdminClient(req);

  // POST: Generate & optionally persist remedial recommendation
  if (req.method === "POST") {
    try {
      const { user_id, question_id, selected_answer, correct_answer } = req.body || {};

      if (!question_id || typeof question_id !== "string") {
        return res.status(400).json({ error: "Missing required 'question_id'.", correlationId });
      }

      if (authUser && user_id && isValidUuid(user_id) && authUser.id !== user_id) {
        return res.status(403).json({ error: "Forbidden: Cross-user remedial write denied.", correlationId });
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
        return res.status(404).json({ error: `Question ${question_id} not found.`, correlationId });
      }

      const realCorrectAnswer = Array.isArray(authorQuestion.answers)
        ? authorQuestion.answers[0]
        : authorQuestion.answer || correct_answer;

      const recommendation = generateRemedialRecommendation(
        authorQuestion,
        selected_answer,
        realCorrectAnswer,
        previewData,
        {}
      );

      // Persist ONLY for authenticated Bearer session users (prevents unauthenticated user_id spoofing)
      if (authUser?.id) {
        await dbClient.from("remedial_recommendations").insert([
          {
            user_id: authUser.id,
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

      return res.status(200).json({ recommendation, correlationId });
    } catch (err) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/learning/remedial-recommendations",
        err,
        publicMessage: "Lỗi hệ thống khi sinh lộ trình củng cố.",
      });
    }
  }

  // GET: Fetch recommendations for authenticated user
  if (req.method === "GET") {
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required.", correlationId });
    }

    const { user_id, status } = req.query || {};
    if (user_id && authUser.id !== user_id) {
      return res.status(403).json({ error: "Forbidden: Cross-user remedial read denied.", correlationId });
    }

    try {
      let query = dbClient
        .from("remedial_recommendations")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (status) {
        query = query.eq("status", String(status));
      }

      const { data, error } = await query;
      if (error) {
        return sendSafeServerError(res, {
          correlationId,
          route: "/api/learning/remedial-recommendations",
          err: error,
          publicMessage: "Không thể tải danh sách khuyến nghị.",
        });
      }

      return res.status(200).json({ recommendations: data || [], correlationId });
    } catch (err) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/learning/remedial-recommendations",
        err,
        publicMessage: "Lỗi hệ thống khi lấy danh sách khuyến nghị.",
      });
    }
  }

  // PATCH: Update recommendation status (strict owner check)
  if (!authUser) {
    return res.status(401).json({ error: "Authentication required.", correlationId });
  }

  try {
    const { id, status } = req.body || {};

    if (!id || !isValidUuid(id) || !status) {
      return res.status(400).json({ error: "Missing or invalid 'id' UUID or 'status'.", correlationId });
    }

    const validStatuses = ["suggested", "accepted", "dismissed", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`, correlationId });
    }

    const updateData = { status };
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await dbClient
      .from("remedial_recommendations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", authUser.id)
      .select()
      .maybeSingle();

    if (error) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/learning/remedial-recommendations",
        err: error,
        publicMessage: "Không thể cập nhật trạng thái khuyến nghị.",
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Recommendation not found or not owned by user.", correlationId });
    }

    return res.status(200).json({ success: true, updated: data, correlationId });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/learning/remedial-recommendations",
      err,
      publicMessage: "Lỗi hệ thống khi cập nhật trạng thái khuyến nghị.",
    });
  }
}
