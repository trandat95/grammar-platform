import { getAdminClient } from "../../../../lib/supabase/server";
import { verifyAdminWithGuard, getClientIp } from "../../../../lib/admin/admin-guard";
import { AuditRepository } from "../../../../repositories/audit.repository";
import { DIFFICULTY_LEVELS, validateExplanation } from "../../../../lib/explanation/explanation.schema";
import { migrateQuestionExplanation } from "../../../../lib/explanation/explanation.migrator";
import { KNOWLEDGE_GRAPH, resolveConceptForQuestion } from "../../../../lib/knowledge/knowledge-graph";
import quizData from "../../../../data/ui/quiz_bank.json";
import { attachCorrelationId, sendSafeServerError } from "../../../../lib/api/security-guard";

const CHUNK_SIZE = 500;

/**
 * Milestone 2.5.8: Batch Explanation Migration & Question-Concept Mapping Ingestion
 * POST: Validates & upserts all 2,939 questions into `explanations` and `question_concepts`.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  const adminContext = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_expl_ingest" });
  if (!adminContext) return;

  const serverClient = getAdminClient();

  try {
    const explanationRows = [];
    const conceptLinkRows = [];
    let invalidCount = 0;

    for (const topic of quizData.topics || []) {
      for (const q of topic.questions || []) {
        const enrichedQ = {
          ...q,
          topic_id: q.topic_id || topic.id,
          topic_name: q.topic_name || topic.name,
        };
        const expl = migrateQuestionExplanation(enrichedQ, DIFFICULTY_LEVELS.INTERMEDIATE);
        const validation = validateExplanation(expl);
        if (!validation.isValid) {
          invalidCount += 1;
          continue;
        }

        explanationRows.push({
          ...expl,
          status: "published",
          version: 1,
        });

        const conceptId = resolveConceptForQuestion(enrichedQ);
        const conceptNode = KNOWLEDGE_GRAPH.nodes[conceptId];
        conceptLinkRows.push({
          question_id: q.id,
          primary_topic: enrichedQ.topic_name,
          concept_id: conceptId,
          concept_name: conceptNode?.title_vi || enrichedQ.topic_name,
          lesson_id: conceptNode?.lesson_id || null,
          weight: 1.0,
        });
      }
    }

    let explanationsIngested = 0;
    let conceptLinksIngested = 0;

    for (let i = 0; i < explanationRows.length; i += CHUNK_SIZE) {
      const chunk = explanationRows.slice(i, i + CHUNK_SIZE);
      const { error } = await serverClient
        .from("explanations")
        .upsert(chunk, { onConflict: "question_id,difficulty,version", ignoreDuplicates: true });
      if (error) throw error;
      explanationsIngested += chunk.length;
    }

    for (let i = 0; i < conceptLinkRows.length; i += CHUNK_SIZE) {
      const chunk = conceptLinkRows.slice(i, i + CHUNK_SIZE);
      const { error } = await serverClient
        .from("question_concepts")
        .upsert(chunk, { onConflict: "question_id,concept_id", ignoreDuplicates: true });
      if (error) throw error;
      conceptLinksIngested += chunk.length;
    }

    await AuditRepository.recordAuditLog({
      adminId: adminContext.user.id,
      actionType: "BATCH_INGEST_EXPLANATIONS",
      targetType: "explanations",
      targetId: `total_${explanationsIngested}`,
      beforeState: null,
      afterState: {
        explanationsProcessed: explanationsIngested,
        conceptLinksProcessed: conceptLinksIngested,
        invalidSkipped: invalidCount,
      },
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      processed: explanationsIngested,
      conceptLinksProcessed: conceptLinksIngested,
      invalidSkipped: invalidCount,
    });
  } catch (e) {
    return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/explanations/batch-ingest", err: e.message });
  }
}
