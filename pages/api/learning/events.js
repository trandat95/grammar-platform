import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { KNOWLEDGE_GRAPH } from "../../../lib/knowledge/knowledge-graph";
import { aggregateTwelveTopicMastery } from "../../../lib/learning/mastery-tracker";
import { processLearningGamificationEvent } from "../../../lib/gamification/gamification-processor";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Section 8D.1: Unified Learning Event Bus Endpoint
 * Records idempotent QUESTION_ANSWERED / QUIZ_COMPLETED events atomically cleanly avoiding duplicates.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  const serverClient = getAdminClient();
  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid Bearer session token." });
  }

  const { user_id, events, event_type, idempotency_key, question_id, concept_id, is_correct, response_time_ms, device_id, payload } =
    req.body || {};
  const resolvedUserId = authUser?.id || user_id;

  const eventList = Array.isArray(events)
    ? events
    : event_type && idempotency_key
    ? [{ event_type, idempotency_key, question_id, concept_id, is_correct, response_time_ms, device_id, payload }]
    : null;

  if (!resolvedUserId || !UUID_REGEX.test(resolvedUserId) || !Array.isArray(eventList)) {
    return res.status(400).json({ success: false, error: "Valid user_id UUID and events array required." });
  }
  if (authUser && user_id && authUser.id !== user_id) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user event write denied." });
  }

  try {
    let processed = 0;
    let deduped = 0;
    let latestGamification = null;

    for (const ev of eventList.slice(0, 50)) {
      if (!ev?.idempotency_key || !ev?.event_type) continue;
      const { error } = await serverClient.from("learning_event_logs").insert({
        user_id: resolvedUserId,
        idempotency_key: String(ev.idempotency_key),
        event_type: String(ev.event_type),
        question_id: ev.question_id || null,
        concept_id: ev.concept_id || null,
        is_correct: typeof ev.is_correct === "boolean" ? ev.is_correct : null,
        response_time_ms: Math.max(0, Math.round(Number(ev.response_time_ms || 0))),
        device_id: ev.device_id || null,
        payload: ev.payload || {},
      });
      if (error && (error.code === "23505" || error.message?.toLowerCase().includes("duplicate"))) {
        deduped += 1;
      } else if (!error) {
        processed += 1;
        if (ev.event_type === "QUIZ_COMPLETED") {
          const { data: progRows } = await serverClient
            .from("user_concept_progress")
            .select("*")
            .eq("user_id", resolvedUserId);
          const progMap = new Map((progRows || []).map((r) => [r.concept_id, r]));
          const twelveTopicSnapshot = aggregateTwelveTopicMastery(
            KNOWLEDGE_GRAPH.nodeList.map((n) => (progMap.get(n.id) ? { ...n, ...progMap.get(n.id) } : { ...n, attempts: 0, mastery_score: 0 }))
          );
          latestGamification = await processLearningGamificationEvent({
            serverClient,
            userId: resolvedUserId,
            eventType: "QUIZ_COMPLETED",
            idempotencyKey: String(ev.idempotency_key),
            twelveTopicMastery: twelveTopicSnapshot,
            quizPayload: ev.payload || {},
          });
        }
      }
    }

    return res.status(200).json({ success: true, processed, deduped, gamification: latestGamification });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
