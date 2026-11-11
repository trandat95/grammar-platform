import { verifyAdmin } from "../../../lib/supabase/middleware";
import { AuditRepository } from "../../../repositories/audit.repository";

export default async function handler(req, res) {
  // Check Admin Authorization
  const adminContext = await verifyAdmin(req);
  if (!adminContext) {
    return res.status(403).json({ success: false, error: "Unauthorized: Admin privileges required." });
  }

  if (req.method === "GET") {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const logs = await AuditRepository.getRecentAuditLogs(limit);
      return res.status(200).json({ success: true, logs });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
