import { attachCorrelationId } from "../../lib/api/security-guard";
import { supabaseServer } from "../../lib/supabase/server";

/**
 * Lightweight Network Liveness & Optional Deep Readiness Health Endpoint (/api/health)
 * - Default GET/HEAD is zero-DB for SyncManager heartbeat checks (<5ms, zero Free-Tier quota cost).
 * - Optional GET /api/health?deep=1 checks lightweight DB reachability cleanly.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "HEAD") {
    return res.status(200).end();
  }

  const deepCheck = String(req.query?.deep || "") === "1";
  if (!deepCheck) {
    return res.status(200).json({
      ok: true,
      status: "healthy",
      correlationId,
      serverTime: new Date().toISOString(),
    });
  }

  try {
    const startedAt = Date.now();
    const { error } = await supabaseServer
      .from("subscription_plans")
      .select("code")
      .limit(1);

    if (error) {
      return res.status(503).json({
        ok: false,
        status: "degraded",
        db: "unreachable",
        correlationId,
        serverTime: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      ok: true,
      status: "healthy",
      db: "ok",
      latencyMs: Date.now() - startedAt,
      correlationId,
      serverTime: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      ok: false,
      status: "degraded",
      db: "error",
      correlationId,
      serverTime: new Date().toISOString(),
    });
  }
}
