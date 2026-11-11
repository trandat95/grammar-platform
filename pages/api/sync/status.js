import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";

/**
 * Milestone 2.3.9: Bidirectional Sync Status & Server Clock Endpoint
 * Provides authoritative UTC time and active system policy versioning for client convergence.
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const serverClient = getAdminClient();
  const authUser = await verifyServerSession(req);
  const requestedUserId = authUser?.id || req.query.userId || null;

  try {
    const { data: policy } = await serverClient
      .from("system_policies")
      .select("key, policy_version, free_exercise_limit, free_daily_quiz_limit, diagnostic_cooldown_days, offline_sync_max_batch, updated_at")
      .eq("key", "default")
      .maybeSingle();

    let lastSyncedAt = null;
    let totalEventsProcessed = 0;

    if (requestedUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedUserId)) {
      const { data: latest } = await serverClient
        .from("sync_idempotency_logs")
        .select("processed_at")
        .eq("user_id", requestedUserId)
        .order("processed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastSyncedAt = latest?.processed_at || null;

      const { count } = await serverClient
        .from("sync_idempotency_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", requestedUserId);
      totalEventsProcessed = count || 0;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ success: false, error: err.message });
  }
}
