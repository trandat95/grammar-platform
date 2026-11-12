import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { calculateLevelProgress } from "../../../lib/gamification/xp-level-engine";
import {
  DEFAULT_TZ_OFFSET_MINUTES,
  getLocalDateKey,
  getLocalWeekKey,
  getLocalMonthKey,
} from "../../../lib/gamification/challenge-streak-engine";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

const ALLOWED_BOARDS = ["weekly_xp", "monthly_xp", "all_time_xp", "weekly_consistency", "grammar_mastery"];
const LEADERBOARD_CACHE_TTL_MS = 10 * 1000;
let leaderboardTablesCache = { data: null, expiresAt: 0 };
const xpWindowCache = new Map();

export function invalidateLeaderboardServerCache() {
  leaderboardTablesCache = { data: null, expiresAt: 0 };
  xpWindowCache.clear();
}

async function getLeaderboardBaseTables(serverClient) {
  const nowMs = Date.now();
  if (leaderboardTablesCache.data && nowMs < leaderboardTablesCache.expiresAt) {
    return leaderboardTablesCache.data;
  }
  const [{ data: profiles }, { data: xpRows }, { data: trackerRows }, { data: streakRows }, { data: progRows }] =
    await Promise.all([
      serverClient.from("profiles").select("id, full_name, email, status").eq("status", "ACTIVE").limit(500),
      serverClient.from("user_xp").select("*"),
      serverClient.from("user_learning_trackers").select("user_id, xp, streak, active_days"),
      serverClient.from("user_streaks").select("*"),
      serverClient.from("user_concept_progress").select("user_id, mastery_score, attempts, correct_attempts"),
    ]);
  const payload = { profiles, xpRows, trackerRows, streakRows, progRows };
  leaderboardTablesCache = { data: payload, expiresAt: nowMs + LEADERBOARD_CACHE_TTL_MS };
  return payload;
}

async function getXpWindowRows(serverClient, board, now) {
  if (board !== "weekly_xp" && board !== "monthly_xp") return [];
  const nowMs = Date.now();
  const cached = xpWindowCache.get(board);
  if (cached && nowMs < cached.expiresAt) {
    return cached.rows;
  }
  const lookbackDays = board === "monthly_xp" ? 30 : 7;
  const sinceIso = new Date(now.getTime() - lookbackDays * 86400000).toISOString();
  const { data: txWindow } = await serverClient
    .from("xp_transactions")
    .select("user_id, xp_amount")
    .gte("created_at", sinceIso);
  const rows = txWindow || [];
  xpWindowCache.set(board, { rows, expiresAt: nowMs + LEADERBOARD_CACHE_TTL_MS });
  return rows;
}

function formatDisplayName(profile, userId, visibility) {
  if (visibility === "anonymous") {
    return `Học viên Ẩn danh #${String(userId).slice(0, 4).toUpperCase()}`;
  }
  const rawName = profile?.full_name || profile?.email?.split("@")[0] || "Học viên Grammar";
  return String(rawName).slice(0, 32);
}

/**
 * Milestone 2.10.6: 5-Mode Competitive Leaderboard Endpoint
 * Uses SECURITY DEFINER RPC get_leaderboard_snapshot so per-user RLS never hides XP on public rankings.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const serverClient = getAdminClient(req);
  const board = ALLOWED_BOARDS.includes(req.query?.board) ? req.query.board : "weekly_xp";
  const limit = Math.min(50, Math.max(5, Number(req.query?.limit || 10)));
  const offset = Math.max(0, Number(req.query?.offset || 0));
  const tzOffset = Number(req.query?.tzOffsetMinutes || DEFAULT_TZ_OFFSET_MINUTES);

  const now = new Date();
  const periodKey =
    board === "monthly_xp"
      ? getLocalMonthKey(now, tzOffset)
      : board === "all_time_xp"
      ? "all_time"
      : getLocalWeekKey(now, tzOffset);

  try {
    const [authUser, rpcRes] = await Promise.all([
      req.headers?.authorization ? verifyServerSession(req) : Promise.resolve(null),
      serverClient.rpc("get_leaderboard_snapshot", { p_tz_offset: tzOffset }),
    ]);
    const requestedUserId = authUser?.id || req.query?.user_id || null;

    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

    let rankedRaw = [];

    if (!rpcRes?.error && Array.isArray(rpcRes.data)) {
      for (const row of rpcRes.data) {
        const uid = row.user_id;
        const vis = row.leaderboard_visibility || "public";
        if (vis === "hidden") continue;

        const totalXp = Number(row.total_xp || 0);
        const lvl = calculateLevelProgress(totalXp);
        const accuracy = Number(row.accuracy || 0);
        const avgMastery = Number(row.avg_mastery || 0);
        const currentStreak = Number(row.current_streak || 0);

        let score = totalXp;
        if (board === "weekly_xp") {
          score = Number(row.weekly_xp ?? totalXp);
        } else if (board === "monthly_xp") {
          score = Number(row.monthly_xp ?? totalXp);
        } else if (board === "weekly_consistency") {
          score = currentStreak * 10 + Number(row.active_days_7d || 0);
        } else if (board === "grammar_mastery") {
          score = avgMastery;
        }

        rankedRaw.push({
          board_type: board,
          period_key: periodKey,
          user_id: uid,
          display_name: row.display_name || "Học viên Grammar",
          is_anonymous: vis === "anonymous",
          score: Math.round(score * 100) / 100,
          tie_breaker_accuracy: Math.round(accuracy * 100) / 100,
          level: lvl.level,
          title: lvl.title,
          isCurrentUser: requestedUserId === uid,
        });
      }
    } else {
      const [baseTables, txWindow] = await Promise.all([
        getLeaderboardBaseTables(serverClient),
        getXpWindowRows(serverClient, board, now),
      ]);
      const { profiles, xpRows, trackerRows, streakRows, progRows } = baseTables;

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const xpMap = new Map((xpRows || []).map((x) => [x.user_id, x]));
      const trackerMap = new Map((trackerRows || []).map((t) => [t.user_id, t]));
      const streakMap = new Map((streakRows || []).map((s) => [s.user_id, s]));

      const masteryAgg = new Map();
      for (const pr of progRows || []) {
        const cur = masteryAgg.get(pr.user_id) || { sum: 0, count: 0, attempts: 0, correct: 0 };
        if (Number(pr.attempts || 0) > 0) {
          cur.sum += Number(pr.mastery_score || 0);
          cur.count += 1;
          cur.attempts += Number(pr.attempts || 0);
          cur.correct += Number(pr.correct_attempts || 0);
        }
        masteryAgg.set(pr.user_id, cur);
      }

      const windowXpMap = new Map();
      for (const tx of txWindow || []) {
        windowXpMap.set(tx.user_id, (windowXpMap.get(tx.user_id) || 0) + Number(tx.xp_amount || 0));
      }

      const candidateIds = new Set([...profileMap.keys(), ...xpMap.keys(), ...trackerMap.keys()]);

      for (const uid of candidateIds) {
        const xpObj = xpMap.get(uid);
        const vis = xpObj?.leaderboard_visibility || "public";
        if (vis === "hidden") continue;

        const prof = profileMap.get(uid);
        if (!prof) continue;

        const totalXp = Math.max(Number(xpObj?.total_xp || 0), Number(trackerMap.get(uid)?.xp || 0));
        const lvl = calculateLevelProgress(totalXp);
        const stObj = streakMap.get(uid);
        const trObj = trackerMap.get(uid);
        const mObj = masteryAgg.get(uid) || { sum: 0, count: 0, attempts: 0, correct: 0 };

        const accuracy = mObj.attempts > 0 ? Math.round((mObj.correct / mObj.attempts) * 10000) / 100 : 0;
        const avgMastery = mObj.count > 0 ? Math.round((mObj.sum / mObj.count) * 100) / 100 : 0;
        const currentStreak = Number(stObj?.current_streak ?? trObj?.streak ?? 0);

        let score = totalXp;
        if (board === "weekly_xp") {
          score = windowXpMap.has(uid) ? Math.max(windowXpMap.get(uid), totalXp) : totalXp;
        } else if (board === "monthly_xp") {
          score = windowXpMap.has(uid) ? Math.max(windowXpMap.get(uid), totalXp) : totalXp;
        } else if (board === "weekly_consistency") {
          const datesCount = Array.isArray(stObj?.active_dates_30d)
            ? stObj.active_dates_30d.filter((d) => {
                const cutoff = getLocalDateKey(new Date(now.getTime() - 7 * 86400000), tzOffset);
                return d >= cutoff;
              }).length
            : 0;
          score = currentStreak * 10 + datesCount;
        } else if (board === "grammar_mastery") {
          score = avgMastery;
        }

        rankedRaw.push({
          board_type: board,
          period_key: periodKey,
          user_id: uid,
          display_name: formatDisplayName(prof, uid, vis),
          is_anonymous: vis === "anonymous",
          score: Math.round(score * 100) / 100,
          tie_breaker_accuracy: accuracy,
          level: lvl.level,
          title: lvl.title,
          isCurrentUser: requestedUserId === uid,
        });
      }
    }

    // Deterministic tie-breaking: score DESC -> accuracy DESC -> level DESC -> user_id ASC
    rankedRaw.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.tie_breaker_accuracy !== a.tie_breaker_accuracy) return b.tie_breaker_accuracy - a.tie_breaker_accuracy;
      if (b.level !== a.level) return b.level - a.level;
      return String(a.user_id).localeCompare(String(b.user_id));
    });

    const positioned = rankedRaw.map((entry, idx) => ({
      ...entry,
      rank_position: idx + 1,
    }));

    const currentUserEntry = requestedUserId ? positioned.find((e) => e.user_id === requestedUserId) || null : null;
    const pagedEntries = positioned.slice(offset, offset + limit).map((e) => ({
      rank: e.rank_position,
      user_id: e.is_anonymous && !e.isCurrentUser ? undefined : e.user_id,
      display_name: e.display_name,
      is_anonymous: e.is_anonymous,
      score: e.score,
      tie_breaker_accuracy: e.tie_breaker_accuracy,
      level: e.level,
      title: e.title,
      isCurrentUser: e.isCurrentUser,
    }));

    return res.status(200).json({
      success: true,
      board,
      periodKey,
      limit,
      offset,
      totalEntries: positioned.length,
      entries: pagedEntries,
      currentUserEntry: currentUserEntry
        ? {
            rank: currentUserEntry.rank_position,
            score: currentUserEntry.score,
            tie_breaker_accuracy: currentUserEntry.tie_breaker_accuracy,
            level: currentUserEntry.level,
            title: currentUserEntry.title,
          }
        : null,
    });
  } catch (err) {
    return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/gamification/leaderboard", err: err.message });
  }
}
