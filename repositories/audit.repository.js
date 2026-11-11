import { getAdminClient } from "../lib/supabase/server";

export const AuditRepository = {
  async recordAuditLog({ adminId, actionType, targetType, targetId, beforeState, afterState, ipAddress }) {
    try {
      const serverClient = getAdminClient();
      const { data, error } = await serverClient
        .from("audit_logs")
        .insert({
          admin_id: adminId || null,
          action_type: actionType,
          target_type: targetType,
          target_id: String(targetId || ""),
          before_state: beforeState || null,
          after_state: afterState || null,
          ip_address: ipAddress || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) console.error("Audit log record error:", error.message);
      return data;
    } catch (e) {
      console.error("Could not write audit log:", e.message);
      return null;
    }
  },

  async getRecentAuditLogs(limit = 100) {
    try {
      const serverClient = getAdminClient();
      const { data, error } = await serverClient
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Could not fetch audit logs:", e.message);
      return [];
    }
  },
};
