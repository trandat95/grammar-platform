import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { KNOWLEDGE_GRAPH } from "../../../lib/knowledge/knowledge-graph";
import { aggregateTwelveTopicMastery } from "../../../lib/learning/mastery-tracker";
import { processLearningGamificationEvent } from "../../../lib/gamification/gamification-processor";
import { attachCorrelationId, checkApiRateLimit, sendSafeServerError } from "../../../lib/api/security-guard";
import {
  ANALYTICS_SCHEMA_VERSION,
  sanitizeAnalyticsProperties,
  validateFtcSafePaywallPayload,
} from "../../../lib/learning/behavioral-engine";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Section 8D.1 & M4.7: Unified Learning & FTC-Safe Conversion Event Bus Endpoint
 * Records idempotent canonical telemetry events (PII-sanitized & deduplicated via idempotency_key).
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "learning_events", maxRequests: 120, correlationId });
  if (!rate.allowed) return;

  const serverClient = getAdminClient(req);
  const authUser = await verifyServerSession(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Unauthorized: Bearer session token required." });
  }

  const {
    user_id,
    events,
    event_type,
    idempotency_key,
    question_id,
    concept_id,
    is_correct,
    response_time_ms,
    device_id,
    payload,
    // Canonical M4.7 schema fields
    event_name,
    event_version,
    event_id,
    session_id,
    timestamp,
    platform,
    feature,
    properties,
    consent,
  } = req.body || {};

  if (user_id && authUser.id !== user_id) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user event write denied." });
  }
  const resolvedUserId = authUser.id;

  if (consent === false || properties?.consent === false) {
    return res.status(200).json({ success: true, processed: 0, deduped: 0, skipped_opt_out: true });
  }

  const eventList = Array.isArray(events)
    ? events
    : event_type && idempotency_key
    ? [{ event_type, idempotency_key, question_id, concept_id, is_correct, response_time_ms, device_id, payload }]
    : event_name && event_id
    ? [
        {
          event_type: String(event_name).toUpperCase(),
          event_name: String(event_name).toLowerCase(),
          event_version: event_version || ANALYTICS_SCHEMA_VERSION,
          idempotency_key: String(event_id),
          event_id: String(event_id),
          session_id: session_id || null,
          timestamp: timestamp || null,
          platform: platform || "desktop",
          feature: feature || "grammar_study",
          properties: properties || {},
          question_id: properties?.question_id || question_id || null,
          concept_id: properties?.concept_id || concept_id || null,
          is_correct: typeof properties?.result === "string" ? properties.result === "correct" : is_correct,
          response_time_ms: Number(properties?.duration_ms || response_time_ms || 0),
          device_id: platform || device_id || null,
          payload: payload || {},
        },
      ]
    : null;

  if (!resolvedUserId || !UUID_REGEX.test(resolvedUserId) || !Array.isArray(eventList)) {
    return res.status(400).json({ success: false, error: "Valid user_id UUID and events array required." });
  }

  try {
    let processed = 0;
    let deduped = 0;
    let rejectedFtc = 0;
    let latestGamification = null;

    for (const ev of eventList.slice(0, 50)) {
      const normalizedType = ev?.event_type || (ev?.event_name ? String(ev.event_name).toUpperCase() : null);
      const normalizedKey = ev?.idempotency_key || ev?.event_id;
      if (!normalizedKey || !normalizedType) continue;

      const ftcAudit = validateFtcSafePaywallPayload(ev);
      if (!ftcAudit.safe) {
        rejectedFtc += 1;
        return res.status(400).json({
          success: false,
          error: `FTC Anti-Dark-Pattern Violation rejected: ${ftcAudit.violations.join(", ")}`,
        });
      }

      const cleanProperties = sanitizeAnalyticsProperties(ev?.properties || ev?.payload?.properties || {});
      const cleanPayload = {
        ...sanitizeAnalyticsProperties(ev?.payload || {}),
        ...(ev?.event_name ? { event_name: String(ev.event_name).toLowerCase() } : {}),
        ...(ev?.session_id ? { session_id: String(ev.session_id).slice(0, 80) } : {}),
        ...(ev?.platform ? { platform: String(ev.platform).slice(0, 24) } : {}),
        ...(ev?.feature ? { feature: String(ev.feature).slice(0, 64) } : {}),
        ...(ev?.timestamp ? { timestamp: String(ev.timestamp).slice(0, 40) } : {}),
        event_version: ev?.event_version || ANALYTICS_SCHEMA_VERSION,
        ...(Object.keys(cleanProperties).length > 0 ? { properties: cleanProperties } : {}),
      };

      const { error } = await serverClient.from("learning_event_logs").insert({
        user_id: resolvedUserId,
        idempotency_key: String(normalizedKey),
        event_type: String(normalizedType),
        question_id: ev.question_id || cleanProperties.question_id || null,
        concept_id: ev.concept_id || cleanProperties.concept_id || null,
        is_correct: typeof ev.is_correct === "boolean" ? ev.is_correct : null,
        response_time_ms: Math.max(0, Math.round(Number(ev.response_time_ms || cleanProperties.duration_ms || 0))),
        device_id: ev.device_id || ev.platform || null,
        payload: cleanPayload,
      });
      if (error && (error.code === "23505" || error.message?.toLowerCase().includes("duplicate"))) {
        deduped += 1;
      } else if (!error) {
        processed += 1;
        if (normalizedType === "QUIZ_COMPLETED") {
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
            idempotencyKey: String(normalizedKey),
            twelveTopicMastery: twelveTopicSnapshot,
            quizPayload: cleanPayload,
          });
        }
      }
    }

    return res.status(200).json({ success: true, processed, deduped, rejectedFtc, gamification: latestGamification });
  } catch (err) {
    return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/learning/events", err: err.message });
  }
}
