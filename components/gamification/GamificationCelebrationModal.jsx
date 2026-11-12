import React from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Badge, Button, Modal } from "../design-system";
import { getBadgeArtworkPath } from "../ui-2026/assetMap";

/**
 * Milestone 2.10.7: Accessible Level Up Celebration & Achievement Unlock Modal
 * Respects both user-configured reducedMotion toggle and OS prefers-reduced-motion.
 */
export default function GamificationCelebrationModal({
  celebration = null,
  onClose,
  isLight = false,
  reducedMotion = false,
}) {
  if (!celebration) return null;
  const T = getThemeTokens(isLight);
  const { leveledUp, previousLevel, levelState, newlyUnlockedAchievements = [], streakState } = celebration;

  const hasContent = Boolean(leveledUp || newlyUnlockedAchievements.length > 0 || streakState?.milestone_reached);
  if (!hasContent) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={leveledUp ? "🎉 Thăng Cấp Thành Công!" : "🏆 Chúc Mừng Thành Tích Mới!"}
      isLight={isLight}
      maxWidth="520px"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          transition: reducedMotion ? "none" : "transform 220ms ease",
        }}
      >
        {leveledUp && levelState && (
          <div
            style={{
              backgroundColor: T.accentBg,
              border: `1px solid ${T.accentBorder}`,
              borderRadius: "12px",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.25rem", marginBottom: "0.35rem" }}>{levelState.badgeIcon || "🎖️"}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.textHeading }}>
              Level {previousLevel} ➔ Level {levelState.level}
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: T.accent, marginTop: "0.2rem" }}>
              Danh hiệu mới: {levelState.title}
            </div>
            <div style={{ fontSize: "0.78rem", color: T.textMuted, marginTop: "0.35rem" }}>
              Tổng XP xác thực: {Number(levelState.totalXp || 0).toLocaleString()} XP
            </div>
          </div>
        )}

        {streakState?.milestone_reached && (
          <div
            style={{
              backgroundColor: T.warningBg,
              border: `1px solid ${T.warningBorder}`,
              borderRadius: "10px",
              padding: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.6rem" }}>🔥</span>
            <div>
              <div style={{ fontWeight: 800, color: T.warning, fontSize: "0.92rem" }}>
                Cột mốc Chuỗi {streakState.milestone_reached} Ngày Liên Tiếp!
              </div>
              <div style={{ fontSize: "0.78rem", color: T.textSecondary }}>
                Thói quen học tập đều đặn giúp ghi nhớ dài hạn vượt trội.
              </div>
            </div>
          </div>
        )}

        {newlyUnlockedAchievements.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: T.textHeading }}>
              Huy hiệu vừa mở khóa ({newlyUnlockedAchievements.length})
            </div>
            {newlyUnlockedAchievements.map((b) => (
              <div
                key={b.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: "10px",
                  padding: "0.7rem 0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <img
                    src={getBadgeArtworkPath(b.code, b.tier, true, b.is_hidden)}
                    alt={b.title_vi}
                    width={42}
                    height={42}
                    style={{ width: 42, height: 42, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 800, color: T.textHeading }}>{b.title_vi}</div>
                    <div style={{ fontSize: "0.75rem", color: T.textMuted }}>{b.description_vi}</div>
                  </div>
                </div>
                <Badge tone="success" isLight={isLight}>
                  +{b.xp_bonus || 0} XP
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
          <Button variant="primary" isLight={isLight} onClick={onClose}>
            Tiếp tục chinh phục ➔
          </Button>
        </div>
      </div>
    </Modal>
  );
}
