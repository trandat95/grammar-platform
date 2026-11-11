import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdmin } from "../../../lib/supabase/middleware";
import { AuditRepository } from "../../../repositories/audit.repository";

export default async function handler(req, res) {
  // Check Admin Authorization
  const adminContext = await verifyAdmin(req);
  if (!adminContext) {
    return res.status(403).json({ success: false, error: "Unauthorized: Admin privileges required." });
  }

  const { user: adminUser } = adminContext;
  const serverClient = getAdminClient();

  if (req.method === "GET") {
    try {
      const { data: policy, error } = await serverClient
        .from("system_policies")
        .select("*")
        .eq("key", "default")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return res.status(200).json({
        success: true,
        policy: policy || {
          key: "default",
          free_exercise_limit: 10,
          free_daily_quiz_limit: 2,
        },
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    const { freeExerciseLimit, freeDailyQuizLimit } = req.body || {};

    try {
      // Get before state for audit log
      const { data: beforeState } = await serverClient
        .from("system_policies")
        .select("*")
        .eq("key", "default")
        .maybeSingle();

      const payload = {
        key: "default",
        free_exercise_limit: Number(freeExerciseLimit) || 10,
        free_daily_quiz_limit: Number(freeDailyQuizLimit) || 2,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error } = await serverClient
        .from("system_policies")
        .upsert(payload, { onConflict: "key" })
        .select()
        .single();

      if (error) throw error;

      // Record Audit Log
      await AuditRepository.recordAuditLog({
        adminId: adminUser.id,
        actionType: "UPDATE_SYSTEM_POLICY",
        targetType: "SYSTEM_POLICY",
        targetId: "default",
        beforeState,
        afterState: updated,
        ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      });

      return res.status(200).json({ success: true, policy: updated });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
