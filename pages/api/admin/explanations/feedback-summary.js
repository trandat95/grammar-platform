import { getAdminClient } from "../../../../lib/supabase/server";
import { verifyAdminWithGuard } from "../../../../lib/admin/admin-guard";
import { KNOWLEDGE_GRAPH, resolveConceptForQuestion } from "../../../../lib/knowledge/knowledge-graph";
import quizData from "../../../../data/ui/quiz_bank.json";
import { attachCorrelationId, sendSafeServerError } from "../../../lib/api/security-guard";

const QUESTION_LOOKUP = (() => {
  const map = new Map();
  for (const topic of quizData.topics || []) {
    for (const q of topic.questions || []) {
      map.set(q.id, {
        id: q.id,
        stem: q.stem || "",
        topic_id: q.topic_id || topic.id,
        topic_name: q.topic_name || topic.name,
        level: q.level || "Intermediate",
      });
    }
  }
  return map;
})();

/**
 * Milestone 2.5.12: Admin Pedagogical Quality & Explanation Feedback Summary API
 * Protected with Zero-Trust Admin RBAC & Sliding-Window Rate Limiter.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }

  const adminContext = await verifyAdminWithGuard(req, res, { rateLimitKeyPrefix: "admin_feedback_read" });
  if (!adminContext) return;

  const dbClient = getAdminClient();

  try {
    const { questionId, minReports } = req.query;
    const minReportThreshold = Number(minReports || 0);

    let feedbackQuery = dbClient
      .from("explanation_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (questionId) {
      feedbackQuery = feedbackQuery.eq("question_id", questionId);
    }

    const [
      { data: allFeedback, error: fbError },
      { count: ingestedExplanationsCount },
      { count: mappedConceptsCount },
    ] = await Promise.all([
      feedbackQuery,
      dbClient.from("explanations").select("*", { count: "exact", head: true }),
      dbClient.from("question_concepts").select("*", { count: "exact", head: true }),
    ]);

    if (fbError) throw fbError;

    const feedbackRows = allFeedback || [];
    const total = feedbackRows.length;
    const helpful = feedbackRows.filter((f) => f.feedback_type === "helpful").length;
    const reported = feedbackRows.filter((f) => f.feedback_type === "report_error").length;
    const helpfulRate = total > 0 ? Math.round((helpful / total) * 100) : 100;

    const errorBreakdown = {};
    const groupMap = new Map();

    for (const row of feedbackRows) {
      const qid = row.question_id || "unknown";
      if (!groupMap.has(qid)) {
        const meta = QUESTION_LOOKUP.get(qid);
        const conceptId = meta ? resolveConceptForQuestion(meta) : null;
        groupMap.set(qid, {
          question_id: qid,
          topic_name: meta?.topic_name || "Ngữ pháp tổng hợp",
          stem_preview: meta?.stem ? (meta.stem.length > 110 ? `${meta.stem.slice(0, 110)}...` : meta.stem) : qid,
          concept_id: conceptId,
          concept_title: conceptId && KNOWLEDGE_GRAPH.nodes[conceptId] ? KNOWLEDGE_GRAPH.nodes[conceptId].title_vi : null,
          helpfulCount: 0,
          reportCount: 0,
          categories: {},
          latestComment: null,
          latestReportAt: null,
        });
      }

      const grp = groupMap.get(qid);
      if (row.feedback_type === "helpful") {
        grp.helpfulCount += 1;
      } else if (row.feedback_type === "report_error") {
        grp.reportCount += 1;
        if (row.error_category) {
          errorBreakdown[row.error_category] = (errorBreakdown[row.error_category] || 0) + 1;
          grp.categories[row.error_category] = (grp.categories[row.error_category] || 0) + 1;
        }
        if (!grp.latestReportAt) {
          grp.latestReportAt = row.created_at;
          grp.latestComment = row.comment || null;
        }
      }
    }

    const questionGroups = Array.from(groupMap.values())
      .filter((g) => (minReportThreshold > 0 ? g.reportCount >= minReportThreshold : true))
      .sort((a, b) => b.reportCount - a.reportCount || b.helpfulCount - a.helpfulCount)
      .slice(0, 100);

    const recentReports = feedbackRows
      .filter((f) => f.feedback_type === "report_error")
      .slice(0, 25)
      .map((f) => {
        const meta = QUESTION_LOOKUP.get(f.question_id);
        return {
          id: f.id,
          question_id: f.question_id,
          topic_name: meta?.topic_name || "Ngữ pháp tổng hợp",
          stem_preview: meta?.stem ? (meta.stem.length > 90 ? `${meta.stem.slice(0, 90)}...` : meta.stem) : f.question_id,
          error_category: f.error_category || "other",
          comment: f.comment || "",
          created_at: f.created_at,
        };
      });

    return res.status(200).json({
      success: true,
      summary: {
        totalFeedback: total,
        helpfulCount: helpful,
        reportErrorCount: reported,
        helpfulRatePercent: helpfulRate,
        errorBreakdown,
        ingestedExplanationsCount: ingestedExplanationsCount || 0,
        mappedConceptsCount: mappedConceptsCount || 0,
        totalQuizQuestions: QUESTION_LOOKUP.size,
      },
      questionGroups,
      recentReports,
    });
  } catch (err) {
    return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/admin/explanations/feedback-summary", err: err.message || "Internal server error fetching feedback summary." });
  }
}
