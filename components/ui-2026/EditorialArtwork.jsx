import React from "react";

/**
 * Integrated theme-aware inline SVG illustrations for Homepage Feature Cards & Hero Banners.
 * Uses CSS design tokens exclusively so Light Mode remains airy/crisp (no murky grey fog)
 * and Dark Mode adapts cleanly without external image cache lag.
 */
export function FeatureCardVisual({ kind }) {
  if (kind === "grammar") {
    return (
      <svg
        viewBox="0 0 112 92"
        width="104"
        height="86"
        fill="none"
        aria-hidden="true"
        className="ge-fc-svg"
      >
        <defs>
          <radialGradient id="fc-gram-aura" cx="55%" cy="48%" r="50%">
            <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="44" r="44" fill="url(#fc-gram-aura)" />
        {/* Layered open grammar pages */}
        <rect
          x="20"
          y="16"
          width="74"
          height="52"
          rx="10"
          fill="var(--ds-card)"
          fillOpacity="0.88"
          stroke="var(--ds-accent)"
          strokeOpacity="0.32"
          strokeWidth="1.4"
        />
        <rect
          x="14"
          y="10"
          width="74"
          height="52"
          rx="10"
          fill="var(--ds-card)"
          stroke="var(--ds-accent)"
          strokeOpacity="0.52"
          strokeWidth="1.5"
        />
        <line
          x1="51"
          y1="16"
          x2="51"
          y2="56"
          stroke="var(--ds-accent)"
          strokeOpacity="0.28"
          strokeWidth="1.2"
          strokeDasharray="2.5 2.5"
        />
        {/* Bookmark ribbon */}
        <path
          d="M72 10 H80 V25 L76 21.5 L72 25 Z"
          fill="var(--ds-warning)"
        />
        {/* Left page rules + syntax pill */}
        <rect x="21" y="19" width="22" height="3.5" rx="1.75" fill="var(--ds-accent)" fillOpacity="0.7" />
        <rect x="21" y="26" width="24" height="3" rx="1.5" fill="var(--ds-text-muted)" fillOpacity="0.32" />
        <rect x="21" y="32" width="18" height="3" rx="1.5" fill="var(--ds-text-muted)" fillOpacity="0.24" />
        <rect x="20" y="40" width="26" height="14" rx="4.5" fill="var(--ds-btn-primary)" />
        <text
          x="33"
          y="49.5"
          textAnchor="middle"
          fill="var(--ds-text-on-accent)"
          fontSize="7.5"
          fontWeight="800"
          fontFamily="var(--font-sans)"
        >
          S+V
        </text>
        {/* Right page lines + mastery dot */}
        <rect x="57" y="20" width="12" height="3.5" rx="1.75" fill="var(--ds-cyan)" fillOpacity="0.78" />
        <rect x="57" y="27" width="24" height="3" rx="1.5" fill="var(--ds-text-muted)" fillOpacity="0.32" />
        <rect x="57" y="33" width="20" height="3" rx="1.5" fill="var(--ds-text-muted)" fillOpacity="0.24" />
        <rect
          x="57"
          y="41"
          width="24"
          height="12"
          rx="6"
          fill="var(--ds-success)"
          fillOpacity="0.16"
          stroke="var(--ds-success)"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        <circle cx="69" cy="47" r="3" fill="var(--ds-success)" />
        {/* Tense timeline axis below book */}
        <line
          x1="22"
          y1="78"
          x2="86"
          y2="78"
          stroke="var(--ds-accent)"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="28" cy="78" r="3.5" fill="var(--ds-warning)" />
        <circle cx="54" cy="78" r="4.5" fill="var(--ds-success)" />
        <circle cx="54" cy="78" r="7.5" stroke="var(--ds-success)" strokeOpacity="0.3" strokeWidth="1.2" />
        <circle cx="80" cy="78" r="3.5" fill="var(--ds-accent)" />
      </svg>
    );
  }

  if (kind === "diagnostic") {
    return (
      <svg
        viewBox="0 0 112 92"
        width="104"
        height="86"
        fill="none"
        aria-hidden="true"
        className="ge-fc-svg"
      >
        <defs>
          <radialGradient id="fc-diag-aura" cx="55%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ds-indigo)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--ds-indigo)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="58" cy="46" r="44" fill="url(#fc-diag-aura)" />
        <g transform="translate(58, 46)">
          <polygon
            points="0,-34 29.4,-17 29.4,17 0,34 -29.4,17 -29.4,-17"
            fill="var(--ds-card)"
            fillOpacity="0.65"
            stroke="var(--ds-indigo)"
            strokeOpacity="0.34"
            strokeWidth="1.2"
          />
          <polygon
            points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11"
            stroke="var(--ds-indigo)"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeDasharray="2.5 2.5"
          />
          <polygon
            points="0,-10 8.6,-5 8.6,5 0,10 -8.6,5 -8.6,-5"
            stroke="var(--ds-indigo)"
            strokeOpacity="0.24"
            strokeWidth="1"
          />
          <g stroke="var(--ds-indigo)" strokeOpacity="0.22" strokeWidth="1">
            <line x1="0" y1="-34" x2="0" y2="34" />
            <line x1="-29.4" y1="-17" x2="29.4" y2="17" />
            <line x1="-29.4" y1="17" x2="29.4" y2="-17" />
          </g>
          {/* Active Diagnostic Score Shape */}
          <polygon
            points="0,-29 25,-12 17,12 0,26 -22,9 -19,-15"
            fill="var(--ds-indigo)"
            fillOpacity="0.28"
            stroke="var(--ds-indigo)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="-29" r="3" fill="var(--ds-indigo)" stroke="var(--ds-card)" strokeWidth="1.2" />
          <circle cx="25" cy="-12" r="3" fill="var(--ds-cyan)" stroke="var(--ds-card)" strokeWidth="1.2" />
          <circle cx="17" cy="12" r="3" fill="var(--ds-success)" stroke="var(--ds-card)" strokeWidth="1.2" />
          <circle cx="0" cy="26" r="3" fill="var(--ds-accent)" stroke="var(--ds-card)" strokeWidth="1.2" />
          <circle cx="-22" cy="9" r="3" fill="var(--ds-warning)" stroke="var(--ds-card)" strokeWidth="1.2" />
          <circle cx="-19" cy="-15" r="3" fill="var(--ds-indigo)" stroke="var(--ds-card)" strokeWidth="1.2" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 112 92"
      width="104"
      height="86"
      fill="none"
      aria-hidden="true"
      className="ge-fc-svg"
    >
      <defs>
        <radialGradient id="fc-toeic-aura" cx="55%" cy="48%" r="50%">
          <stop offset="0%" stopColor="var(--ds-success)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--ds-success)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fc-toeic-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ds-cyan)" />
          <stop offset="60%" stopColor="var(--ds-success)" />
          <stop offset="100%" stopColor="var(--ds-warning)" />
        </linearGradient>
      </defs>
      <circle cx="58" cy="46" r="44" fill="url(#fc-toeic-aura)" />
      {/* 990 Dial Ring */}
      <g transform="translate(58, 46)">
        <path
          d="M -32 6 A 33 33 0 1 1 32 6"
          stroke="var(--ds-success)"
          strokeOpacity="0.2"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M -32 6 A 33 33 0 1 1 26 -14"
          stroke="url(#fc-toeic-arc)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="26" cy="-14" r="4" fill="var(--ds-warning)" stroke="var(--ds-card)" strokeWidth="1.4" />
        <text
          x="0"
          y="1"
          textAnchor="middle"
          fill="var(--ds-success)"
          fontSize="16"
          fontWeight="900"
          fontFamily="var(--font-heading)"
        >
          990
        </text>
        <text
          x="0"
          y="11"
          textAnchor="middle"
          fill="var(--ds-text-muted)"
          fontSize="6.5"
          fontWeight="800"
          fontFamily="var(--font-sans)"
        >
          TOEIC AI
        </text>
      </g>
      {/* Soundwave equalizer bars below */}
      <g fill="var(--ds-success)" fillOpacity="0.72">
        <rect x="33" y="75" width="3" height="6" rx="1.5" />
        <rect x="39" y="71" width="3" height="12" rx="1.5" />
        <rect x="45" y="73" width="3" height="9" rx="1.5" />
        <rect x="51" y="69" width="3" height="15" rx="1.5" />
        <rect x="57" y="72" width="3" height="10" rx="1.5" />
        <rect x="63" y="70" width="3" height="13" rx="1.5" />
        <rect x="69" y="73" width="3" height="8" rx="1.5" />
        <rect x="75" y="75" width="3" height="6" rx="1.5" />
      </g>
    </svg>
  );
}

/**
 * Seamless atmospheric hero backdrop:
 * - Light Mode: crisp transparent architectural vector SVG blended into airy tinted canvas (0 muddy grey fog).
 * - Dark Mode: rich glowing raster WebP artwork blended invisibly into #111115 dark canvas.
 */
export function HeroBannerVisual({ kind, webpSrc }) {
  return (
    <>
      {webpSrc && (
        <img
          src={webpSrc}
          alt=""
          aria-hidden="true"
          width={1440}
          height={420}
          loading={kind === "gamification" ? "lazy" : undefined}
          className="ge-hero-banner-bg ge-hero-dark-only"
        />
      )}
      <div className="ge-hero-banner-scrim ge-hero-dark-only" aria-hidden="true" />
      <div className="ge-hero-light-vector ge-hero-light-only" aria-hidden="true">
        <HeroLightSvg kind={kind} />
      </div>
    </>
  );
}

function HeroLightSvg({ kind }) {
  if (kind === "vip") {
    return (
      <svg viewBox="0 0 360 180" width="100%" height="100%" preserveAspectRatio="xMaxYMid meet" fill="none">
        <defs>
          <radialGradient id="hl-vip-aura" cx="72%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ds-success)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--ds-success)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="256" cy="90" r="88" fill="url(#hl-vip-aura)" />
        {/* Architectural dot matrix */}
        <g fill="var(--ds-accent)" fillOpacity="0.16">
          <circle cx="150" cy="34" r="2" />
          <circle cx="180" cy="34" r="2" />
          <circle cx="150" cy="64" r="2" />
          <circle cx="180" cy="64" r="2" />
          <circle cx="150" cy="124" r="2" />
          <circle cx="180" cy="124" r="2" />
        </g>
        {/* VIP Emerald Shield */}
        <g transform="translate(212, 26)">
          <path
            d="M44 6 L84 22 V66 C84 98 63 120 44 128 C25 120 4 98 4 66 V22 L44 6 Z"
            fill="var(--ds-success)"
            fillOpacity="0.14"
            stroke="var(--ds-success)"
            strokeOpacity="0.55"
            strokeWidth="2.5"
          />
          <path
            d="M44 18 L73 30 V64 C73 88 57 105 44 112 C31 105 15 88 15 64 V30 L44 18 Z"
            fill="var(--ds-card)"
            fillOpacity="0.72"
            stroke="var(--ds-warning)"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          {/* Crown silhouette */}
          <path
            d="M27 65 L32 45 L44 55 L56 45 L61 65 Z"
            fill="var(--ds-warning)"
            fillOpacity="0.88"
          />
          <rect x="27" y="68" width="34" height="5" rx="2.5" fill="var(--ds-warning)" fillOpacity="0.88" />
          {/* Diamond gem */}
          <polygon points="44,78 52,87 44,96 36,87" fill="var(--ds-cyan)" fillOpacity="0.75" />
        </g>
        {/* Golden Unlock Key accent */}
        <g transform="translate(292, 62) rotate(-25)">
          <circle cx="16" cy="16" r="14" stroke="var(--ds-warning)" strokeWidth="4" fill="var(--ds-card)" fillOpacity="0.85" />
          <circle cx="16" cy="16" r="5" fill="var(--ds-warning)" fillOpacity="0.65" />
          <rect x="28" y="13" width="28" height="6" rx="3" fill="var(--ds-warning)" />
          <rect x="44" y="19" width="5" height="8" rx="1.5" fill="var(--ds-warning)" />
          <rect x="51" y="19" width="5" height="6" rx="1.5" fill="var(--ds-warning)" />
        </g>
      </svg>
    );
  }

  if (kind === "gamification") {
    return (
      <svg viewBox="0 0 360 160" width="100%" height="100%" preserveAspectRatio="xMaxYMid meet" fill="none">
        <defs>
          <radialGradient id="hl-gam-aura" cx="72%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ds-warning)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--ds-warning)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="262" cy="80" r="82" fill="url(#hl-gam-aura)" />
        {/* 3-tier Podium */}
        <rect x="198" y="102" width="38" height="36" rx="6" fill="var(--ds-accent)" fillOpacity="0.16" stroke="var(--ds-accent)" strokeOpacity="0.38" strokeWidth="1.4" />
        <rect x="242" y="84" width="44" height="54" rx="6" fill="var(--ds-warning)" fillOpacity="0.2" stroke="var(--ds-warning)" strokeOpacity="0.55" strokeWidth="1.5" />
        <rect x="292" y="110" width="38" height="28" rx="6" fill="var(--ds-success)" fillOpacity="0.16" stroke="var(--ds-success)" strokeOpacity="0.38" strokeWidth="1.4" />
        {/* Gold Trophy */}
        <g transform="translate(244, 24)">
          <path d="M10 10 H30 V24 C30 32 25 38 20 38 C15 38 10 32 10 24 Z" fill="var(--ds-warning)" fillOpacity="0.86" />
          <path d="M10 14 H5 C5 22 8 25 10 25" stroke="var(--ds-warning)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 14 H35 C35 22 32 25 30 25" stroke="var(--ds-warning)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="17" y="38" width="6" height="9" fill="var(--ds-warning)" />
          <rect x="11" y="47" width="18" height="5" rx="2.5" fill="var(--ds-warning)" />
        </g>
        {/* Star sparks */}
        <circle cx="212" cy="46" r="3" fill="var(--ds-accent)" fillOpacity="0.55" />
        <circle cx="312" cy="48" r="3.5" fill="var(--ds-success)" fillOpacity="0.55" />
        <circle cx="326" cy="76" r="2.5" fill="var(--ds-warning)" fillOpacity="0.65" />
      </svg>
    );
  }

  if (kind === "diagnostic") {
    return (
      <svg viewBox="0 0 360 180" width="100%" height="100%" preserveAspectRatio="xMaxYMid meet" fill="none">
        <defs>
          <radialGradient id="hl-diag-aura" cx="72%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ds-indigo)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--ds-indigo)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="262" cy="90" r="84" fill="url(#hl-diag-aura)" />
        <g transform="translate(262, 90)">
          <polygon points="0,-58 50,-29 50,29 0,58 -50,29 -50,-29" stroke="var(--ds-indigo)" strokeOpacity="0.32" strokeWidth="1.5" fill="var(--ds-card)" fillOpacity="0.65" />
          <polygon points="0,-38 33,-19 33,19 0,38 -33,19 -33,-19" stroke="var(--ds-indigo)" strokeOpacity="0.28" strokeWidth="1.2" strokeDasharray="4 4" />
          <line x1="0" y1="-58" x2="0" y2="58" stroke="var(--ds-indigo)" strokeOpacity="0.2" />
          <line x1="-50" y1="-29" x2="50" y2="29" stroke="var(--ds-indigo)" strokeOpacity="0.2" />
          <line x1="-50" y1="29" x2="50" y2="-29" stroke="var(--ds-indigo)" strokeOpacity="0.2" />
          <polygon points="0,-46 42,-19 28,24 0,44 -36,14 -30,-22" fill="var(--ds-indigo)" fillOpacity="0.25" stroke="var(--ds-indigo)" strokeWidth="2.2" />
          <circle cx="0" cy="-46" r="4" fill="var(--ds-indigo)" />
          <circle cx="42" cy="-19" r="4" fill="var(--ds-cyan)" />
          <circle cx="28" cy="24" r="4" fill="var(--ds-success)" />
          <circle cx="-36" cy="14" r="4" fill="var(--ds-warning)" />
        </g>
      </svg>
    );
  }

  /* Default: Dashboard Welcome Hero Light Vector */
  return (
    <svg viewBox="0 0 380 180" width="100%" height="100%" preserveAspectRatio="xMaxYMid meet" fill="none">
      <defs>
        <radialGradient id="hl-dash-aura" cx="72%" cy="46%" r="52%">
          <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hl-dash-area" x1="150" y1="70" x2="320" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--ds-cyan)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <circle cx="272" cy="82" r="96" fill="url(#hl-dash-aura)" />
      {/* Subtle blueprint grid */}
      <g stroke="var(--ds-accent)" strokeOpacity="0.14" strokeWidth="1">
        <path d="M130 42 H360 M130 82 H360 M130 122 H360 M130 156 H360" />
        <path d="M180 16 V164 M236 16 V164 M292 16 V164 M344 16 V164" />
      </g>
      {/* Rising mastery area & spline */}
      <path
        d="M156 146 L212 122 L262 100 L314 60 V156 H156 Z"
        fill="url(#hl-dash-area)"
      />
      <path
        d="M156 146 L212 122 L262 100 L314 60"
        stroke="var(--ds-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="156" cy="146" r="4.5" fill="var(--ds-card)" stroke="var(--ds-accent)" strokeWidth="2.5" />
      <circle cx="212" cy="122" r="4.5" fill="var(--ds-card)" stroke="var(--ds-accent)" strokeWidth="2.5" />
      <circle cx="262" cy="100" r="4.5" fill="var(--ds-card)" stroke="var(--ds-cyan)" strokeWidth="2.5" />
      {/* Circular Mastery Ring Badge top-right */}
      <g transform="translate(314, 56)">
        <circle cx="0" cy="0" r="30" fill="var(--ds-card)" fillOpacity="0.92" stroke="var(--ds-accent)" strokeOpacity="0.22" strokeWidth="5" />
        <path d="M 0 -30 A 30 30 0 1 1 -25 16" stroke="var(--ds-accent)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M -9 0 L -3 6 L 10 -7" stroke="var(--ds-success)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Sparkle accents */}
      <circle cx="192" cy="54" r="3" fill="var(--ds-warning)" fillOpacity="0.72" />
      <circle cx="352" cy="24" r="2.5" fill="var(--ds-success)" fillOpacity="0.72" />
    </svg>
  );
}
