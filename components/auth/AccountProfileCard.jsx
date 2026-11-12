import React, { useState, useEffect, useRef } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Progress, Skeleton } from "../design-system";
import { getBadgeArtworkPath, getLevelIconPath } from "../ui-2026/assetMap";
import { getCachedMonetizationOverview } from "../monetization/MonetizationHub";
import { getCachedGamificationSummary } from "../gamification/GamificationHub";

function formatViDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysRemaining(endIso) {
  if (!endIso) return null;
  const diffMs = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86400000));
}

function getTierTone(tier) {
  if (tier === "Diamond") return "accent";
  if (tier === "Gold") return "warning";
  if (tier === "Silver") return "success";
  return "neutral";
}

/**
 * Rich Account Profile, Exact VIP Subscription Expiry, Learning Progress & Earned Badges Card
 */
export default function AccountProfileCard({
  currentUser,
  authToken = null,
  completedLessonsCount = 0,
  totalLessonsCount = 53,
  userTracker = {},
  savedMistakesCount = 0,
  savedVocabCount = 0,
  isLight = false,
  onOpenVipHub,
  onOpenGamificationHub,
  onSwitchAccount,
  onLogout,
  onEntitlementSync,
}) {
  const T = getThemeTokens(isLight);
  const uid = currentUser?.id && !currentUser?.isGuest ? currentUser.id : null;
  const cachedMon = uid ? getCachedMonetizationOverview(uid) : null;
  const cachedGam = uid ? getCachedGamificationSummary(uid) : null;

  const [monData, setMonData] = useState(cachedMon);
  const [gamData, setGamData] = useState(cachedGam);
  const [refreshing, setRefreshing] = useState(!cachedMon || !cachedGam);
  const onSyncRef = useRef(onEntitlementSync);
  onSyncRef.current = onEntitlementSync;

  useEffect(() => {
    if (!uid) return undefined;
    let active = true;
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const tzOffsetMinutes = (() => {
      try {
        return -new Date().getTimezoneOffset();
      } catch {
        return 420;
      }
    })();

    Promise.all([
      fetch(`/api/monetization/overview?user_id=${encodeURIComponent(uid)}`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/gamification/summary?user_id=${encodeURIComponent(uid)}&tzOffsetMinutes=${tzOffsetMinutes}`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([monJson, gamJson]) => {
        if (!active) return;
        if (monJson?.success) {
          setMonData(monJson);
          if (onSyncRef.current && monJson.entitlement) {
            onSyncRef.current(monJson.entitlement);
          }
        }
        if (gamJson?.success) {
          setGamData(gamJson);
        }
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [uid, authToken]);

  const entitlement = monData?.entitlement || {};
  const sub = entitlement.subscription || null;
  const effectiveRole = entitlement.effectiveRole || currentUser?.role || "FREE";
  const hasVip = Boolean(entitlement.hasVipAccess || effectiveRole === "VIP" || effectiveRole === "ADMIN");
  const latestTx = (monData?.transactions || []).find((t) => t.status === "succeeded") || (monData?.transactions || [])[0] || null;

  const xpState = gamData?.xpState || {};
  const streakState = gamData?.streakState || {};
  const achievements = Array.isArray(gamData?.achievements) ? gamData.achievements : [];
  const unlockedBadges = achievements.filter((a) => a.unlocked);
  const nextLockedBadges = achievements.filter((a) => !a.unlocked).slice(0, 3);

  const displayLevel = xpState.level || Math.max(1, Math.floor((userTracker?.xp || 0) / 100) + 1);
  const displayTitle = xpState.title || "Học viên";
  const displayXp = xpState.totalXp ?? userTracker?.xp ?? 0;
  const xpInto = xpState.xpIntoLevel ?? 0;
  const xpNext = xpState.xpForNextLevel ?? 100;
  const displayStreak = streakState.current_streak ?? userTracker?.streak ?? 0;
  const lessonPct = totalLessonsCount > 0 ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100)) : 0;

  const isLifetime = sub?.plan?.billing_cycle === "lifetime";
  const expiryIso = sub?.status === "trialing" && sub?.trial_ends_at ? sub.trial_ends_at : sub?.current_period_end;
  const daysLeft = isLifetime ? null : getDaysRemaining(expiryIso);

  const subStatusLabel =
    sub?.status === "active"
      ? "Đang hoạt động"
      : sub?.status === "trialing"
      ? "Đang dùng thử miễn phí"
      : sub?.status === "grace_period"
      ? "Gia hạn ân hạn"
      : sub?.status === "canceled"
      ? "Đã hủy gia hạn"
      : sub?.status === "expired"
      ? "Đã hết hạn"
      : "Kích hoạt hệ thống";

  const subStatusTone =
    sub?.status === "active"
      ? "success"
      : sub?.status === "trialing"
      ? "info"
      : sub?.status === "grace_period"
      ? "warning"
      : "danger";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
      {/* Section 1: User Identity Header */}
      <div
        style={{
          backgroundColor: T.bgElevated,
          border: `1px solid ${hasVip ? T.accentBorder : T.border}`,
          borderRadius: "12px",
          padding: "0.9rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img
            src={getLevelIconPath(displayLevel)}
            alt={displayTitle}
            width={42}
            height={42}
            style={{ width: 42, height: 42, flexShrink: 0 }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>{currentUser.name}</span>
              <Badge tone={effectiveRole === "ADMIN" ? "danger" : hasVip ? "success" : "neutral"} isLight={isLight}>
                {effectiveRole === "ADMIN" ? "🛡️ ADMIN" : hasVip ? "⭐ VIP" : "👤 FREE"}
              </Badge>
            </div>
            <div style={{ fontSize: "0.78rem", color: T.textSecondary, marginTop: "0.1rem" }}>{currentUser.email}</div>
            <div style={{ fontSize: "0.7rem", color: T.textMuted, marginTop: "0.1rem" }}>
              Level {displayLevel} • {displayTitle} • Tham gia từ {currentUser.createdAt || "—"}
            </div>
          </div>
        </div>

        <Button size="sm" variant="danger" isLight={isLight} onClick={onLogout}>
          🚪 Đăng xuất
        </Button>
      </div>

      {/* Section 2: Exact Subscription Plan & Expiration Details */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${hasVip ? T.successBorder : T.cardBorder}`,
          borderRadius: "12px",
          padding: "0.9rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading }}>
            💎 Thông tin Gói Cước &amp; Thời Hạn
          </div>
          {sub ? (
            <Badge tone={subStatusTone} isLight={isLight}>
              {subStatusLabel}
            </Badge>
          ) : (
            <Badge tone={hasVip ? "success" : "neutral"} isLight={isLight}>
              {effectiveRole === "ADMIN" ? "Quản trị viên hệ thống" : hasVip ? "VIP Đặc quyền" : "Gói Miễn Phí"}
            </Badge>
          )}
        </div>

        {refreshing && !monData ? (
          <Skeleton height="54px" width="100%" />
        ) : sub ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.55rem",
              fontSize: "0.78rem",
            }}
          >
            <div style={{ backgroundColor: T.bgElevated, padding: "0.55rem 0.7rem", borderRadius: "8px", border: `1px solid ${T.borderSubtle}` }}>
              <div style={{ fontSize: "0.69rem", color: T.textMuted }}>Gói đang sử dụng</div>
              <div style={{ fontWeight: 800, color: T.textHeading, marginTop: "0.15rem" }}>
                {sub.plan?.name_vi || (sub.status === "trialing" ? "Dùng thử VIP" : "Thành viên VIP")}
              </div>
              <div style={{ fontSize: "0.69rem", color: T.textMuted, marginTop: "0.1rem" }}>
                Cổng: {sub.provider === "sepay" ? "SePay VA (VietQR)" : sub.provider === "manual" ? "Hệ thống / Dùng thử" : sub.provider?.toUpperCase()}
              </div>
            </div>

            <div style={{ backgroundColor: T.bgElevated, padding: "0.55rem 0.7rem", borderRadius: "8px", border: `1px solid ${T.borderSubtle}` }}>
              <div style={{ fontSize: "0.69rem", color: T.textMuted }}>Ngày kích hoạt / Bắt đầu</div>
              <div style={{ fontWeight: 700, color: T.textSecondary, marginTop: "0.15rem" }}>
                {formatViDateTime(sub.current_period_start)}
              </div>
              {latestTx && (
                <div style={{ fontSize: "0.69rem", color: T.textMuted, marginTop: "0.1rem" }}>
                  Giao dịch: {latestTx.provider_tx_id || latestTx.coupon_code || `${Number(latestTx.final_amount_vnd || 0).toLocaleString()}đ`}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: T.bgElevated, padding: "0.55rem 0.7rem", borderRadius: "8px", border: `1px solid ${T.borderSubtle}`, gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.69rem", color: T.textMuted }}>Ngày hết hạn chính xác</div>
                  <div style={{ fontWeight: 800, color: isLifetime ? T.success : daysLeft !== null && daysLeft <= 7 ? T.warning : T.accent, marginTop: "0.12rem", fontSize: "0.86rem" }}>
                    {isLifetime ? "Trọn đời (Không giới hạn)" : formatViDateTime(expiryIso)}
                  </div>
                </div>
                {!isLifetime && daysLeft !== null && (
                  <Badge tone={daysLeft <= 7 ? "warning" : "success"} isLight={isLight}>
                    {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Hết hạn hôm nay"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : hasVip ? (
          <Alert tone="success" isLight={isLight}>
            {effectiveRole === "ADMIN"
              ? "Tài khoản Quản trị viên (ADMIN) có toàn quyền truy cập và quản lý hệ thống không giới hạn."
              : "Tài khoản VIP đã được kích hoạt đặc quyền bởi Quản trị viên (không giới hạn thời hạn)."}
          </Alert>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.78rem", color: T.textSecondary }}>
              Bạn đang dùng gói Miễn Phí. Nâng cấp VIP để mở khóa lời giải Nâng cao, 2,939 câu hỏi &amp; AI Study Coach.
            </div>
            <Button size="sm" variant="primary" isLight={isLight} onClick={onOpenVipHub}>
              💎 Nâng cấp VIP
            </Button>
          </div>
        )}
      </div>

      {/* Section 3: Learning Progress & Gamification Stats */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "12px",
          padding: "0.9rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.7rem",
        }}
      >
        <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading }}>
          📊 Tiến Độ Học Tập &amp; Kinh Nghiệm
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: "0.5rem" }}>
          {[
            { label: "Tổng XP", val: Number(displayXp).toLocaleString(), tone: T.accent },
            { label: "Chuỗi Streak", val: `${displayStreak} ngày`, tone: T.warning },
            { label: "Hoàn thành", val: `${completedLessonsCount}/${totalLessonsCount} bài`, tone: T.success },
            { label: "Huy hiệu", val: `${unlockedBadges.length}/${achievements.length || 20}`, tone: T.textHeading },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: T.bgElevated,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: "8px",
                padding: "0.5rem 0.65rem",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: T.textMuted, fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: stat.tone, marginTop: "0.1rem" }}>{stat.val}</div>
            </div>
          ))}
        </div>

        <Progress
          value={completedLessonsCount}
          max={totalLessonsCount}
          label={`Tiến độ 53 bài học (${lessonPct}%)`}
          tone="accent"
          isLight={isLight}
          height={8}
        />

        <Progress
          value={xpInto}
          max={xpNext}
          label={`Cấp độ hiện tại: Lv ${displayLevel} ➔ Lv ${displayLevel + 1} (${xpInto}/${xpNext} XP)`}
          tone="success"
          isLight={isLight}
          height={8}
        />

        <div style={{ fontSize: "0.73rem", color: T.textMuted }}>
          Sổ tay câu sai: <strong>{savedMistakesCount}</strong> • Từ vựng đã lưu: <strong>{savedVocabCount}</strong>
        </div>
      </div>

      {/* Section 4: Earned Badges & Next Achievements */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "12px",
          padding: "0.9rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading }}>
            🏆 Huy Hiệu Thành Tích ({unlockedBadges.length}/{achievements.length || 20})
          </div>
          <Button size="sm" variant="ghost" isLight={isLight} onClick={onOpenGamificationHub} style={{ fontSize: "0.74rem" }}>
            Xem tất cả ➔
          </Button>
        </div>

        {refreshing && !gamData ? (
          <Skeleton height="56px" width="100%" />
        ) : unlockedBadges.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.5rem" }}>
            {unlockedBadges.slice(0, 6).map((b) => (
              <div
                key={b.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.successBorder}`,
                  borderRadius: "9px",
                  padding: "0.5rem 0.65rem",
                }}
              >
                <img
                  src={getBadgeArtworkPath(b.code, b.tier, true, b.is_hidden)}
                  alt={b.title_vi}
                  width={36}
                  height={36}
                  style={{ width: 36, height: 36, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 800, color: T.textHeading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.title_vi}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.12rem" }}>
                    <Badge tone={getTierTone(b.tier)} isLight={isLight}>
                      {b.tier}
                    </Badge>
                    {b.unlocked_at && (
                      <span style={{ fontSize: "0.66rem", color: T.textMuted }}>
                        {new Date(b.unlocked_at).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.76rem", color: T.textMuted }}>
              Chưa mở khóa huy hiệu nào. Gợi ý các mục tiêu gần nhất để đạt huy hiệu đầu tiên:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.45rem" }}>
              {nextLockedBadges.map((b) => (
                <div
                  key={b.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: T.bgElevated,
                    border: `1px solid ${T.borderSubtle}`,
                    borderRadius: "8px",
                    padding: "0.45rem 0.6rem",
                    opacity: 0.85,
                  }}
                >
                  <img
                    src={getBadgeArtworkPath(b.code, b.tier, false, b.is_hidden)}
                    alt={b.title_vi}
                    width={32}
                    height={32}
                    style={{ width: 32, height: 32, borderRadius: "7px", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.74rem", fontWeight: 700, color: T.textSecondary }}>{b.title_vi}</div>
                    <div style={{ fontSize: "0.67rem", color: T.textMuted, lineHeight: 1.3 }}>{b.description_vi}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" isLight={isLight} onClick={onSwitchAccount}>
          🔄 Đổi / Đăng nhập tài khoản khác
        </Button>
        <Button size="sm" variant="primary" isLight={isLight} onClick={onOpenVipHub}>
          {hasVip ? "💎 Xem chi tiết & Gia hạn VIP" : "💎 Nâng cấp VIP ngay"}
        </Button>
      </div>
    </div>
  );
}
