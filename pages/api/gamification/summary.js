import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { calculateLevelProgress } from "../../../lib/gamification/xp-level-engine";
import { DEFAULT_ACHIEVEMENT_CATALOG, formatAchievementsForClient } from "../../../lib/gamification/achievement-engine";
import {
  DEFAULT_TZ_OFFSET_MINUTES,
  getLocalDateKey,
  updateStreakState,
  recoverStreakWithFreeze,
} from "../../../lib/gamification/challenge-streak-engine";
import { ensureActiveChallengesForUser } from "../../../lib/gamification/gamification-processor";
import { invalidateLeaderboardServerCache } from "./leaderboard";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Warm Lambda 5-minute catalog cache (achievements + daily_challenges rarely change)
let catalogCache = { ts: 0, achievements: null, templates: null };
const CATALOG_TTL_MS = 5 * 60 * 1000;

async function getGamificationCatalog(serverClient) {
  if (catalogCache.achievements && catalogCache.templates && Date.now() - catalogCache.ts < CATALOG_TTL_MS) {
    return catalogCache;
  }
  const [{ data: achs }, { data: tpls }] = await Promise.all([
    serverClient.from("achievements").select("*").order("sort_order", { ascending: true }),
    serverClient.from("daily_challenges").select("*").eq("is_active", true),
  ]);
  catalogCache = {
    ts: Date.now(),
    achievements: achs?.length ? achs : DEFAULT_ACHIEVEMENT_CATALOG,
    templates: tpls || [],
  };
  return catalogCache;
}

/**
 * Milestone 2.10: Authoritative Gamification Summary, Challenges, Streak Recovery & Preferences API
 * Security: total_xp/level/achievements can NEVER be modified via POST body (Server Authoritative).
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const serverClient = getAdminClient(req);

  if (req.method === "GET") {
    const requestedUserId = req.query?.user_id;
    const tzOffset = Number(req.query?.tzOffsetMinutes || DEFAULT_TZ_OFFSET_MINUTES);

    try {
      // Single-hop parallelization for auth + cached catalog
      const [authUser, catalogData] = await Promise.all([
        req.headers?.authorization ? verifyServerSession(req) : Promise.resolve(null),
        getGamificationCatalog(serverClient),
      ]);

      if (req.headers?.authorization && !authUser) {
        return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token." });
      }

      const effectiveUserId = authUser?.id || requestedUserId;
      const catalog = catalogData.achievements;

      if (!effectiveUserId || !UUID_REGEX.test(effectiveUserId)) {
        res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
        return res.status(200).json({
          success: true,
          guestMode: true,
          xpState: calculateLevelProgress(50),
          streakState: {
            current_streak: 1,
            longest_streak: 1,
            freeze_tokens: 1,
            last_qualified_date: getLocalDateKey(new Date(), tzOffset),
            active_dates_30d: [getLocalDateKey(new Date(), tzOffset)],
            can_recover: false,
          },
          achievements: formatAchievementsForClient({ catalog, unlockedRows: [] }),
          challenges: (catalogData.templates || []).slice(0, 4).map((t) => ({
            id: t.id,
            status: "preview",
            current_progress: 0,
            target_value: t.target_value,
            challenge: t,
          })),
          recentTransactions: [],
          preferences: {
            leaderboard_visibility: "public",
            reduced_motion: false,
          },
        });
      }

      if (authUser && req.query?.user_id && authUser.id !== req.query.user_id) {
        return res.status(403).json({ success: false, error: "Forbidden: Cross-user gamification read denied." });
      }

      const now = new Date();
      const [
        { data: xpRow },
        { data: trackerRow },
        { data: streakRow },
        { data: unlockedRows },
        { data: txRows },
        challengeBundle,
      ] = await Promise.all([
        serverClient.from("user_xp").select("*").eq("user_id", effectiveUserId).maybeSingle(),
        serverClient.from("user_learning_trackers").select("xp, streak").eq("user_id", effectiveUserId).maybeSingle(),
        serverClient.from("user_streaks").select("*").eq("user_id", effectiveUserId).maybeSingle(),
        serverClient
          .from("user_achievements")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("unlocked_at", { ascending: false }),
        serverClient
          .from("xp_transactions")
          .select("id, source_type, xp_amount, question_id, reference_id, metadata, created_at")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false })
          .limit(20),
        ensureActiveChallengesForUser({ serverClient, userId: effectiveUserId, now, tzOffsetMinutes: tzOffset }),
      ]);

      const authoritativeXp = Math.max(Number(xpRow?.total_xp || 0), Number(trackerRow?.xp || 0));
      const xpState = calculateLevelProgress(authoritativeXp);
      const streakEvaluated = updateStreakState({
        streakRow: streakRow || { current_streak: trackerRow?.streak || 0, freeze_tokens: 1 },
        hasQualifiedActivity: false,
        now,
        tzOffsetMinutes: tzOffset,
      });

      return res.status(200).json({
        success: true,
        guestMode: false,
        xpState,
        streakState: streakEvaluated,
        achievements: formatAchievementsForClient({ catalog, unlockedRows: unlockedRows || [] }),
        unlockedCount: (unlockedRows || []).length,
        totalCatalogCount: catalog.length,
        challenges: challengeBundle.rows || [],
        recentTransactions: txRows || [],
        preferences: {
          leaderboard_visibility: xpRow?.leaderboard_visibility || "public",
          reduced_motion: Boolean(xpRow?.reduced_motion),
        },
      });
    } catch (err) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/gamification/summary", err: err.message });
    }
  }

  if (req.method === "POST") {
    const authUser = req.headers?.authorization ? await verifyServerSession(req) : null;
    if (req.headers?.authorization && !authUser) {
      return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token." });
    }
    const { action, user_id, leaderboard_visibility, reduced_motion, user_challenge_id, tzOffsetMinutes } =
      req.body || {};
    const resolvedUserId = authUser?.id || user_id;
    const tzOffset = Number(tzOffsetMinutes || DEFAULT_TZ_OFFSET_MINUTES);

    if (!resolvedUserId || !UUID_REGEX.test(resolvedUserId)) {
      return res.status(400).json({ success: false, error: "Valid authenticated user_id UUID required." });
    }
    if (authUser && user_id && authUser.id !== user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user mutation denied." });
    }

    try {
      if (action === "record_xp_activity") {
        const {
          idempotency_key,
          source_type = "learning_activity",
          xp_amount = 0,
          min_xp_floor = 0,
          streak = null,
          metadata = {},
        } = req.body || {};

        const { data: rpcRes, error: rpcErr } = await serverClient.rpc("award_user_gamification_xp", {
          p_user_id: resolvedUserId,
          p_idempotency_key: String(idempotency_key || `sync_${Date.now()}`),
          p_source_type: String(source_type || "learning_activity"),
          p_xp_amount: Math.max(0, Math.min(100, Math.round(Number(xp_amount || 0)))),
          p_min_xp_floor: Math.max(0, Math.min(50000, Math.round(Number(min_xp_floor || 0)))),
          p_streak: streak !== null && streak !== undefined ? Number(streak) : null,
          p_tz_offset: tzOffset,
          p_metadata: metadata || {},
        });

        if (rpcErr) {
          return res.status(400).json({ success: false, error: rpcErr.message });
        }

        invalidateLeaderboardServerCache();
        const totalXp = Number(rpcRes?.total_xp || 0);
        return res.status(200).json({
          success: true,
          xpState: calculateLevelProgress(totalXp),
          xpAdded: Number(rpcRes?.xp_added || 0),
          deduped: Boolean(rpcRes?.deduped),
          currentStreak: Number(rpcRes?.current_streak || 1),
        });
      }

      if (action === "update_preferences") {
        const allowedVis = ["public", "anonymous", "hidden"];
        const { data: existingXp } = await serverClient
          .from("user_xp")
          .select("*")
          .eq("user_id", resolvedUserId)
          .maybeSingle();

        const nextVis = allowedVis.includes(leaderboard_visibility)
          ? leaderboard_visibility
          : existingXp?.leaderboard_visibility || "public";
        const nextMotion =
          typeof reduced_motion === "boolean" ? reduced_motion : Boolean(existingXp?.reduced_motion);

        const baseLevel = calculateLevelProgress(existingXp?.total_xp || 0);
        const { data: updated, error: updErr } = await serverClient
          .from("user_xp")
          .upsert(
            {
              user_id: resolvedUserId,
              total_xp: existingXp ? existingXp.total_xp : 0,
              level: existingXp ? existingXp.level : baseLevel.level,
              title: existingXp ? existingXp.title : baseLevel.title,
              xp_into_level: existingXp ? existingXp.xp_into_level : baseLevel.xpIntoLevel,
              xp_for_next_level: existingXp ? existingXp.xp_for_next_level : baseLevel.xpForNextLevel,
              leaderboard_visibility: nextVis,
              reduced_motion: nextMotion,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .select("leaderboard_visibility, reduced_motion")
          .single();
        if (updErr) throw updErr;

        return res.status(200).json({ success: true, preferences: updated });
      }

      if (action === "recover_streak") {
        const { data: streakRow } = await serverClient
          .from("user_streaks")
          .select("*")
          .eq("user_id", resolvedUserId)
          .maybeSingle();

        const rec = recoverStreakWithFreeze({ streakRow, now: new Date(), tzOffsetMinutes: tzOffset });
        if (!rec.ok) {
          return res.status(400).json({ success: false, error: rec.reason });
        }

        const { data: savedStreak, error: stErr } = await serverClient
          .from("user_streaks")
          .upsert(rec.nextRow, { onConflict: "user_id" })
          .select()
          .single();
        if (stErr) throw stErr;

        return res.status(200).json({ success: true, streakState: savedStreak });
      }

      if (action === "swap_challenge") {
        if (!user_challenge_id) {
          return res.status(400).json({ success: false, error: "user_challenge_id required for swap." });
        }
        const { data: currentCh } = await serverClient
          .from("user_challenges")
          .select("*, challenge:daily_challenges(*)")
          .eq("id", user_challenge_id)
          .eq("user_id", resolvedUserId)
          .maybeSingle();

        if (!currentCh || currentCh.status !== "active") {
          return res.status(400).json({ success: false, error: "Only active challenges can be swapped." });
        }

        const periodType = currentCh.challenge?.period_type || "daily";
        const { data: existingInPeriod } = await serverClient
          .from("user_challenges")
          .select("challenge_id")
          .eq("user_id", resolvedUserId)
          .eq("period_key", currentCh.period_key);
        const usedTemplateIds = new Set((existingInPeriod || []).map((r) => r.challenge_id));

        const { data: candidates } = await serverClient
          .from("daily_challenges")
          .select("*")
          .eq("period_type", periodType)
          .eq("is_active", true);
        const alt = (candidates || []).find((c) => !usedTemplateIds.has(c.id));
        if (!alt) {
          return res.status(400).json({ success: false, error: "No alternative challenge available for this period." });
        }

        await serverClient.from("user_challenges").update({ status: "swapped" }).eq("id", currentCh.id);
        const { data: insertedAlt, error: insErr } = await serverClient
          .from("user_challenges")
          .insert({
            user_id: resolvedUserId,
            challenge_id: alt.id,
            period_key: currentCh.period_key,
            target_value: alt.target_value,
            status: "active",
          })
          .select("*, challenge:daily_challenges(*)")
          .single();
        if (insErr) throw insErr;

        return res.status(200).json({ success: true, newChallenge: insertedAlt });
      }

      return res.status(400).json({ success: false, error: `Unsupported action '${action}'.` });
    } catch (err) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/gamification/summary", err: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
