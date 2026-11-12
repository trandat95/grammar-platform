import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdminWithGuard } from "../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../repositories/audit.repository";
import { getClientIp } from "../../../lib/admin/admin-guard";
import { attachCorrelationId, sendSafeServerError } from "../../../lib/api/security-guard";

function escapeCsvCell(val) {
  const s = val === null || val === undefined ? "" : String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Milestone 2.4.6, 2.4.9, 2.4.10, 2.4.11: Admin User Governance API
 * - Server-side RBAC Guard + 30 ops/min Rate Limiting
 * - Step-Up Confirmation for locking accounts or promoting to ADMIN
 * - Paginated search & UTF-8 BOM CSV export (?format=csv)
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const serverClient = getAdminClient(req);

  if (req.method === "GET") {
    const adminContext = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_users_read" });
    if (!adminContext) return;

    try {
      const { role, status, search, minStreak, format, page = "1", limit = "50" } = req.query;

      let query = serverClient
        .from("profiles")
        .select(
          `
          id,
          email,
          full_name,
          role,
          status,
          created_at,
          updated_at,
          user_learning_trackers (
            streak,
            xp,
            completed_lessons,
            last_active_date
          )
        `
        )
        .order("created_at", { ascending: false });

      if (role && role !== "ALL") query = query.eq("role", role);
      if (status && status !== "ALL") query = query.eq("status", status);

      const { data: rawUsers, error } = await query;
      if (error) throw error;

      let users = rawUsers || [];

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        users = users.filter(
          (u) =>
            (u.full_name && u.full_name.toLowerCase().includes(term)) ||
            (u.email && u.email.toLowerCase().includes(term)) ||
            u.id.toLowerCase().includes(term)
        );
      }

      const streakThreshold = parseInt(minStreak, 10);
      if (!Number.isNaN(streakThreshold) && streakThreshold > 0) {
        users = users.filter((u) => {
          const tracker = Array.isArray(u.user_learning_trackers)
            ? u.user_learning_trackers[0]
            : u.user_learning_trackers;
          return (tracker?.streak || 0) >= streakThreshold;
        });
      }

      if (format === "csv") {
        const header = ["UUID", "Họ và Tên", "Email", "Vai trò", "Trạng thái", "Streak", "XP", "Bài học đã xong", "Ngày tạo"];
        const lines = [header.map(escapeCsvCell).join(",")];
        for (const u of users) {
          const tracker = Array.isArray(u.user_learning_trackers)
            ? u.user_learning_trackers[0]
            : u.user_learning_trackers;
          const lessonsCount = Array.isArray(tracker?.completed_lessons) ? tracker.completed_lessons.length : 0;
          lines.push(
            [
              u.id,
              u.full_name || "",
              u.email,
              u.role,
              u.status,
              tracker?.streak ?? 1,
              tracker?.xp ?? 0,
              lessonsCount,
              u.created_at ? u.created_at.split("T")[0] : "",
            ]
              .map(escapeCsvCell)
              .join(",")
          );
        }

        // UTF-8 BOM for proper Vietnamese rendering in Microsoft Excel
        const csvOutput = "\uFEFF" + lines.join("\r\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="grammar-users-report.csv"');
        return res.status(200).send(csvOutput);
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      const start = (pageNum - 1) * limitNum;
      const pagedUsers = users.slice(start, start + limitNum);

      return res.status(200).json({
        success: true,
        users: pagedUsers,
        total: users.length,
        page: pageNum,
        limit: limitNum,
      });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/users", err: e.message });
    }
  }

  if (req.method === "PATCH") {
    const { userId, role, status } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing required parameter: userId" });
    }

    const isHighRiskMutation = status === "LOCKED" || role === "ADMIN";
    const adminContext = await verifyAdminWithGuard(req, res, {
      requireStepUp: isHighRiskMutation,
      rateLimitKeyPrefix: "admin_user_mutate",
    });
    if (!adminContext) return;

    const { user: adminUser } = adminContext;

    try {
      const { data: beforeState } = await serverClient
        .from("profiles")
        .select("id, email, role, status")
        .eq("id", userId)
        .maybeSingle();

      const updates = { updated_at: new Date().toISOString() };
      if (role && ["FREE", "VIP", "ADMIN"].includes(role)) updates.role = role;
      if (status && ["ACTIVE", "LOCKED"].includes(status)) updates.status = status;

      let updated = null;
      if (beforeState) {
        const { data, error } = await serverClient
          .from("profiles")
          .update(updates)
          .eq("id", userId)
          .select()
          .single();
        if (error) throw error;
        updated = data;
      } else {
        updated = { id: userId, role, status, ...updates };
      }

      const actionType = status
        ? status === "LOCKED"
          ? "BAN_USER"
          : "UNBAN_USER"
        : "UPDATE_USER_ROLE";

      await AuditRepository.recordAuditLog({
        adminId: adminUser.id,
        actionType,
        targetType: "PROFILE",
        targetId: userId,
        beforeState: beforeState || { id: userId },
        afterState: updated,
        ipAddress: getClientIp(req),
      });

      return res.status(200).json({ success: true, profile: updated });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/users", err: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
