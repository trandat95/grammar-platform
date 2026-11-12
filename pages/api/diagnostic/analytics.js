import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { analyzeDiagnosticRootCauses } from "../../../lib/diagnostic/knowledge.graph";
import { calculateRetentionMetrics } from "../../../lib/spaced-repetition/retention.tracker";
import {
  attachCorrelationId,
  checkApiRateLimit,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

/**
 * Milestone 2.8.4 & 2.8.9: Diagnostic Analytics & Multi-Attempt Growth Comparison API
 * GET /api/diagnostic/analytics?user_id=...
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET.", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "diag_analytics", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token.", correlationId });
  }

  if (authUser && req.query?.user_id && authUser.id !== req.query.user_id) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user analytics denied.", correlationId });
  }

  const serverClient = getAdminClient(req);
  const requestedUserId = authUser?.id || null;
  if (!requestedUserId) {
    return res.status(200).json({
      success: true,
      guestMode: true,
      correlationId,
      attempts: [],
      roadmapVersions: [],
      retentionMetrics: calculateRetentionMetrics({}),
      topicComparison: [],
    });
  }

  try {
    const [
      { data: attempts },
      { data: skillRows },
      { data: conceptRows },
      { data: srRows },
      { data: versionRows },
    ] = await Promise.all([
      serverClient
        .from("diagnostic_attempts")
        .select("*")
        .eq("user_id", requestedUserId)
        .eq("status", "COMPLETED")
        .order("completed_at", { ascending: true }),
      serverClient
        .from("diagnostic_skill_results")
        .select("*")
        .eq("user_id", requestedUserId),
      serverClient
        .from("user_concept_progress")
        .select("*")
        .eq("user_id", requestedUserId),
      serverClient
        .from("spaced_repetition_queue")
        .select("*")
        .eq("user_id", requestedUserId),
      serverClient
        .from("roadmap_versions")
        .select("*")
        .eq("user_id", requestedUserId)
        .order("version_number", { ascending: false })
        .limit(15),
    ]);

    const attemptList = attempts || [];
    const skills = skillRows || [];

    // Compute per-topic delta between first and latest attempt
    const topicComparison = [];
    if (attemptList.length >= 2) {
      const firstId = attemptList[0].id;
      const lastId = attemptList[attemptList.length - 1].id;
      const firstSkills = new Map(skills.filter((s) => s.attempt_id === firstId).map((s) => [s.topic_id, s]));
      const lastSkills = new Map(skills.filter((s) => s.attempt_id === lastId).map((s) => [s.topic_id, s]));

      for (const [topicId, latestSkill] of lastSkills.entries()) {
        const initialSkill = firstSkills.get(topicId);
        topicComparison.push({
          topic_id: topicId,
          topic_name: latestSkill.topic_name,
          initialAccuracy: Number(initialSkill?.accuracy ?? latestSkill.accuracy),
          latestAccuracy: Number(latestSkill.accuracy),
          delta: Math.round(Number(latestSkill.accuracy) - Number(initialSkill?.accuracy ?? latestSkill.accuracy)),
        });
      }
      topicComparison.sort((a, b) => b.delta - a.delta);
    }

    const retentionMetrics = calculateRetentionMetrics({
      conceptProgress: conceptRows || [],
      srCards: srRows || [],
      diagnosticAttempts: attemptList,
    });

    // Latest attempt detailed answers for Root Cause summary
    let rootCauseSummary = null;
    if (attemptList.length > 0) {
      const latestId = attemptList[attemptList.length - 1].id;
      const latestSkills = skills.filter((s) => s.attempt_id === latestId);
      const { data: latestAns } = await serverClient
        .from("diagnostic_answers")
        .select("*")
        .eq("attempt_id", latestId);
      const formattedAns = (latestAns || []).map((a) => ({
        is_correct: a.is_correct,
        topic: a.question_snapshot?.topic || "tenses",
        topic_vi: a.question_snapshot?.topic || "",
        difficulty: a.question_snapshot?.difficulty || "medium",
        time_spent_seconds: a.time_spent_seconds,
      }));
      rootCauseSummary = analyzeDiagnosticRootCauses(formattedAns, latestSkills);
    }

    return res.status(200).json({
      success: true,
      guestMode: false,
      attempts: attemptList.map((a) => ({
        id: a.id,
        total_score: Number(a.total_score || 0),
        correct_answers: a.correct_answers,
        total_questions: a.total_questions,
        estimated_level: a.estimated_level,
        completed_at: a.completed_at,
      })),
      topicComparison,
      roadmapVersions: versionRows || [],
      retentionMetrics,
      rootCauseSummary,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/diagnostic/analytics",
      err,
      publicMessage: "Không thể tải dữ liệu phân tích chẩn đoán.",
    });
  }
}
