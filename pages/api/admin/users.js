import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdminWithGuard, getClientIp } from "../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../repositories/audit.repository";
import { attachCorrelationId, sendSafeServerError } from "../../../lib/api/security-guard";

function escapeCsvCell(val) {
  const s = val === null || val === undefined ? "" : String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatSubSummary(sub) {
  if (!sub) return "";
  const cycleLabel =
    sub.billing_cycle === "monthly"
      ? "1 tháng"
      : sub.billing_cycle === "quarterly"
      ? "3 tháng"
      : sub.billing_cycle === "lifetime"
      ? "Trọn đời"
      : "1 năm";
  return `${sub.plan_name || sub.plan_code} (${cycleLabel})`;
}

/**
 * Milestone 2.4.6, 2.4.9, 2.4.10, 2.4.11 & 2.12 Admin VIP Governance API
 * - Server-side RBAC Guard + 30 ops/min Rate Limiting
 * - Step-Up Confirmation for locking accounts or promoting to ADMIN
 * - Active VIP Subscription plan & expiration join + atomic Admin VIP grant/revoke RPC
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

      const [{ data: rawUsers, error }, { data: activeSubs }, { data: plansRows }] = await Promise.all([
        query,
        serverClient
          .from("user_subscriptions")
          .select(
            `
            id,
            user_id,
            status,
            provider,
            current_period_start,
            current_period_end,
            created_at,
            subscription_plans (
              code,
              name_vi,
              billing_cycle,
              price_vnd
            )
          `
          )
          .in("status", ["active", "trialing", "grace_period"])
          .order("current_period_end", { ascending: false }),
        serverClient
          .from("subscription_plans")
          .select("id, code, name_vi, billing_cycle, price_vnd, is_active")
          .eq("is_active", true)
          .order("price_vnd", { ascending: true }),
      ]);

      if (error) throw error;

      const subByUser = new Map();
      for (const s of activeSubs || []) {
        if (!s?.user_id || subByUser.has(s.user_id)) continue;
        const plan = Array.isArray(s.subscription_plans) ? s.subscription_plans[0] : s.subscription_plans;
        subByUser.set(s.user_id, {
          id: s.id,
          status: s.status,
          provider: s.provider,
          plan_code: plan?.code || null,
          plan_name: plan?.name_vi || plan?.code || null,
          billing_cycle: plan?.billing_cycle || null,
          current_period_start: s.current_period_start || s.created_at || null,
          current_period_end: s.current_period_end || null,
        });
      }

      let users = (rawUsers || []).map((u) => ({
        ...u,
        active_subscription: subByUser.get(u.id) || null,
      }));

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
        const header = [
          "UUID",
          "Họ và Tên",
          "Email",
          "Vai trò",
          "Gói VIP",
          "Thời gian kết thúc VIP",
          "Trạng thái",
          "Streak",
          "XP",
          "Bài học đã xong",
          "Ngày tạo",
        ];
        const lines = [header.map(escapeCsvCell).join(",")];
        for (const u of users) {
          const tracker = Array.isArray(u.user_learning_trackers)
            ? u.user_learning_trackers[0]
            : u.user_learning_trackers;
          const lessonsCount = Array.isArray(tracker?.completed_lessons) ? tracker.completed_lessons.length : 0;
          const sub = u.active_subscription;
          const vipLabel = u.role === "VIP" ? (sub ? formatSubSummary(sub) : "VIP Thủ công") : "";
          const vipEnd =
            u.role === "VIP" && sub
              ? sub.billing_cycle === "lifetime"
                ? "Trọn đời (Vĩnh viễn)"
                : sub.current_period_end
                ? sub.current_period_end.split("T")[0]
                : ""
              : "";
          lines.push(
            [
              u.id,
              u.full_name || "",
              u.email,
              u.role,
              vipLabel,
              vipEnd,
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
        correlationId,
        users: pagedUsers,
        vipPlans: plansRows || [],
        total: users.length,
        page: pageNum,
        limit: limitNum,
      });
    } catch (e) {
      return sendSafeServerError(res, { correlationId, route: "/api/admin/users", err: e });
    }
  }

  if (req.method === "PATCH") {
    const { userId, role, status, planCode } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing required parameter: userId", correlationId });
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

      let updated = null;
      let subscription = null;

      if (role === "VIP" || role === "FREE") {
        const { data: rpcRes, error: rpcErr } = await serverClient.rpc("admin_grant_user_vip_subscription", {
          p_target_user_id: userId,
          p_plan_code: role === "VIP" ? planCode || "VIP_YEARLY" : null,
          p_action: role === "VIP" ? "grant_vip" : "revoke_vip",
        });
        if (rpcErr) throw rpcErr;
        if (!rpcRes?.ok) {
          return res.status(Number(rpcRes?.http_status || 400)).json({
            success: false,
            error: rpcRes?.error || "Không thể cập nhật gói VIP.",
            correlationId,
          });
        }
        subscription = rpcRes.subscription || null;
        const { data: refreshed } = await serverClient
          .from("profiles")
          .select("id, email, full_name, role, status, created_at, updated_at")
          .eq("id", userId)
          .maybeSingle();
        updated = refreshed || { id: userId, role };
      } else {
        const updates = { updated_at: new Date().toISOString() };
        if (role && ["FREE", "VIP", "ADMIN"].includes(role)) updates.role = role;
        if (status && ["ACTIVE", "LOCKED"].includes(status)) updates.status = status;

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
        afterState: subscription ? { ...updated, plan_code: subscription.plan_code, current_period_end: subscription.current_period_end } : updated,
        ipAddress: getClientIp(req),
      });

      return res.status(200).json({ success: true, profile: updated, subscription, correlationId });
    } catch (e) {
      return sendSafeServerError(res, { correlationId, route: "/api/admin/users", err: e });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed`, correlationId });
}
