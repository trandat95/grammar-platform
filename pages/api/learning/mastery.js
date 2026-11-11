import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { KNOWLEDGE_GRAPH, findPrerequisites, resolveConceptForQuestion } from "../../../lib/knowledge/knowledge-graph";
import { applyKnowledgeDecay, calculateConceptMasteryScore } from "../../../lib/learning/mastery-tracker";
import { calculateNextReview, getDailyDueSummary } from "../../../lib/explanation/spaced-repetition";
import quizData from "../../../data/ui/quiz_bank.json";

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

/**
 * Milestone 2.5.9, 2.5.10 & 2.5.11: Adaptive Concept Mastery, Knowledge Decay & SM-2 Spaced Repetition API
 */
export default async function handler(req, res) {
  const serverClient = getAdminClient();
  const authUser = await verifyServerSession(req);

  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token." });
  }

  if (req.method === "GET") {
    const requestedUserId = authUser?.id || req.query?.user_id;

    if (!requestedUserId || !UUID_REGEX.test(requestedUserId)) {
      return res.status(200).json({
        success: true,
        guestMode: true,
        dailyReview: getDailyDueSummary([]),
        concepts: KNOWLEDGE_GRAPH.nodeList.map((n) => ({
          ...n,
          attempts: 0,
          correct_attempts: 0,
          mastery_score: 0,
          decayed_score: 0,
          decay_penalty: 0,
          days_overdue: 0,
          mastery_status: "unstarted",
          prerequisites: findPrerequisites(n.id, { includeIndirect: false }),
        })),
        weakConcepts: [],
      });
    }

    if (authUser && req.query?.user_id && authUser.id !== req.query.user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user mastery read denied." });
    }

    try {
      const [{ data: progressRows, error: progErr }, { data: srRows, error: srErr }] = await Promise.all([
        serverClient.from("user_concept_progress").select("*").eq("user_id", requestedUserId),
        serverClient
          .from("spaced_repetition_queue")
          .select("*")
          .eq("user_id", requestedUserId)
          .order("next_review_at", { ascending: true })
          .limit(250),
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

      return res.status(200).json({
        success: true,
        guestMode: false,
        dailyReview,
        concepts,
        weakConcepts,
        summaryStats: {
          trackedConcepts: (progressRows || []).length,
          masteredConcepts: concepts.filter((c) => c.mastery_status === "mastered").length,
          decayedConcepts: concepts.filter((c) => c.decay_penalty > 0).length,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { user_id, question_id, is_correct, quality_rating = null, error_category = null } = req.body || {};
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
      const now = new Date();
      const nowIso = now.toISOString();

      // 1. Update Spaced Repetition Queue (SM-2: 1 -> 3 -> 7 -> 14 -> 30d)
      const { data: existingSr } = await serverClient
        .from("spaced_repetition_queue")
        .select("*")
        .eq("user_id", resolvedUserId)
        .eq("question_id", question_id)
        .maybeSingle();

      const nextSr = calculateNextReview(existingSr, Boolean(is_correct), quality_rating, now);
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
        updated_at: nowIso,
      };

      const { data: savedSr, error: srSaveErr } = await serverClient
        .from("spaced_repetition_queue")
        .upsert(srPayload, { onConflict: "user_id,question_id" })
        .select()
        .single();

      if (srSaveErr) throw srSaveErr;

      // 2. Update Real-Time Concept Mastery (user_concept_progress)
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

      const mastery = calculateConceptMasteryScore({
        attempts: nextAttempts,
        correct_attempts: nextCorrect,
        consecutive_correct: nextConsecutive,
        interval_days: nextSr.interval_days,
        next_review_at: nextSr.next_review_at,
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

      return res.status(200).json({
        success: true,
        conceptId,
        conceptNode: KNOWLEDGE_GRAPH.nodes[conceptId] || null,
        prerequisites: findPrerequisites(conceptId, { includeIndirect: false }),
        mastery: savedProg,
        spacedRepetition: savedSr,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
