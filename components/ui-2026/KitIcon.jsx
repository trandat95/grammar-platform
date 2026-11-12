import React from "react";

/**
 * Crisp Vector SVG Icon Set for Grammar Engine 2026 UI
 * Replaces inconsistent OS emojis and preserves WCAG AA contrast across Light & Dark modes via CSS variables.
 */
export default function KitIcon({ name, size = 18, className = "", style = {} }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className,
    style: { flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style },
  };

  switch (name) {
    case "hub-overview":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7.5" height="9" rx="2" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
          <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <rect x="3" y="15" width="7.5" height="6" rx="2" />
        </svg>
      );
    case "hub-study":
      return (
        <svg {...common}>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" stroke="var(--ds-accent)" />
          <circle cx="12.5" cy="9.5" r="3.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="m15 12 2.5 2.5" stroke="var(--ds-accent)" />
        </svg>
      );
    case "hub-practice":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="3" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="m8 11 2.2 2.2L15.5 8" stroke="var(--ds-success)" strokeWidth="2.1" />
          <path d="M8 16h8" />
        </svg>
      );
    case "hub-achievements":
      return (
        <svg {...common}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="var(--ds-warning)" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="var(--ds-warning)" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "hub-vip":
      return (
        <svg {...common}>
          <polygon points="6 3 18 3 22 9 12 21 2 9" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M2 9h20" stroke="var(--ds-accent)" />
          <path d="m12 21-4-12 3-6" stroke="var(--ds-accent)" />
          <path d="m12 21 4-12-3-6" stroke="var(--ds-accent)" />
        </svg>
      );
    case "hub-admin":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="var(--ds-danger-bg)" stroke="var(--ds-danger)" />
          <path d="m9 12 2 2 4-4" stroke="var(--ds-danger)" strokeWidth="2" />
        </svg>
      );
    case "tool-search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="m20 20-3.5-3.5" stroke="var(--ds-accent)" strokeWidth="2" />
        </svg>
      );
    case "tool-dict":
      return (
        <svg {...common}>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19v16H6.5a2.5 2.5 0 0 0 0 5H19" stroke="var(--ds-accent)" />
          <path d="m10 11 2-5 2 5" stroke="var(--ds-success)" />
          <path d="M10.5 9.8h3" stroke="var(--ds-success)" />
          <path d="M13 14l2 1.5L13 17" stroke="var(--ds-warning)" />
        </svg>
      );
    case "tool-vocab":
      return (
        <svg {...common}>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="var(--ds-warning-bg)"
            stroke="var(--ds-warning)"
          />
        </svg>
      );
    case "tool-audio":
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="var(--ds-accent)" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="var(--ds-accent)" />
        </svg>
      );
    case "tool-theme-light":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="var(--ds-warning)" />
        </svg>
      );
    case "tool-theme-dark":
      return (
        <svg {...common}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    default:
      return null;
  }
}
