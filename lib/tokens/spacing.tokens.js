/**
 * Milestone 2.6.7 & 2.6.10: 4px Spacing Grid, Border Radius, Layout Breakpoints & Motion Tokens
 */

export const SPACING = {
  space0: "0px",
  space1: "4px",
  space2: "8px",
  space3: "12px",
  space4: "16px",
  space5: "20px",
  space6: "24px",
  space8: "32px",
  space10: "40px",
  space12: "48px",
  space16: "64px",
};

export const RADII = {
  radiusNone: "0px",
  radiusSm: "4px",
  radiusMd: "8px",
  radiusLg: "12px",
  radiusXl: "16px",
  radius2xl: "20px",
  radiusFull: "9999px",
};

export const SHADOWS = {
  shadowXs: "0 1px 2px rgba(0, 0, 0, 0.05)",
  shadowSm: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
  shadowMd: "0 4px 12px rgba(0, 0, 0, 0.08)",
  shadowLg: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
  shadowElevated: "0 12px 30px rgba(0, 0, 0, 0.25)",
};

export const BREAKPOINTS = {
  mobileSmall: 375,
  mobile: 767,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export const CONTAINERS = {
  narrow: "760px",
  reading: "960px",
  wide: "1120px",
};

export const MOTION = {
  durationFast: "120ms",
  durationNormal: "200ms",
  durationSlow: "300ms",
  easingDefault: "cubic-bezier(0.22, 1, 0.36, 1)",
  easingLinear: "linear",
  reducedMotionQuery: "@media (prefers-reduced-motion: reduce)",
};

export const ACCESSIBILITY = {
  minContrastNormalText: 4.5,
  minContrastLargeText: 3.0,
  minTargetSizeDesktopPx: 24,
  minTargetSizeTouchPx: 44,
  stickyHeaderOffsetPx: 72,
};
