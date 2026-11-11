import { verifyAdminWithGuard } from "../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../repositories/audit.repository";

export default async function handler(req, res) {
  const adminContext = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_audit_read" });
  if (!adminContext) return;

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
