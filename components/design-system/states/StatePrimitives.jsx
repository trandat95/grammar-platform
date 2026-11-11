import React from "react";
import { getThemeTokens } from "../../../lib/tokens/design-tokens";
import { RADII } from "../../../lib/tokens/spacing.tokens";
import { Button } from "../buttons/Button";

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
  icon = "📭",
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
      <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }} aria-hidden="true">
        {icon}
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
