/**
 * Milestone 2.8.9: Knowledge Retention & Growth Tracker
 * Combines Milestone 2.5 Concept Mastery / Ebbinghaus Decay with Multi-Attempt Diagnostic Growth.
 */

import { applyKnowledgeDecay } from "../learning/mastery-tracker";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateRetentionMetrics({
  conceptProgress = [],
  srCards = [],
  diagnosticAttempts = [],
  now = new Date(),
}) {
  const progressList = conceptProgress || [];
  const cards = srCards || [];
  const attempts = [...(diagnosticAttempts || [])].sort(
    (a, b) => new Date(a.completed_at || a.started_at || 0) - new Date(b.completed_at || b.started_at || 0)
  );

  // 1. Short-term vs Long-term Retention
  let decayedSum = 0;
  let decayCount = 0;
  const topicsAtRisk = [];

  for (const c of progressList) {
    const decay = applyKnowledgeDecay(c.mastery_score ?? 0, c.next_review_at, now);
    decayedSum += decay.decayedScore;
    if (decay.decayPenalty > 0) {
      decayCount += 1;
    }
    if (decay.decayPenalty > 0 || decay.decayedScore < 65) {
      topicsAtRisk.push({
        concept_id: c.concept_id,
        mastery_score: Number(c.mastery_score || 0),
        decayed_score: decay.decayedScore,
        decay_penalty: decay.decayPenalty,
        days_overdue: decay.daysOverdue,
      });
    }
  }

  const longTermCards = cards.filter((c) => Number(c.interval_days || 1) >= 14);
  const masteredCards = cards.filter((c) => c.status === "mastered");

  const overallRetentionScore =
    progressList.length > 0
      ? Math.round(decayedSum / progressList.length)
      : cards.length > 0
      ? Math.round((masteredCards.length / cards.length) * 100)
      : 0;

  // 2. Diagnostic Multi-Attempt Progress Comparison (+% Growth)
  let growthSummary = null;
  if (attempts.length >= 2) {
    const first = attempts[0];
    const latest = attempts[attempts.length - 1];
    const initialPct = Number(first.total_score ?? first.percentage ?? 0);
    const latestPct = Number(latest.total_score ?? latest.percentage ?? 0);
    growthSummary = {
      attemptCount: attempts.length,
      initialScore: Math.round(initialPct),
      latestScore: Math.round(latestPct),
      growthDelta: Math.round(latestPct - initialPct),
      initialLevel: first.estimated_level?.code || first.estimated_level || "A2",
      latestLevel: latest.estimated_level?.code || latest.estimated_level || "B1",
      daysBetween: Math.max(
        0,
        Math.round(
          (new Date(latest.completed_at || now).getTime() - new Date(first.completed_at || now).getTime()) / MS_PER_DAY
        )
      ),
    };
  } else if (attempts.length === 1) {
    const only = attempts[0];
    growthSummary = {
      attemptCount: 1,
      initialScore: Math.round(Number(only.total_score ?? only.percentage ?? 0)),
      latestScore: Math.round(Number(only.total_score ?? only.percentage ?? 0)),
      growthDelta: 0,
      initialLevel: only.estimated_level?.code || only.estimated_level || "B1",
      latestLevel: only.estimated_level?.code || only.estimated_level || "B1",
      daysBetween: 0,
    };
  }

  return {
    overallRetentionScore,
    trackedConceptsCount: progressList.length,
    decayedConceptsCount: decayCount,
    longTermIntervalCardsCount: longTermCards.length,
    masteredCardsCount: masteredCards.length,
    topicsAtRisk: topicsAtRisk.sort((a, b) => a.decayed_score - b.decayed_score).slice(0, 5),
    growthSummary,
  };
}
