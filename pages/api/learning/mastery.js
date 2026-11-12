import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { KNOWLEDGE_GRAPH, findPrerequisites, resolveConceptForQuestion } from "../../../lib/knowledge/knowledge-graph";
import {
  applyKnowledgeDecay,
  calculateMultiFactorMastery,
  aggregateTwelveTopicMastery,
} from "../../../lib/learning/mastery-tracker";
import {
  calculateNextReview,
  getDailyDueSummary,
  calculateForgettingCurve,
} from "../../../lib/explanation/spaced-repetition";
import { generatePersonalRecommendations } from "../../../lib/learning/adaptive-question-engine";
import { processLearningGamificationEvent } from "../../../lib/gamification/gamification-processor";
import quizData from "../../../data/ui/quiz_bank.json";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const QUESTION_MAP = (() => {
  const map = new Map();
  for (const topic of quizData.topics || []) {
    for (const q of topic.questions || []) {
      map.set(q.id, {
        ...q,
        topic_id: q.topic_id || topic.id,
        topic_name: q.topic_name || topic.name,
      });
    }
  }
  return map;
})();

const DIFF_TO_SCORE = { Beginner: 1, Elementary: 2, Intermediate: 3, Advanced: 4, easy: 1, medium: 3, hard: 4 };

/**
 * Milestone 2.5 & 2.9: Adaptive 12-Topic Concept Mastery, 5-State SM-2 & Forgetting Curve API
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const serverClient = getAdminClient(req);
  const authUser = await verifyServerSession(req);

  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token." });
  }

  if (req.method === "GET") {
    const requestedUserId = authUser?.id || req.query?.user_id;

    if (!requestedUserId || !UUID_REGEX.test(requestedUserId)) {
      const guestConcepts = KNOWLEDGE_GRAPH.nodeList.map((n) => ({
        ...n,
        attempts: 0,
        correct_attempts: 0,
        mastery_score: 0,
        decayed_score: 0,
        decay_penalty: 0,
        days_overdue: 0,
        mastery_status: "unstarted",
        mastery_tier: "Beginner",
        prerequisites: findPrerequisites(n.id, { includeIndirect: false }),
      }));
      const twelveTopicMastery = aggregateTwelveTopicMastery(guestConcepts);
      const dailyReview = getDailyDueSummary([]);
      const forgettingCurve = calculateForgettingCurve([]);
      const personalRecommendations = generatePersonalRecommendations({
        twelveTopicMastery,
        dailyReview,
        retentionMetrics: { overallRetentionScore: 0 },
      });

      return res.status(200).json({
        success: true,
        guestMode: true,
        dailyReview,
        concepts: guestConcepts,
        weakConcepts: [],
        twelveTopicMastery,
        forgettingCurve,
        personalRecommendations,
        analyticsIntelligence: {
          overallMastery: 0,
          learningVelocity7d: 0,
          strongestTopic: null,
          weakestTopic: null,
        },
      });
    }

    if (authUser && req.query?.user_id && authUser.id !== req.query.user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user mastery read denied." });
    }

    try {
      const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [
        { data: progressRows, error: progErr },
        { data: srRows, error: srErr },
        { data: recentEvents },
      ] = await Promise.all([
        serverClient.from("user_concept_progress").select("*").eq("user_id", requestedUserId),
        serverClient
          .from("spaced_repetition_queue")
          .select("*")
          .eq("user_id", requestedUserId)
          .order("next_review_at", { ascending: true })
          .limit(300),
        serverClient
          .from("learning_event_logs")
          .select("id, created_at, is_correct")
          .eq("user_id", requestedUserId)
          .gte("created_at", weekAgoIso),
      ]);

      if (progErr) throw progErr;
      if (srErr) throw srErr;

      const progressByConcept = new Map((progressRows || []).map((r) => [r.concept_id, r]));
      const now = new Date();

      const concepts = KNOWLEDGE_GRAPH.nodeList.map((node) => {
        const prog = progressByConcept.get(node.id);
        if (!prog) {
          return {
            ...node,
            attempts: 0,
            correct_attempts: 0,
            incorrect_attempts: 0,
            consecutive_correct: 0,
            mastery_score: 0,
            decayed_score: 0,
            decay_penalty: 0,
            days_overdue: 0,
            mastery_status: "unstarted",
            mastery_tier: "Beginner",
            prerequisites: findPrerequisites(node.id, { includeIndirect: false }),
          };
        }

        const decay = applyKnowledgeDecay(prog.mastery_score, prog.next_review_at, now);
        return {
          ...node,
          attempts: prog.attempts || 0,
          correct_attempts: prog.correct_attempts || 0,
          incorrect_attempts: prog.incorrect_attempts || 0,
          consecutive_correct: prog.consecutive_correct || 0,
          mastery_score: Number(prog.mastery_score || 0),
          decayed_score: decay.decayedScore,
          decay_penalty: decay.decayPenalty,
          days_overdue: decay.daysOverdue,
          mastery_status: prog.mastery_status || "learning",
          mastery_tier: prog.mastery_tier || "Beginner",
          consistency_score: Number(prog.consistency_score || 0),
          retention_score: Number(prog.retention_score || 0),
          topic_coverage_score: Number(prog.topic_coverage_score || 0),
          unique_questions_seen: prog.unique_questions_seen || 0,
          last_reviewed_at: prog.last_reviewed_at,
          next_review_at: prog.next_review_at,
          prerequisites: findPrerequisites(node.id, { includeIndirect: false }),
        };
      });

      const weakConcepts = concepts
        .filter((c) => c.attempts > 0 && c.decayed_score < 70)
        .sort((a, b) => a.decayed_score - b.decayed_score)
        .slice(0, 6);

      const enrichedSrCards = (srRows || []).map((card) => {
        const q = QUESTION_MAP.get(card.question_id);
        return {
          ...card,
          question: q
            ? {
                id: q.id,
                stem: q.stem,
                options: q.options || [],
                answers: q.answers || (q.answer ? [q.answer] : []),
                explanation: q.explanation || "",
                pedagogy: q.pedagogy || null,
                topic_id: q.topic_id,
                topic_name: q.topic_name,
              }
            : null,
          concept: card.concept_id ? KNOWLEDGE_GRAPH.nodes[card.concept_id] || null : null,
        };
      });

      const dailyReview = getDailyDueSummary(enrichedSrCards, now);
      const twelveTopicMastery = aggregateTwelveTopicMastery(concepts);
      const forgettingCurve = calculateForgettingCurve(srRows || [], now);

      const trackedChapters = twelveTopicMastery.filter((t) => t.attempts > 0);
      const overallMastery =
        trackedChapters.length > 0
          ? Math.round(trackedChapters.reduce((s, t) => s + t.mastery_score, 0) / trackedChapters.length)
          : 0;
      const strongestTopic =
        trackedChapters.length > 0 ? [...trackedChapters].sort((a, b) => b.mastery_score - a.mastery_score)[0] : null;
      const weakestTopic =
        trackedChapters.length > 0 ? [...trackedChapters].sort((a, b) => a.mastery_score - b.mastery_score)[0] : null;

      const personalRecommendations = generatePersonalRecommendations({
        twelveTopicMastery,
        dailyReview,
        retentionMetrics: { overallRetentionScore: forgettingCurve.longTermRetention || overallMastery },
      });

      return res.status(200).json({
        success: true,
        guestMode: false,
        dailyReview,
        concepts,
        weakConcepts,
        twelveTopicMastery,
        forgettingCurve,
        personalRecommendations,
        analyticsIntelligence: {
          overallMastery,
          learningVelocity7d: (recentEvents || []).length,
          strongestTopic,
          weakestTopic,
        },
        summaryStats: {
          trackedConcepts: (progressRows || []).length,
          masteredConcepts: concepts.filter((c) => c.mastery_status === "mastered").length,
          decayedConcepts: concepts.filter((c) => c.decay_penalty > 0).length,
        },
      });
    } catch (err) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/learning/mastery", err: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        user_id,
        question_id,
        is_correct,
        quality_rating = null,
        error_category = null,
        response_time_ms = 0,
        difficulty_rating = null,
        idempotency_key = null,
        device_id = null,
      } = req.body || {};

      const resolvedUserId = authUser?.id || user_id;

      if (!resolvedUserId || !UUID_REGEX.test(resolvedUserId)) {
        return res.status(400).json({ success: false, error: "Valid user_id UUID required." });
      }
      if (authUser && user_id && authUser.id !== user_id) {
        return res.status(403).json({ success: false, error: "Forbidden: Cross-user mastery mutation denied." });
      }
      if (!question_id) {
        return res.status(400).json({ success: false, error: "Missing required 'question_id'." });
      }

      const question = QUESTION_MAP.get(question_id);
      const conceptId = resolveConceptForQuestion(question || { id: question_id }, error_category);
      const diffScore = difficulty_rating || DIFF_TO_SCORE[question?.level] || 3;
      const now = new Date();
      const nowIso = now.toISOString();

      // Anti-Duplicate Idempotency Check via Unified Learning Event Log (8D.1 & 2.9.8)
      if (idempotency_key && typeof idempotency_key === "string") {
        const { error: evErr } = await serverClient.from("learning_event_logs").insert({
          user_id: resolvedUserId,
          idempotency_key,
          event_type: "QUESTION_ANSWERED",
          question_id,
          concept_id: conceptId,
          is_correct: Boolean(is_correct),
          response_time_ms: Math.max(0, Math.round(Number(response_time_ms || 0))),
          device_id,
          payload: { error_category, difficulty_score: diffScore },
        });
        if (evErr && (evErr.code === "23505" || evErr.message?.toLowerCase().includes("duplicate"))) {
          return res.status(200).json({
            success: true,
            deduped: true,
            conceptId,
            message: "Idempotent learning event already processed.",
          });
        }
      }

      // 1. Update Spaced Repetition Queue (5-State Machine & Stability/Retrievability)
      const { data: existingSr } = await serverClient
        .from("spaced_repetition_queue")
        .select("*")
        .eq("user_id", resolvedUserId)
        .eq("question_id", question_id)
        .maybeSingle();

      const nextSr = calculateNextReview(existingSr, Boolean(is_correct), quality_rating, now, {
        responseTimeMs: response_time_ms,
        difficultyWeight: diffScore,
      });

      const srPayload = {
        user_id: resolvedUserId,
        question_id,
        concept_id: conceptId,
        topic_id: question?.topic_id || null,
        ease_factor: nextSr.ease_factor,
        interval_days: nextSr.interval_days,
        repetitions: nextSr.repetitions,
        consecutive_correct: nextSr.consecutive_correct,
        last_reviewed_at: nextSr.last_reviewed_at,
        next_review_at: nextSr.next_review_at,
        status: nextSr.status,
        memory_state: nextSr.memory_state,
        response_time_ms: nextSr.response_time_ms,
        correct_history: nextSr.correct_history,
        difficulty_rating: nextSr.difficulty_rating,
        stability_score: nextSr.stability_score,
        retrievability_score: nextSr.retrievability_score,
        updated_at: nowIso,
      };

      const { data: savedSr, error: srSaveErr } = await serverClient
        .from("spaced_repetition_queue")
        .upsert(srPayload, { onConflict: "user_id,question_id" })
        .select()
        .single();

      if (srSaveErr) throw srSaveErr;

      // Count unique questions seen for this concept to enforce Anti-Gaming Topic Coverage
      const { count: uniqueCount } = await serverClient
        .from("spaced_repetition_queue")
        .select("question_id", { count: "exact", head: true })
        .eq("user_id", resolvedUserId)
        .eq("concept_id", conceptId);

      // 2. Update 6-Factor Anti-Gaming Concept Mastery (user_concept_progress)
      const { data: existingProg } = await serverClient
        .from("user_concept_progress")
        .select("*")
        .eq("user_id", resolvedUserId)
        .eq("concept_id", conceptId)
        .maybeSingle();

      const nextAttempts = Number(existingProg?.attempts || 0) + 1;
      const nextCorrect = Number(existingProg?.correct_attempts || 0) + (is_correct ? 1 : 0);
      const nextIncorrect = Number(existingProg?.incorrect_attempts || 0) + (is_correct ? 0 : 1);
      const nextConsecutive = is_correct ? Number(existingProg?.consecutive_correct || 0) + 1 : 0;
      const seenCount = Math.max(1, uniqueCount || 1);

      const mastery = calculateMultiFactorMastery({
        attempts: nextAttempts,
        correct_attempts: nextCorrect,
        consecutive_correct: nextConsecutive,
        interval_days: nextSr.interval_days,
        next_review_at: nextSr.next_review_at,
        last_attempt_at: nowIso,
        avg_difficulty_score: diffScore,
        unique_questions_seen: seenCount,
        now,
      });

      const progPayload = {
        user_id: resolvedUserId,
        concept_id: conceptId,
        attempts: nextAttempts,
        correct_attempts: nextCorrect,
        incorrect_attempts: nextIncorrect,
        consecutive_correct: nextConsecutive,
        mastery_score: mastery.masteryScore,
        mastery_status: mastery.masteryStatus,
        mastery_tier: mastery.masteryTier,
        consistency_score: mastery.factors.consistency,
        retention_score: mastery.factors.retention,
        difficulty_weight: mastery.factors.difficultyWeight,
        recency_score: mastery.factors.recency,
        topic_coverage_score: mastery.factors.topicCoverage,
        unique_questions_seen: seenCount,
        last_attempt_at: nowIso,
        last_reviewed_at: nowIso,
        next_review_at: nextSr.next_review_at,
        updated_at: nowIso,
      };

      const { data: savedProg, error: progSaveErr } = await serverClient
        .from("user_concept_progress")
        .upsert(progPayload, { onConflict: "user_id,concept_id" })
        .select()
        .single();

      if (progSaveErr) throw progSaveErr;

      // 3. Section 8D.1 Shared Pipeline: Trigger M2.10 XP, Streak, Challenges & Achievements
      const { data: allProgRows } = await serverClient
        .from("user_concept_progress")
        .select("*")
        .eq("user_id", resolvedUserId);

      const progLookup = new Map((allProgRows || []).map((r) => [r.concept_id, r]));
      const snapshotNodes = KNOWLEDGE_GRAPH.nodeList.map((n) => {
        const pr = progLookup.get(n.id);
        return pr ? { ...n, ...pr } : { ...n, attempts: 0, mastery_score: 0 };
      });
      const twelveTopicSnapshot = aggregateTwelveTopicMastery(snapshotNodes);

      const gamification = await processLearningGamificationEvent({
        serverClient,
        userId: resolvedUserId,
        eventType: "QUESTION_ANSWERED",
        idempotencyKey: idempotency_key || `${resolvedUserId}_${question_id}_${Date.now()}`,
        questionId: question_id,
        isCorrect: Boolean(is_correct),
        responseTimeMs: Number(response_time_ms || 0),
        existingSrCard: existingSr,
        nextSrCard: savedSr,
        masteryBeforeScore: Number(existingProg?.mastery_score || 0),
        masteryAfter: mastery,
        twelveTopicMastery: twelveTopicSnapshot,
        now,
      });

      return res.status(200).json({
        success: true,
        deduped: false,
        conceptId,
        conceptNode: KNOWLEDGE_GRAPH.nodes[conceptId] || null,
        prerequisites: findPrerequisites(conceptId, { includeIndirect: false }),
        mastery: savedProg,
        masteryFactors: mastery.factors,
        spacedRepetition: savedSr,
        gamification,
      });
    } catch (err) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/learning/mastery", err: err.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
