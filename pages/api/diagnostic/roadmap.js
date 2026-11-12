/**
 * API: /api/diagnostic/roadmap
 * GET: Retrieve active personalized roadmap and items for authenticated user
 * PATCH: Toggle completion status of a roadmap task owned by authenticated user
 */

import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "diagnostic_roadmap",
    maxRequests: 60,
    correlationId,
  });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token.", correlationId });
  }

  const serverClient = getAdminClient(req);

  if (req.method === "GET") {
    const { user_id } = req.query || {};

    if (!user_id || !isValidUuid(user_id)) {
      if (!authUser) {
        return res.status(200).json({ success: true, roadmap: null, guestMode: true, correlationId });
      }
    }

    if (!authUser) {
      return res.status(401).json({ success: false, error: "Authentication required to read user roadmap.", correlationId });
    }

    if (user_id && isValidUuid(user_id) && authUser.id !== user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user roadmap access denied.", correlationId });
    }

    try {
      const { data: roadmap, error } = await serverClient
        .from("user_learning_roadmaps")
        .select(`
          id,
          user_id,
          title,
          target_level,
          status,
          created_at,
          roadmap_items (
            id,
            lesson_id,
            topic_id,
            title,
            item_type,
            priority,
            sequence_order,
            status,
            reason,
            completed_at
          )
        `)
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return sendSafeServerError(res, {
          correlationId,
          route: "/api/diagnostic/roadmap",
          err: error,
          publicMessage: "Không thể tải lộ trình học tập.",
        });
      }

      return res.status(200).json({ success: true, roadmap, correlationId });
    } catch (err) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/diagnostic/roadmap",
        err,
        publicMessage: "Lỗi hệ thống khi tải lộ trình học tập.",
      });
    }
  }

  // PATCH
  const { task_id, is_completed, user_id } = req.body || {};

  if (!task_id) {
    return res.status(400).json({ success: false, error: "task_id is required", correlationId });
  }

  if (!authUser) {
    return res.status(401).json({ success: false, error: "Authentication required to update roadmap item.", correlationId });
  }

  if (user_id && isValidUuid(user_id) && authUser.id !== user_id) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user roadmap write denied.", correlationId });
  }

  if (isValidUuid(task_id)) {
    try {
      const { error } = await serverClient
        .from("roadmap_items")
        .update({
          status: Boolean(is_completed) ? "COMPLETED" : "PENDING",
          completed_at: Boolean(is_completed) ? new Date().toISOString() : null,
        })
        .eq("id", task_id)
        .eq("user_id", authUser.id);

      if (error) {
        return sendSafeServerError(res, {
          correlationId,
          route: "/api/diagnostic/roadmap",
          err: error,
          publicMessage: "Không thể cập nhật tiến độ lộ trình.",
        });
      }
    } catch (dbErr) {
      console.warn("DB roadmap item update warning:", dbErr.message);
    }
  }

  return res.status(200).json({ success: true, task_id, is_completed: Boolean(is_completed), correlationId });
}
