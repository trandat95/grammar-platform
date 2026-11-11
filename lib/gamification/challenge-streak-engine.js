/**
 * Milestone 2.10.4 & 2.10.5: Timezone-Aware Streak & Daily/Weekly Challenge Engine
 * - Handles UTC+7 (420m) day boundaries and ISO weekly periods cleanly
 * - Streak qualifies ONLY on verified learning actions (never bare logins)
 * - Freeze token streak recovery prevents unfair loss on 1 missed day
 */

export const DEFAULT_TZ_OFFSET_MINUTES = 420; // UTC+7 Vietnam Standard Time

function shiftedDate(now = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) {
  return new Date(now.getTime() + tzOffsetMinutes * 60 * 1000);
}

export function getLocalDateKey(now = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) {
  const d = shiftedDate(now, tzOffsetMinutes);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getLocalHour(now = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) {
  return shiftedDate(now, tzOffsetMinutes).getUTCHours();
}

export function getLocalMonthKey(now = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) {
  return getLocalDateKey(now, tzOffsetMinutes).slice(0, 7);
}

export function getLocalWeekKey(now = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) {
  const d = shiftedDate(now, tzOffsetMinutes);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function diffCalendarDays(prevDateStr, currDateStr) {
  if (!prevDateStr || !currDateStr) return null;
  const prevMs = Date.parse(`${prevDateStr}T00:00:00Z`);
  const currMs = Date.parse(`${currDateStr}T00:00:00Z`);
  if (Number.isNaN(prevMs) || Number.isNaN(currMs)) return null;
  return Math.round((currMs - prevMs) / 86400000);
}

/**
 * Updates streak state on legitimate learning activity.
 * Prevents stacking multiple increments in a single calendar day.
 */
export function updateStreakState({
  streakRow = null,
  hasQualifiedActivity = false,
  now = new Date(),
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
} = {}) {
  const todayKey = getLocalDateKey(now, tzOffsetMinutes);
  const prevStreak = Number(streakRow?.current_streak || 0);
  const prevLongest = Number(streakRow?.longest_streak || 0);
  const lastDate = streakRow?.last_qualified_date ? String(streakRow.last_qualified_date).slice(0, 10) : null;
  const freezeTokens = Number(streakRow?.freeze_tokens ?? 1);
  const prevDates = Array.isArray(streakRow?.active_dates_30d) ? streakRow.active_dates_30d : [];

  if (!hasQualifiedActivity) {
    const gap = diffCalendarDays(lastDate, todayKey);
    return {
      current_streak: prevStreak,
      longest_streak: prevLongest,
      last_qualified_date: lastDate,
      freeze_tokens: freezeTokens,
      active_dates_30d: prevDates,
      incremented: false,
      can_recover: Boolean(lastDate && gap === 2 && freezeTokens > 0 && prevStreak > 0),
      milestone_reached: null,
    };
  }

  const nextDates = Array.from(new Set([...prevDates, todayKey])).sort().slice(-30);

  if (lastDate === todayKey) {
    const nextCurrent = Math.max(1, prevStreak);
    return {
      current_streak: nextCurrent,
      longest_streak: Math.max(prevLongest, nextCurrent),
      last_qualified_date: todayKey,
      freeze_tokens: freezeTokens,
      active_dates_30d: nextDates,
      incremented: false,
      can_recover: false,
      milestone_reached: null,
    };
  }

  const gap = diffCalendarDays(lastDate, todayKey);
  let nextStreak = 1;
  let usedAutoFreeze = false;
  let nextTokens = freezeTokens;

  if (gap === 1) {
    nextStreak = prevStreak + 1;
  } else if (gap === 2 && freezeTokens > 0 && prevStreak > 0) {
    // Automatic Streak Freeze protection saves the streak if 1 single day was missed
    nextStreak = prevStreak + 1;
    nextTokens = freezeTokens - 1;
    usedAutoFreeze = true;
  }

  const nextLongest = Math.max(prevLongest, nextStreak);
  const milestones = new Set([3, 7, 14, 30, 60, 100]);
  const milestoneReached = milestones.has(nextStreak) ? nextStreak : null;

  return {
    current_streak: nextStreak,
    longest_streak: nextLongest,
    last_qualified_date: todayKey,
    freeze_tokens: nextTokens,
    recovery_used_count: Number(streakRow?.recovery_used_count || 0) + (usedAutoFreeze ? 1 : 0),
    active_dates_30d: nextDates,
    incremented: true,
    used_freeze_token: usedAutoFreeze,
    can_recover: false,
    milestone_reached: milestoneReached,
  };
}

/**
 * Explicit user-triggered Streak Freeze recovery when missed exactly 1 day yesterday.
 */
export function recoverStreakWithFreeze({
  streakRow = null,
  now = new Date(),
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
} = {}) {
  if (!streakRow || Number(streakRow.freeze_tokens || 0) <= 0) {
    return { ok: false, reason: "NO_FREEZE_TOKENS" };
  }
  const todayKey = getLocalDateKey(now, tzOffsetMinutes);
  const lastDate = streakRow.last_qualified_date ? String(streakRow.last_qualified_date).slice(0, 10) : null;
  const gap = diffCalendarDays(lastDate, todayKey);

  if (gap !== 2) {
    return { ok: false, reason: "NOT_ELIGIBLE_FOR_RECOVERY" };
  }

  const yesterdayDate = new Date(Date.parse(`${todayKey}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  const nextDates = Array.from(new Set([...(streakRow.active_dates_30d || []), yesterdayDate])).sort().slice(-30);

  return {
    ok: true,
    nextRow: {
      ...streakRow,
      last_qualified_date: yesterdayDate,
      freeze_tokens: Number(streakRow.freeze_tokens || 1) - 1,
      recovery_used_count: Number(streakRow.recovery_used_count || 0) + 1,
      active_dates_30d: nextDates,
      updated_at: now.toISOString(),
    },
  };
}

/**
 * Computes incremental challenge progress cleanly across Daily & Weekly missions.
 */
export function computeChallengeProgressUpdate({
  challengeTemplate,
  userChallengeRow,
  eventType = "QUESTION_ANSWERED",
  isCorrect = false,
  isSrReview = false,
  newActiveDayInWeek = false,
} = {}) {
  const status = userChallengeRow?.status || "active";
  if (status === "claimed" || status === "swapped" || status === "completed") {
    return { changed: false, completedNow: false, row: userChallengeRow };
  }

  const target = Number(userChallengeRow?.target_value || challengeTemplate?.target_value || 15);
  let nextProgress = Number(userChallengeRow?.current_progress || 0);
  let nextCorrect = Number(userChallengeRow?.correct_in_period || 0);
  let nextAttempts = Number(userChallengeRow?.attempts_in_period || 0);

  const cType = challengeTemplate?.challenge_type;

  if (eventType === "QUESTION_ANSWERED") {
    nextAttempts += 1;
    if (isCorrect) nextCorrect += 1;

    if (cType === "questions_count" || cType === "accuracy_threshold") {
      nextProgress += 1;
    } else if (cType === "sr_reviews" && isSrReview) {
      nextProgress += 1;
    }
  } else if (eventType === "QUIZ_COMPLETED") {
    if (cType === "quizzes_count") {
      nextProgress += 1;
    }
  }

  if (cType === "active_days" && newActiveDayInWeek) {
    nextProgress += 1;
  }

  const accPct = nextAttempts > 0 ? (nextCorrect / nextAttempts) * 100 : 100;
  const minAcc = Number(challengeTemplate?.accuracy_min || 0);
  const meetsProgress = nextProgress >= target;
  const meetsAccuracy = minAcc <= 0 || accPct >= minAcc;
  const completedNow = meetsProgress && meetsAccuracy;

  return {
    changed: true,
    completedNow,
    row: {
      ...userChallengeRow,
      current_progress: Math.min(target, nextProgress),
      correct_in_period: nextCorrect,
      attempts_in_period: nextAttempts,
      status: completedNow ? "claimed" : "active",
      claimed_at: completedNow ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
  };
}
