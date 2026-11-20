import React from "react";
import { BANNER_PATHS, OBJECT_3D_PATHS } from "./assetMap";

const FEATURE_3D_MAP = {
  grammar: {
    src: OBJECT_3D_PATHS.grammarBook,
    alt: "Sổ tay ngữ pháp 3D",
    tone: "sky",
  },
  diagnostic: {
    src: OBJECT_3D_PATHS.diagnosticPrism,
    alt: "Lăng kính đo trình độ 3D",
    tone: "lavender",
  },
  toeic: {
    src: OBJECT_3D_PATHS.toeicHeadphones,
    alt: "Tai nghe luyện thi TOEIC 3D",
    tone: "mint",
    scoreBadge: "990",
  },
  library: {
    src: OBJECT_3D_PATHS.grammarLibrary,
    alt: "Thư viện 12 chương ngữ pháp 3D",
    tone: "sky",
  },
  ai: {
    src: OBJECT_3D_PATHS.aiSparkLens,
    alt: "Kính lúp AI phân tích ngữ pháp 3D",
    tone: "lavender",
  },
  quiz: {
    src: OBJECT_3D_PATHS.quizTarget,
    alt: "Bia mục tiêu luyện Quiz 3D",
    tone: "peach",
  },
  mistakes: {
    src: OBJECT_3D_PATHS.mistakeShield,
    alt: "Khiên bảo vệ sửa lỗi sai 3D",
    tone: "rose",
  },
  vocab: {
    src: OBJECT_3D_PATHS.vocabCards,
    alt: "Bộ thẻ Flashcard từ vựng 3D",
    tone: "amber",
  },
  exam: {
    src: OBJECT_3D_PATHS.toeicExamSheet,
    alt: "Bộ đề thi thử TOEIC 3D",
    tone: "mint",
  },
  xray: {
    src: OBJECT_3D_PATHS.toeicXrayLens,
    alt: "Lăng kính quang phổ X-Ray 3D",
    tone: "lavender",
  },
  dictation: {
    src: OBJECT_3D_PATHS.dictationMic,
    alt: "Micro luyện nghe chép 3D",
    tone: "mint",
  },
  roadmap: {
    src: OBJECT_3D_PATHS.roadmapCompass,
    alt: "La bàn lộ trình học tập 3D",
    tone: "sky",
  },
  trophy: {
    src: OBJECT_3D_PATHS.trophyGold,
    alt: "Cúp bảng xếp hạng 3D",
    tone: "gold",
  },
  streak: {
    src: OBJECT_3D_PATHS.streakFlame,
    alt: "Ngọn lửa chuỗi ngày học 3D",
    tone: "amber",
  },
  vip: {
    src: OBJECT_3D_PATHS.vipDiamond,
    alt: "Kim cương gói VIP 3D",
    tone: "gold",
  },
};

/**
 * Pastel Glass 2026 Soft-3D Visual for Feature Cards & Bento Modules
 * Uses transparent studio-rendered 512x512 WebP objects with CSS ambient halo (Light & Dark Mode)
 */
export function FeatureCardVisual({ kind = "grammar", size, className = "" }) {
  const item = FEATURE_3D_MAP[kind] || FEATURE_3D_MAP.grammar;
  return (
    <div
      className={`pg-3d-visual pg-3d-visual--${item.tone} ${className}`.trim()}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
      aria-hidden="true"
    >
      <span className="pg-3d-aura" />
      <img
        src={item.src}
        alt={item.alt}
        width={120}
        height={120}
        loading={kind === "grammar" || kind === "diagnostic" || kind === "toeic" ? "eager" : "lazy"}
        className="pg-3d-img"
      />
      {item.scoreBadge && (
        <span className="pg-3d-score-pill" aria-hidden="true">
          {item.scoreBadge}
        </span>
      )}
    </div>
  );
}

const SECTION_WATERMARK_3D = {
  "next-lesson": { src: OBJECT_3D_PATHS.grammarLibrary, tone: "sky" },
  "spaced-rep": { src: OBJECT_3D_PATHS.mistakeShield, tone: "rose" },
  "quiz-arena": { src: OBJECT_3D_PATHS.quizTarget, tone: "peach" },
  vocab: { src: OBJECT_3D_PATHS.vocabCards, tone: "amber" },
  "toeic-diag": { src: OBJECT_3D_PATHS.diagnosticPrism, tone: "lavender" },
  "toeic-xray": { src: OBJECT_3D_PATHS.toeicXrayLens, tone: "lavender" },
  "toeic-tests": { src: OBJECT_3D_PATHS.toeicExamSheet, tone: "mint" },
  "toeic-dictation": { src: OBJECT_3D_PATHS.dictationMic, tone: "mint" },
  "toeic-fast": { src: OBJECT_3D_PATHS.toeicHeadphones, tone: "mint" },
  roadmap: { src: OBJECT_3D_PATHS.roadmapCompass, tone: "sky" },
  streak: { src: OBJECT_3D_PATHS.streakFlame, tone: "amber" },
  ai: { src: OBJECT_3D_PATHS.aiSparkLens, tone: "lavender" },
};

/**
 * Floating 3D Soft-Glass Accent for Section Cards, TOEIC Hub Modules & Practice Banners
 */
export function SectionCardWatermark({ kind = "next-lesson" }) {
  const item = SECTION_WATERMARK_3D[kind] || SECTION_WATERMARK_3D["next-lesson"];
  return (
    <div className={`ge-section-watermark pg-section-3d pg-section-3d--${item.tone}`} aria-hidden="true">
      <img
        src={item.src}
        alt=""
        width={112}
        height={112}
        loading="lazy"
        className="pg-section-3d-img"
      />
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

const HERO_3D_DEFAULTS = {
  dashboard: null,
  study: OBJECT_3D_PATHS.grammarLibrary,
  diagnostic: OBJECT_3D_PATHS.diagnosticPrism,
  gamification: OBJECT_3D_PATHS.trophyGold,
  vip: OBJECT_3D_PATHS.vipDiamond,
  toeic: OBJECT_3D_PATHS.toeicHeadphones,
  roadmap: OBJECT_3D_PATHS.roadmapCompass,
  dictation: OBJECT_3D_PATHS.dictationMic,
};

const HERO_BACKDROP_DEFAULTS = {
  dashboard: BANNER_PATHS.dashboard,
  study: BANNER_PATHS.study,
  diagnostic: BANNER_PATHS.diagnostic,
  gamification: BANNER_PATHS.gamification,
  vip: BANNER_PATHS.vip,
  toeic: BANNER_PATHS.toeic,
  roadmap: BANNER_PATHS.study,
  dictation: BANNER_PATHS.toeic,
};

/**
 * Pastel Glass 2026 Unified Atmospheric Hero Backdrop:
 * - Uses our 16:9 Pastel Glass WebP artwork seamlessly in BOTH Light & Dark Mode
 * - Left-side clean frost/obsidian scrim preserves razor-sharp text contrast across Mobile/Tablet/Desktop
 * - Right-side floating 3D object adds lively studio depth without cluttering text
 */
export function HeroBannerVisual({
  kind = "dashboard",
  webpSrc,
  object3dSrc,
  hideObject3d = false,
  targetScore,
}) {
  const backdropSrc = webpSrc || HERO_BACKDROP_DEFAULTS[kind] || BANNER_PATHS.dashboard;
  const floatingObj = hideObject3d
    ? null
    : object3dSrc !== undefined
    ? object3dSrc
    : HERO_3D_DEFAULTS[kind];

  return (
    <div className={`pg-hero-visual pg-hero-visual--${kind}`} aria-hidden="true">
      {backdropSrc && (
        <img
          src={backdropSrc}
          alt=""
          width={1440}
          height={810}
          loading={kind === "gamification" ? "lazy" : "eager"}
          className="pg-hero-backdrop-img"
        />
      )}
      <div className="pg-hero-scrim" />
      <div className="pg-hero-ambient-orb" />
      {floatingObj && (
        <div className="pg-hero-3d-stage">
          <img
            src={floatingObj}
            alt=""
            width={160}
            height={160}
            loading={kind === "gamification" ? "lazy" : "eager"}
            className="pg-hero-3d-obj"
          />
          {kind === "toeic" && targetScore && (
            <span className="pg-hero-score-chip">{targetScore}</span>
          )}
        </div>
      )}
    </div>
  );
}
