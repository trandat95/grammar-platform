/**
 * Canonical 2026 Visual Asset Paths (public/assets/)
 */

export const BANNER_PATHS = {
  dashboard: "/assets/banners/01-hero-dashboard-vn-foreign.jpg",
  diagnostic: "/assets/banners/02-diagnostic-roadmap-ai.jpg",
  gamification: "/assets/banners/03-gamification-streak-community.jpg",
  vip: "/assets/banners/04-vip-ai-study-coach.jpg",
  toeic: "/assets/banners/05-toeic-adaptive-ai.jpg",
};

export const VIP_SHOWCASE_PATHS = {
  free: "/assets/vip/free-tier-showcase.svg",
  vip: "/assets/vip/vip-tier-showcase.svg",
};

export const AVATAR_PATHS = [
  "/assets/avatars/avatar-01-vn-student-female.jpg",
  "/assets/avatars/avatar-02-uk-mentor-male.jpg",
  "/assets/avatars/avatar-03-vn-learner-male.jpg",
  "/assets/avatars/avatar-04-us-coach-female.jpg",
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
  first_step: "/assets/badges/first_step.jpg",
  daily_learner_3: "/assets/badges/daily_learner_3.jpg",
  streak_7_days: "/assets/badges/streak_7_days.jpg",
  warrior_30_days: "/assets/badges/warrior_30_days.jpg",
  consistency_master_100: "/assets/badges/consistency_master_100.jpg",
  night_owl_hidden: "/assets/badges/night_owl_hidden.jpg",
  tense_explorer: "/assets/badges/tense_explorer.jpg",
  master_13_tenses: "/assets/badges/master_13_tenses.jpg",
  conditional_expert: "/assets/badges/conditional_expert.jpg",
  passive_voice_master: "/assets/badges/passive_voice_master.svg",
  grammar_legend_12: "/assets/badges/grammar_legend_12.jpg",
  perfect_score: "/assets/badges/perfect_score.jpg",
  sharp_shooter: "/assets/badges/sharp_shooter.svg",
  error_hunter: "/assets/badges/error_hunter.svg",
  comeback_king: "/assets/badges/comeback_king.svg",
  lightning_master_hidden: "/assets/badges/lightning_master_hidden.svg",
  quiz_starter: "/assets/badges/quiz_starter.svg",
  century_club: "/assets/badges/century_club.svg",
  knowledge_collector: "/assets/badges/knowledge_collector.svg",
  review_master: "/assets/badges/review_master.svg",
  mystery_locked: "/assets/badges/mystery_locked.jpg",
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
