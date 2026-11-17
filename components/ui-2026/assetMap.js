/**
 * Canonical 2026 Visual Asset Paths (public/assets/)
 */

export const BANNER_PATHS = {
  dashboard: "/assets/banners/01-hero-dashboard.webp",
  diagnostic: "/assets/banners/02-diagnostic-roadmap.webp",
  gamification: "/assets/banners/03-gamification-community.webp",
  vip: "/assets/banners/04-vip-coach.webp",
  toeic: "/assets/banners/05-toeic-adaptive.webp",
};

export const XRAY_PREVIEW_PATH = "/assets/banners/xray-preview.svg";

export const MASCOT_PATHS = {
  master: "/assets/mascot/master-mascot.png",
  welcome: "/assets/mascot/mascot-welcome.png",
  celebrate: "/assets/mascot/mascot-celebrate.png",
  encourage: "/assets/mascot/mascot-encourage.png",
  vip: "/assets/mascot/mascot-vip.png",
  empty: "/assets/mascot/mascot-empty.png",
  ai_coach: "/assets/mascot/mascot-ai-coach.png",
  state_404: "/assets/mascot/state-404.svg",
};

export const VIP_SHOWCASE_PATHS = {
  free: "/assets/vip/free-tier-showcase.svg",
  vip: "/assets/vip/vip-tier-showcase.svg",
};

export const AVATAR_PATHS = [
  "/assets/avatars/unified/avatar-01.svg",
  "/assets/avatars/unified/avatar-02.svg",
  "/assets/avatars/unified/avatar-03.svg",
  "/assets/avatars/unified/avatar-04.svg",
];

export const CHAPTER_ICON_MAP = {
  1: "/assets/icons/chapters/ch-01-tenses.svg",
  2: "/assets/icons/chapters/ch-02-sequence-of-tenses.svg",
  3: "/assets/icons/chapters/ch-03-clauses-phrases.svg",
  4: "/assets/icons/chapters/ch-04-quantity.svg",
  5: "/assets/icons/chapters/ch-05-styles.svg",
  6: "/assets/icons/chapters/ch-06-emphasis.svg",
  7: "/assets/icons/chapters/ch-07-parts-of-speech.svg",
  8: "/assets/icons/chapters/ch-08-word-study.svg",
  9: "/assets/icons/chapters/ch-09-reported-speech.svg",
  10: "/assets/icons/chapters/ch-10-passive-active.svg",
  11: "/assets/icons/chapters/ch-11-sentences.svg",
  12: "/assets/icons/chapters/ch-12-comprehensive-test.svg",
};

export function getLevelIconPath(level = 1) {
  const lv = Number(level || 1);
  if (lv >= 41) return "/assets/icons/levels/level-06-legend-diamond.svg";
  if (lv >= 31) return "/assets/icons/levels/level-05-master-crown.svg";
  if (lv >= 21) return "/assets/icons/levels/level-04-expert-mortarboard.svg";
  if (lv >= 11) return "/assets/icons/levels/level-03-fighter-swords.svg";
  if (lv >= 6) return "/assets/icons/levels/level-02-explorer-compass.svg";
  return "/assets/icons/levels/level-01-beginner-sprout.svg";
}

export function getBadgeTierIconPath(tier = "Bronze", unlocked = false, isHidden = false) {
  if (!unlocked && isHidden) return "/assets/icons/badges/badge-tier-05-mystery-locked.svg";
  switch (String(tier || "Bronze").toLowerCase()) {
    case "diamond":
      return "/assets/icons/badges/badge-tier-04-diamond.svg";
    case "gold":
      return "/assets/icons/badges/badge-tier-03-gold.svg";
    case "silver":
      return "/assets/icons/badges/badge-tier-02-silver.svg";
    default:
      return "/assets/icons/badges/badge-tier-01-bronze.svg";
  }
}

export const BADGE_ART_MAP = {
  first_step: "/assets/badges/unified/first_step.svg",
  daily_learner_3: "/assets/badges/unified/daily_learner_3.svg",
  streak_7_days: "/assets/badges/unified/streak_7_days.svg",
  warrior_30_days: "/assets/badges/unified/warrior_30_days.svg",
  consistency_master_100: "/assets/badges/unified/consistency_master_100.svg",
  night_owl_hidden: "/assets/badges/unified/night_owl_hidden.svg",
  tense_explorer: "/assets/badges/unified/tense_explorer.svg",
  master_13_tenses: "/assets/badges/unified/master_13_tenses.svg",
  conditional_expert: "/assets/badges/unified/conditional_expert.svg",
  passive_voice_master: "/assets/badges/unified/passive_voice_master.svg",
  grammar_legend_12: "/assets/badges/unified/grammar_legend_12.svg",
  perfect_score: "/assets/badges/unified/perfect_score.svg",
  sharp_shooter: "/assets/badges/unified/sharp_shooter.svg",
  error_hunter: "/assets/badges/unified/error_hunter.svg",
  comeback_king: "/assets/badges/unified/comeback_king.svg",
  lightning_master_hidden: "/assets/badges/unified/lightning_master_hidden.svg",
  quiz_starter: "/assets/badges/unified/quiz_starter.svg",
  century_club: "/assets/badges/unified/century_club.svg",
  knowledge_collector: "/assets/badges/unified/knowledge_collector.svg",
  review_master: "/assets/badges/unified/review_master.svg",
  mystery_locked: "/assets/badges/unified/mystery_locked.svg",
};

export function getBadgeArtworkPath(code, tier = "Bronze", unlocked = false, isHidden = false) {
  if (!unlocked && isHidden) return BADGE_ART_MAP.mystery_locked;
  if (code && BADGE_ART_MAP[code]) return BADGE_ART_MAP[code];
  return getBadgeTierIconPath(tier, unlocked, isHidden);
}

export const VIZ_ICON_MAP = {
  timeline: "/assets/icons/visualizations/viz-01-timeline-13-tenses.svg",
  "decision-tree": "/assets/icons/visualizations/viz-02-decision-tree-conditionals.svg",
  transformation: "/assets/icons/visualizations/viz-03-passive-transformation.svg",
  "conversion-flow": "/assets/icons/visualizations/viz-04-reported-speech-flow.svg",
  "sentence-tree": "/assets/icons/visualizations/viz-05-relative-clause-tree.svg",
  "comparison-scale": "/assets/icons/visualizations/viz-06-comparison-scale.svg",
  "modal-matrix": "/assets/icons/visualizations/viz-07-modal-certainty-matrix.svg",
  "word-family-tree": "/assets/icons/visualizations/viz-08-word-family-tree.svg",
};
