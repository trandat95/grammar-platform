import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Skeleton } from "../design-system";
import { AVATAR_PATHS, OBJECT_3D_PATHS } from "../ui-2026/assetMap";
import KitIcon from "../ui-2026/KitIcon";

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
    if (rank === 1) return <KitIcon name="rank-1" size={20} />;
    if (rank === 2) return <KitIcon name="rank-2" size={20} />;
    if (rank === 3) return <KitIcon name="rank-3" size={20} />;
    return `#${rank}`;
  };

  return (
    <div className="pg-lb-card">
      {/* Header with 3D Trophy + LIVE Pulse + Controls */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <img
            src={OBJECT_3D_PATHS.trophyGold}
            alt="Cúp bảng xếp hạng 3D"
            width={34}
            height={34}
            loading="lazy"
            style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
          />
          <h2 style={{ margin: 0, fontSize: compact ? "1.06rem" : "1rem", fontWeight: 800, color: T.textHeading }}>
            Bảng Xếp Hạng
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
              icon="medal"
              isLight={isLight}
              onClick={onOpenFullAchievements}
              style={{ fontSize: "0.74rem", padding: "0.28rem 0.65rem", minHeight: "36px" }}
            >
              Thành tích →
            </Button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs — Single-Row Frosted Pill Rail (No Orphan Wrap!) */}
      <div className="pg-lb-tabs" role="tablist" aria-label="Chế độ Bảng xếp hạng">
        {BOARD_TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={boardType === tb.id}
            onClick={() => setBoardType(tb.id)}
            className={`pg-lb-tab-btn ds-focusable ${boardType === tb.id ? "is-active" : ""}`}
          >
            {tb.label}
          </button>
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
            gap: "0.52rem",
            ...(compact ? { maxHeight: "400px", overflowY: "auto", paddingRight: "3px" } : {}),
          }}
        >
          {leaderboard.entries.map((row, idx) => {
            const isTop1 = row.rank === 1;
            const isTop2 = row.rank === 2;
            const isTop3 = row.rank === 3;
            const cycleIdx = (row.rank - 4) % 3;
            const rowToneClass = row.isCurrentUser
              ? "pg-lb-row--me ge-lb-row-me"
              : isTop1
              ? "pg-lb-row--1 ge-lb-row-top1"
              : isTop2
              ? "pg-lb-row--2"
              : isTop3
              ? "pg-lb-row--3"
              : "pg-lb-row--rest";
            const rankChipClass = isTop1
              ? "pg-lb-rank-chip--1"
              : isTop2
              ? "pg-lb-rank-chip--2"
              : isTop3
              ? "pg-lb-rank-chip--3"
              : `pg-lb-rank-chip--c${Math.max(0, cycleIdx)}`;
            const scorePillClass = isTop1
              ? "pg-lb-score-pill--1"
              : isTop2
              ? "pg-lb-score-pill--2"
              : isTop3
              ? "pg-lb-score-pill--3"
              : `pg-lb-score-pill--c${Math.max(0, cycleIdx)}`;
            const avatarBorder = isTop1
              ? "#f59e0b"
              : isTop2
              ? "#38bdf8"
              : isTop3
              ? "#fb923c"
              : row.isCurrentUser
              ? "#8b5cf6"
              : T.borderSubtle;

            return (
              <div
                key={`${row.rank}-${row.display_name}`}
                className={`ge-lb-row pg-lb-row ${rowToneClass}`}
                style={{
                  animationDelay: `${Math.min(idx, 9) * 40}ms`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                  <span className={`pg-lb-rank-chip ${rankChipClass}`}>
                    {row.rank <= 3 ? row.rank : `#${row.rank}`}
                  </span>

                  <img
                    src={AVATAR_PATHS[(row.rank - 1) % AVATAR_PATHS.length]}
                    alt={row.display_name}
                    width={isTop1 ? 36 : 32}
                    height={isTop1 ? 36 : 32}
                    loading="lazy"
                    style={{
                      width: isTop1 ? 36 : 32,
                      height: isTop1 ? 36 : 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `2px solid ${avatarBorder}`,
                      opacity: row.is_anonymous ? 0.55 : 1,
                      filter: row.is_anonymous ? "grayscale(100%)" : "none",
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.86rem",
                        fontWeight: row.isCurrentUser || row.rank <= 3 ? 800 : 700,
                        color: T.textHeading,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.38rem",
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
                        <span className="pg-fc-pill pg-fc-pill--gold" style={{ padding: "0.12rem 0.45rem", fontSize: "0.62rem" }}>
                          Dẫn đầu
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: T.textMuted, fontWeight: 600 }}>
                      Lv {row.level} • {row.title} • {row.tie_breaker_accuracy}%
                    </div>
                  </div>
                </div>

                <span className={`pg-lb-score-pill ${scorePillClass}`}>
                  {Number(row.score || 0).toLocaleString()} {activeUnit}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
