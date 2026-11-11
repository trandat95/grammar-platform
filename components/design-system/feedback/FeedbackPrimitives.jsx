import React, { useState } from "react";
import { getThemeTokens, getComponentTokens } from "../../../lib/tokens/design-tokens";
import { RADII, MOTION } from "../../../lib/tokens/spacing.tokens";

export function Badge({ children, tone = "neutral", isLight = false, style = {} }) {
  const T = getThemeTokens(isLight);
  const map = {
    neutral: { bg: T.bgElevated, color: T.textSecondary, border: T.borderSubtle },
    accent: { bg: T.accentBg, color: T.accent, border: T.accentBorder },
    success: { bg: T.successBg, color: T.success, border: T.successBorder },
    warning: { bg: T.warningBg, color: T.warning, border: T.warningBorder },
    danger: { bg: T.dangerBg, color: T.danger, border: T.dangerBorder },
  };
  const pal = map[tone] || map.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.28rem",
        padding: "0.18rem 0.58rem",
        borderRadius: RADII.radiusFull,
        fontSize: "0.72rem",
        fontWeight: 700,
        backgroundColor: pal.bg,
        color: pal.color,
        border: `1px solid ${pal.border}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Alert({ children, title, tone = "info", isLight = false, style = {} }) {
  const T = getThemeTokens(isLight);
  const map = {
    info: { bg: T.infoBg, color: T.info, border: T.infoBorder, icon: "ℹ️" },
    success: { bg: T.successBg, color: T.success, border: T.successBorder, icon: "✅" },
    warning: { bg: T.warningBg, color: T.warning, border: T.warningBorder, icon: "⚠️" },
    danger: { bg: T.dangerBg, color: T.danger, border: T.dangerBorder, icon: "🚨" },
  };
  const pal = map[tone] || map.info;

  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      style={{
        backgroundColor: pal.bg,
        border: `1px solid ${pal.border}`,
        borderLeft: `4px solid ${pal.color}`,
        borderRadius: RADII.radiusMd,
        padding: "0.75rem 1rem",
        color: T.text,
        fontSize: "0.84rem",
        lineHeight: 1.5,
        ...style,
      }}
    >
      {title && (
        <div style={{ fontWeight: 700, color: pal.color, marginBottom: "0.2rem" }}>
          {pal.icon} {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function Progress({ value = 0, max = 100, label, tone = "accent", isLight = false, height = 8 }) {
  const T = getThemeTokens(isLight);
  const pct = Math.max(0, Math.min(100, Math.round((Number(value) / Math.max(1, Number(max))) * 100)));
  const fill = tone === "success" ? T.success : tone === "warning" ? T.warning : tone === "danger" ? T.danger : T.accent;

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: T.textSecondary, marginBottom: "0.3rem" }}>
          <span>{label}</span>
          <strong style={{ color: fill }}>{pct}%</strong>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: "100%",
          height: `${height}px`,
          backgroundColor: T.bgActive,
          borderRadius: RADII.radiusFull,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: fill,
            borderRadius: RADII.radiusFull,
            transition: `width ${MOTION.durationSlow} ${MOTION.easingDefault}`,
          }}
        />
      </div>
    </div>
  );
}

export function Tooltip({ content, children, isLight = false }) {
  const [visible, setVisible] = useState(false);
  const C = getComponentTokens(isLight);

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: C.tooltip.bg,
            color: C.tooltip.color,
            border: `1px solid ${C.tooltip.border}`,
            borderRadius: RADII.radiusSm,
            padding: "0.3rem 0.55rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            zIndex: 300,
            pointerEvents: "none",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
