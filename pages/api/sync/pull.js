import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

/**
 * Milestone 2.3.9: Multi-Device Delta Pull Endpoint (/api/sync/pull)
 * Fetches state changes committed from other devices since the caller's last cursor.
 */

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "sync_pull", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Unauthorized: Valid Bearer session required.", correlationId });
  }

  const queryUserId = req.query.userId || authUser.id;

  if (!isValidUuid(queryUserId)) {
    return res.status(400).json({ success: false, error: "Valid userId UUID required", correlationId });
  }

  if (authUser.id !== queryUserId) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user sync access denied.", correlationId });
  }

  const since = req.query.since || null;
  const serverClient = getAdminClient(req);

  try {
    const { data: tracker } = await serverClient
      .from("user_learning_trackers")
      .select("*")
      .eq("user_id", queryUserId)
      .maybeSingle();

    let mistakesQuery = serverClient
      .from("user_mistakes")
      .select("*")
      .eq("user_id", queryUserId)
      .order("updated_at", { ascending: false });
    if (since) mistakesQuery = mistakesQuery.gte("updated_at", since);
    const { data: mistakesRows } = await mistakesQuery;

    let vocabQuery = serverClient
      .from("user_vocabularies")
      .select("*")
      .eq("user_id", queryUserId)
      .order("updated_at", { ascending: false });
    if (since) vocabQuery = vocabQuery.gte("updated_at", since);
    const { data: vocabRows } = await vocabQuery;

    const { data: conceptProgress } = await serverClient
      .from("user_concept_progress")
      .select("*")
      .eq("user_id", queryUserId);

    const { data: policy } = await serverClient
      .from("system_policies")
      .select("*")
      .eq("key", "default")
      .maybeSingle();

    const activeMistakes = (mistakesRows || []).filter((m) => !m.deleted_at);
    const deletedMistakeQuestionIds = (mistakesRows || [])
      .filter((m) => Boolean(m.deleted_at))
      .map((m) => m.question_id);

    const activeVocab = (vocabRows || []).filter((v) => !v.deleted_at);
    const deletedVocabWords = (vocabRows || [])
      .filter((v) => Boolean(v.deleted_at))
      .map((v) => v.word);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      serverTime: new Date().toISOString(),
      tracker: tracker || null,
      mistakesDelta: activeMistakes,
      deletedMistakeQuestionIds,
      vocabDelta: activeVocab,
      deletedVocabWords,
      conceptProgress: conceptProgress || [],
      policy: policy || null,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/sync/pull",
      err,
      publicMessage: "Không thể đồng bộ dữ liệu từ máy chủ.",
    });
  }
}
