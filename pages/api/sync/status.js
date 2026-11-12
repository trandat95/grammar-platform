import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

/**
 * Milestone 2.3.9: Bidirectional Sync Status & Server Clock Endpoint
 * Provides authoritative UTC time and active system policy versioning for client convergence.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "sync_status", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const serverClient = getAdminClient(req);
  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token.", correlationId });
  }

  if (req.query?.userId && authUser && authUser.id !== req.query.userId) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user sync status denied.", correlationId });
  }

  const verifiedUserId = authUser?.id || null;

  try {
    const { data: policy } = await serverClient
      .from("system_policies")
      .select("key, policy_version, free_exercise_limit, free_daily_quiz_limit, diagnostic_cooldown_days, offline_sync_max_batch, updated_at")
      .eq("key", "default")
      .maybeSingle();

    let lastSyncedAt = null;
    let totalEventsProcessed = 0;

    if (verifiedUserId && isValidUuid(verifiedUserId)) {
      const { data: latest } = await serverClient
        .from("sync_idempotency_logs")
        .select("processed_at")
        .eq("user_id", verifiedUserId)
        .order("processed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastSyncedAt = latest?.processed_at || null;

      const { count } = await serverClient
        .from("sync_idempotency_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", verifiedUserId);
      totalEventsProcessed = count || 0;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      correlationId,
      serverTime: new Date().toISOString(),
      policy: policy || {
        key: "default",
        policy_version: 1,
        free_exercise_limit: 10,
        free_daily_quiz_limit: 2,
        diagnostic_cooldown_days: 7,
        offline_sync_max_batch: 50,
      },
      syncSummary: {
        lastSyncedAt,
        totalEventsProcessed,
      },
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/sync/status",
      err,
      publicMessage: "Không thể kiểm tra trạng thái đồng bộ.",
    });
  }
}
