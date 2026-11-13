/**
 * Milestone E7.1: Centralized TOEIC Entitlement & Feature Gate Engine
 * Defines canonical feature keys, tier quotas, milestone access matrix,
 * and authoritative permission checking logic.
 * Strict Rule: Never relies on localStorage for server decisions.
 */

export const TOEIC_FEATURE_KEYS = {
  FULL_ROADMAP: 'toeic_full_roadmap',
  SENTENCE_XRAY_UNLIMITED: 'toeic_sentence_xray_unlimited',
  AI_TUTOR_ADVANCED: 'toeic_ai_tutor_advanced',
  MOCK_TESTS_FULL: 'toeic_mock_tests_full',
  DICTATION_540: 'toeic_dictation_540',
  BOSS_GATE_UNLIMITED: 'toeic_boss_gate_unlimited',
  SRS_UNLIMITED: 'toeic_srs_unlimited',
  ADVANCED_ANALYTICS: 'toeic_advanced_analytics'
};

export const TOEIC_TIERS = {
  FREE: 'FREE',
  VIP: 'VIP',
  PREMIUM_PLUS: 'PREMIUM_PLUS',
  ADMIN: 'ADMIN'
};

/**
 * Milestone Access Matrix (E7.2)
 * Defines access level per milestone ID for Free learners.
 */
export const MILESTONE_ACCESS_MATRIX = {
  MS_01_FOUNDATION_POS: {
    freeAccess: 'FULL',
    badge: null,
    isLockedForFree: false,
    minBand: 450
  },
  MS_02_VERB_MASTERY: {
    freeAccess: 'FULL',
    badge: null,
    isLockedForFree: false,
    minBand: 550
  },
  MS_03_PRONOUN_CONNECTOR: {
    freeAccess: 'PARTIAL',
    badge: 'FREE_TRIAL',
    isLockedForFree: false,
    minBand: 650
  },
  MS_04_ADVANCED_GRAMMAR: {
    freeAccess: 'PREVIEW',
    badge: 'VIP_PREMIUM',
    isLockedForFree: true,
    minBand: 750,
    previewTitle: '12 Bài Học Đảo Ngữ & Cấu Trúc Khó',
    previewCount: '180 câu hỏi phân loại Band 750+'
  },
  MS_05_VOCAB_COHERENCE: {
    freeAccess: 'PREVIEW',
    badge: 'VIP_PREMIUM',
    isLockedForFree: true,
    minBand: 800,
    previewTitle: 'Collocations & Mạch Văn Part 6',
    previewCount: '160 câu phân tích liên kết đoạn văn'
  },
  MS_06_READING_COMPREHENSION: {
    freeAccess: 'LOCKED',
    badge: 'VIP_PREMIUM',
    isLockedForFree: true,
    minBand: 850,
    previewTitle: 'Double & Triple Passages Part 7',
    previewCount: '240 câu hỏi đọc hiểu đa văn bản ETS'
  },
  MS_07_MASTERY_SPEED_DRILL: {
    freeAccess: 'LOCKED',
    badge: 'VIP_PREMIUM',
    isLockedForFree: true,
    minBand: 900,
    previewTitle: 'Speed Drill Phản Xạ < 10s/câu',
    previewCount: '200 câu bẫy đề thi thật ETS 2026'
  }
};

/**
 * Free Tier Quota Limits
 */
export const FREE_TIER_LIMITS = {
  dailySentenceXRay: 15,
  dailyAiTutorQueries: 3,
  maxDictationTracks: 50,
  maxSrsCards: 30,
  maxFullTests: 2
};

/**
 * Check if a user role has VIP access.
 */
export function hasVipPrivilege(role) {
  if (!role) return false;
  const upper = String(role).toUpperCase();
  return upper === 'VIP' || upper === 'ADMIN' || upper === 'PREMIUM' || upper === 'PREMIUM_PLUS';
}

/**
 * Checks milestone access for a user.
 */
export function getMilestoneAccess(milestoneId, userRole = 'FREE', isMilestoneCompleted = false) {
  if (hasVipPrivilege(userRole) || isMilestoneCompleted) {
    return {
      canAccess: true,
      accessType: 'FULL',
      isLocked: false,
      badge: isMilestoneCompleted ? 'COMPLETED' : 'VIP_UNLOCKED'
    };
  }

  const spec = MILESTONE_ACCESS_MATRIX[milestoneId] || {
    freeAccess: 'LOCKED',
    isLockedForFree: true
  };

  return {
    canAccess: !spec.isLockedForFree,
    accessType: spec.freeAccess,
    isLocked: spec.isLockedForFree,
    badge: spec.badge,
    previewTitle: spec.previewTitle,
    previewCount: spec.previewCount
  };
}

export const getMilestoneAccessStatus = getMilestoneAccess;

/**
 * Evaluates feature entitlement for user and context.
 */
export function checkToeicEntitlement(featureKey, { role = 'FREE', usageCount = 0 } = {}) {
  const isVip = hasVipPrivilege(role);

  if (isVip) {
    return {
      granted: true,
      isVip: true,
      remainingQuota: Infinity,
      requiresUpgrade: false
    };
  }

  // Free Tier checks
  switch (featureKey) {
    case TOEIC_FEATURE_KEYS.SENTENCE_XRAY_UNLIMITED: {
      const remaining = Math.max(0, FREE_TIER_LIMITS.dailySentenceXRay - usageCount);
      return {
        granted: remaining > 0,
        isVip: false,
        remainingQuota: remaining,
        requiresUpgrade: remaining <= 0,
        limitMessage: `Bạn đã dùng hết ${FREE_TIER_LIMITS.dailySentenceXRay} câu X-Ray miễn phí hôm nay.`
      };
    }
    case TOEIC_FEATURE_KEYS.AI_TUTOR_ADVANCED: {
      const remaining = Math.max(0, FREE_TIER_LIMITS.dailyAiTutorQueries - usageCount);
      return {
        granted: remaining > 0,
        isVip: false,
        remainingQuota: remaining,
        requiresUpgrade: remaining <= 0,
        limitMessage: `Bạn đã dùng hết ${FREE_TIER_LIMITS.dailyAiTutorQueries} câu hỏi AI Gia sư miễn phí trong ngày.`
      };
    }
    case TOEIC_FEATURE_KEYS.DICTATION_540: {
      const granted = usageCount <= FREE_TIER_LIMITS.maxDictationTracks;
      return {
        granted,
        isVip: false,
        requiresUpgrade: !granted,
        limitMessage: 'Phần nghe hội thoại Part 3 & 4 thuộc gói VIP.'
      };
    }
    case TOEIC_FEATURE_KEYS.MOCK_TESTS_FULL: {
      const granted = usageCount <= FREE_TIER_LIMITS.maxFullTests;
      return {
        granted,
        isVip: false,
        requiresUpgrade: !granted,
        limitMessage: 'Trọn bộ 20 đề ETS Part 6 & 7 thuộc gói VIP.'
      };
    }
    case TOEIC_FEATURE_KEYS.FULL_ROADMAP:
    case TOEIC_FEATURE_KEYS.BOSS_GATE_UNLIMITED:
    default:
      return {
        granted: false,
        isVip: false,
        remainingQuota: 0,
        requiresUpgrade: true,
        limitMessage: 'Tính năng này yêu cầu nâng cấp gói VIP.'
      };
  }
}
