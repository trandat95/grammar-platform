/**
 * Milestone 2.10.8 Automated Gamification & Anti-Abuse Test Suite (Node / CI)
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  XP_REWARDS,
  calculateLevelProgress,
  evaluateQuestionXpEligibility,
} from "../lib/gamification/xp-level-engine.js";
import {
  DEFAULT_ACHIEVEMENT_CATALOG,
  evaluateUnlockableAchievements,
  formatAchievementsForClient,
} from "../lib/gamification/achievement-engine.js";
import {
  getLocalDateKey,
  getLocalWeekKey,
  updateStreakState,
  recoverStreakWithFreeze,
  computeChallengeProgressUpdate,
} from "../lib/gamification/challenge-streak-engine.js";

function run() {
  console.log("=== Milestone 2.10: Intelligent Gamification Validation ===");
  const now = new Date("2026-11-11T16:30:00Z"); // 23:30 UTC+7 (same local date 2026-11-11)

  // 1. Level Progression Bands (Section 8B.2)
  assert.equal(calculateLevelProgress(0).level, 1);
  assert.equal(calculateLevelProgress(0).title, "Beginner");
  assert.equal(calculateLevelProgress(501).title, "Grammar Explorer");
  assert.equal(calculateLevelProgress(501).level, 6);
  assert.equal(calculateLevelProgress(1501).title, "Grammar Fighter");
  assert.equal(calculateLevelProgress(5001).title, "Grammar Expert");
  assert.equal(calculateLevelProgress(12001).title, "Grammar Master");
  assert.equal(calculateLevelProgress(25001).title, "Grammar Legend");
  assert.ok(calculateLevelProgress(25001).level >= 41);
  console.log("[PASS] 1. Level progression & 6 canonical titles verified");

  // 2. Anti-Farming XP Eligibility (blocks Mastered non-due & 12h repeats)
  const fresh = evaluateQuestionXpEligibility({ existingSrCard: null, isCorrect: true, now });
  assert.equal(fresh.eligible, true);
  assert.equal(fresh.totalXp, XP_REWARDS.QUESTION_COMPLETED + XP_REWARDS.QUESTION_CORRECT_BONUS);

  const farmedMastered = evaluateQuestionXpEligibility({
    existingSrCard: {
      memory_state: "Mastered",
      next_review_at: new Date(now.getTime() + 10 * 86400000).toISOString(),
    },
    isCorrect: true,
    now,
  });
  assert.equal(farmedMastered.eligible, false);
  assert.equal(farmedMastered.totalXp, 0);
  console.log("[PASS] 2. Anti-farming XP guard blocks mastered repetition");

  // 3. Achievement Engine + Hidden Masking + No Duplicate Unlocks
  assert.equal(DEFAULT_ACHIEVEMENT_CATALOG.length, 20);
  const unlocked = evaluateUnlockableAchievements({
    alreadyUnlockedCodes: ["first_step"],
    stats: {
      totalAnswered: 15,
      currentStreak: 7,
      longestStreak: 7,
      isNightStudy: true,
      twelveTopicMastery: [{ chapter_number: 1, mastery_score: 92 }],
      hasPerfectQuiz: true,
      highAccuracyQuizzes: 5,
      quizzesCompleted: 12,
    },
  });
  assert.ok(!unlocked.some((b) => b.code === "first_step"), "Already unlocked badge must not re-unlock");
  assert.ok(unlocked.some((b) => b.code === "streak_7_days"));
  assert.ok(unlocked.some((b) => b.code === "master_13_tenses"));
  assert.ok(unlocked.some((b) => b.code === "night_owl_hidden"));

  const clientGallery = formatAchievementsForClient({ unlockedRows: [] });
  const maskedNightOwl = clientGallery.find((b) => b.code === "night_owl_hidden");
  assert.equal(maskedNightOwl.title_vi, "Huy hiệu Bí ẩn");
  console.log("[PASS] 3. Achievement unlock evaluator & hidden badge masking verified");

  // 4. Timezone UTC+7 Boundaries, No Same-Day Stacking & Streak Recovery
  const localDay = getLocalDateKey(new Date("2026-11-11T17:10:00Z"), 420); // 00:10 on 2026-11-12 UTC+7
  assert.equal(localDay, "2026-11-12");
  assert.ok(getLocalWeekKey(now, 420).startsWith("2026-W"));

  const sameDayRes = updateStreakState({
    streakRow: { current_streak: 4, longest_streak: 4, last_qualified_date: "2026-11-11", freeze_tokens: 1 },
    hasQualifiedActivity: true,
    now,
    tzOffsetMinutes: 420,
  });
  assert.equal(sameDayRes.current_streak, 4, "Same-day activity must not increment streak twice");
  assert.equal(sameDayRes.incremented, false);

  const recovered = recoverStreakWithFreeze({
    streakRow: { current_streak: 5, longest_streak: 5, last_qualified_date: "2026-11-09", freeze_tokens: 1 },
    now,
    tzOffsetMinutes: 420,
  });
  assert.equal(recovered.ok, true);
  assert.equal(recovered.nextRow.freeze_tokens, 0);
  console.log("[PASS] 4. Timezone UTC+7 Streak, anti-stacking & freeze recovery verified");

  // 5. Challenge Progress & Anti-Double-Claim
  const chTpl = { period_type: "daily", challenge_type: "questions_count", target_value: 2, xp_reward: 50 };
  let chRow = { current_progress: 0, correct_in_period: 0, attempts_in_period: 0, target_value: 2, status: "active" };
  const upd1 = computeChallengeProgressUpdate({ challengeTemplate: chTpl, userChallengeRow: chRow, isCorrect: true });
  assert.equal(upd1.completedNow, false);
  const upd2 = computeChallengeProgressUpdate({ challengeTemplate: chTpl, userChallengeRow: upd1.row, isCorrect: true });
  assert.equal(upd2.completedNow, true);
  assert.equal(upd2.row.status, "claimed");
  const upd3 = computeChallengeProgressUpdate({ challengeTemplate: chTpl, userChallengeRow: upd2.row, isCorrect: true });
  assert.equal(upd3.changed, false, "Claimed challenge must never grant second reward");
  console.log("[PASS] 5. Challenge progression & anti-double-claim verified");

  // 6. Migration 005 SQL Security & Concurrency Contracts
  const mig = fs.readFileSync(path.join(process.cwd(), "database/migrations/005_milestone_210_gamification.sql"), "utf8");
  assert.ok(mig.includes("uq_xp_transactions_idempotency UNIQUE (user_id, idempotency_key)"));
  assert.ok(mig.includes("uq_user_achievements_user_code UNIQUE (user_id, achievement_code)"));
  assert.ok(mig.includes("uq_user_challenge_period UNIQUE (user_id, challenge_id, period_key)"));
  assert.ok(mig.includes("achievements_server_only_insert"));
  console.log("[PASS] 6. Migration 005 RLS, idempotency & anti-tamper SQL contracts verified");

  console.log("\nALL MILESTONE 2.10 TESTS PASSED!");
}

run();
