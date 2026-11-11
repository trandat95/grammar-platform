/**
 * Section 8D.1 & Milestone 2.10: Unified Gamification Event Processor
 * Runs strictly server-side after Milestone 2.9 validation to guarantee anti-cheat integrity.
 */

import { XP_REWARDS, calculateLevelProgress, evaluateQuestionXpEligibility } from "./xp-level-engine";
import { evaluateUnlockableAchievements } from "./achievement-engine";
import {
  DEFAULT_TZ_OFFSET_MINUTES,
  getLocalDateKey,
  getLocalWeekKey,
  getLocalHour,
  updateStreakState,
  computeChallengeProgressUpdate,
} from "./challenge-streak-engine";

/**
 * Inserts an idempotent XP transaction and returns true if freshly recorded (false if deduped).
 */
async function recordIdempotentXpTx({
  serverClient,
  userId,
  idempotencyKey,
  sourceType,
  xpAmount,
  questionId = null,
  referenceId = null,
  metadata = {},
}) {
  if (!xpAmount || xpAmount <= 0) return false;
  const { error } = await serverClient.from("xp_transactions").insert({
    user_id: userId,
    idempotency_key: String(idempotencyKey),
    source_type: String(sourceType),
    xp_amount: Math.max(0, Math.round(xpAmount)),
    question_id: questionId,
    reference_id: referenceId,
    metadata,
  });
  if (error) {
    if (error.code === "23505" || error.message?.toLowerCase().includes("duplicate")) {
      return false;
    }
    throw error;
  }
  return true;
}

/**
 * Ensures the user has active daily & weekly challenges materialized for current timezone periods.
 */
export async function ensureActiveChallengesForUser({
  serverClient,
  userId,
  now = new Date(),
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
}) {
  const dailyPeriodKey = getLocalDateKey(now, tzOffsetMinutes);
  const weeklyPeriodKey = getLocalWeekKey(now, tzOffsetMinutes);

  const [{ data: templates }, { data: existingRows }] = await Promise.all([
    serverClient.from("daily_challenges").select("*").eq("is_active", true),
    serverClient
      .from("user_challenges")
      .select("*, challenge:daily_challenges(*)")
      .eq("user_id", userId)
      .in("period_key", [dailyPeriodKey, weeklyPeriodKey]),
  ]);

  const activeTemplates = templates || [];
  let rows = existingRows || [];

  const hasDaily = rows.some((r) => r.period_key === dailyPeriodKey && r.status !== "swapped");
  const hasWeekly = rows.some((r) => r.period_key === weeklyPeriodKey);

  const toInsert = [];
  if (!hasDaily) {
    const dailies = activeTemplates.filter((t) => t.period_type === "daily").slice(0, 2);
    for (const d of dailies) {
      toInsert.push({
        user_id: userId,
        challenge_id: d.id,
        period_key: dailyPeriodKey,
        target_value: d.target_value,
        status: "active",
      });
    }
  }
  if (!hasWeekly) {
    const weeklies = activeTemplates.filter((t) => t.period_type === "weekly").slice(0, 2);
    for (const w of weeklies) {
      toInsert.push({
        user_id: userId,
        challenge_id: w.id,
        period_key: weeklyPeriodKey,
        target_value: w.target_value,
        status: "active",
      });
    }
  }

  if (toInsert.length > 0) {
    await serverClient
      .from("user_challenges")
      .upsert(toInsert, { onConflict: "user_id,challenge_id,period_key", ignoreDuplicates: true });

    const { data: refreshed } = await serverClient
      .from("user_challenges")
      .select("*, challenge:daily_challenges(*)")
      .eq("user_id", userId)
      .in("period_key", [dailyPeriodKey, weeklyPeriodKey]);
    rows = refreshed || rows;
  }

  return { dailyPeriodKey, weeklyPeriodKey, rows };
}

/**
 * Central Event Processor called by /api/learning/mastery (QUESTION_ANSWERED) and /api/learning/events (QUIZ_COMPLETED).
 */
export async function processLearningGamificationEvent({
  serverClient,
  userId,
  eventType = "QUESTION_ANSWERED",
  idempotencyKey = null,
  questionId = null,
  isCorrect = false,
  responseTimeMs = 0,
  existingSrCard = null,
  nextSrCard = null,
  masteryBeforeScore = 0,
  masteryAfter = null,
  twelveTopicMastery = [],
  quizPayload = null,
  now = new Date(),
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
}) {
  if (!serverClient || !userId) return null;

  const eventKey = idempotencyKey || `${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const todayKey = getLocalDateKey(now, tzOffsetMinutes);
  const weekKey = getLocalWeekKey(now, tzOffsetMinutes);
  const localHour = getLocalHour(now, tzOffsetMinutes);

  // Fetch current user gamification state in parallel
  const [{ data: existingXpRow }, { data: existingStreakRow }, { data: trackerRow }, { data: unlockedRows }] =
    await Promise.all([
      serverClient.from("user_xp").select("*").eq("user_id", userId).maybeSingle(),
      serverClient.from("user_streaks").select("*").eq("user_id", userId).maybeSingle(),
      serverClient.from("user_learning_trackers").select("xp, streak, quizzes_completed_today").eq("user_id", userId).maybeSingle(),
      serverClient.from("user_achievements").select("achievement_code").eq("user_id", userId),
    ]);

  // Seed legacy pre-M2.10 XP balance once via idempotency key so ledger SUM is always authoritative & race-safe
  if (!existingXpRow && Number(trackerRow?.xp || 0) > 0) {
    await recordIdempotentXpTx({
      serverClient,
      userId,
      idempotencyKey: "legacy_xp_seed_v1",
      sourceType: "LEGACY_SEED",
      xpAmount: Number(trackerRow.xp),
      metadata: { migratedFrom: "user_learning_trackers" },
    });
  }

  let awardedXp = 0;
  let xpReason = null;

  // 1. Evaluate & award Base XP atomically with idempotency_key
  if (eventType === "QUESTION_ANSWERED") {
    const elig = evaluateQuestionXpEligibility({ existingSrCard, isCorrect, now });
    if (elig.eligible && elig.totalXp > 0) {
      const inserted = await recordIdempotentXpTx({
        serverClient,
        userId,
        idempotencyKey: `q_${eventKey}`,
        sourceType: isCorrect ? "QUESTION_CORRECT" : "QUESTION_COMPLETED",
        xpAmount: elig.totalXp,
        questionId,
        metadata: { reason: elig.reason },
      });
      if (inserted) {
        awardedXp += elig.totalXp;
        xpReason = elig.reason;
      }
    } else {
      xpReason = elig.reason;
    }

    // Topic Master Bonus (+100 XP) first time a concept hits >= 90%
    if (Number(masteryAfter?.masteryScore || 0) >= 90 && Number(masteryBeforeScore || 0) < 90) {
      const topicBonusKey = `master_concept_${nextSrCard?.concept_id || questionId}`;
      const okBonus = await recordIdempotentXpTx({
        serverClient,
        userId,
        idempotencyKey: topicBonusKey,
        sourceType: "MASTER_TOPIC",
        xpAmount: XP_REWARDS.MASTER_TOPIC,
        referenceId: nextSrCard?.concept_id || null,
      });
      if (okBonus) awardedXp += XP_REWARDS.MASTER_TOPIC;
    }
  } else if (eventType === "QUIZ_COMPLETED" && quizPayload) {
    const totalQs = Number(quizPayload.total || 0);
    const pct = Number(quizPayload.percentage || 0);
    if (totalQs >= 5) {
      let quizXp = XP_REWARDS.QUIZ_COMPLETED;
      if (pct >= 90) quizXp += XP_REWARDS.QUIZ_HIGH_ACCURACY_BONUS;
      const insertedQuizXp = await recordIdempotentXpTx({
        serverClient,
        userId,
        idempotencyKey: `quiz_${eventKey}`,
        sourceType: pct >= 90 ? "QUIZ_HIGH_ACCURACY" : "QUIZ_COMPLETED",
        xpAmount: quizXp,
        metadata: { total: totalQs, percentage: pct, mode: quizPayload.mode || "standard" },
      });
      if (insertedQuizXp) {
        awardedXp += quizXp;
        xpReason = pct >= 90 ? "QUIZ_HIGH_ACCURACY" : "QUIZ_COMPLETED";
      }
    }
  }

  // 2. Timezone-aware Streak Update (qualifies only on genuine learning action)
  const prevLastDate = existingStreakRow?.last_qualified_date
    ? String(existingStreakRow.last_qualified_date).slice(0, 10)
    : null;
  const streakNext = updateStreakState({
    streakRow: existingStreakRow,
    hasQualifiedActivity: true,
    now,
    tzOffsetMinutes,
  });
  const isNewActiveDayToday = prevLastDate !== todayKey;

  await serverClient.from("user_streaks").upsert(
    {
      user_id: userId,
      current_streak: streakNext.current_streak,
      longest_streak: streakNext.longest_streak,
      last_qualified_date: streakNext.last_qualified_date,
      timezone_offset_minutes: tzOffsetMinutes,
      freeze_tokens: streakNext.freeze_tokens,
      recovery_used_count: streakNext.recovery_used_count || 0,
      active_dates_30d: streakNext.active_dates_30d,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  // 3. Advance Daily & Weekly Challenges (and auto-claim rewards cleanly without duplicates)
  const { rows: challengeRows } = await ensureActiveChallengesForUser({
    serverClient,
    userId,
    now,
    tzOffsetMinutes,
  });

  const isSrReview = Boolean(existingSrCard && existingSrCard.memory_state !== "New");
  const updatedChallenges = [];
  for (const chRow of challengeRows) {
    const resUpd = computeChallengeProgressUpdate({
      challengeTemplate: chRow.challenge,
      userChallengeRow: chRow,
      eventType,
      isCorrect,
      isSrReview,
      newActiveDayInWeek: isNewActiveDayToday,
    });
    if (resUpd.changed) {
      await serverClient
        .from("user_challenges")
        .update({
          current_progress: resUpd.row.current_progress,
          correct_in_period: resUpd.row.correct_in_period,
          attempts_in_period: resUpd.row.attempts_in_period,
          status: resUpd.row.status,
          claimed_at: resUpd.row.claimed_at,
          updated_at: resUpd.row.updated_at,
        })
        .eq("id", chRow.id);

      if (resUpd.completedNow) {
        const rewardXp = Number(chRow.challenge?.xp_reward || XP_REWARDS.DAILY_CHALLENGE);
        const periodTag = chRow.challenge?.period_type === "weekly" ? weekKey : todayKey;
        const okChallengeXp = await recordIdempotentXpTx({
          serverClient,
          userId,
          idempotencyKey: `challenge_${periodTag}_${chRow.challenge_id}`,
          sourceType: chRow.challenge?.period_type === "weekly" ? "WEEKLY_GOAL" : "DAILY_CHALLENGE",
          xpAmount: rewardXp,
          referenceId: chRow.challenge?.code || String(chRow.challenge_id),
        });
        if (okChallengeXp) awardedXp += rewardXp;
      }
      updatedChallenges.push({ ...chRow, ...resUpd.row });
    } else {
      updatedChallenges.push(chRow);
    }
  }

  // 4. Evaluate Unlockable Achievements (without duplicate inserts)
  const [
    { count: totalAnsweredCount },
    { count: srMasteredCount },
    { count: srRelearningResolved },
    { data: quizEvents },
    { data: catalogRows },
  ] = await Promise.all([
    serverClient.from("spaced_repetition_queue").select("id", { count: "exact", head: true }).eq("user_id", userId),
    serverClient
      .from("spaced_repetition_queue")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("memory_state", "Mastered"),
    serverClient
      .from("learning_event_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "QUESTION_ANSWERED")
      .eq("is_correct", true),
    serverClient
      .from("learning_event_logs")
      .select("payload")
      .eq("user_id", userId)
      .eq("event_type", "QUIZ_COMPLETED")
      .limit(120),
    serverClient.from("achievements").select("*").order("sort_order", { ascending: true }),
  ]);

  const quizLogs = quizEvents || [];
  const highAccuracyQuizzes = quizLogs.filter((q) => Number(q.payload?.percentage || 0) >= 90).length;
  const hasPerfectQuiz =
    (eventType === "QUIZ_COMPLETED" && Number(quizPayload?.percentage) === 100 && Number(quizPayload?.total || 0) >= 10) ||
    quizLogs.some((q) => Number(q.payload?.percentage) === 100 && Number(q.payload?.total || 0) >= 10);

  const newlyUnlockedRaw = evaluateUnlockableAchievements({
    catalog: catalogRows?.length ? catalogRows : undefined,
    alreadyUnlockedCodes: (unlockedRows || []).map((u) => u.achievement_code),
    stats: {
      totalAnswered: Math.max(1, totalAnsweredCount || 0),
      currentStreak: streakNext.current_streak,
      longestStreak: streakNext.longest_streak,
      isNightStudy: localHour >= 23 || localHour < 4,
      twelveTopicMastery,
      hasPerfectQuiz,
      highAccuracyQuizzes,
      errorsResolved: srRelearningResolved || 0,
      hasComebackTopic: Number(masteryBeforeScore || 0) < 50 && Number(masteryAfter?.masteryScore || 0) >= 75,
      fastConsecutiveCorrect: isCorrect && responseTimeMs > 0 && responseTimeMs <= 5000 ? Number(nextSrCard?.consecutive_correct || 0) : 0,
      quizzesCompleted: quizLogs.length,
      uniqueQuestionsCorrect: totalAnsweredCount || 0,
      srMasteredCount: srMasteredCount || 0,
    },
  });

  const unlockedAchievements = [];
  for (const badge of newlyUnlockedRaw) {
    const { error: insAchErr } = await serverClient.from("user_achievements").insert({
      user_id: userId,
      achievement_code: badge.code,
      title: badge.title_vi,
      description: badge.description_vi,
      icon: badge.icon,
      tier: badge.tier,
      category: badge.category,
      is_hidden: Boolean(badge.is_hidden),
      xp_bonus: Number(badge.xp_bonus || 0),
    });

    if (!insAchErr) {
      unlockedAchievements.push(badge);
      if (Number(badge.xp_bonus || 0) > 0) {
        const okAchXp = await recordIdempotentXpTx({
          serverClient,
          userId,
          idempotencyKey: `ach_${badge.code}`,
          sourceType: "ACHIEVEMENT_UNLOCK",
          xpAmount: Number(badge.xp_bonus),
          referenceId: badge.code,
        });
        if (okAchXp) awardedXp += Number(badge.xp_bonus);
      }
    }
  }

  // 5. Compute Authoritative Total XP from xp_transactions ledger (immune to concurrent lost updates)
  const { data: allTxRows } = await serverClient
    .from("xp_transactions")
    .select("xp_amount")
    .eq("user_id", userId);

  const ledgerTotalXp = (allTxRows || []).reduce((sum, row) => sum + Number(row.xp_amount || 0), 0);
  const newTotalXp = Math.max(0, ledgerTotalXp);
  const prevXpGuess = Math.max(0, newTotalXp - awardedXp);
  const prevLevelState = calculateLevelProgress(prevXpGuess);
  const nextLevelState = calculateLevelProgress(newTotalXp);
  const leveledUp = nextLevelState.level > prevLevelState.level;

  await serverClient.from("user_xp").upsert(
    {
      user_id: userId,
      total_xp: nextLevelState.totalXp,
      level: nextLevelState.level,
      title: nextLevelState.title,
      xp_into_level: nextLevelState.xpIntoLevel,
      xp_for_next_level: nextLevelState.xpForNextLevel,
      leaderboard_visibility: existingXpRow?.leaderboard_visibility || "public",
      reduced_motion: Boolean(existingXpRow?.reduced_motion),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  // Synchronize legacy user_learning_trackers.xp & streak cleanly
  if (trackerRow) {
    await serverClient
      .from("user_learning_trackers")
      .update({
        xp: nextLevelState.totalXp,
        streak: streakNext.current_streak,
        last_active_date: todayKey,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);
  }

  return {
    awardedXp,
    xpReason,
    levelState: nextLevelState,
    leveledUp,
    previousLevel: prevLevelState.level,
    streakState: streakNext,
    newlyUnlockedAchievements: unlockedAchievements,
    activeChallenges: updatedChallenges,
  };
}
