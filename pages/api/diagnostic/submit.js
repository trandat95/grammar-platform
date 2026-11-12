/**
 * API: POST /api/diagnostic/submit
 * Deterministic assessment submission, grading, and personalized roadmap generation.
 * Server-Side Validation: Anti-tampering, JWT-verified cloud persistence, RLS-safe writes.
 */

import { scoreDiagnosticAttempt } from "../../../lib/diagnostic/diagnostic.scoring";
import { generatePersonalizedRoadmap } from "../../../lib/diagnostic/roadmap.generator";
import { analyzeDiagnosticRootCauses } from "../../../lib/diagnostic/knowledge.graph";
import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import {
  attachCorrelationId,
  checkApiRateLimit,
  isValidUuid,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "diagnostic_submit",
    maxRequests: 30,
    correlationId,
  });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (req.headers?.authorization && !authUser) {
    return res.status(401).json({ success: false, error: "Invalid or expired Bearer session token.", correlationId });
  }

  try {
    const {
      test_id = "a0000000-0000-0000-0000-000000000001",
      answers = [],
      duration_seconds = 0,
      user_id,
      user_tracker = {},
    } = req.body || {};

    if (!Array.isArray(answers) || answers.length > 100) {
      return res.status(422).json({ success: false, error: "Invalid answers payload.", correlationId });
    }

    if (authUser && user_id && isValidUuid(user_id) && authUser.id !== user_id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cross-user diagnostic submission denied.", correlationId });
    }

    const safeDuration = Math.max(0, Math.min(7200, Number(duration_seconds) || 0));

    // 1. Layer 1: Deterministic Scorer (Zero Hallucination)
    const scoreResult = scoreDiagnosticAttempt(answers, safeDuration);
    scoreResult.root_cause_analysis = analyzeDiagnosticRootCauses(
      scoreResult.detailed_answers,
      scoreResult.skill_results
    );

    // 2. Layer 2: Actionable Personalized Roadmap Generator
    const roadmap = generatePersonalizedRoadmap(scoreResult, user_tracker);
    if (roadmap) {
      roadmap.current_version = 1;
      roadmap.version_history = [
        {
          version_number: 1,
          trigger_reason: "initial_diagnostic",
          adjustments_count: 0,
          summary: "Khởi tạo lộ trình 4 tuần từ bài kiểm tra chẩn đoán 30 câu.",
          created_at: new Date().toISOString(),
        },
      ];
    }

    let savedToCloud = false;
    let attemptId = null;

    // 3. Persist to Supabase ONLY for authenticated Bearer session users (prevents spoofing)
    const verifiedUserId = authUser?.id || null;
    if (verifiedUserId) {
      const serverClient = getAdminClient(req);
      try {
        const { data: attemptData, error: attemptError } = await serverClient
          .from("diagnostic_attempts")
          .insert({
            user_id: verifiedUserId,
            test_id: isValidUuid(test_id) ? test_id : null,
            total_questions: scoreResult.total_questions,
            correct_answers: scoreResult.correct_answers,
            total_score: scoreResult.total_score,
            estimated_level: scoreResult.estimated_level.code,
            status: "COMPLETED",
            started_at: new Date(Date.now() - safeDuration * 1000).toISOString(),
            completed_at: scoreResult.completed_at,
          })
          .select("id")
          .single();

        if (!attemptError && attemptData?.id) {
          attemptId = attemptData.id;
          savedToCloud = true;

          const answerInserts = scoreResult.detailed_answers.map((ans) => ({
            attempt_id: attemptId,
            question_id: ans.question_id,
            question_snapshot: {
              stem: ans.stem,
              options: ans.options,
              topic: ans.topic,
              difficulty: ans.difficulty,
            },
            selected_answer: ans.selected_answer,
            is_correct: ans.is_correct,
            time_spent_seconds: ans.time_spent_seconds,
            answered_at: new Date().toISOString(),
          }));

          if (answerInserts.length > 0) {
            await serverClient.from("diagnostic_answers").insert(answerInserts);
          }

          const skillInserts = scoreResult.skill_results.map((skill) => ({
            attempt_id: attemptId,
            user_id: verifiedUserId,
            topic_id: skill.topic_id,
            topic_name: skill.topic_name,
            total_questions: skill.total_questions,
            correct_answers: skill.correct_answers,
            accuracy: skill.accuracy,
            confidence: skill.confidence,
            classification: skill.classification,
          }));

          if (skillInserts.length > 0) {
            await serverClient.from("diagnostic_skill_results").insert(skillInserts);
          }

          const { data: roadmapData, error: roadmapError } = await serverClient
            .from("user_learning_roadmaps")
            .insert({
              user_id: verifiedUserId,
              diagnostic_attempt_id: attemptId,
              title: roadmap.title,
              target_level: roadmap.target_level,
              status: "ACTIVE",
            })
            .select("id")
            .single();

          if (!roadmapError && roadmapData?.id) {
            roadmap.db_id = roadmapData.id;

            const taskInserts = [];
            roadmap.weeks.forEach((week) => {
              week.tasks.forEach((task) => {
                taskInserts.push({
                  roadmap_id: roadmapData.id,
                  user_id: verifiedUserId,
                  lesson_id: task.lesson_id,
                  topic_id: task.lesson_code,
                  title: task.title,
                  item_type: task.action_type,
                  priority: task.priority,
                  sequence_order: task.sequence_order,
                  status: task.status === "completed" ? "COMPLETED" : "PENDING",
                  reason: task.reason,
                });
              });
            });

            if (taskInserts.length > 0) {
              await serverClient.from("roadmap_items").insert(taskInserts);
            }

            await serverClient.from("roadmap_versions").insert({
              roadmap_id: roadmapData.id,
              user_id: verifiedUserId,
              version_number: 1,
              trigger_reason: "initial_diagnostic",
              adjustment_summary: [
                {
                  rule: "INITIAL_GENERATION",
                  detail: `Khởi tạo lộ trình từ kết quả ${scoreResult.percentage}/100 (${scoreResult.estimated_level.code}).`,
                },
              ],
              weeks_snapshot: roadmap.weeks,
            });
          }
        }
      } catch (dbErr) {
        console.warn("Supabase persistence fallback to local:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      score_result: scoreResult,
      roadmap: roadmap,
      saved_to_cloud: savedToCloud,
      attempt_id: attemptId,
      correlationId,
    });
  } catch (error) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/diagnostic/submit",
      err: error,
      publicMessage: "Internal server error while evaluating diagnostic test",
    });
  }
}
