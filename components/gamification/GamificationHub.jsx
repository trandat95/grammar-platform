import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Progress, Select, Skeleton, Switch } from "../design-system";
import { AVATAR_PATHS, BANNER_PATHS, getBadgeTierIconPath, getLevelIconPath } from "../ui-2026/assetMap";

const BOARD_TABS = [
  { id: "weekly_xp", label: "XP Tuần", unit: "XP" },
  { id: "monthly_xp", label: "XP Tháng", unit: "XP" },
  { id: "all_time_xp", label: "Tổng XP", unit: "XP" },
  { id: "weekly_consistency", label: "Chăm chỉ", unit: "điểm" },
  { id: "grammar_mastery", label: "Mastery", unit: "%" },
];

// Client-side SWR cache: renders Gamification tab instantaneously (0ms) on revisit & after prefetch
const gamificationSummaryCache = new Map();
const gamificationLeaderboardCache = new Map();
const gamificationSummaryInflight = new Map();
const gamificationLbInflight = new Map();

export function prefetchGamificationData({ userId = null, authToken = null } = {}) {
  if (typeof window === "undefined") return Promise.resolve();
  const summaryKey = userId || "guest";
  const lbKey = `weekly_xp_10_${summaryKey}`;
  const tzOffsetMinutes = -new Date().getTimezoneOffset();
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const jobs = [];

  if (!gamificationSummaryCache.has(summaryKey) && !gamificationSummaryInflight.has(summaryKey)) {
    const params = new URLSearchParams({ tzOffsetMinutes: String(tzOffsetMinutes) });
    if (userId) params.set("user_id", userId);
    const p = fetch(`/api/gamification/summary?${params.toString()}`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) gamificationSummaryCache.set(summaryKey, json);
      })
      .catch(() => {})
      .finally(() => gamificationSummaryInflight.delete(summaryKey));
    gamificationSummaryInflight.set(summaryKey, p);
    jobs.push(p);
  }

  if (!gamificationLeaderboardCache.has(lbKey) && !gamificationLbInflight.has(lbKey)) {
    const params = new URLSearchParams({
      board: "weekly_xp",
      limit: "10",
      tzOffsetMinutes: String(tzOffsetMinutes),
    });
    if (userId) params.set("user_id", userId);
    const p = fetch(`/api/gamification/leaderboard?${params.toString()}`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) gamificationLeaderboardCache.set(lbKey, json);
      })
      .catch(() => {})
      .finally(() => gamificationLbInflight.delete(lbKey));
    gamificationLbInflight.set(lbKey, p);
    jobs.push(p);
  }

  return Promise.all(jobs);
}

const BADGE_CATEGORIES = [
  "ALL",
  "Learning Consistency",
  "Grammar Mastery",
  "Accuracy & Performance",
  "Learning Milestones",
];

function getTierTone(tier) {
  if (tier === "Diamond") return "accent";
  if (tier === "Gold") return "warning";
  if (tier === "Silver") return "success";
  return "neutral";
}

/**
 * Milestone 2.10: Comprehensive Intelligent Gamification Hub
 * - Server-authoritative XP & Level Progression Bar
 * - Daily & Weekly Challenges (with Swap Challenge)
 * - Timezone-Aware Streak Calendar & Freeze Recovery
 * - 4-Category Badge Gallery (Bronze/Silver/Gold/Diamond + Hidden)
 * - 5-Mode Competitive Leaderboard (Top 10 / Top 50, Privacy & Reduced Motion)
 */
export default function GamificationHub({
  userId = null,
  authToken = null,
  isLight = false,
  onPreferencesChange,
  onStartAdaptivePractice,
}) {
  const T = getThemeTokens(isLight);
  const summaryKey = userId || "guest";
  const initialSummary = gamificationSummaryCache.get(summaryKey) || null;
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(!initialSummary);
  const [boardType, setBoardType] = useState("weekly_xp");
  const [boardLimit, setBoardLimit] = useState(10);
  const lbKey = `${boardType}_${boardLimit}_${userId || "guest"}`;
  const initialLb = gamificationLeaderboardCache.get(lbKey) || { entries: [], totalEntries: 0, currentUserEntry: null };
  const [leaderboard, setLeaderboard] = useState(initialLb);
  const [lbLoading, setLbLoading] = useState(!gamificationLeaderboardCache.has(lbKey));
  const [badgeFilter, setBadgeFilter] = useState("ALL");
  const [actionNotice, setActionNotice] = useState(null);
  const onPrefsRef = useRef(onPreferencesChange);
  onPrefsRef.current = onPreferencesChange;

  const tzOffsetMinutes = useMemo(() => {
    try {
      return -new Date().getTimezoneOffset();
    } catch {
      return 420;
    }
  }, []);

  const loadSummary = useCallback(async () => {
    if (!gamificationSummaryCache.has(summaryKey)) setLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const params = new URLSearchParams({ tzOffsetMinutes: String(tzOffsetMinutes) });
      if (userId) params.set("user_id", userId);
      const res = await fetch(`/api/gamification/summary?${params.toString()}`, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        gamificationSummaryCache.set(summaryKey, json);
        setSummary(json);
        if (onPrefsRef.current && json.preferences) {
          onPrefsRef.current(json.preferences);
        }
      }
    } catch (err) {
      console.warn("Gamification summary load warning:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, authToken, tzOffsetMinutes, summaryKey]);

  const loadLeaderboard = useCallback(async () => {
    const key = `${boardType}_${boardLimit}_${userId || "guest"}`;
    if (!gamificationLeaderboardCache.has(key)) setLbLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const params = new URLSearchParams({
        board: boardType,
        limit: String(boardLimit),
        tzOffsetMinutes: String(tzOffsetMinutes),
      });
      if (userId) params.set("user_id", userId);
      const res = await fetch(`/api/gamification/leaderboard?${params.toString()}`, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        gamificationLeaderboardCache.set(key, json);
        setLeaderboard(json);
      }
    } catch (err) {
      console.warn("Leaderboard load warning:", err.message);
    } finally {
      setLbLoading(false);
    }
  }, [boardType, boardLimit, userId, authToken, tzOffsetMinutes]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleServerAction = async (payload) => {
    if (!userId) {
      setActionNotice({ tone: "warning", text: "Vui lòng đăng nhập để lưu thay đổi lên máy chủ." });
      return;
    }
    try {
      const res = await fetch("/api/gamification/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, tzOffsetMinutes, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionNotice({ tone: "danger", text: json.error || "Không thể thực hiện thao tác." });
        return;
      }
      setActionNotice({ tone: "success", text: "Đã đồng bộ thành công với máy chủ!" });
      await loadSummary();
      if (payload.action === "update_preferences") {
        await loadLeaderboard();
      }
    } catch (err) {
      setActionNotice({ tone: "danger", text: err.message });
    }
  };

  // Build 7-day calendar strip ending today
  const weekCalendar = useMemo(() => {
    const activeSet = new Set(summary?.streakState?.active_dates_30d || []);
    const list = [];
    const now = new Date();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      list.push({ iso, label: dayNames[d.getDay()], dayNum: d.getDate(), active: activeSet.has(iso) });
    }
    return list;
  }, [summary?.streakState?.active_dates_30d]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Skeleton height="120px" width="100%" />
        <Skeleton height="240px" width="100%" />
      </div>
    );
  }

  if (!summary) return null;

  const {
    guestMode,
    xpState = {},
    streakState = {},
    achievements = [],
    challenges = [],
    recentTransactions = [],
    preferences = {},
  } = summary;

  const filteredBadges =
    badgeFilter === "ALL" ? achievements : achievements.filter((b) => b.category === badgeFilter);
  const unlockedTotal = achievements.filter((b) => b.unlocked).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {guestMode && (
        <Alert tone="info" title="Chế độ Xem trước Khách (Guest Preview)" isLight={isLight}>
          Đăng nhập để hệ thống Server XP Engine ghi nhận điểm kinh nghiệm thực tế, mở khóa huy hiệu, lưu thử thách ngày UTC+7 và tranh hạng Leaderboard!
        </Alert>
      )}

      {actionNotice && (
        <Alert tone={actionNotice.tone} isLight={isLight}>
          {actionNotice.text}
        </Alert>
      )}

      {/* Community Gamification Editorial Banner */}
      <div
        className="ge-hero-banner-card"
        style={{
          padding: "1.2rem 1.4rem",
          border: `1px solid ${T.accentBorder}`,
        }}
      >
        <img
          src={BANNER_PATHS.gamification}
          alt="Cộng đồng học viên ăn mừng chuỗi Streak & Thành tích"
          className="ge-hero-banner-bg"
        />
        <div className="ge-hero-banner-scrim" />
        <div className="ge-hero-banner-content" style={{ maxWidth: "620px" }}>
          <Badge tone="warning" isLight={isLight}>
            Cộng đồng &amp; Bảng Xếp Hạng UTC+7
          </Badge>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.textHeading, marginTop: "0.45rem" }}>
            Duy trì Kỷ luật Hàng ngày — Chinh phục 20 Huy hiệu &amp; 6 Danh hiệu
          </div>
          <div style={{ fontSize: "0.8rem", color: T.textSecondary, marginTop: "0.25rem", lineHeight: 1.5 }}>
            Mọi XP đều được xác thực chống học vẹt từ Server Ledger và đồng bộ Streak Freeze theo múi giờ Việt Nam.
          </div>
        </div>
      </div>

      {/* Top Grid: Level Progression & Timezone Streak System */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        {/* Level & Authoritative XP Card */}
        <div
          style={{
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: "14px",
            padding: "1.25rem",
            boxShadow: T.shadowSm,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <img
                src={getLevelIconPath(xpState.level || 1)}
                alt={xpState.title || "Beginner"}
                width={40}
                height={40}
                style={{ width: 40, height: 40, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: T.textHeading }}>
                  Level {xpState.level || 1} — {xpState.title || "Beginner"}
                </div>
                <div style={{ fontSize: "0.78rem", color: T.textMuted }}>
                  Server-Authoritative XP Ledger (Chống cộng trùng & chống gian lận)
                </div>
              </div>
            </div>
            <Badge tone="accent" isLight={isLight}>
              {Number(xpState.totalXp || 0).toLocaleString()} XP
            </Badge>
          </div>

          <Progress
            value={xpState.xpIntoLevel || 0}
            max={xpState.xpForNextLevel || 100}
            label={`Tiến độ lên Level ${(xpState.level || 1) + 1} (${xpState.xpIntoLevel || 0}/${xpState.xpForNextLevel || 100} XP)`}
            tone="accent"
            isLight={isLight}
            height={10}
          />

          <div style={{ marginTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
              Còn <strong>{xpState.xpRemaining ?? 100} XP</strong> để thăng cấp tiếp theo
            </span>
            {onStartAdaptivePractice && (
              <Button size="sm" variant="primary" isLight={isLight} onClick={() => onStartAdaptivePractice({ mode: "adaptive", count: 20 })}>
                🎯 Kiếm XP (Đề 50/30/20)
              </Button>
            )}
          </div>
        </div>

        {/* Streak & Weekly Activity Calendar Card */}
        <div
          style={{
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: "14px",
            padding: "1.25rem",
            boxShadow: T.shadowSm,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: T.textHeading }}>
                🔥 Chuỗi Học Tập: {streakState.current_streak || 0} ngày
              </div>
              <div style={{ fontSize: "0.78rem", color: T.textMuted }}>
                Kỷ lục dài nhất: {streakState.longest_streak || 0} ngày • Freeze Tokens: {streakState.freeze_tokens ?? 1}
              </div>
            </div>
            {streakState.can_recover && (
              <Button size="sm" variant="success" isLight={isLight} onClick={() => handleServerAction({ action: "recover_streak" })}>
                ❄️ Khôi phục Chuỗi
              </Button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.4rem", marginTop: "0.5rem" }}>
            {weekCalendar.map((d) => (
              <div
                key={d.iso}
                style={{
                  backgroundColor: d.active ? T.successBg : T.bgElevated,
                  border: `1px solid ${d.active ? T.successBorder : T.borderSubtle}`,
                  borderRadius: "8px",
                  padding: "0.45rem 0.25rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: T.textMuted, fontWeight: 700 }}>{d.label}</div>
                <div style={{ fontSize: "0.86rem", fontWeight: 800, color: d.active ? T.success : T.textSecondary, marginTop: "0.15rem" }}>
                  {d.active ? "🔥" : d.dayNum}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.6rem" }}>
            Chỉ ghi nhận Streak khi hoàn thành hoạt động học tập thực thụ (reset 00:00 UTC+7).
          </div>
        </div>
      </div>

      {/* Daily & Weekly Challenges */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "14px",
          padding: "1.25rem",
          boxShadow: T.shadowSm,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
              ⚡ Thử Thách Ngày &amp; Tuần (Daily &amp; Weekly Missions)
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: T.textMuted }}>
              Hoàn thành mục tiêu để tự động nhận +50 XP (Ngày) hoặc +150 XP (Tuần) chống nhận thưởng kép.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.8rem" }}>
          {challenges
            .filter((c) => c.status !== "swapped")
            .map((ch) => {
              const tpl = ch.challenge || {};
              const isDone = ch.status === "claimed" || ch.status === "completed";
              return (
                <div
                  key={ch.id}
                  style={{
                    backgroundColor: T.bgElevated,
                    border: `1px solid ${isDone ? T.successBorder : T.borderSubtle}`,
                    borderRadius: "10px",
                    padding: "0.85rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.6rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem" }}>
                      <Badge tone={tpl.period_type === "weekly" ? "warning" : "accent"} isLight={isLight}>
                        {tpl.period_type === "weekly" ? "Mục tiêu Tuần" : "Thử thách Ngày"}
                      </Badge>
                      <Badge tone={isDone ? "success" : "neutral"} isLight={isLight}>
                        {isDone ? `✅ +${tpl.xp_reward || 50} XP` : `+${tpl.xp_reward || 50} XP`}
                      </Badge>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.86rem", color: T.textHeading, marginTop: "0.5rem" }}>
                      {tpl.title_vi || "Thử thách học tập"}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: T.textMuted, marginTop: "0.2rem" }}>
                      {tpl.description_vi}
                    </div>
                  </div>

                  <div>
                    <Progress
                      value={ch.current_progress || 0}
                      max={ch.target_value || tpl.target_value || 15}
                      label={`${ch.current_progress || 0} / ${ch.target_value || tpl.target_value || 15}`}
                      tone={isDone ? "success" : "accent"}
                      isLight={isLight}
                      height={7}
                    />
                    {!guestMode && ch.status === "active" && tpl.period_type === "daily" && (
                      <div style={{ marginTop: "0.55rem", display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          isLight={isLight}
                          onClick={() => handleServerAction({ action: "swap_challenge", user_challenge_id: ch.id })}
                          style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", minHeight: "26px" }}
                        >
                          🔄 Đổi thử thách
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Achievement & Badge Collection Gallery */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "14px",
          padding: "1.25rem",
          boxShadow: T.shadowSm,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.9rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
              🏅 Bộ Sưu Tập Huy Hiệu ({unlockedTotal} / {achievements.length})
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: T.textMuted }}>
              4 hạng danh giá (Bronze / Silver / Gold / Diamond) kèm các Huy hiệu Bí ẩn tự động mở khóa.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {BADGE_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={badgeFilter === cat ? "primary" : "secondary"}
                isLight={isLight}
                onClick={() => setBadgeFilter(cat)}
                style={{ fontSize: "0.72rem", padding: "0.28rem 0.65rem", minHeight: "30px" }}
              >
                {cat === "ALL" ? "Tất cả" : cat}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(225px, 1fr))", gap: "0.75rem" }}>
          {filteredBadges.map((b) => (
            <div
              key={b.code}
              style={{
                backgroundColor: T.bgElevated,
                border: `1px solid ${b.unlocked ? T.successBorder : T.borderSubtle}`,
                borderRadius: "10px",
                padding: "0.8rem",
                opacity: b.unlocked ? 1 : 0.72,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                <img
                  src={getBadgeTierIconPath(b.tier, b.unlocked, b.is_hidden)}
                  alt={`${b.tier} badge`}
                  width={32}
                  height={32}
                  style={{ width: 32, height: 32 }}
                />
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <Badge tone={getTierTone(b.tier)} isLight={isLight}>
                    {b.tier}
                  </Badge>
                  {b.unlocked && (
                    <Badge tone="success" isLight={isLight}>
                      Đã mở
                    </Badge>
                  )}
                </div>
              </div>
              <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading }}>{b.title_vi}</div>
              <div style={{ fontSize: "0.73rem", color: T.textMuted, marginTop: "0.2rem", lineHeight: 1.4 }}>
                {b.description_vi}
              </div>
              <div style={{ fontSize: "0.7rem", color: T.accent, fontWeight: 700, marginTop: "0.45rem" }}>
                Thưởng: +{b.xp_bonus} XP
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Mode Leaderboard + Privacy & Motion Preferences + Reward History */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
        {/* Leaderboard */}
        <div
          style={{
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: "14px",
            padding: "1.25rem",
            boxShadow: T.shadowSm,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>
              🏆 Bảng Xếp Hạng (Leaderboard)
            </h2>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {[10, 50].map((lim) => (
                <Button
                  key={lim}
                  size="sm"
                  variant={boardLimit === lim ? "primary" : "secondary"}
                  isLight={isLight}
                  onClick={() => setBoardLimit(lim)}
                  style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", minHeight: "28px" }}
                >
                  Top {lim}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }}>
            {BOARD_TABS.map((tb) => (
              <Button
                key={tb.id}
                size="sm"
                variant={boardType === tb.id ? "primary" : "ghost"}
                isLight={isLight}
                onClick={() => setBoardType(tb.id)}
                style={{ fontSize: "0.73rem", padding: "0.25rem 0.6rem", minHeight: "28px" }}
              >
                {tb.label}
              </Button>
            ))}
          </div>

          {leaderboard.currentUserEntry && (
            <Alert tone="info" isLight={isLight} style={{ marginBottom: "0.75rem" }}>
              Thứ hạng của bạn: <strong>#{leaderboard.currentUserEntry.rank}</strong> • Điểm:{" "}
              <strong>{leaderboard.currentUserEntry.score}</strong> • Accuracy Tie-break:{" "}
              <strong>{leaderboard.currentUserEntry.tie_breaker_accuracy}%</strong>
            </Alert>
          )}

          {lbLoading ? (
            <Skeleton height="160px" width="100%" />
          ) : (leaderboard.entries || []).length === 0 ? (
            <div style={{ fontSize: "0.82rem", color: T.textMuted, padding: "1rem 0", textAlign: "center" }}>
              Chưa có dữ liệu xếp hạng trong chu kỳ này.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", maxHeight: "340px", overflowY: "auto" }}>
              {leaderboard.entries.map((row) => (
                <div
                  key={`${row.rank}-${row.display_name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    backgroundColor: row.isCurrentUser ? T.accentBg : T.bgElevated,
                    border: `1px solid ${row.isCurrentUser ? T.accentBorder : T.borderSubtle}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <strong style={{ minWidth: "28px", color: row.rank <= 3 ? T.warning : T.textMuted }}>
                      #{row.rank}
                    </strong>
                    <img
                      src={AVATAR_PATHS[(row.rank - 1) % AVATAR_PATHS.length]}
                      alt={row.display_name}
                      width={28}
                      height={28}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `1px solid ${T.borderSubtle}`,
                        opacity: row.is_anonymous ? 0.55 : 1,
                        filter: row.is_anonymous ? "grayscale(100%)" : "none",
                      }}
                    />
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: T.textHeading }}>
                        {row.display_name} {row.isCurrentUser ? "(Bạn)" : ""}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: T.textMuted }}>
                        Lv {row.level} • {row.title} • Acc {row.tie_breaker_accuracy}%
                      </div>
                    </div>
                  </div>
                  <Badge tone="accent" isLight={isLight}>
                    {row.score} {BOARD_TABS.find((b) => b.id === boardType)?.unit || "XP"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy, Accessibility Settings & Reward Ledger */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              backgroundColor: T.card,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: T.shadowSm,
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>
              ⚙️ Quyền riêng tư &amp; Hiệu ứng (Privacy &amp; Accessibility)
            </h2>

            <Select
              label="Hiển thị trên Bảng xếp hạng:"
              isLight={isLight}
              value={preferences.leaderboard_visibility || "public"}
              onChange={(e) =>
                handleServerAction({
                  action: "update_preferences",
                  leaderboard_visibility: e.target.value,
                })
              }
              options={[
                { value: "public", label: "Công khai (Hiển thị tên học viên)" },
                { value: "anonymous", label: "Ẩn danh (Hiển thị mã Học viên Ẩn danh)" },
                { value: "hidden", label: "Tắt tham gia Bảng xếp hạng" },
              ]}
            />

            <Switch
              label="Tắt hiệu ứng ăn mừng chuyển động mạnh (Reduced Motion)"
              isLight={isLight}
              checked={Boolean(preferences.reduced_motion)}
              onChange={(nextVal) =>
                handleServerAction({
                  action: "update_preferences",
                  reduced_motion: nextVal,
                })
              }
            />
          </div>

          <div
            style={{
              backgroundColor: T.card,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: T.shadowSm,
            }}
          >
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>
              📜 Lịch sử Giao dịch XP (Reward History)
            </h2>
            {recentTransactions.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: T.textMuted }}>
                Chưa có giao dịch XP nào được ghi nhận trên máy chủ. Hãy làm bài tập hoặc Quiz để nhận thưởng!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "215px", overflowY: "auto" }}>
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "8px",
                      backgroundColor: T.bgElevated,
                      border: `1px solid ${T.borderSubtle}`,
                      fontSize: "0.78rem",
                    }}
                  >
                    <div>
                      <strong style={{ color: T.textHeading }}>{tx.source_type}</strong>
                      <div style={{ fontSize: "0.68rem", color: T.textMuted }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleString("vi-VN") : ""}
                      </div>
                    </div>
                    <Badge tone="success" isLight={isLight}>
                      +{tx.xp_amount} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
