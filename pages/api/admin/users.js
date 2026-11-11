import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdmin } from "../../../lib/supabase/middleware";
import { AuditRepository } from "../../../repositories/audit.repository";

export default async function handler(req, res) {
  // Check Admin Authorization
  const adminContext = await verifyAdmin(req);
  if (!adminContext) {
    return res.status(403).json({ success: false, error: "Unauthorized: Admin privileges required." });
  }

  const { user: adminUser, profile: adminProfile } = adminContext;
  const serverClient = getAdminClient();

  if (req.method === "GET") {
    try {
      const { data: users, error } = await serverClient
        .from("profiles")
        .select(`
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
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, users: users || [] });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method === "PATCH") {
    const { userId, role, status } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing required parameter: userId" });
    }

    try {
      // Get before state for audit log
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

      // Record Audit Log
      const actionType = status
        ? (status === "LOCKED" ? "BAN_USER" : "UNBAN_USER")
        : "UPDATE_USER_ROLE";

      await AuditRepository.recordAuditLog({
        adminId: adminUser.id,
        actionType,
        targetType: "PROFILE",
        targetId: userId,
        beforeState: beforeState || { id: userId },
        afterState: updated,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      });

      return res.status(200).json({ success: true, profile: updated });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
