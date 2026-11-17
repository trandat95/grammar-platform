import React from "react";

/**
 * Integrated theme-aware inline SVG illustrations for Feature Cards, Section Banners,
 * Achievement Cards, and Light/Dark Hero Headers.
 * Strict CSS token discipline (zero raw HEX) ensures instant theme adaptation and zero cache lag.
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
        <path d="M72 10 H80 V25 L76 21.5 L72 25 Z" fill="var(--ds-warning)" />
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

  /* Concentric TOEIC 990 Dial (Exact r=30 polar math around center (56, 40)) */
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
        <radialGradient id="fc-toeic-aura" cx="50%" cy="44%" r="50%">
          <stop offset="0%" stopColor="var(--ds-success)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--ds-success)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fc-toeic-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ds-cyan)" />
          <stop offset="60%" stopColor="var(--ds-success)" />
          <stop offset="100%" stopColor="var(--ds-warning)" />
        </linearGradient>
      </defs>
      <circle cx="56" cy="40" r="42" fill="url(#fc-toeic-aura)" />
      {/* True circle center (56, 40), exact radius r=30 from 140deg (-23, 19.3) clockwise to 40deg (23, 19.3) */}
      <g transform="translate(56, 40)">
        <path
          d="M -23 19.3 A 30 30 0 1 1 23 19.3"
          stroke="var(--ds-success)"
          strokeOpacity="0.2"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        {/* Active arc from 140deg to +15deg (28.98, 7.76 on r=30 circle) */}
        <path
          d="M -23 19.3 A 30 30 0 1 1 29 7.8"
          stroke="url(#fc-toeic-arc)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <circle cx="29" cy="7.8" r="4" fill="var(--ds-warning)" stroke="var(--ds-card)" strokeWidth="1.4" />
        <text
          x="0"
          y="2"
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
          y="12"
          textAnchor="middle"
          fill="var(--ds-text-muted)"
          fontSize="6"
          fontWeight="800"
          fontFamily="var(--font-sans)"
        >
          TOEIC AI
        </text>
      </g>
      {/* Equalizer centered symmetrically around x=56 */}
      <g fill="var(--ds-success)" fillOpacity="0.72">
        <rect x="33.5" y="75" width="3" height="6" rx="1.5" />
        <rect x="39.5" y="72" width="3" height="12" rx="1.5" />
        <rect x="45.5" y="73.5" width="3" height="9" rx="1.5" />
        <rect x="51.5" y="70" width="3" height="15" rx="1.5" />
        <rect x="57.5" y="70" width="3" height="15" rx="1.5" />
        <rect x="63.5" y="73.5" width="3" height="9" rx="1.5" />
        <rect x="69.5" y="72" width="3" height="12" rx="1.5" />
        <rect x="75.5" y="75" width="3" height="6" rx="1.5" />
      </g>
    </svg>
  );
}

/**
 * Subtle translucent watermark artwork blended into bottom-right / right corner of
 * Section Banners, Quiz Arena, TOEIC Hub Cards, and Achievement Badge Cards.
 */
export function SectionCardWatermark({ kind }) {
  return (
    <div className="ge-section-watermark" aria-hidden="true">
      <SectionWatermarkSvg kind={kind} />
    </div>
  );
}

export function BadgeCardWatermark({ category, tier, unlocked }) {
  const toneVar =
    tier === "Diamond"
      ? "var(--ds-accent)"
      : tier === "Gold"
      ? "var(--ds-warning)"
      : tier === "Silver"
      ? "var(--ds-indigo)"
      : "var(--ds-success)";

  return (
    <div
      className={`ge-badge-watermark ${unlocked ? "is-unlocked" : "is-locked"}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 76" width="96" height="76" fill="none">
        <circle cx="68" cy="52" r="34" fill={toneVar} fillOpacity="0.14" />
        <circle
          cx="68"
          cy="52"
          r="24"
          stroke={toneVar}
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        {category === "Learning Consistency" ? (
          <path
            d="M68 30 C76 40 78 48 73 57 C71 61 65 62 62 58 C57 52 59 42 68 30 Z"
            fill={toneVar}
            fillOpacity="0.34"
          />
        ) : category === "Grammar Mastery" ? (
          <g stroke={toneVar} strokeOpacity="0.46" strokeWidth="1.8">
            <rect x="50" y="34" width="30" height="24" rx="4" fill={toneVar} fillOpacity="0.18" />
            <line x1="65" y1="36" x2="65" y2="56" />
          </g>
        ) : category === "Accuracy & Performance" ? (
          <g stroke={toneVar} strokeOpacity="0.46" strokeWidth="1.8">
            <circle cx="68" cy="50" r="14" />
            <circle cx="68" cy="50" r="7" />
            <circle cx="68" cy="50" r="2.5" fill={toneVar} />
          </g>
        ) : (
          <path
            d="M68 32 L72 43 L84 44 L75 51 L78 63 L68 56 L58 63 L61 51 L52 44 L64 43 Z"
            fill={toneVar}
            fillOpacity="0.32"
          />
        )}
      </svg>
    </div>
  );
}

function SectionWatermarkSvg({ kind }) {
  if (kind === "next-lesson") {
    return (
      <svg viewBox="0 0 180 120" width="170" height="114" fill="none">
        <circle cx="136" cy="58" r="46" fill="var(--ds-accent)" fillOpacity="0.1" />
        <rect x="86" y="24" width="76" height="58" rx="9" fill="var(--ds-accent)" fillOpacity="0.12" stroke="var(--ds-accent)" strokeOpacity="0.35" strokeWidth="1.5" />
        <line x1="124" y1="30" x2="124" y2="76" stroke="var(--ds-accent)" strokeOpacity="0.3" strokeWidth="1.4" strokeDasharray="3 3" />
        <path d="M144 24 H153 V40 L148.5 36.5 L144 40 Z" fill="var(--ds-warning)" fillOpacity="0.7" />
        <circle cx="104" cy="48" r="6" fill="var(--ds-accent)" fillOpacity="0.35" />
        <path d="M98 94 L156 94" stroke="var(--ds-success)" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
        <circle cx="136" cy="94" r="5" fill="var(--ds-success)" fillOpacity="0.65" />
      </svg>
    );
  }

  if (kind === "spaced-rep") {
    return (
      <svg viewBox="0 0 180 120" width="170" height="114" fill="none">
        <circle cx="132" cy="62" r="46" fill="var(--ds-indigo)" fillOpacity="0.1" />
        <path d="M76 92 C98 44, 128 84, 162 34" stroke="var(--ds-success)" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
        <circle cx="88" cy="70" r="4.5" fill="var(--ds-accent)" fillOpacity="0.7" />
        <circle cx="118" cy="66" r="4.5" fill="var(--ds-indigo)" fillOpacity="0.7" />
        <circle cx="144" cy="52" r="5.5" fill="var(--ds-success)" fillOpacity="0.8" />
        <circle cx="162" cy="34" r="6" fill="var(--ds-warning)" fillOpacity="0.75" />
      </svg>
    );
  }

  if (kind === "quiz-arena") {
    return (
      <svg viewBox="0 0 200 120" width="190" height="114" fill="none">
        <circle cx="148" cy="58" r="50" fill="var(--ds-accent)" fillOpacity="0.1" />
        <rect x="94" y="20" width="84" height="54" rx="10" fill="var(--ds-card)" fillOpacity="0.7" stroke="var(--ds-accent)" strokeOpacity="0.35" strokeWidth="1.5" />
        <rect x="106" y="32" width="44" height="6" rx="3" fill="var(--ds-accent)" fillOpacity="0.45" />
        <rect x="106" y="44" width="60" height="5" rx="2.5" fill="var(--ds-text-muted)" fillOpacity="0.28" />
        <circle cx="162" cy="58" r="14" fill="var(--ds-success)" fillOpacity="0.2" stroke="var(--ds-success)" strokeOpacity="0.6" strokeWidth="1.5" />
        <path d="M157 58 L160.5 61.5 L167 54" stroke="var(--ds-success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "toeic-diag") {
    return (
      <svg viewBox="0 0 140 100" width="132" height="94" fill="none">
        <circle cx="102" cy="54" r="36" fill="var(--ds-accent)" fillOpacity="0.1" />
        <circle cx="102" cy="54" r="24" stroke="var(--ds-accent)" strokeOpacity="0.35" strokeWidth="1.6" strokeDasharray="4 3" />
        <circle cx="102" cy="54" r="12" stroke="var(--ds-indigo)" strokeOpacity="0.45" strokeWidth="1.6" />
        <circle cx="102" cy="54" r="4" fill="var(--ds-accent)" fillOpacity="0.7" />
      </svg>
    );
  }

  if (kind === "toeic-xray") {
    return (
      <svg viewBox="0 0 140 100" width="132" height="94" fill="none">
        <circle cx="102" cy="54" r="36" fill="var(--ds-success)" fillOpacity="0.1" />
        <rect x="64" y="34" width="62" height="8" rx="4" fill="var(--ds-success)" fillOpacity="0.28" />
        <rect x="74" y="48" width="52" height="8" rx="4" fill="var(--ds-cyan)" fillOpacity="0.32" />
        <rect x="68" y="62" width="58" height="8" rx="4" fill="var(--ds-accent)" fillOpacity="0.25" />
      </svg>
    );
  }

  if (kind === "toeic-tests") {
    return (
      <svg viewBox="0 0 140 100" width="132" height="94" fill="none">
        <circle cx="102" cy="54" r="36" fill="var(--ds-warning)" fillOpacity="0.1" />
        <rect x="74" y="26" width="48" height="58" rx="7" fill="var(--ds-card)" fillOpacity="0.65" stroke="var(--ds-warning)" strokeOpacity="0.42" strokeWidth="1.5" />
        <rect x="83" y="38" width="30" height="4" rx="2" fill="var(--ds-warning)" fillOpacity="0.55" />
        <rect x="83" y="48" width="24" height="4" rx="2" fill="var(--ds-text-muted)" fillOpacity="0.32" />
        <path d="M88 64 L93 69 L106 56" stroke="var(--ds-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "toeic-dictation") {
    return (
      <svg viewBox="0 0 140 100" width="132" height="94" fill="none">
        <circle cx="102" cy="54" r="36" fill="var(--ds-cyan)" fillOpacity="0.12" />
        <g fill="var(--ds-accent)" fillOpacity="0.42">
          <rect x="74" y="50" width="4" height="16" rx="2" />
          <rect x="82" y="40" width="4" height="36" rx="2" />
          <rect x="90" y="46" width="4" height="24" rx="2" />
          <rect x="98" y="34" width="4" height="48" rx="2" />
          <rect x="106" y="42" width="4" height="32" rx="2" />
          <rect x="114" y="48" width="4" height="20" rx="2" />
        </g>
      </svg>
    );
  }

  /* toeic-fast CTA bar watermark */
  return (
    <svg viewBox="0 0 160 80" width="150" height="74" fill="none">
      <circle cx="122" cy="40" r="34" fill="var(--ds-accent)" fillOpacity="0.1" />
      <g fill="var(--ds-accent)" fillOpacity="0.22">
        <rect x="78" y="18" width="18" height="18" rx="4" />
        <rect x="102" y="18" width="18" height="18" rx="4" />
        <rect x="126" y="18" width="18" height="18" rx="4" />
        <rect x="78" y="42" width="18" height="18" rx="4" />
        <rect x="102" y="42" width="18" height="18" rx="4" />
        <rect x="126" y="42" width="18" height="18" rx="4" fill="var(--ds-success)" fillOpacity="0.35" />
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
  if (kind === "toeic") {
    return (
      <svg viewBox="0 0 360 180" width="100%" height="100%" preserveAspectRatio="xMaxYMid meet" fill="none">
        <defs>
          <radialGradient id="hl-toeic-aura" cx="72%" cy="50%" r="52%">
            <stop offset="0%" stopColor="var(--ds-success)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--ds-success)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hl-toeic-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ds-cyan)" />
            <stop offset="60%" stopColor="var(--ds-success)" />
            <stop offset="100%" stopColor="var(--ds-warning)" />
          </linearGradient>
        </defs>
        <circle cx="268" cy="90" r="88" fill="url(#hl-toeic-aura)" />
        {/* Audio dictation equalizer motif */}
        <g fill="var(--ds-accent)" fillOpacity="0.26">
          <rect x="166" y="76" width="5" height="28" rx="2.5" />
          <rect x="176" y="64" width="5" height="52" rx="2.5" />
          <rect x="186" y="72" width="5" height="36" rx="2.5" />
          <rect x="196" y="58" width="5" height="64" rx="2.5" />
        </g>
        {/* Concentric 990 Dial centered at (276, 90), exact r=52 */}
        <g transform="translate(276, 90)">
          <path d="M -39.8 33.4 A 52 52 0 1 1 39.8 33.4" stroke="var(--ds-success)" strokeOpacity="0.2" strokeWidth="10" strokeLinecap="round" />
          <path d="M -39.8 33.4 A 52 52 0 1 1 50.2 13.5" stroke="url(#hl-toeic-arc)" strokeWidth="10" strokeLinecap="round" />
          <circle cx="50.2" cy="13.5" r="6" fill="var(--ds-warning)" stroke="var(--ds-card)" strokeWidth="2" />
          <text x="0" y="3" textAnchor="middle" fill="var(--ds-success)" fontSize="24" fontWeight="900" fontFamily="var(--font-heading)">990</text>
          <text x="0" y="18" textAnchor="middle" fill="var(--ds-text-muted)" fontSize="8.5" fontWeight="800" fontFamily="var(--font-sans)">TARGET SCORE</text>
        </g>
      </svg>
    );
  }

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
        <g fill="var(--ds-accent)" fillOpacity="0.16">
          <circle cx="150" cy="34" r="2" />
          <circle cx="180" cy="34" r="2" />
          <circle cx="150" cy="64" r="2" />
          <circle cx="180" cy="64" r="2" />
          <circle cx="150" cy="124" r="2" />
          <circle cx="180" cy="124" r="2" />
        </g>
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
          <path d="M27 65 L32 45 L44 55 L56 45 L61 65 Z" fill="var(--ds-warning)" fillOpacity="0.88" />
          <rect x="27" y="68" width="34" height="5" rx="2.5" fill="var(--ds-warning)" fillOpacity="0.88" />
          <polygon points="44,78 52,87 44,96 36,87" fill="var(--ds-cyan)" fillOpacity="0.75" />
        </g>
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
        <rect x="198" y="102" width="38" height="36" rx="6" fill="var(--ds-accent)" fillOpacity="0.16" stroke="var(--ds-accent)" strokeOpacity="0.38" strokeWidth="1.4" />
        <rect x="242" y="84" width="44" height="54" rx="6" fill="var(--ds-warning)" fillOpacity="0.2" stroke="var(--ds-warning)" strokeOpacity="0.55" strokeWidth="1.5" />
        <rect x="292" y="110" width="38" height="28" rx="6" fill="var(--ds-success)" fillOpacity="0.16" stroke="var(--ds-success)" strokeOpacity="0.38" strokeWidth="1.4" />
        <g transform="translate(244, 24)">
          <path d="M10 10 H30 V24 C30 32 25 38 20 38 C15 38 10 32 10 24 Z" fill="var(--ds-warning)" fillOpacity="0.86" />
          <path d="M10 14 H5 C5 22 8 25 10 25" stroke="var(--ds-warning)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 14 H35 C35 22 32 25 30 25" stroke="var(--ds-warning)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="17" y="38" width="6" height="9" fill="var(--ds-warning)" />
          <rect x="11" y="47" width="18" height="5" rx="2.5" fill="var(--ds-warning)" />
        </g>
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
          <radialGradient id="hl-diag-aura" cx="78%" cy="50%" r="48%">
            <stop offset="0%" stopColor="var(--ds-indigo)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--ds-indigo)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="282" cy="90" r="76" fill="url(#hl-diag-aura)" />
        <g transform="translate(282, 90)">
          <polygon points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25" stroke="var(--ds-indigo)" strokeOpacity="0.3" strokeWidth="1.4" fill="var(--ds-card)" fillOpacity="0.6" />
          <polygon points="0,-32 27.7,-16 27.7,16 0,32 -27.7,16 -27.7,-16" stroke="var(--ds-indigo)" strokeOpacity="0.25" strokeWidth="1.1" strokeDasharray="3.5 3.5" />
          <line x1="0" y1="-50" x2="0" y2="50" stroke="var(--ds-indigo)" strokeOpacity="0.18" />
          <line x1="-43.3" y1="-25" x2="43.3" y2="25" stroke="var(--ds-indigo)" strokeOpacity="0.18" />
          <line x1="-43.3" y1="25" x2="43.3" y2="-25" stroke="var(--ds-indigo)" strokeOpacity="0.18" />
          <polygon points="0,-40 36,-16 24,20 0,38 -31,12 -26,-19" fill="var(--ds-indigo)" fillOpacity="0.22" stroke="var(--ds-indigo)" strokeWidth="2" />
          <circle cx="0" cy="-40" r="3.5" fill="var(--ds-indigo)" />
          <circle cx="36" cy="-16" r="3.5" fill="var(--ds-cyan)" />
          <circle cx="24" cy="20" r="3.5" fill="var(--ds-success)" />
          <circle cx="-31" cy="12" r="3.5" fill="var(--ds-warning)" />
        </g>
      </svg>
    );
  }

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
      <g stroke="var(--ds-accent)" strokeOpacity="0.14" strokeWidth="1">
        <path d="M130 42 H360 M130 82 H360 M130 122 H360 M130 156 H360" />
        <path d="M180 16 V164 M236 16 V164 M292 16 V164 M344 16 V164" />
      </g>
      <path d="M156 146 L212 122 L262 100 L314 60 V156 H156 Z" fill="url(#hl-dash-area)" />
      <path d="M156 146 L212 122 L262 100 L314 60" stroke="var(--ds-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="156" cy="146" r="4.5" fill="var(--ds-card)" stroke="var(--ds-accent)" strokeWidth="2.5" />
      <circle cx="212" cy="122" r="4.5" fill="var(--ds-card)" stroke="var(--ds-accent)" strokeWidth="2.5" />
      <circle cx="262" cy="100" r="4.5" fill="var(--ds-card)" stroke="var(--ds-cyan)" strokeWidth="2.5" />
      <g transform="translate(314, 56)">
        <circle cx="0" cy="0" r="30" fill="var(--ds-card)" fillOpacity="0.92" stroke="var(--ds-accent)" strokeOpacity="0.22" strokeWidth="5" />
        <path d="M 0 -30 A 30 30 0 1 1 -25 16" stroke="var(--ds-accent)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M -9 0 L -3 6 L 10 -7" stroke="var(--ds-success)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="192" cy="54" r="3" fill="var(--ds-warning)" fillOpacity="0.72" />
      <circle cx="352" cy="24" r="2.5" fill="var(--ds-success)" fillOpacity="0.72" />
    </svg>
  );
}
