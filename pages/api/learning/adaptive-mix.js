import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { KNOWLEDGE_GRAPH } from "../../../lib/knowledge/knowledge-graph";
import { aggregateTwelveTopicMastery, applyKnowledgeDecay } from "../../../lib/learning/mastery-tracker";
import { buildAdaptiveQuestionSet } from "../../../lib/learning/adaptive-question-engine";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Milestone 2.9.3: Dynamic Adaptive Question Mix Endpoint (50% Weak / 30% SR Review / 20% Challenge)
 * Supports GET (?user_id=...&count=20&mode=adaptive|manual_review&topicId=...) and POST.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const serverClient = getAdminClient();
  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token." });
  }

  const params = req.method === "GET" ? req.query : req.body || {};
  const count = Math.min(50, Math.max(5, Number(params.count || 20)));
  const mode = params.mode === "manual_review" ? "manual_review" : "adaptive";
  const targetTopicId = params.topicId || null;
  const completedQuestionIds = Array.isArray(params.completedQuestionIds) ? params.completedQuestionIds : [];
  const requestedUserId = authUser?.id || params.user_id || null;

  try {
    let twelveTopicMastery = [];
    let srCards = [];

    if (requestedUserId && UUID_REGEX.test(requestedUserId)) {
      const [{ data: progRows }, { data: srRows }] = await Promise.all([
        serverClient.from("user_concept_progress").select("*").eq("user_id", requestedUserId),
        serverClient.from("spaced_repetition_queue").select("*").eq("user_id", requestedUserId).limit(300),
      ]);

      srCards = srRows || [];
      const progMap = new Map((progRows || []).map((p) => [p.concept_id, p]));
      const now = new Date();
      const concepts = KNOWLEDGE_GRAPH.nodeList.map((n) => {
        const p = progMap.get(n.id);
        if (!p) return { ...n, attempts: 0, mastery_score: 0 };
        const dec = applyKnowledgeDecay(p.mastery_score, p.next_review_at, now);
        return { ...n, ...p, decayed_score: dec.decayedScore, decay_penalty: dec.decayPenalty };
      });
      twelveTopicMastery = aggregateTwelveTopicMastery(concepts);
    }

    const result = buildAdaptiveQuestionSet({
      count,
      twelveTopicMastery,
      srCards,
      completedQuestionIds,
      targetTopicId,
      mode,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/learning/adaptive-mix", err: err.message });
  }
}
