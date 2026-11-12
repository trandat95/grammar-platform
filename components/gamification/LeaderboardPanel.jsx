import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Skeleton } from "../design-system";
import { AVATAR_PATHS } from "../ui-2026/assetMap";

const BOARD_TABS = [
  { id: "weekly_xp", label: "XP Tuần", unit: "XP" },
  { id: "monthly_xp", label: "XP Tháng", unit: "XP" },
  { id: "all_time_xp", label: "Tổng XP", unit: "XP" },
  { id: "weekly_consistency", label: "Chăm chỉ", unit: "điểm" },
  { id: "grammar_mastery", label: "Mastery", unit: "%" },
];

const leaderboardCache = new Map();

export function invalidateLeaderboardCache() {
  leaderboardCache.clear();
}

export default function LeaderboardPanel({
  userId = null,
  authToken = null,
  isLight = false,
  compact = false,
  onOpenFullAchievements = null,
  refreshKey = 0,
}) {
  const T = getThemeTokens(isLight);
  const [boardType, setBoardType] = useState("weekly_xp");
  const [boardLimit, setBoardLimit] = useState(10);

  const cacheKey = `${boardType}_${boardLimit}_${userId || "guest"}`;
  const [leaderboard, setLeaderboard] = useState(
    () => leaderboardCache.get(cacheKey) || { entries: [], totalEntries: 0, currentUserEntry: null }
  );
  const [lbLoading, setLbLoading] = useState(() => !leaderboardCache.has(cacheKey));

  const tzOffsetMinutes = useMemo(() => {
    try {
      return -new Date().getTimezoneOffset();
    } catch {
      return 420;
    }
  }, []);

  const loadLeaderboard = useCallback(
    async (forceFresh = false) => {
      const key = `${boardType}_${boardLimit}_${userId || "guest"}`;
      if (!forceFresh && !leaderboardCache.has(key)) setLbLoading(true);
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const params = new URLSearchParams({
          board: boardType,
          limit: String(boardLimit),
          tzOffsetMinutes: String(tzOffsetMinutes),
        });
        if (userId) params.set("user_id", userId);
        if (forceFresh) params.set("t", String(Date.now()));
        const res = await fetch(`/api/gamification/leaderboard?${params.toString()}`, { headers });
        const json = await res.json();
        if (res.ok && json.success) {
          leaderboardCache.set(key, json);
          setLeaderboard(json);
        }
      } catch (err) {
        console.warn("Leaderboard load warning:", err.message);
      } finally {
        setLbLoading(false);
      }
    },
    [boardType, boardLimit, userId, authToken, tzOffsetMinutes]
  );

  useEffect(() => {
    loadLeaderboard(false);
  }, [loadLeaderboard, refreshKey]);

  useEffect(() => {
    const onRefresh = () => {
      leaderboardCache.clear();
      loadLeaderboard(true);
    };
    window.addEventListener("ge:leaderboard-refresh", onRefresh);
    return () => window.removeEventListener("ge:leaderboard-refresh", onRefresh);
  }, [loadLeaderboard]);

  const activeUnit = BOARD_TABS.find((b) => b.id === boardType)?.unit || "XP";

  const getRankDisplay = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div
      style={{
        backgroundColor: T.card,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: "14px",
        padding: compact ? "1.15rem 1.25rem" : "1.25rem",
        boxShadow: T.shadowSm,
      }}
    >
      {/* Header with Animated Trophy + LIVE Pulse + Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.6rem",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: compact ? "1.06rem" : "1rem", fontWeight: 800, color: T.textHeading, display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span className="ge-trophy-float" aria-hidden="true">🏆</span>
            <span>Bảng Xếp Hạng Thành Tích</span>
          </h2>
          <span className="ge-live-badge" title="Cập nhật thời gian thực">
            <span className="ge-live-dot" aria-hidden="true" />
            <span>LIVE</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
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
          {onOpenFullAchievements && (
            <Button
              size="sm"
              variant="ghost"
              isLight={isLight}
              onClick={onOpenFullAchievements}
              style={{ fontSize: "0.74rem", padding: "0.22rem 0.6rem", minHeight: "28px" }}
            >
              🏅 Huy hiệu &amp; Thành tích ➔
            </Button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }}>
        {BOARD_TABS.map((tb) => (
          <Button
            key={tb.id}
            size="sm"
            variant={boardType === tb.id ? "primary" : "ghost"}
            isLight={isLight}
            onClick={() => setBoardType(tb.id)}
            style={{ fontSize: "0.73rem", padding: "0.25rem 0.65rem", minHeight: "28px" }}
          >
            {tb.label}
          </Button>
        ))}
      </div>

      {/* Current User Highlight Banner */}
      {leaderboard.currentUserEntry && (
        <Alert tone="info" isLight={isLight} style={{ marginBottom: "0.8rem" }}>
          Thứ hạng của bạn: <strong>#{leaderboard.currentUserEntry.rank}</strong> • Điểm:{" "}
          <strong>{Number(leaderboard.currentUserEntry.score || 0).toLocaleString()} {activeUnit}</strong> • Độ chính xác:{" "}
          <strong>{leaderboard.currentUserEntry.tie_breaker_accuracy}%</strong>
        </Alert>
      )}

      {lbLoading ? (
        <Skeleton height="180px" width="100%" />
      ) : (leaderboard.entries || []).length === 0 ? (
        <div style={{ fontSize: "0.82rem", color: T.textMuted, padding: "1.25rem 0", textAlign: "center" }}>
          Chưa có dữ liệu xếp hạng trong chu kỳ này. Hãy làm bài tập ngay để ghi danh Top 1!
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxHeight: compact ? "380px" : "350px",
            overflowY: "auto",
            paddingRight: "2px",
          }}
        >
          {leaderboard.entries.map((row, idx) => {
            const isTop1 = row.rank === 1;
            const isTop3 = row.rank <= 3;
            const rowClasses = [
              "ge-lb-row",
              isTop1 ? "ge-lb-row-top1" : "",
              row.isCurrentUser ? "ge-lb-row-me" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const rowBg = row.isCurrentUser
              ? T.accentBg
              : isTop1
              ? T.warningBg
              : T.bgElevated;

            const rowBorder = row.isCurrentUser
              ? T.accentBorder
              : isTop1
              ? T.warningBorder
              : T.borderSubtle;

            return (
              <div
                key={`${row.rank}-${row.display_name}`}
                className={rowClasses}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: isTop1 ? "0.65rem 0.85rem" : "0.55rem 0.8rem",
                  borderRadius: "10px",
                  backgroundColor: rowBg,
                  border: `1px solid ${rowBorder}`,
                  borderLeft: isTop1
                    ? `4px solid ${T.warning}`
                    : row.isCurrentUser
                    ? `4px solid ${T.accent}`
                    : `1px solid ${rowBorder}`,
                  animationDelay: `${Math.min(idx, 9) * 45}ms`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      minWidth: "30px",
                      textAlign: "center",
                      fontSize: isTop3 ? "1.1rem" : "0.82rem",
                      fontWeight: 800,
                      color: isTop3 ? T.warning : T.textMuted,
                    }}
                  >
                    {getRankDisplay(row.rank)}
                  </div>

                  <img
                    src={AVATAR_PATHS[(row.rank - 1) % AVATAR_PATHS.length]}
                    alt={row.display_name}
                    width={isTop1 ? 34 : 30}
                    height={isTop1 ? 34 : 30}
                    style={{
                      width: isTop1 ? 34 : 30,
                      height: isTop1 ? 34 : 30,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `2px solid ${isTop1 ? T.warningBorder : row.isCurrentUser ? T.accentBorder : T.borderSubtle}`,
                      opacity: row.is_anonymous ? 0.55 : 1,
                      filter: row.is_anonymous ? "grayscale(100%)" : "none",
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: row.isCurrentUser || isTop1 ? 800 : 700,
                        color: T.textHeading,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.display_name}
                      </span>
                      {row.isCurrentUser && (
                        <Badge tone="accent" isLight={isLight}>
                          Bạn
                        </Badge>
                      )}
                      {isTop1 && !row.isCurrentUser && (
                        <Badge tone="warning" isLight={isLight}>
                          Dẫn đầu
                        </Badge>
                      )}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: T.textMuted }}>
                      Lv {row.level} • {row.title} • Acc {row.tie_breaker_accuracy}%
                    </div>
                  </div>
                </div>

                <Badge tone={isTop1 ? "warning" : row.isCurrentUser ? "accent" : "neutral"} isLight={isLight}>
                  {Number(row.score || 0).toLocaleString()} {activeUnit}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
