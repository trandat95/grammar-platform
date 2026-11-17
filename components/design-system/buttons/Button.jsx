import React from "react";
import { getThemeTokens, getComponentTokens } from "../../../lib/tokens/design-tokens";
import { RADII, MOTION, ACCESSIBILITY } from "../../../lib/tokens/spacing.tokens";
import KitIcon from "../../ui-2026/KitIcon";

const SIZE_STYLES = {
  sm: { padding: "0.35rem 0.72rem", fontSize: "0.78rem", minHeight: "30px" },
  md: { padding: "0.55rem 1.05rem", fontSize: "0.85rem", minHeight: "36px" },
  lg: { padding: "0.75rem 1.45rem", fontSize: "0.95rem", minHeight: `${ACCESSIBILITY.minTargetSizeTouchPx}px` },
};

/**
 * Shared Design System Button (Consolidated Grammar + TOEIC Contract)
 * Supports variants: primary | secondary | outline | ghost | danger | success
 * Supports optional icon / leftIcon / rightIcon (ReactNode or KitIcon name).
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
  icon = null,
  leftIcon = null,
  rightIcon = null,
  type = "button",
  className = "",
  style = {},
  onClick,
  ...rest
}) {
  const T = getThemeTokens(isLight);
  const C = getComponentTokens(isLight);
  const resolvedVariant = variant === "outline" ? "secondary" : variant;
  const vToken = C.button[resolvedVariant] || C.button.primary;
  const sToken = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isBlocked = disabled || isLoading;
  const resolvedLeft = leftIcon || icon;
  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  const renderSlot = (slot) =>
    typeof slot === "string" ? <KitIcon name={slot} size={iconSize} /> : slot;

  return (
    <button
      type={type}
      disabled={isBlocked}
      aria-busy={isLoading ? "true" : undefined}
      onClick={onClick}
      className={`ds-btn ds-btn-${resolvedVariant} ds-focusable ${className}`.trim()}
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
        backgroundColor: variant === "outline" ? "transparent" : vToken.bg,
        color: vToken.color,
        border: `1px solid ${vToken.border}`,
        transition: `background-color ${MOTION.durationFast} ${MOTION.easingDefault}, transform ${MOTION.durationFast} ${MOTION.easingDefault}, box-shadow ${MOTION.durationFast} ${MOTION.easingDefault}`,
        boxShadow: resolvedVariant === "primary" ? T.shadow : "none",
        ...sToken,
        ...style,
      }}
      {...rest}
    >
      {isLoading ? (
        <KitIcon name="hourglass" size={iconSize} />
      ) : resolvedLeft ? (
        <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>{renderSlot(resolvedLeft)}</span>
      ) : null}
      {children}
      {rightIcon && (
        <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>{renderSlot(rightIcon)}</span>
      )}
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
