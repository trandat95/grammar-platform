import { getAdminClient } from "../../lib/supabase/server";
import { verifyServerSession } from "../../lib/supabase/middleware";
import { FEEDBACK_ERROR_CATEGORIES } from "../../lib/explanation/explanation.schema";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sanitizeShortText,
  sendSafeServerError,
} from "../../lib/api/security-guard";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed. Use GET or POST.", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "explanation_feedback",
    maxRequests: 30,
    correlationId,
  });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ error: "Invalid or expired Bearer session token.", correlationId });
  }

  const dbClient = getAdminClient(req);

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
      } = req.body || {};

      if (!question_id || !feedback_type) {
        return res.status(400).json({ error: "Missing required fields: question_id and feedback_type.", correlationId });
      }

      if (!["helpful", "report_error"].includes(feedback_type)) {
        return res.status(422).json({ error: "Invalid feedback_type. Must be 'helpful' or 'report_error'.", correlationId });
      }

      if (feedback_type === "report_error" && error_category) {
        if (!FEEDBACK_ERROR_CATEGORIES.includes(error_category)) {
          return res.status(422).json({
            error: `Invalid error_category. Must be one of: ${FEEDBACK_ERROR_CATEGORIES.join(", ")}`,
            correlationId,
          });
        }
      }

      if (authUser && user_id && isValidUuid(user_id) && authUser.id !== user_id) {
        return res.status(403).json({ error: "Forbidden: Cross-user feedback spoofing denied.", correlationId });
      }

      // Only attribute user_id when cryptographically verified via Supabase session JWT
      const safeUserId = authUser?.id || null;
      const safeComment = sanitizeShortText(comment, 1000) || null;
      const safeQuestionId = sanitizeShortText(String(question_id), 120);
      const safeVersion = Math.max(1, Math.min(100, Number(explanation_version) || 1));

      if (safeUserId) {
        const { data: existing } = await dbClient
          .from("explanation_feedback")
          .select("id")
          .eq("user_id", safeUserId)
          .eq("question_id", safeQuestionId)
          .eq("explanation_version", safeVersion)
          .eq("feedback_type", feedback_type)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            error: "Bạn đã gửi phản hồi cho lời giải này rồi.",
            isDuplicate: true,
            correlationId,
          });
        }
      }

      const { error } = await dbClient.from("explanation_feedback").insert([
        {
          user_id: safeUserId,
          question_id: safeQuestionId,
          explanation_id: isValidUuid(explanation_id) ? explanation_id : null,
          explanation_version: safeVersion,
          feedback_type,
          error_category: error_category || null,
          comment: safeComment,
        },
      ]);

      if (error) {
        return sendSafeServerError(res, {
          correlationId,
          route: "/api/explanation-feedback",
          err: error,
          publicMessage: "Không thể lưu phản hồi lúc này.",
        });
      }

      return res.status(200).json({
        success: true,
        correlationId,
        message:
          feedback_type === "helpful"
            ? "Cảm ơn bạn đã đánh giá lời giải hữu ích!"
            : "Đã tiếp nhận báo lỗi lời giải. Ban biên tập sẽ rà soát ngay!",
      });
    } catch (err) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/explanation-feedback",
        err,
        publicMessage: "Lỗi hệ thống khi gửi phản hồi.",
      });
    }
  }

  // GET: Requires verified session and strictly scopes to authUser.id
  if (!authUser) {
    return res.status(401).json({ error: "Authentication required.", correlationId });
  }

  try {
    const { user_id, question_id } = req.query || {};
    if (!question_id) {
      return res.status(400).json({ error: "Missing question_id parameter.", correlationId });
    }
    if (user_id && authUser.id !== user_id) {
      return res.status(403).json({ error: "Forbidden: Cross-user feedback read denied.", correlationId });
    }

    const { data, error } = await dbClient
      .from("explanation_feedback")
      .select("id, question_id, explanation_version, feedback_type, error_category, comment, created_at")
      .eq("user_id", authUser.id)
      .eq("question_id", String(question_id).slice(0, 120));

    if (error) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/explanation-feedback",
        err: error,
        publicMessage: "Không thể tra cứu phản hồi.",
      });
    }

    return res.status(200).json({ feedbackHistory: data || [], correlationId });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/explanation-feedback",
      err,
      publicMessage: "Lỗi hệ thống khi tra cứu phản hồi.",
    });
  }
}
