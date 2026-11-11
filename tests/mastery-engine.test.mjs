/**
 * Milestone 2.9.8 Automated 8-Scenario Validation Suite (Node / CI Runner)
 * Covers: 5-State Memory Machine, Response-Time Weighting, Forgetting Curve,
 * 6-Factor Anti-Gaming Mastery, Knowledge Decay, 50/30/20 Adaptive Mix,
 * Anti-Consecutive Interleaving, and Idempotent Event & Schema Contracts.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  MEMORY_STATES,
  calculateNextReview,
  getDailyDueSummary,
  calculateForgettingCurve,
} from "../lib/explanation/spaced-repetition.js";
import {
  MASTERY_TIERS,
  classifyMasteryTier,
  applyKnowledgeDecay,
  calculateMultiFactorMastery,
  aggregateTwelveTopicMastery,
} from "../lib/learning/mastery-tracker.js";
import {
  interleaveAntiConsecutive,
  buildAdaptiveQuestionSet,
  generatePersonalRecommendations,
} from "../lib/learning/adaptive-question-engine.js";
import { KNOWLEDGE_GRAPH } from "../lib/knowledge/knowledge-graph.js";

function run() {
  console.log("=== Milestone 2.9: 8-Scenario Adaptive Learning Validation ===");
  const now = new Date("2026-11-11T12:00:00Z");

  // Scenario 1: 5-State Memory Machine (New -> Learning -> Review -> Relearning -> Mastered)
  const step1 = calculateNextReview(null, true, null, now, { responseTimeMs: 4000 });
  assert.equal(step1.memory_state, MEMORY_STATES.LEARNING);
  assert.equal(step1.interval_days, 1);

  const step2 = calculateNextReview(step1, true, null, now, { responseTimeMs: 4000 });
  assert.equal(step2.memory_state, MEMORY_STATES.REVIEW);
  assert.equal(step2.interval_days, 3);

  const relapse = calculateNextReview(step2, false, null, now, { responseTimeMs: 8000 });
  assert.equal(relapse.memory_state, MEMORY_STATES.RELEARNING);
  assert.equal(relapse.interval_days, 1);

  let card = null;
  for (let i = 0; i < 5; i += 1) {
    card = calculateNextReview(card, true, null, now, { responseTimeMs: 4500 });
  }
  assert.equal(card.memory_state, MEMORY_STATES.MASTERED);
  assert.equal(card.interval_days, 30);
  console.log("[PASS] Scenario 1: 5-State Memory Machine transitions");

  // Scenario 2: Response-Time Weighting (Fast vs Hesitant Recall)
  const fast = calculateNextReview(step1, true, null, now, { responseTimeMs: 3000 });
  const slow = calculateNextReview(step1, true, null, now, { responseTimeMs: 28000 });
  assert.ok(fast.ease_factor > slow.ease_factor, "Fast recall should yield higher ease_factor than slow recall");
  assert.ok(fast.retrievability_score >= slow.retrievability_score);
  console.log("[PASS] Scenario 2: Response-Time SM-2/FSRS weighting");

  // Scenario 3: Forgetting Curve (1 -> 3 -> 7 -> 14 -> 30 days)
  const curve = calculateForgettingCurve([step1, step2, card, relapse], now);
  assert.deepEqual(
    curve.checkpoints.map((c) => c.day),
    [1, 3, 7, 14, 30]
  );
  assert.ok(curve.longTermRetention > 0);
  assert.ok(curve.consistencyIndex > 0);
  console.log("[PASS] Scenario 3: Forgetting Curve 5-horizon metrics");

  // Scenario 4: 6-Factor Anti-Gaming Mastery Engine & 6 Canonical Tiers
  assert.equal(MASTERY_TIERS.length, 6);
  const gamed = calculateMultiFactorMastery({
    attempts: 25,
    correct_attempts: 25,
    consecutive_correct: 25,
    interval_days: 30,
    avg_difficulty_score: 1,
    unique_questions_seen: 1,
    now,
  });
  assert.ok(gamed.masteryScore <= 68, `Expected anti-gaming cap <= 68, got ${gamed.masteryScore}`);
  assert.notEqual(gamed.masteryTier, "Master");

  const genuineMaster = calculateMultiFactorMastery({
    attempts: 12,
    correct_attempts: 12,
    consecutive_correct: 6,
    interval_days: 30,
    avg_difficulty_score: 4,
    unique_questions_seen: 8,
    now,
  });
  assert.ok(genuineMaster.masteryScore >= 90, `Expected Master >= 90, got ${genuineMaster.masteryScore}`);
  assert.equal(classifyMasteryTier(genuineMaster.masteryScore).key, "Master");
  console.log("[PASS] Scenario 4: 6-Factor Anti-Gaming Mastery & Tiers");

  // Scenario 5: Knowledge Decay (>14d overdue drops 5%/week floored at 50%)
  const overdueDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
  const decayed = applyKnowledgeDecay(95, overdueDate, now);
  assert.equal(decayed.daysOverdue, 28);
  assert.equal(decayed.decayPenalty, 10);
  assert.equal(decayed.decayedScore, 85);

  const extremeDecay = applyKnowledgeDecay(55, new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), now);
  assert.equal(extremeDecay.decayedScore, 50);
  console.log("[PASS] Scenario 5: Overdue Ebbinghaus Knowledge Decay");

  // Scenario 6: 50/30/20 Adaptive Mix + Manual Topic Review
  const twelve = aggregateTwelveTopicMastery(KNOWLEDGE_GRAPH.nodeList.map((n) => ({ ...n, attempts: 0 })));
  assert.equal(twelve.length, 12);

  const adaptive = buildAdaptiveQuestionSet({
    count: 20,
    twelveTopicMastery: twelve,
    srCards: [{ question_id: step1.question_id || "nonexistent", memory_state: "Relearning" }],
    mode: "adaptive",
  });
  assert.equal(adaptive.totalSelected, 20);
  assert.equal(adaptive.questions.length, 20);

  const manual = buildAdaptiveQuestionSet({ count: 15, targetTopicId: 10, mode: "manual_review" });
  assert.equal(manual.mode, "manual_review");
  assert.equal(manual.questions.length, 15);
  assert.ok(manual.questions.every((q) => q.chapter_number === 10));
  console.log("[PASS] Scenario 6: 50/30/20 Adaptive Mix & Manual Topic Review");

  // Scenario 7: Anti-Consecutive Topic/Stem Adjacency Interleaving
  const interleaved = interleaveAntiConsecutive(adaptive.questions);
  let adjacentSameStemPrefix = 0;
  for (let i = 1; i < interleaved.length; i += 1) {
    const a = (interleaved[i - 1].stem || "").slice(0, 18).toLowerCase();
    const b = (interleaved[i].stem || "").slice(0, 18).toLowerCase();
    if (a && a === b) adjacentSameStemPrefix += 1;
  }
  assert.equal(adjacentSameStemPrefix, 0, "Adjacent identical question stem prefixes detected");
  console.log("[PASS] Scenario 7: Anti-Consecutive Structure Interleaving");

  // Scenario 8: Personal Recommendations & Idempotency Migration Contract
  const summary = getDailyDueSummary([relapse], now);
  const recs = generatePersonalRecommendations({
    twelveTopicMastery: twelve.map((c, idx) =>
      idx === 0 ? { ...c, attempts: 5, mastery_score: 35, tier_badge: "⚠️ Basic", decayedConceptsCount: 1 } : c
    ),
    dailyReview: summary,
    retentionMetrics: { overallRetentionScore: 76 },
  });
  assert.ok(recs.length >= 2);
  const migSql = fs.readFileSync(path.join(process.cwd(), "database/migrations/004_milestone_29_adaptive_mastery.sql"), "utf8");
  assert.ok(migSql.includes("UNIQUE (user_id, idempotency_key)"));
  assert.ok(migSql.includes("ENABLE ROW LEVEL SECURITY"));
  console.log("[PASS] Scenario 8: Personal Coach Recommendations & Idempotency RLS Contract");

  console.log("\nALL 8 MILESTONE 2.9 SCENARIOS PASSED!");
}

run();
