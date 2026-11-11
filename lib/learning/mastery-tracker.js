/**
 * Milestone 2.5.9, 2.5.11 & 2.9.4:
 * Multi-Factor 12-Topic Mastery Engine, 6 Canonical Tiers & Knowledge Decay
 * Anti-Gaming: Combines Accuracy (30%) + Consistency (15%) + Retention (20%) + Difficulty (15%) + Recency (10%) + Topic Coverage (10%)
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DECAY_GRACE_DAYS = 14;
export const DECAY_WEEKLY_RATE_PERCENT = 5;
export const DECAY_MIN_FLOOR = 50;

export const MASTERY_TIERS = [
  { key: "Master", min: 90, max: 100, label_vi: "Thành thạo Xuất sắc", badge: "💎 Master" },
  { key: "Proficient", min: 75, max: 89, label_vi: "Thành thạo", badge: "🌟 Proficient" },
  { key: "Advanced", min: 60, max: 74, label_vi: "Vận dụng Khá", badge: "✅ Advanced" },
  { key: "Intermediate", min: 40, max: 59, label_vi: "Trung bình", badge: "⚡ Intermediate" },
  { key: "Basic", min: 20, max: 39, label_vi: "Nhận diện Cơ bản", badge: "⚠️ Basic" },
  { key: "Beginner", min: 0, max: 19, label_vi: "Mới Bắt đầu", badge: "🌱 Beginner" },
];

export function classifyMasteryTier(score = 0) {
  const s = Math.max(0, Math.min(100, Math.round(Number(score || 0))));
  return MASTERY_TIERS.find((t) => s >= t.min && s <= t.max) || MASTERY_TIERS[MASTERY_TIERS.length - 1];
}

/**
 * Ebbinghaus-aligned Knowledge Decay:
 * After 14 days overdue, mastery decays 5%/week floored at 50%.
 */
export function applyKnowledgeDecay(currentScore, nextReviewAt, now = new Date()) {
  const baseScore = Math.max(0, Math.min(100, Number(currentScore || 0)));
  if (!nextReviewAt || baseScore <= DECAY_MIN_FLOOR) {
    return { decayedScore: Math.round(baseScore * 100) / 100, decayPenalty: 0, daysOverdue: 0 };
  }

  const dueMs = new Date(nextReviewAt).getTime();
  const daysOverdue = Math.max(0, (now.getTime() - dueMs) / MS_PER_DAY);

  if (daysOverdue <= DECAY_GRACE_DAYS) {
    return { decayedScore: Math.round(baseScore * 100) / 100, decayPenalty: 0, daysOverdue: Math.round(daysOverdue) };
  }

  const overdueWeeks = (daysOverdue - DECAY_GRACE_DAYS) / 7;
  const rawPenalty = overdueWeeks * DECAY_WEEKLY_RATE_PERCENT;
  const decayedScore = Math.max(DECAY_MIN_FLOOR, baseScore - rawPenalty);
  const actualPenalty = Math.max(0, baseScore - decayedScore);

  return {
    decayedScore: Math.round(decayedScore * 100) / 100,
    decayPenalty: Math.round(actualPenalty * 100) / 100,
    daysOverdue: Math.round(daysOverdue),
  };
}

/**
 * Milestone 2.9.4: 6-Factor Anti-Gaming Mastery Computation
 * Prevents score inflation from repeating identical easy questions.
 */
export function calculateMultiFactorMastery({
  attempts = 0,
  correct_attempts = 0,
  consecutive_correct = 0,
  interval_days = 1,
  next_review_at = null,
  last_attempt_at = null,
  avg_difficulty_score = 3, // 1=Beginner .. 4=Advanced
  unique_questions_seen = 1,
  expected_breadth = 6,
  now = new Date(),
}) {
  const total = Math.max(0, Number(attempts || 0));
  if (total === 0) {
    return {
      masteryScore: 0,
      masteryStatus: "learning",
      masteryTier: "Beginner",
      decayPenalty: 0,
      daysOverdue: 0,
      factors: {
        accuracy: 0,
        consistency: 0,
        retention: 0,
        difficultyWeight: 0,
        recency: 0,
        topicCoverage: 0,
      },
    };
  }

  // 1. Accuracy (30%)
  const accuracy = Math.min(100, Math.max(0, (Number(correct_attempts || 0) / total) * 100));

  // 2. Consistency (15%) - requires streak progression
  const consistency = Math.min(100, (Number(consecutive_correct || 0) / 5) * 100);

  // 3. Long-Term Retention (20%) - 30-day durability checkpoint
  const retention = Math.min(100, (Number(interval_days || 1) / 30) * 100);

  // 4. Difficulty Weight (15%) - Anti-gaming cap for easy-only repetition
  const normalizedDiff = Math.max(1, Math.min(4, Number(avg_difficulty_score || 3)));
  const difficultyWeight = (normalizedDiff / 4) * 100;

  // 5. Recency (10%)
  let recency = 100;
  if (last_attempt_at) {
    const daysSince = Math.max(0, (now.getTime() - new Date(last_attempt_at).getTime()) / MS_PER_DAY);
    if (daysSince > 7) {
      recency = Math.max(20, 100 - (daysSince - 7) * 3);
    }
  }

  // 6. Topic Coverage (10%) - Unique question breadth prevents 1-question farming
  const uniqueSeen = Math.max(1, Number(unique_questions_seen || 1));
  const topicCoverage = Math.min(100, (uniqueSeen / Math.max(1, expected_breadth)) * 100);

  // Anti-gaming ceiling: repeating < 3 unique items OR purely Beginner level caps raw mastery at 68%
  const compositeRaw =
    accuracy * 0.3 +
    consistency * 0.15 +
    retention * 0.2 +
    difficultyWeight * 0.15 +
    recency * 0.1 +
    topicCoverage * 0.1;

  // Confidence dampening so 1 lucky item cannot jump to Master
  const sampleDampening = 0.6 + 0.4 * Math.min(1, total / 5);
  let bounded = compositeRaw * sampleDampening;

  if (uniqueSeen < 2 || (normalizedDiff <= 1.2 && uniqueSeen < 4)) {
    bounded = Math.min(68, bounded);
  }

  bounded = Math.max(0, Math.min(100, Math.round(bounded * 100) / 100));
  const decay = applyKnowledgeDecay(bounded, next_review_at, now);
  const tierObj = classifyMasteryTier(decay.decayedScore);

  let masteryStatus = "learning";
  if (decay.decayedScore >= 85 && consecutive_correct >= 3 && uniqueSeen >= 2) {
    masteryStatus = "mastered";
  } else if (decay.decayedScore >= 55) {
    masteryStatus = "developing";
  }

  return {
    masteryScore: decay.decayedScore,
    masteryStatus,
    masteryTier: tierObj.key,
    decayPenalty: decay.decayPenalty,
    daysOverdue: decay.daysOverdue,
    factors: {
      accuracy: Math.round(accuracy * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      retention: Math.round(retention * 10) / 10,
      difficultyWeight: Math.round(difficultyWeight * 10) / 10,
      recency: Math.round(recency * 10) / 10,
      topicCoverage: Math.round(topicCoverage * 10) / 10,
    },
  };
}

/**
 * Legacy-compatible wrapper delegating cleanly to calculateMultiFactorMastery.
 */
export function calculateConceptMasteryScore(params) {
  return calculateMultiFactorMastery(params);
}

/**
 * Rolls up 53 Grammar Concepts into the canonical 12 Chapters of Mai Lan Huong.
 */
export function aggregateTwelveTopicMastery(concepts = []) {
  const byChapter = new Map();

  for (const c of concepts || []) {
    const chNum = Number(c.chapter_number || 1);
    if (!byChapter.has(chNum)) {
      byChapter.set(chNum, {
        chapter_number: chNum,
        chapter_code: c.chapter_code || `CH${String(chNum).padStart(2, "0")}`,
        chapter_title_vi: c.chapter_title_vi || `Chương ${chNum}`,
        conceptsCount: 0,
        trackedConceptsCount: 0,
        masteredConceptsCount: 0,
        decayedConceptsCount: 0,
        attempts: 0,
        correct_attempts: 0,
        scoreSum: 0,
        weakestLessonCode: null,
        weakestScore: 101,
      });
    }
    const ch = byChapter.get(chNum);
    ch.conceptsCount += 1;
    ch.attempts += Number(c.attempts || 0);
    ch.correct_attempts += Number(c.correct_attempts || 0);

    if (Number(c.attempts || 0) > 0) {
      ch.trackedConceptsCount += 1;
      const sc = Number(c.decayed_score ?? c.mastery_score ?? 0);
      ch.scoreSum += sc;
      if (c.mastery_status === "mastered") ch.masteredConceptsCount += 1;
      if (Number(c.decay_penalty || 0) > 0) ch.decayedConceptsCount += 1;
      if (sc < ch.weakestScore) {
        ch.weakestScore = sc;
        ch.weakestLessonCode = c.lesson_code || c.id;
      }
    }
  }

  return Array.from(byChapter.values())
    .sort((a, b) => a.chapter_number - b.chapter_number)
    .map((ch) => {
      const avgScore = ch.trackedConceptsCount > 0 ? Math.round(ch.scoreSum / ch.trackedConceptsCount) : 0;
      const accuracy = ch.attempts > 0 ? Math.round((ch.correct_attempts / ch.attempts) * 100) : 0;
      const tier = classifyMasteryTier(avgScore);
      return {
        ...ch,
        mastery_score: avgScore,
        accuracy,
        tier: tier.key,
        tier_label_vi: tier.label_vi,
        tier_badge: tier.badge,
      };
    });
}
