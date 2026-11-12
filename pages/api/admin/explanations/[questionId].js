import { getAdminClient } from "../../../../lib/supabase/server";
import { verifyAdminWithGuard, getClientIp } from "../../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../../repositories/audit.repository";
import {
  SCHEMA_VERSION,
  DIFFICULTY_LEVELS,
  DIFFICULTY_SCORES,
  ESTIMATED_TIME_SECONDS,
  validateExplanation,
} from "../../../../lib/explanation/explanation.schema";
import { migrateQuestionExplanation } from "../../../../lib/explanation/explanation.migrator";
import { resolveConceptForQuestion } from "../../../../lib/knowledge/knowledge-graph";
import quizData from "../../../../data/ui/quiz_bank.json";
import { attachCorrelationId, sendSafeServerError } from "../../../lib/api/security-guard";

function findQuestionInBank(questionId) {
  for (const topic of quizData.topics || []) {
    const match = (topic.questions || []).find((q) => q.id === questionId);
    if (match) {
      return {
        ...match,
        topic_id: match.topic_id || topic.id,
        topic_name: match.topic_name || topic.name,
      };
    }
  }
  return null;
}

/**
 * Milestone 2.5.12: Admin Pedagogical Quality Editor API
 * GET: Fetch latest DB or migrated explanation + question stem/answers for review
 * PUT: Validate strict 5-field JSON, publish incremented version, and record immutable audit log
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  const adminContext = await verifyAdminWithGuard(req, res, {
    rateLimitKeyPrefix: req.method === "GET" ? "admin_expl_read" : "admin_expl_write",
  });
  if (!adminContext) return;

  const { questionId } = req.query;
  if (!questionId || typeof questionId !== "string") {
    return res.status(400).json({ success: false, error: "Missing questionId parameter." });
  }

  const serverClient = getAdminClient();
  const question = findQuestionInBank(questionId);

  if (req.method === "GET") {
    try {
      const difficulty = req.query.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;
      const { data: latest, error } = await serverClient
        .from("explanations")
        .select("*")
        .eq("question_id", questionId)
        .eq("difficulty", difficulty)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      const explanation =
        latest || (question ? migrateQuestionExplanation(question, difficulty) : null);

      if (!explanation) {
        return res.status(404).json({ success: false, error: `Question '${questionId}' not found.` });
      }

      return res.status(200).json({
        success: true,
        source: latest ? "database" : "generated",
        question,
        conceptId: question ? resolveConceptForQuestion(question) : null,
        explanation,
      });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/explanations/[questionId]", err: e.message });
    }
  }

  if (req.method === "PUT" || req.method === "POST") {
    try {
      const body = req.body || {};
      const difficulty = body.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;
      const payload = {
        schema_version: body.schema_version || SCHEMA_VERSION,
        question_id: questionId,
        topic_id: body.topic_id || question?.topic_id || "general",
        difficulty,
        difficulty_score: DIFFICULTY_SCORES[difficulty] || 3,
        estimated_time_seconds: ESTIMATED_TIME_SECONDS[difficulty] || 60,
        language: body.language || "vi",
        signal: body.signal,
        rule: body.rule,
        translation: body.translation,
        common_mistakes: body.common_mistakes,
        exam_tips: body.exam_tips,
      };

      const validation = validateExplanation(payload);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Schema validation failed (5-field Pedagogical Contract).",
          validationErrors: validation.errors,
        });
      }

      const { data: beforeState } = await serverClient
        .from("explanations")
        .select("*")
        .eq("question_id", questionId)
        .eq("difficulty", difficulty)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = Number(beforeState?.version || 0) + 1;
      const nowIso = new Date().toISOString();

      const { data: saved, error } = await serverClient
        .from("explanations")
        .upsert(
          {
            ...payload,
            status: body.status === "draft" ? "draft" : "published",
            version: nextVersion,
            updated_at: nowIso,
          },
          { onConflict: "question_id,difficulty,version" }
        )
        .select()
        .single();

      if (error) throw error;

      await AuditRepository.recordAuditLog({
        adminId: adminContext.user.id,
        actionType: "EDIT_EXPLANATION",
        targetType: "explanations",
        targetId: `${questionId}:v${nextVersion}`,
        beforeState: beforeState || null,
        afterState: saved,
        ipAddress: getClientIp(req),
      });

      return res.status(200).json({
        success: true,
        explanation: saved,
        version: nextVersion,
      });
    } catch (e) {
      return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/explanations/[questionId]", err: e.message });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
