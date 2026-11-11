import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BATCH_SIZE = 50;

/**
 * Milestone 2.3.6 & 2.3.9: Upgraded Resilient Batch Sync API
 * - Validates ownership & caps batches at 50 events
 * - Deduplicates repeated deliveries via public.sync_idempotency_logs (HTTP 200 deduped)
 * - Handles all 8 canonical SyncEvent types + legacy actions
 * - Applies Conflict Resolution Matrix (XP Delta, UTC Streak, Set Union, Tombstone Deletes)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, deviceId = null, items } = req.body || {};

  if (!userId || !UUID_REGEX.test(userId) || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid request payload: valid userId UUID and items array required" });
  }

  const authUser = await verifyServerSession(req);
  if (authUser && authUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden: Cross-user sync write denied" });
  }

  const boundedItems = items.slice(0, MAX_BATCH_SIZE);
  const supabaseClient = getAdminClient();

  try {
    // 1. Check idempotency keys already processed for this user
    const candidateKeys = boundedItems
      .map((i) => i.idempotency_key)
      .filter((k) => typeof k === "string" && k.length > 0);

    let alreadyProcessedSet = new Set();
    if (candidateKeys.length > 0) {
      const { data: existingKeys } = await supabaseClient
        .from("sync_idempotency_logs")
        .select("idempotency_key")
        .eq("user_id", userId)
        .in("idempotency_key", candidateKeys);
      alreadyProcessedSet = new Set((existingKeys || []).map((r) => r.idempotency_key));
    }

    const freshItems = boundedItems.filter(
      (item) => !item.idempotency_key || !alreadyProcessedSet.has(item.idempotency_key)
    );
    const dedupedCount = boundedItems.length - freshItems.length;

    // Fetch current tracker from database
    const { data: currentTracker } = await supabaseClient
      .from("user_learning_trackers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];
    const tracker = currentTracker || {
      user_id: userId,
      streak: 1,
      xp: 0,
      last_active_date: today,
      active_days: [today],
      completed_lessons: [],
      quizzes_completed_today: 0,
      version: 1,
    };

    if (freshItems.length === 0) {
      return res.status(200).json({
        success: true,
        deduped: true,
        processedCount: 0,
        dedupedCount,
        tracker,
        serverTime: new Date().toISOString(),
      });
    }

    let xpDelta = 0;
    const lessonsToAdd = new Set(tracker.completed_lessons || []);
    const mistakesToInsert = [];
    const mistakesToResolveIds = [];
    const quizAttemptsToInsert = [];
    const vocabToInsert = [];
    const vocabWordsToDelete = [];
    const idempotencyRows = [];
    const nowIso = new Date().toISOString();

    for (const item of freshItems) {
      const type = item.event_type || item.actionType || "SYNC_TRACKER";
      const payload = item.payload || {};

      if (item.idempotency_key) {
        idempotencyRows.push({
          user_id: userId,
          idempotency_key: item.idempotency_key,
          device_id: item.device_id || deviceId || null,
          event_type: type,
          client_timestamp: item.client_timestamp ? Number(item.client_timestamp) : null,
          processed_at: nowIso,
        });
      }

      switch (type) {
        case "XP_EARNED":
        case "INCREMENT_XP":
          xpDelta += Math.max(0, Number(payload.amount || 0));
          break;

        case "SYNC_TRACKER":
          if (payload.tracker) {
            const incomingXp = Number(payload.tracker.xp || 0);
            if (incomingXp > (tracker.xp || 0) + xpDelta) {
              xpDelta = incomingXp - (tracker.xp || 0);
            }
            const incomingLessons = payload.tracker.completedLessons || payload.tracker.completed_lessons;
            if (Array.isArray(incomingLessons)) {
              incomingLessons.forEach((lId) => lessonsToAdd.add(lId));
            }
          }
          break;

        case "LESSON_COMPLETED":
        case "COMPLETE_LESSON":
          if (payload.lessonId) {
            lessonsToAdd.add(payload.lessonId);
            xpDelta += Number(payload.xpReward || 25);
          }
          break;

        case "MISTAKE_RECORDED":
        case "RECORD_MISTAKE":
          if (payload.mistake) {
            mistakesToInsert.push({
              user_id: userId,
              question_id: String(payload.mistake.id || payload.mistake.question_id),
              chapter_title: payload.mistake.chapter_title || payload.mistake.topic_name || "Chưa phân loại",
              question_prompt: payload.mistake.question_prompt || payload.mistake.stem || "",
              user_wrong_answer: payload.mistake.user_wrong_answer || payload.mistake.userAnswer || "",
              correct_answer: Array.isArray(payload.mistake.correct_answer || payload.mistake.answers)
                ? (payload.mistake.correct_answer || payload.mistake.answers).join(" / ")
                : String(payload.mistake.correct_answer || payload.mistake.answers || ""),
              explanation:
                typeof payload.mistake.explanation === "string"
                  ? payload.mistake.explanation
                  : JSON.stringify(payload.mistake.explanation || {}),
              explanation_structured: payload.mistake.pedagogy || null,
              failed_at: nowIso,
              updated_at: nowIso,
              deleted_at: null,
            });
          }
          break;

        case "MISTAKE_RESOLVED":
          if (payload.questionId) {
            mistakesToResolveIds.push(String(payload.questionId));
          }
          break;

        case "QUIZ_SUBMITTED":
        case "RECORD_QUIZ":
          if (payload.quiz) {
            quizAttemptsToInsert.push({
              user_id: userId,
              topic_code: payload.quiz.topicCode || "all",
              score: Number(payload.quiz.score || 0),
              total_questions: Number(payload.quiz.totalQuestions || 50),
              time_spent_seconds: Number(payload.quiz.timeSpentSeconds || 0),
              incorrect_question_ids: payload.quiz.incorrectQuestionIds || [],
              created_at: nowIso,
            });
            xpDelta += Number(payload.quiz.score || 0) * 10;
          }
          break;

        case "VOCABULARY_SAVED":
        case "SAVE_VOCAB":
          if (payload.vocab?.word) {
            vocabToInsert.push({
              user_id: userId,
              word: String(payload.vocab.word),
              phonetic: payload.vocab.phonetic || "",
              vietnamese: payload.vocab.vietnamese || payload.vocab.meaning || "",
              part_of_speech: payload.vocab.part_of_speech || "",
              audio_url: payload.vocab.audio_url || "",
              added_at: nowIso,
              updated_at: nowIso,
              deleted_at: null,
            });
          }
          break;

        case "VOCABULARY_DELETED":
          if (payload.word) {
            vocabWordsToDelete.push(String(payload.word).toLowerCase());
          }
          break;

        case "DIAGNOSTIC_COMPLETED":
          xpDelta += Number(payload.xpReward || 50);
          break;

        default:
          break;
      }
    }

    // 2. Server-side Streak Calculation (UTC)
    let newStreak = tracker.streak || 1;
    if (tracker.last_active_date) {
      const last = new Date(tracker.last_active_date);
      const curr = new Date(today);
      const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    }

    const activeDaysSet = new Set(tracker.active_days || []);
    activeDaysSet.add(today);

    const updatedTrackerPayload = {
      user_id: userId,
      streak: newStreak,
      xp: (tracker.xp || 0) + xpDelta,
      last_active_date: today,
      active_days: Array.from(activeDaysSet),
      completed_lessons: Array.from(lessonsToAdd),
      version: (tracker.version || 1) + 1,
      updated_at: nowIso,
    };

    const { data: savedTracker, error: saveErr } = await supabaseClient
      .from("user_learning_trackers")
      .upsert(updatedTrackerPayload, { onConflict: "user_id" })
      .select()
      .single();

    if (saveErr) throw saveErr;

    // 3. Apply batched entities with Tombstone Precedence
    if (mistakesToInsert.length > 0) {
      await supabaseClient.from("user_mistakes").insert(mistakesToInsert);
    }

    if (mistakesToResolveIds.length > 0) {
      await supabaseClient
        .from("user_mistakes")
        .update({ is_mastered: true, updated_at: nowIso, deleted_at: nowIso })
        .eq("user_id", userId)
        .in("question_id", mistakesToResolveIds);
    }

    if (quizAttemptsToInsert.length > 0) {
      await supabaseClient.from("quiz_attempts").insert(quizAttemptsToInsert);
    }

    if (vocabToInsert.length > 0) {
      await supabaseClient.from("user_vocabularies").insert(vocabToInsert);
    }

    if (vocabWordsToDelete.length > 0) {
      await supabaseClient
        .from("user_vocabularies")
        .update({ deleted_at: nowIso, updated_at: nowIso })
        .eq("user_id", userId)
        .in("word", vocabWordsToDelete);
    }

    // 4. Persist idempotency logs to guarantee strict deduplication
    if (idempotencyRows.length > 0) {
      await supabaseClient
        .from("sync_idempotency_logs")
        .upsert(idempotencyRows, { onConflict: "user_id,idempotency_key", ignoreDuplicates: true });
    }

    return res.status(200).json({
      success: true,
      processedCount: freshItems.length,
      dedupedCount,
      tracker: savedTracker,
      serverTime: nowIso,
    });
  } catch (err) {
    console.error("Batch sync error:", err);
    return res.status(500).json({ error: "Failed to process batch sync", details: err.message });
  }
}
