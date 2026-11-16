import React from "react";

/**
 * GrammarProLogo
 * Brand identity emblem and wordmark for grammarpro.io.vn
 * Variants:
 * - "header": Compact interactive logo mark + wordmark + .io.vn pill for top navbar
 * - "auth": Centered domain-branded lockup for login/register modals
 * - "footer": Full signature lockup with tagline for global footer
 */
export default function GrammarProLogo({
  variant = "header",
  size = 30,
  onClick = null,
}) {
  const iconSize = variant === "auth" ? 38 : variant === "footer" ? 34 : size;
  const uid = React.useId ? React.useId().replace(/:/g, "") : "gp";

  const emblem = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(37, 99, 235, 0.25))" }}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="52%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id={`${uid}-spark`} x1="41" y1="10" x2="53" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${uid}-bg)`} />
      <rect x="3" y="3" width="58" height="58" rx="15" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" />
      <path
        d="M42.5 23.5C39.8 20.1 35.6 18 30.8 18C22.6 18 16.5 24.3 16.5 32.5C16.5 40.7 22.6 47 31 47C38.6 47 44.5 42.2 45.2 34.8H31.5V30.2H47.5"
        stroke="#ffffff"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 31.5L27.2 34.5L32.8 28" stroke="#67e8f9" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M47 10L48.7 14.3L53 16L48.7 17.7L47 22L45.3 17.7L41 16L45.3 14.3L47 10Z"
        fill={`url(#${uid}-spark)`}
      />
    </svg>
  );

  if (variant === "auth") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.45rem",
          padding: "0.85rem 1rem",
          marginBottom: "1rem",
          borderRadius: "12px",
          background: "linear-gradient(135deg, var(--ds-accent-bg) 0%, var(--ds-bg-elevated) 100%)",
          border: "1px solid var(--ds-accent-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {emblem}
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.025em", color: "var(--ds-text-heading)" }}>
              Grammar<span className="ge-brand-pro-accent">Pro</span>
            </span>
            <span className="ge-domain-pill">.io.vn</span>
          </div>
        </div>
        <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--ds-text-muted)", textAlign: "center" }}>
          Tài khoản học tập đồng bộ trên <strong style={{ color: "var(--ds-accent)" }}>grammarpro.io.vn</strong>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        {emblem}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--ds-text-heading)" }}>
              Grammar<span className="ge-brand-pro-accent">Pro</span>
            </span>
            <span className="ge-domain-pill">grammarpro.io.vn</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)", fontWeight: 500 }}>
            Nền tảng Ngữ pháp Tiếng Anh &amp; Luyện thi TOEIC Cá nhân hóa Data Science
          </span>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {emblem}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
        <span
          className="ge-brand-title"
          style={{
            fontWeight: 800,
            fontSize: "0.95rem",
            letterSpacing: "-0.025em",
            color: "var(--ds-text-heading)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Grammar<span className="ge-brand-pro-accent">Pro</span>
        </span>
        <span className="ge-domain-pill ge-domain-pill-header ge-hide-laptop-compact">
          .io.vn
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="ge-brand-wrap ge-brand-logo-btn ds-focusable"
        aria-label="GrammarPro.io.vn - Về trang tổng quan"
        title="GrammarPro.io.vn — Trang tổng quan"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="ge-brand-wrap" style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      {content}
    </div>
  );
}
