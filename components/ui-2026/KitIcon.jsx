import React from "react";

/**
 * Crisp Vector SVG Icon Set & StatusDot for Grammar Engine 2026 UI
 * Replaces OS color emojis across buttons, cards, badges, headers, alerts, and modals.
 * Inherits WCAG AA contrast across Light & Dark modes via semantic CSS tokens (`--ds-*`).
 */

export function StatusDot({ tone = "success", size = 8, pulse = false, style = {} }) {
  const toneColor =
    tone === "warning"
      ? "var(--ds-warning)"
      : tone === "danger"
      ? "var(--ds-danger)"
      : tone === "accent" || tone === "info"
      ? "var(--ds-accent)"
      : tone === "neutral" || tone === "muted"
      ? "var(--ds-text-muted)"
      : "var(--ds-success)";

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "9999px",
        backgroundColor: toneColor,
        flexShrink: 0,
        boxShadow: pulse ? `0 0 0 3px color-mix(in srgb, ${toneColor} 24%, transparent)` : "none",
        ...style,
      }}
    />
  );
}

export function KitIcon({ name, size = 18, color, className = "", style = {} }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth: "1.85",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className,
    style: {
      ...(color ? { color } : {}),
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle",
      ...style,
    },
  };

  switch (name) {
    /* ============================
     * 1. HUB & NAVIGATION ICONS
     * ============================ */
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
    case "trophy":
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
    case "gem":
      return (
        <svg {...common}>
          <polygon points="6 3 18 3 22 9 12 21 2 9" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M2 9h20" stroke="var(--ds-accent)" />
          <path d="m12 21-4-12 3-6" stroke="var(--ds-accent)" />
          <path d="m12 21 4-12-3-6" stroke="var(--ds-accent)" />
        </svg>
      );
    case "hub-admin":
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="var(--ds-danger-bg)" stroke="var(--ds-danger)" />
          <path d="m9 12 2 2 4-4" stroke="var(--ds-danger)" strokeWidth="2" />
        </svg>
      );

    /* ============================
     * 2. CORE TOOLS
     * ============================ */
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
    case "star":
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
    case "tool-diag":
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="12" cy="12" r="4.5" stroke="var(--ds-accent)" />
          <circle cx="12" cy="12" r="1.5" fill="var(--ds-accent)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "tool-xray":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M7 10h4M7 14h10M14 10h3" stroke="var(--ds-accent)" strokeWidth="2" />
        </svg>
      );
    case "tool-dna":
      return (
        <svg {...common}>
          <path d="M6 3c0 5 12 5 12 10s-12 5-12 8" stroke="var(--ds-warning)" />
          <path d="M18 3c0 5-12 5-12 10s12 5 12 8" stroke="var(--ds-accent)" />
          <path d="M8 7h8M8 17h8" stroke="var(--ds-text-muted)" />
        </svg>
      );
    case "tool-loop":
    case "refresh":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" stroke="var(--ds-success)" />
          <path d="M21 3v5h-5" stroke="var(--ds-success)" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" stroke="var(--ds-accent)" />
          <path d="M3 21v-5h5" stroke="var(--ds-accent)" />
        </svg>
      );
    case "tool-chart":
      return (
        <svg {...common}>
          <path d="M4 20h16" />
          <rect x="6" y="12" width="3" height="6" rx="1" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <rect x="11" y="8" width="3" height="10" rx="1" fill="var(--ds-indigo-bg)" stroke="var(--ds-indigo)" />
          <rect x="16" y="4" width="3" height="14" rx="1" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
        </svg>
      );
    case "tool-spark":
    case "celebrate":
      return (
        <svg {...common}>
          <path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M5 3v4M3 5h4M19 17v4M17 19h4" stroke="var(--ds-accent)" strokeWidth="1.6" />
        </svg>
      );

    /* ============================
     * 3. AUTH, SECURITY & VIP
     * ============================ */
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2.5" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="var(--ds-warning)" />
          <circle cx="12" cy="16" r="1" fill="var(--ds-warning)" />
        </svg>
      );
    case "unlock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2.5" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <path d="M8 11V7a4 4 0 0 1 7.6-1.7" stroke="var(--ds-success)" />
        </svg>
      );
    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="14" r="4" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="m11 11 9-9M16 6l3 3M19 3l2 2" stroke="var(--ds-accent)" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" fill="var(--ds-accent-bg)" stroke="currentColor" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M3 19.5a6 6 0 0 1 12 0" stroke="var(--ds-accent)" />
          <circle cx="16.5" cy="9" r="2.5" />
          <path d="M16 14.2a5 5 0 0 1 5 5.3" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="m3 18 2-10 5 4 2-6 2 6 5-4 2 10H3Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M4 21h16" stroke="var(--ds-warning)" />
        </svg>
      );
    case "bank":
      return (
        <svg {...common}>
          <path d="M3 10h18L12 3 3 10Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18" />
        </svg>
      );
    case "credit-card":
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M2.5 10h19M6.5 15h4" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...common}>
          <path d="M5 3v18l2.5-1.8L10 21l2-1.8L14 21l2.5-1.8L19 21V3l-2.5 1.5L14 3l-2 1.5L10 3 7.5 4.5 5 3Z" fill="var(--ds-bg-elevated)" stroke="var(--ds-accent)" />
          <path d="M9 9h6M9 13h6M9 17h3" />
        </svg>
      );
    case "ticket":
      return (
        <svg {...common}>
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M13 6v12" strokeDasharray="2 2" />
        </svg>
      );

    /* ============================
     * 4. GAMIFICATION & REWARDS
     * ============================ */
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 2.5c1.5 3 4.5 4.6 4.5 9.2a4.5 4.5 0 1 1-9 0c0-2 .8-3.8 2-5.1.3 1.4 1.3 2.1 2.2 2.1 0-2 .3-4.2.3-6.2Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "medal":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="6" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M8.5 3h7L13 9h-2L8.5 3Z" stroke="var(--ds-accent)" />
          <path d="m10 14 1.5 1.5 3-3" stroke="var(--ds-warning)" />
        </svg>
      );
    case "rank-1":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="6.5" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M9 3h6l-2 5h-2L9 3Z" stroke="var(--ds-warning)" />
          <path d="M11 12l1.2-1.2V17M10.8 17h2.6" stroke="var(--ds-warning)" strokeWidth="2" />
        </svg>
      );
    case "rank-2":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="6.5" fill="var(--ds-bg-elevated)" stroke="var(--ds-text-secondary)" />
          <path d="M9 3h6l-2 5h-2L9 3Z" />
          <path d="M10.5 12.5a1.5 1.5 0 0 1 3 0c0 1.3-3 2.5-3 4h3" strokeWidth="1.9" />
        </svg>
      );
    case "rank-3":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="6.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M9 3h6l-2 5h-2L9 3Z" stroke="var(--ds-accent)" />
          <path d="M10.5 11.8h2.6l-1.5 1.8a1.5 1.5 0 1 1-1.2 2.4" stroke="var(--ds-accent)" strokeWidth="1.9" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="15.5" cy="8.5" r="1.3" fill="var(--ds-accent)" />
        </svg>
      );
    case "snowflake":
      return (
        <svg {...common}>
          <path d="M12 2v20M4.93 7l14.14 10M19.07 7 4.93 17M9 4l3 2 3-2M9 20l3-2 3 2" stroke="var(--ds-accent)" />
        </svg>
      );

    /* ============================
     * 5. BUTTON CONTROLS & UI ACTIONS
     * ============================ */
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "flag":
      return (
        <svg {...common}>
          <path d="M4 22V4" stroke="var(--ds-warning)" />
          <path d="M4 4h13l-2.5 4.5L17 13H4" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "doc-export":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M14 2v6h6M12 18v-6M9.5 14.5 12 12l2.5 2.5" stroke="var(--ds-accent)" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="8" y="2.5" width="8" height="3.5" rx="1" stroke="var(--ds-accent)" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill="var(--ds-bg-elevated)" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case "settings":
    case "sliders":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="var(--ds-text-muted)" />
          <circle cx="9" cy="6" r="2.2" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="15" cy="12" r="2.2" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <circle cx="10" cy="18" r="2.2" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "scale":
      return (
        <svg {...common}>
          <path d="M12 3v18M6 21h12M4 7h16" stroke="var(--ds-accent)" />
          <path d="m4 7-2 6h4L4 7ZM20 7l-2 6h4l-2-6Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <polygon points="7 4 20 12 7 20 7 4" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common}>
          <rect x="6" y="4" width="4" height="16" rx="1" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <rect x="14" y="4" width="4" height="16" rx="1" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "stop":
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="2" fill="var(--ds-danger-bg)" stroke="var(--ds-danger)" />
        </svg>
      );
    case "headphones":
      return (
        <svg {...common}>
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" stroke="var(--ds-accent)" />
          <rect x="3" y="13" width="3.5" height="6" rx="1.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <rect x="17.5" y="13" width="3.5" height="6" rx="1.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "mic":
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v4M9 22h6" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="var(--ds-accent)" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "thumbs-up":
      return (
        <svg {...common}>
          <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm3 9h7.3a2 2 0 0 0 2-1.6l1.1-6a2 2 0 0 0-2-2.4H14l.6-3.7A1.8 1.8 0 0 0 12.8 4L9 11v9Z" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
        </svg>
      );

    /* ============================
     * 6. ACADEMIC, STATUS & METRICS
     * ============================ */
    case "check-circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <path d="m8.5 12.5 2.4 2.4 4.8-5.2" stroke="var(--ds-success)" strokeWidth="2.1" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M12 3 2.5 19.5h19L12 3Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M12 9.5v4.5M12 17h.01" stroke="var(--ds-warning)" strokeWidth="2.1" />
        </svg>
      );
    case "danger":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="var(--ds-danger-bg)" stroke="var(--ds-danger)" />
          <path d="m15 9-6 6M9 9l6 6" stroke="var(--ds-danger)" strokeWidth="2" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M12 16v-4.5M12 8h.01" stroke="var(--ds-accent)" strokeWidth="2.1" />
        </svg>
      );
    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.5 1.1 1.3 1.2 2.1h4.6c.1-.8.5-1.6 1.2-2.1A6 6 0 0 0 12 3Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "hourglass":
      return (
        <svg {...common}>
          <path d="M6 3h12M6 21h12M7.5 3c0 5.5 4.5 6.5 4.5 9s-4.5 3.5-4.5 9M16.5 3c0 5.5-4.5 6.5-4.5 9s4.5 3.5 4.5 9" stroke="var(--ds-accent)" />
        </svg>
      );
    case "timer":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M12 9v4l2.5 1.5M9.5 3h5M12 3v2" stroke="var(--ds-accent)" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM6.5 17H20v4H6.5a2.5 2.5 0 0 1 0-5Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "books":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="4.5" height="16" rx="1" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <rect x="9.5" y="6" width="4.5" height="14" rx="1" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <path d="m15 5 4.2 14.5-3.2.9L11.8 6l3.2-1Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M9 3v15M15 6v15" stroke="var(--ds-accent)" />
        </svg>
      );
    case "ruler":
      return (
        <svg {...common}>
          <path d="M16.5 3.5 20.5 7.5 7.5 20.5 3.5 16.5 16.5 3.5Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="m14 6 2 2M11 9l2 2M8 12l2 2" stroke="var(--ds-accent)" />
        </svg>
      );
    case "brain":
      return (
        <svg {...common}>
          <path d="M9.5 4a3.5 3.5 0 0 0-3.3 4.7A3.5 3.5 0 0 0 5 15a3.5 3.5 0 0 0 4.5 4.3V4Zm5 0a3.5 3.5 0 0 1 3.3 4.7A3.5 3.5 0 0 1 19 15a3.5 3.5 0 0 1-4.5 4.3V4Z" fill="var(--ds-indigo-bg)" stroke="var(--ds-indigo)" />
          <path d="M12 4v16" stroke="var(--ds-indigo)" />
        </svg>
      );
    case "bot":
      return (
        <svg {...common}>
          <rect x="4" y="7" width="16" height="12" rx="3.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M12 3v4M9 3h6M9 12.5h.01M15 12.5h.01M9.5 16h5" stroke="var(--ds-accent)" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <ellipse cx="12" cy="12" rx="4" ry="9.5" stroke="var(--ds-accent)" />
          <path d="M2.8 12h18.4" stroke="var(--ds-accent)" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke="var(--ds-success)" strokeWidth="2.1" />
        </svg>
      );
    case "tree":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2.2" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="6" cy="18" r="2.2" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <circle cx="18" cy="18" r="2.2" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M12 7.2V12M12 12l-5 4M12 12l5 4" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="12" cy="11" r="2" fill="var(--ds-accent)" />
        </svg>
      );
    case "question":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2-2.5 3.7M12 17h.01" stroke="var(--ds-accent)" strokeWidth="2" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M12 2H4v8l9.5 9.5a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8L12 2Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="8.5" cy="7.5" r="1.2" fill="var(--ds-accent)" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...common}>
          <path d="M4 4h16l2 9v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l2-9Z" fill="var(--ds-bg-elevated)" stroke="var(--ds-accent)" />
          <path d="M2 13h6l2 3h4l2-3h6" stroke="var(--ds-accent)" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.4-4.7A8.4 8.4 0 0 1 3.5 12 8.5 8.5 0 1 1 21 12Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.2" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2.5" fill="var(--ds-bg-elevated)" stroke="var(--ds-accent)" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="var(--ds-accent)" />
        </svg>
      );
    case "trend-up":
      return (
        <svg {...common}>
          <path d="m3 17 6-6 4 4 8-8M16 7h5v5" stroke="var(--ds-success)" strokeWidth="2" />
        </svg>
      );
    case "trend-down":
      return (
        <svg {...common}>
          <path d="m3 7 6 6 4-4 8 8M16 17h5v-5" stroke="var(--ds-danger)" strokeWidth="2" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
        </svg>
      );
    case "microscope":
      return (
        <svg {...common}>
          <path d="M6 19h12M9 19v-3M14 5l3 3-6 6-3-3 6-6ZM12 11l3 3" stroke="var(--ds-accent)" />
          <path d="M9 19a7 7 0 0 0 7-7" stroke="var(--ds-indigo)" />
        </svg>
      );
    case "graduation":
      return (
        <svg {...common}>
          <path d="M22 10 12 5 2 10l10 5 10-5Z" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M6 12.5v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M22 10v5" stroke="var(--ds-accent)" />
        </svg>
      );
    case "hash":
      return (
        <svg {...common}>
          <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" stroke="var(--ds-accent)" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="8" ry="3" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="var(--ds-accent)" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" fill="var(--ds-warning-bg)" stroke="var(--ds-warning)" />
          <path d="M5 17v4M3 19h4M19 4v3M17.5 5.5h3" stroke="currentColor" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19h16M7 16v-5M12 16V7M17 16v-8" stroke="currentColor" strokeWidth="2.1" />
        </svg>
      );
    case "git-branch":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <circle cx="18" cy="7" r="2.5" fill="var(--ds-success-bg)" stroke="var(--ds-success)" />
          <circle cx="6" cy="18" r="2.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M6 8.5v7M18 9.5c0 4-6 3.5-12 6" stroke="currentColor" />
        </svg>
      );
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2.5" />
          <circle cx="6" cy="17" r="2.5" />
          <path d="M8.2 8.2 19 17M8.2 15.8 19 7" stroke="var(--ds-accent)" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v12M7.5 11.5 12 16l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12.5 4.2 4.2L19 7" strokeWidth="2.2" />
        </svg>
      );
    case "layout":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2.5" fill="var(--ds-accent-bg)" stroke="var(--ds-accent)" />
          <path d="M12 4v16" stroke="var(--ds-accent)" />
        </svg>
      );
    default:
      return null;
  }
}

export default KitIcon;
