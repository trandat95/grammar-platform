import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Milestone 2.3.9: Multi-Device Delta Pull Endpoint (/api/sync/pull)
 * Fetches state changes committed from other devices since the caller's last cursor.
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authUser = await verifyServerSession(req);
  const queryUserId = req.query.userId;

  if (!queryUserId || !UUID_REGEX.test(queryUserId)) {
    return res.status(400).json({ success: false, error: "Valid userId UUID required" });
  }

  // Enforce ownership when authenticated Bearer session is present
  if (authUser && authUser.id !== queryUserId) {
    return res.status(403).json({ success: false, error: "Forbidden: Cross-user sync access denied." });
  }

  const since = req.query.since || null;
  const serverClient = getAdminClient();

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
    console.error("[Sync Pull Error]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
