import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { assertVipEntitlement } from "../../../lib/monetization/entitlement-engine";
import { KNOWLEDGE_GRAPH } from "../../../lib/knowledge/knowledge-graph";
import { aggregateTwelveTopicMastery } from "../../../lib/learning/mastery-tracker";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Milestone 2.12.3: Protected VIP Mastery & Diagnostic Export Endpoint
 * Enforces strictly server-side VIP/ADMIN access (HTTP 403 for FREE / unauthenticated users).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const serverClient = getAdminClient();
  const authUser = await verifyServerSession(req);
  const requestedUserId = authUser?.id || req.query?.user_id || null;

  if (!requestedUserId || !UUID_REGEX.test(requestedUserId)) {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Vui lòng đăng nhập tài khoản VIP để xuất Báo cáo Năng lực Chuyên sâu.",
    });
  }

  const guard = await assertVipEntitlement({
    serverClient,
    userId: requestedUserId,
    featureKey: "pdf_exam_export",
  });

  if (!guard.allowed) {
    return res.status(403).json({
      success: false,
      error: guard.error,
      effectiveRole: guard.entitlement.effectiveRole,
    });
  }

  try {
    const [{ data: profile }, { data: xpRow }, { data: streakRow }, { data: progRows }] = await Promise.all([
      serverClient.from("profiles").select("full_name, email, role").eq("id", requestedUserId).maybeSingle(),
      serverClient.from("user_xp").select("total_xp, level, title").eq("user_id", requestedUserId).maybeSingle(),
      serverClient.from("user_streaks").select("current_streak, longest_streak").eq("user_id", requestedUserId).maybeSingle(),
      serverClient.from("user_concept_progress").select("*").eq("user_id", requestedUserId),
    ]);

    const progMap = new Map((progRows || []).map((p) => [p.concept_id, p]));
    const twelveTopics = aggregateTwelveTopicMastery(
      KNOWLEDGE_GRAPH.nodeList.map((n) => (progMap.get(n.id) ? { ...n, ...progMap.get(n.id) } : { ...n, attempts: 0, mastery_score: 0 }))
    );

    const lines = [
      "==============================================================",
      "GRAMMAR PRO PLATFORM - BAO CAO NANG LUC NGU PHAP CA NHAN (VIP)",
      "==============================================================",
      `Hoc vien: ${profile?.full_name || profile?.email || requestedUserId}`,
      `Cap do: Level ${xpRow?.level || 1} (${xpRow?.title || "Beginner"}) | Tong XP: ${xpRow?.total_xp || 0}`,
      `Chuoi hoc tap: ${streakRow?.current_streak || 0} ngay (Ky luc: ${streakRow?.longest_streak || 0} ngay)`,
      `Ngay xuat: ${new Date().toISOString()}`,
      "",
      "CHI TIET THANH THAO 12 CHUYEN DE NGU PHAP:",
      ...twelveTopics.map(
        (t) =>
          `- Chuong ${String(t.chapter_number).padStart(2, "0")}: ${t.chapter_title_vi} | Mastery: ${t.mastery_score}% (${t.tier}) | Accuracy: ${t.accuracy}%`
      ),
    ];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="grammar_mastery_report_${requestedUserId.slice(0, 8)}.txt"`);
    return res.status(200).send(lines.join("\n"));
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
