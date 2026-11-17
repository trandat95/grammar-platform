import React from "react";
import { getThemeTokens } from "../../../lib/tokens/design-tokens";
import { RADII } from "../../../lib/tokens/spacing.tokens";
import { Button } from "../buttons/Button";
import KitIcon from "../../ui-2026/KitIcon";

/**
 * Fixed-geometry Skeleton loader to eliminate Cumulative Layout Shift (CLS)
 */
export function Skeleton({ width = "100%", height = "18px", borderRadius = RADII.radiusMd, style = {} }) {
  return (
    <div
      aria-hidden="true"
      className="ds-skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function EmptyState({
  icon = "inbox",
  title = "Chưa có dữ liệu",
  description = "",
  actionLabel = "",
  onAction,
  isLight = false,
}) {
  const T = getThemeTokens(isLight);

  return (
    <div
      style={{
        backgroundColor: T.card,
        border: `1px dashed ${T.border}`,
        borderRadius: RADII.radiusLg,
        padding: "2.25rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          backgroundColor: T.bgElevated,
          border: `1px solid ${T.borderSubtle}`,
          color: T.accent,
          marginBottom: "0.75rem",
        }}
        aria-hidden="true"
      >
        {typeof icon === "string" ? <KitIcon name={icon} size={28} /> : icon}
      </div>
      <h4 style={{ margin: "0 0 0.35rem 0", fontSize: "1rem", fontWeight: 700, color: T.textHeading }}>
        {title}
      </h4>
      {description && (
        <p style={{ margin: "0 auto 1rem auto", maxWidth: "460px", fontSize: "0.85rem", color: T.textMuted, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" isLight={isLight} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
