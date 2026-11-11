/**
 * Milestone 2.8.9: Diagnostic Spaced Repetition Scheduler
 * Reuses SM-2 Engine (lib/explanation/spaced-repetition.js: 1 -> 3 -> 7 -> 14 -> 30 days)
 * and integrates user_mistakes into scheduled retention reviews.
 */

import {
  SPACED_REPETITION_INTERVALS,
  calculateNextReview,
  getDailyDueSummary,
} from "../explanation/spaced-repetition";
import { resolveConceptForQuestion } from "../knowledge/knowledge-graph";

export { SPACED_REPETITION_INTERVALS, calculateNextReview, getDailyDueSummary };

/**
 * Generates SM-2 review schedule items from learner's saved mistakes & incorrect diagnostic answers.
 */
export function scheduleMistakeQueue(savedMistakes = [], existingCards = [], now = new Date()) {
  const existingMap = new Map((existingCards || []).map((c) => [c.question_id, c]));
  const scheduled = [];

  for (const m of savedMistakes || []) {
    const qid = m.id || m.question_id;
    if (!qid) continue;
    const prev = existingMap.get(qid);
    if (prev) {
      scheduled.push(prev);
      continue;
    }
    const conceptId = resolveConceptForQuestion(m);
    const initialPlan = calculateNextReview(null, false, 1, now);
    scheduled.push({
      question_id: qid,
      concept_id: conceptId,
      topic_name: m.topic_name || "Ngữ pháp",
      stem: m.stem || "",
      ease_factor: initialPlan.ease_factor,
      interval_days: initialPlan.interval_days,
      repetitions: initialPlan.repetitions,
      consecutive_correct: initialPlan.consecutive_correct,
      last_reviewed_at: initialPlan.last_reviewed_at,
      next_review_at: now.toISOString(), // Mistakes are immediately due for first reinforcement
      status: "due",
    });
  }

  return getDailyDueSummary(scheduled, now);
}
