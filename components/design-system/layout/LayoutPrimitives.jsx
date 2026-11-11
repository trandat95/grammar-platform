import React from "react";
import { getThemeTokens } from "../../../lib/tokens/design-tokens";
import { RADII, CONTAINERS } from "../../../lib/tokens/spacing.tokens";

export function Card({ children, subtle = false, isLight = false, padding = "1.25rem", style = {}, ...rest }) {
  const T = getThemeTokens(isLight);
  return (
    <div
      style={{
        backgroundColor: subtle ? T.cardSubtle : T.card,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: RADII.radiusLg,
        padding,
        boxShadow: subtle ? "none" : T.shadow,
        color: T.text,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Container({ children, maxWidth = CONTAINERS.reading, padding = "1.5rem", style = {} }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        margin: "0 auto",
        padding,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Grid({ children, minColumnWidth = "240px", gap = "1rem", style = {} }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Divider({ isLight = false, margin = "1rem 0" }) {
  const T = getThemeTokens(isLight);
  return <hr style={{ border: "none", borderTop: `1px solid ${T.borderSubtle}`, margin }} />;
}
