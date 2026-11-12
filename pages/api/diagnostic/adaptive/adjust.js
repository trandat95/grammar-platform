import { getAdminClient } from "../../../../lib/supabase/server";
import { verifyServerSession } from "../../../../lib/supabase/middleware";
import { evaluateAdaptiveAdjustments } from "../../../../lib/diagnostic/adaptive.learning.engine";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sendSafeServerError,
} from "../../../../lib/api/security-guard";

/**
 * Milestone 2.8.8: Dynamic Adaptive Roadmap Adjustment API
 * POST /api/diagnostic/adaptive/adjust
 * Re-evaluates Accuracy > 90% (Accelerate), < 60% (Prerequisite Insert), and Application Gap (< 50%),
 * persists an immutable snapshot into public.roadmap_versions, and updates active roadmap.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST.", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "diag_adjust", maxRequests: 30, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token.", correlationId });
  }

  const serverClient = getAdminClient(req);

  try {
    const {
      user_id = null,
      roadmap = null,
      score_result = null,
      user_tracker = {},
      trigger_reason = "adaptive_recalibration",
    } = req.body || {};

    if (!roadmap || !Array.isArray(roadmap.weeks)) {
      return res.status(400).json({ success: false, error: "Missing active roadmap object with weeks array.", correlationId });
    }

    if (authUser && user_id && isValidUuid(user_id) && authUser.id !== user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user roadmap adjustment denied.", correlationId });
    }

    const resolvedUserId = authUser?.id || null;
    let conceptProgress = [];

    if (resolvedUserId) {
      const { data: progRows } = await serverClient
        .from("user_concept_progress")
        .select("*")
        .eq("user_id", resolvedUserId);
      conceptProgress = progRows || [];
    }

    const {
      adjustedRoadmap,
      adjustmentsApplied,
      changeSummary,
      versionNumber,
    } = evaluateAdaptiveAdjustments({
      roadmap,
      scoreResult: score_result,
      conceptProgress,
      userTracker: user_tracker,
      triggerReason: trigger_reason,
    });

    let persistedVersion = false;

    if (resolvedUserId && roadmap.db_id && isValidUuid(roadmap.db_id)) {
      try {
        await serverClient
          .from("user_learning_roadmaps")
          .update({
            current_version: versionNumber,
            last_adjusted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", roadmap.db_id)
          .eq("user_id", resolvedUserId);

        await serverClient.from("roadmap_versions").insert({
          roadmap_id: roadmap.db_id,
          user_id: resolvedUserId,
          version_number: versionNumber,
          trigger_reason,
          adjustment_summary: adjustmentsApplied,
          weeks_snapshot: adjustedRoadmap.weeks,
        });

        persistedVersion = true;
      } catch (dbErr) {
        console.warn("Could not persist roadmap version:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      roadmap: adjustedRoadmap,
      adjustments: adjustmentsApplied,
      changeSummary,
      versionNumber,
      persistedToCloud: persistedVersion,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/diagnostic/adaptive/adjust",
      err,
      publicMessage: "Không thể điều chỉnh lộ trình học tập.",
    });
  }
}
