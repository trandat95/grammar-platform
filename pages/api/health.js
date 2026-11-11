/**
 * Lightweight Network Liveness Health Endpoint (/api/health)
 * Used by SyncManager heartbeat ping to distinguish real internet from captive portals.
 */

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).json({
    ok: true,
    status: "healthy",
    serverTime: new Date().toISOString(),
  });
}
