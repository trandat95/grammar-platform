import { verifyAdminWithGuard } from "../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../repositories/audit.repository";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const adminContext = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_audit_read" });
  if (!adminContext) return;

  if (req.method === "GET") {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const logs = await AuditRepository.getRecentAuditLogs(limit);
      return res.status(200).json({ success: true, logs });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/audit-logs", err: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
