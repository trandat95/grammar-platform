/**
 * Milestone 2.9.3 & 2.9.6: Adaptive Difficulty, 50/30/20 Dynamic Question Mixer & Personal Coach Recommendations
 */

import quizData from "../../data/ui/quiz_bank.json";
import { resolveConceptForQuestion } from "../knowledge/knowledge-graph";

const CHAPTER_NUM_FROM_TOPIC_NAME = [
  { match: "thì", ch: 1 },
  { match: "phối hợp", ch: 2 },
  { match: "mệnh đề", ch: 3 },
  { match: "số lượng", ch: 4 },
  { match: "văn phong", ch: 5 },
  { match: "nhấn mạnh", ch: 6 },
  { match: "từ loại", ch: 7 },
  { match: "từ vựng", ch: 8 },
  { match: "gián tiếp", ch: 9 },
  { match: "bị động", ch: 10 },
  { match: "câu", ch: 11 },
  { match: "tổng hợp", ch: 12 },
];

export function resolveChapterForTopicName(topicName = "") {
  const low = topicName.toLowerCase();
  if (low.includes("bị động")) return 10;
  if (low.includes("phối hợp")) return 2;
  const hit = CHAPTER_NUM_FROM_TOPIC_NAME.find((item) => low.includes(item.match));
  return hit ? hit.ch : 12;
}

function getTargetDifficultyBucket(avgMastery = 0) {
  if (avgMastery >= 75) return "Advanced";
  if (avgMastery >= 45) return "Intermediate";
  return "Beginner";
}

function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

/**
 * Interleaves questions so no two adjacent items share identical topic_id or stem prefix (anti-rote-memorization).
 */
export function interleaveAntiConsecutive(questions = []) {
  const remaining = [...questions];
  const ordered = [];

  while (remaining.length > 0) {
    const prev = ordered[ordered.length - 1];
    const prevTopic = prev?.topic_id || prev?.topic_name;
    const prevPrefix = (prev?.stem || "").slice(0, 18).toLowerCase();

    const candidateIdx = remaining.findIndex((item) => {
      if (!prev) return true;
      const sameTopic = (item.topic_id || item.topic_name) === prevTopic;
      const samePrefix = (item.stem || "").slice(0, 18).toLowerCase() === prevPrefix;
      return !sameTopic && !samePrefix;
    });

    const chosenIdx = candidateIdx >= 0 ? candidateIdx : 0;
    ordered.push(remaining.splice(chosenIdx, 1)[0]);
  }

  return ordered;
}

/**
 * Generates an adaptive practice quiz using configurable mix ratios:
 * Default: 50% Weak Topics + 30% Spaced Repetition Due Review + 20% New Challenge
 */
export function buildAdaptiveQuestionSet({
  count = 20,
  twelveTopicMastery = [],
  srCards = [],
  completedQuestionIds = [],
  targetTopicId = null,
  mode = "adaptive", // 'adaptive' | 'manual_review'
  ratio = { weak: 0.5, review: 0.3, challenge: 0.2 },
} = {}) {
  const completedSet = new Set(completedQuestionIds || []);
  const allTopics = quizData.topics || [];
  const allQuestions = allTopics.flatMap((t) =>
    (t.questions || []).map((q) => ({
      ...q,
      topic_id: q.topic_id || t.id,
      topic_name: q.topic_name || t.title_vi || t.topic_name,
      chapter_number: Number(t.number) || resolveChapterForTopicName(q.topic_name || t.title_vi || t.topic_name),
    }))
  );

  // Manual Topic Review Mode
  if (mode === "manual_review" && targetTopicId) {
    const matching = shuffleArray(
      allQuestions.filter(
        (q) => String(q.topic_id) === String(targetTopicId) || String(q.chapter_number) === String(targetTopicId)
      )
    ).map((q) => ({
      ...q,
      adaptive_bucket: "Manual Topic Focus",
      concept_id: resolveConceptForQuestion(q),
    }));
    const chosen = interleaveAntiConsecutive(matching.slice(0, count));
    return {
      mode: "manual_review",
      targetTopicId,
      totalSelected: chosen.length,
      breakdown: { weakCount: chosen.length, reviewCount: 0, challengeCount: 0 },
      questions: chosen,
    };
  }

  const weakChapters = new Set(
    (twelveTopicMastery || [])
      .filter((ch) => ch.mastery_score < 65)
      .sort((a, b) => a.mastery_score - b.mastery_score)
      .slice(0, 4)
      .map((ch) => ch.chapter_number)
  );
  if (weakChapters.size === 0) {
    weakChapters.add(1);
    weakChapters.add(3);
    weakChapters.add(10);
  }

  const dueIds = new Set(
    (srCards || [])
      .filter((c) => c.memory_state === "Relearning" || c.status === "due" || c.status === "learning")
      .map((c) => c.question_id)
  );

  const avgMastery =
    twelveTopicMastery.length > 0
      ? twelveTopicMastery.reduce((s, c) => s + Number(c.mastery_score || 0), 0) / twelveTopicMastery.length
      : 35;
  const preferredDifficulty = getTargetDifficultyBucket(avgMastery);

  const targetWeak = Math.round(count * (ratio.weak ?? 0.5));
  const targetReview = Math.round(count * (ratio.review ?? 0.3));
  const targetChallenge = Math.max(1, count - targetWeak - targetReview);

  const usedIds = new Set();

  const pickFromPool = (pool, limit, bucketLabel) => {
    const picked = [];
    for (const q of shuffleArray(pool)) {
      if (picked.length >= limit) break;
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      picked.push({
        ...q,
        adaptive_bucket: bucketLabel,
        concept_id: resolveConceptForQuestion(q),
      });
    }
    return picked;
  };

  // Bucket 1: 50% Weak Topics (prefer unsolved)
  const weakPool = allQuestions.filter((q) => weakChapters.has(q.chapter_number) && !completedSet.has(q.id));
  const weakPicked = pickFromPool(
    weakPool.length >= targetWeak ? weakPool : allQuestions.filter((q) => weakChapters.has(q.chapter_number)),
    targetWeak,
    "50% Weak Topic Reinforcement"
  );

  // Bucket 2: 30% Spaced Repetition Review
  const reviewPool = allQuestions.filter((q) => dueIds.has(q.id));
  const reviewFallbackPool = allQuestions.filter((q) => completedSet.has(q.id));
  const reviewPicked = pickFromPool(
    reviewPool.length > 0 ? reviewPool : reviewFallbackPool.length > 0 ? reviewFallbackPool : weakPool,
    targetReview,
    "30% Spaced Repetition Retention"
  );

  // Bucket 3: 20% New Knowledge & Challenge (escalated difficulty)
  const challengePool = allQuestions.filter(
    (q) =>
      !completedSet.has(q.id) &&
      (q.level === preferredDifficulty ||
        q.chapter_number === 12 ||
        q.type === "SENTENCE_TRANSFORMATION" ||
        (preferredDifficulty === "Advanced" && (q.type === "REWRITE_SENTENCES" || q.type === "ERROR_CORRECTION")))
  );
  const challengePicked = pickFromPool(
    challengePool.length > 0 ? challengePool : allQuestions,
    targetChallenge,
    "20% Challenge Expansion"
  );

  let combined = [...weakPicked, ...reviewPicked, ...challengePicked];
  if (combined.length < count) {
    const extra = pickFromPool(allQuestions, count - combined.length, "Balanced Reinforcement");
    combined = [...combined, ...extra];
  }

  return {
    mode: "adaptive",
    preferredDifficulty,
    ratioApplied: ratio,
    totalSelected: combined.length,
    breakdown: {
      weakCount: weakPicked.length,
      reviewCount: reviewPicked.length,
      challengeCount: combined.length - weakPicked.length - reviewPicked.length,
    },
    questions: interleaveAntiConsecutive(combined),
  };
}

/**
 * Generates actionable Vietnamese recommendations backed by real mastery & retention metrics.
 */
export function generatePersonalRecommendations({ twelveTopicMastery = [], dailyReview = {}, retentionMetrics = {} }) {
  const recs = [];
  const trackedTopics = (twelveTopicMastery || []).filter((c) => c.attempts > 0);
  const weakTopics = trackedTopics.filter((c) => c.mastery_score < 60).sort((a, b) => a.mastery_score - b.mastery_score);
  const decayingTopics = trackedTopics.filter((c) => c.decayedConceptsCount > 0);

  if (decayingTopics.length > 0) {
    const topDecay = decayingTopics[0];
    recs.push({
      id: `rec_decay_${topDecay.chapter_number}`,
      type: "retention_alert",
      priority: "HIGH",
      chapter_number: topDecay.chapter_number,
      title: `Có dấu hiệu quên kiến thức Chương ${topDecay.chapter_number}: ${topDecay.chapter_title_vi}`,
      description: `Bạn có chuyên đề quá hạn ôn tập. Hãy ôn nhanh 10–15 câu để khôi phục trí nhớ dài hạn.`,
      ctaLabel: `Ôn tập Chương ${topDecay.chapter_number}`,
    });
  }

  if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    recs.push({
      id: `rec_weak_${topWeak.chapter_number}`,
      type: "weak_topic",
      priority: "HIGH",
      chapter_number: topWeak.chapter_number,
      title: `Bạn đang yếu ở Chương ${topWeak.chapter_number}: ${topWeak.chapter_title_vi} (${topWeak.mastery_score}%)`,
      description: `Mức hiện tại: ${topWeak.tier_badge}. Đề xuất luyện bộ 50/30/20 tập trung bù đắp chuyên đề này.`,
      ctaLabel: `Luyện Chương ${topWeak.chapter_number}`,
    });
  }

  if ((dailyReview?.dueCount || 0) > 0) {
    recs.push({
      id: "rec_sr_due",
      type: "spaced_repetition",
      priority: "MEDIUM",
      chapter_number: null,
      title: `Bạn có ${dailyReview.dueCount} câu hỏi cần ôn tập hôm nay`,
      description: "Hoàn thành lịch ôn tập SM-2 giúp nâng Long-term Retention lên trên 85%.",
      ctaLabel: "Làm Đề Thích Ứng 50/30/20",
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "rec_challenge",
      type: "challenge",
      priority: "LOW",
      chapter_number: 12,
      title: "Duy trì phong độ với Thử thách Thích ứng 50/30/20",
      description: `Retention hiện tại ${retentionMetrics?.overallRetentionScore ?? 100}%. Thử sức với bộ câu hỏi tổng hợp để đạt cấp Master.`,
      ctaLabel: "Luyện Đề Thích Ứng",
    });
  }

  return recs;
}
