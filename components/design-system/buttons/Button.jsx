import React from "react";
import { getThemeTokens, getComponentTokens } from "../../../lib/tokens/design-tokens";
import { RADII, MOTION, ACCESSIBILITY } from "../../../lib/tokens/spacing.tokens";

const SIZE_STYLES = {
  sm: { padding: "0.35rem 0.72rem", fontSize: "0.78rem", minHeight: "30px" },
  md: { padding: "0.55rem 1.05rem", fontSize: "0.85rem", minHeight: "36px" },
  lg: { padding: "0.75rem 1.45rem", fontSize: "0.95rem", minHeight: `${ACCESSIBILITY.minTargetSizeTouchPx}px` },
};

/**
 * Shared Design System Button
 * Supports variants: primary | secondary | ghost | danger | success
 * WCAG 2.2 AA: target size >= 24px (44px on coarse pointers), visible focus ring, disabled/loading ARIA state.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  isLight = false,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  className = "",
  style = {},
  onClick,
  ...rest
}) {
  const T = getThemeTokens(isLight);
  const C = getComponentTokens(isLight);
  const vToken = C.button[variant] || C.button.primary;
  const sToken = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isBlocked = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isBlocked}
      aria-busy={isLoading ? "true" : undefined}
      onClick={onClick}
      className={`ds-btn ds-focusable ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.45rem",
        width: fullWidth ? "100%" : "auto",
        borderRadius: RADII.radiusMd,
        fontWeight: 700,
        cursor: isBlocked ? "not-allowed" : "pointer",
        opacity: isBlocked ? 0.62 : 1,
        backgroundColor: vToken.bg,
        color: vToken.color,
        border: `1px solid ${vToken.border}`,
        transition: `background-color ${MOTION.durationFast} ${MOTION.easingDefault}, transform ${MOTION.durationFast} ${MOTION.easingDefault}, box-shadow ${MOTION.durationFast} ${MOTION.easingDefault}`,
        boxShadow: variant === "primary" ? T.shadow : "none",
        ...sToken,
        ...style,
      }}
      {...rest}
    >
      {isLoading && <span aria-hidden="true">⏳</span>}
      {children}
    </button>
  );
}

export function IconButton({
  children,
  label,
  isLight = false,
  variant = "secondary",
  size = 36,
  style = {},
  ...rest
}) {
  const safeSize = Math.max(ACCESSIBILITY.minTargetSizeDesktopPx, size);
  return (
    <Button
      variant={variant}
      isLight={isLight}
      aria-label={label}
      title={label}
      style={{
        width: `${safeSize}px`,
        height: `${safeSize}px`,
        minHeight: `${safeSize}px`,
        padding: 0,
        borderRadius: RADII.radiusFull,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}

export function ButtonGroup({ children, gap = "0.5rem", style = {} }) {
  return (
    <div
      role="group"
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
