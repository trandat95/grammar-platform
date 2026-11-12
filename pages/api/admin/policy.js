import { getAdminClient } from "../../../lib/supabase/server";
import { verifyAdminWithGuard, getClientIp } from "../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../repositories/audit.repository";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

/**
 * Milestone 2.4.7 & 2.4.9: Dynamic Quota Policies with Policy Versioning & Step-Up Auth
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const serverClient = getAdminClient(req);

  if (req.method === "GET") {
    const adminContext = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_policy_read" });
    if (!adminContext) return;

    try {
      const [{ data: policy, error }, { data: versions }] = await Promise.all([
        serverClient.from("system_policies").select("*").eq("key", "default").maybeSingle(),
        serverClient
          .from("system_policy_versions")
          .select("*")
          .eq("policy_key", "default")
          .order("policy_version", { ascending: false })
          .limit(10),
      ]);

      if (error && error.code !== "PGRST116") throw error;
      return res.status(200).json({
        success: true,
        policy: policy || {
          key: "default",
          policy_version: 1,
          free_exercise_limit: 10,
          free_daily_quiz_limit: 2,
          diagnostic_cooldown_days: 7,
          offline_sync_max_batch: 50,
        },
        versions: versions || [],
      });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/policy", err: e.message });
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    const adminContext = await verifyAdminWithGuard(req, res, {
      requireStepUp: true,
      rateLimitKeyPrefix: "admin_policy_mutate",
    });
    if (!adminContext) return;

    const { user: adminUser } = adminContext;
    const {
      freeExerciseLimit,
      freeDailyQuizLimit,
      diagnosticCooldownDays = 7,
      offlineSyncMaxBatch = 50,
      changeNote = "Cập nhật chính sách hạn mức từ Admin Panel",
    } = req.body || {};

    try {
      const { data: beforeState } = await serverClient
        .from("system_policies")
        .select("*")
        .eq("key", "default")
        .maybeSingle();

      const nextVersion = Number(beforeState?.policy_version || 1) + 1;

      const payload = {
        key: "default",
        policy_version: nextVersion,
        free_exercise_limit: Math.max(1, Number(freeExerciseLimit) || 10),
        free_daily_quiz_limit: Math.max(1, Number(freeDailyQuizLimit) || 2),
        diagnostic_cooldown_days: Math.max(0, Number(diagnosticCooldownDays) || 7),
        offline_sync_max_batch: Math.min(200, Math.max(10, Number(offlineSyncMaxBatch) || 50)),
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error } = await serverClient
        .from("system_policies")
        .upsert(payload, { onConflict: "key" })
        .select()
        .single();

      if (error) throw error;

      // Record immutable policy version snapshot
      await serverClient.from("system_policy_versions").insert({
        policy_key: "default",
        policy_version: nextVersion,
        free_exercise_limit: updated.free_exercise_limit,
        free_daily_quiz_limit: updated.free_daily_quiz_limit,
        diagnostic_cooldown_days: updated.diagnostic_cooldown_days,
        offline_sync_max_batch: updated.offline_sync_max_batch,
        changed_by: adminUser.id,
        change_note: changeNote,
      });

      await AuditRepository.recordAuditLog({
        adminId: adminUser.id,
        actionType: "UPDATE_SYSTEM_POLICY",
        targetType: "SYSTEM_POLICY",
        targetId: "default",
        beforeState,
        afterState: updated,
        ipAddress: getClientIp(req),
      });

      return res.status(200).json({ success: true, policy: updated });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/policy", err: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
