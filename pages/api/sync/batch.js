import { supabaseServer } from "../../../lib/supabase/server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, items } = req.body;

  if (!userId || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid request payload: userId and items array required" });
  }

  try {
    // 1. Fetch current tracker from database
    const { data: currentTracker } = await supabaseServer
      .from("user_learning_trackers")
      .select("*")
      .eq("user_id", userId)
      .single();

    let tracker = currentTracker || {
      user_id: userId,
      streak: 1,
      xp: 0,
      last_active_date: new Date().toISOString().split("T")[0],
      active_days: [new Date().toISOString().split("T")[0]],
      completed_lessons: [],
      quizzes_today: 0,
      version: 1,
    };

    let xpDelta = 0;
    const lessonsToAdd = new Set(tracker.completed_lessons || []);
    const mistakesToInsert = [];
    const quizAttemptsToInsert = [];
    const vocabToInsert = [];

    // 2. Process all batched queue items according to Conflict Resolution Rules
    for (const item of items) {
      const { actionType, payload } = item;

      switch (actionType) {
        case "INCREMENT_XP":
          xpDelta += Number(payload.amount || 0);
          break;

        case "SYNC_TRACKER":
          if (payload.tracker) {
            if (payload.tracker.xp > tracker.xp + xpDelta) {
              xpDelta = payload.tracker.xp - tracker.xp;
            }
            if (Array.isArray(payload.tracker.completedLessons || payload.tracker.completed_lessons)) {
              (payload.tracker.completedLessons || payload.tracker.completed_lessons).forEach((lId) => lessonsToAdd.add(lId));
            }
          }
          break;

        case "COMPLETE_LESSON":
          if (payload.lessonId) {
            lessonsToAdd.add(payload.lessonId);
            xpDelta += Number(payload.xpReward || 25);
          }
          break;

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
              explanation: typeof payload.mistake.explanation === "string" ? payload.mistake.explanation : JSON.stringify(payload.mistake.explanation || {}),
              explanation_structured: payload.mistake.pedagogy || null,
              failed_at: new Date().toISOString(),
            });
          }
          break;

        case "RECORD_QUIZ":
          if (payload.quiz) {
            quizAttemptsToInsert.push({
              user_id: userId,
              topic_code: payload.quiz.topicCode || "all",
              score: payload.quiz.score || 0,
              total_questions: payload.quiz.totalQuestions || 50,
              time_spent_seconds: payload.quiz.timeSpentSeconds || 0,
              incorrect_question_ids: payload.quiz.incorrectQuestionIds || [],
              created_at: new Date().toISOString(),
            });
            xpDelta += Number(payload.quiz.score || 0) * 10;
          }
          break;

        case "SAVE_VOCAB":
          if (payload.vocab) {
            vocabToInsert.push({
              user_id: userId,
              word: payload.vocab.word,
              phonetic: payload.vocab.phonetic || "",
              vietnamese: payload.vocab.vietnamese || payload.vocab.meaning || "",
              part_of_speech: payload.vocab.part_of_speech || "",
              audio_url: payload.vocab.audio_url || "",
              added_at: new Date().toISOString(),
            });
          }
          break;

        default:
          break;
      }
    }

    // 3. Server-side Streak Calculation
    const today = new Date().toISOString().split("T")[0];
    let newStreak = tracker.streak || 1;
    if (tracker.last_active_date) {
      const last = new Date(tracker.last_active_date);
      const curr = new Date(today);
      const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const activeDaysSet = new Set(tracker.active_days || []);
    activeDaysSet.add(today);

    // 4. Update Tracker with transactional increment
    const updatedTrackerPayload = {
      user_id: userId,
      streak: newStreak,
      xp: (tracker.xp || 0) + xpDelta,
      last_active_date: today,
      active_days: Array.from(activeDaysSet),
      completed_lessons: Array.from(lessonsToAdd),
      version: (tracker.version || 1) + 1,
      updated_at: new Date().toISOString(),
    };

    const { data: savedTracker, error: saveErr } = await supabaseServer
      .from("user_learning_trackers")
      .upsert(updatedTrackerPayload, { onConflict: "user_id" })
      .select()
      .single();

    if (saveErr) throw saveErr;

    // 5. Batch insert mistakes, quiz attempts, and vocabularies
    if (mistakesToInsert.length > 0) {
      await supabaseServer.from("user_mistakes").insert(mistakesToInsert);
    }

    if (quizAttemptsToInsert.length > 0) {
      await supabaseServer.from("quiz_attempts").insert(quizAttemptsToInsert);
    }

    if (vocabToInsert.length > 0) {
      await supabaseServer.from("user_vocabularies").insert(vocabToInsert);
    }

    return res.status(200).json({
      success: true,
      processedCount: items.length,
      tracker: savedTracker,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Batch sync error:", err);
    return res.status(500).json({ error: "Failed to process batch sync", details: err.message });
  }
}
