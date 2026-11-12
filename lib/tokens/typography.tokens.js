/**
 * Milestone 2.6.6: Typography Design System Tokens & Fluid Scale
 * Aligned with Google Fonts 'Google Sans Text' & 'Google Sans' / 'Product Sans' (loaded in pages/_app.js)
 */

export const FONT_FAMILIES = {
  sans: '"Google Sans Text", "Google Sans", "Product Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Google Sans Text", "Google Sans", "Product Sans", -apple-system, BlinkMacSystemFont, monospace',
};

export const FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
  loose: 1.75,
};

export const TYPOGRAPHY_SCALE = {
  display: {
    fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", // ~28px -> 40px
    fontWeight: FONT_WEIGHTS.extrabold,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: "-0.025em",
  },
  h1: {
    fontSize: "clamp(1.5rem, 2.5vw, 2rem)", // ~24px -> 32px
    fontWeight: FONT_WEIGHTS.extrabold,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontSize: "clamp(1.25rem, 2vw, 1.5rem)", // ~20px -> 24px
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: "-0.015em",
  },
  h3: {
    fontSize: "clamp(1.1rem, 1.5vw, 1.25rem)", // ~17.6px -> 20px
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.snug,
  },
  h4: {
    fontSize: "1.125rem", // 18px
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.snug,
  },
  bodyLg: {
    fontSize: "1rem", // 16px
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  body: {
    fontSize: "0.875rem", // 14px
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  bodySm: {
    fontSize: "0.8125rem", // 13px
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  caption: {
    fontSize: "0.75rem", // 12px
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  overline: {
    fontSize: "0.6875rem", // 11px
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
};
