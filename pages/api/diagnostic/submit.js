/**
 * API: POST /api/diagnostic/submit
 * Deterministic assessment submission, grading, and personalized roadmap generation.
 * Server-Side Validation: Anti-tampering, 1-shot grading, RLS-safe DB persistence.
 */

import { scoreDiagnosticAttempt } from "../../../lib/diagnostic/diagnostic.scoring";
import { generatePersonalizedRoadmap } from "../../../lib/diagnostic/roadmap.generator";
import { supabaseServer } from "../../../lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return typeof str === "string" && UUID_REGEX.test(str);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      test_id = "a0000000-0000-0000-0000-000000000001",
      answers = [],
      duration_seconds = 0,
      user_id,
      user_tracker = {},
    } = req.body;

    // 1. Layer 1: Deterministic Scorer (Zero Hallucination)
    const scoreResult = scoreDiagnosticAttempt(answers, duration_seconds);

    // 2. Layer 2: Actionable Personalized Roadmap Generator
    const roadmap = generatePersonalizedRoadmap(scoreResult, user_tracker);

    let savedToCloud = false;
    let attemptId = null;

    // 3. Persist to Supabase if valid user UUID is provided
    if (user_id && isValidUUID(user_id)) {
      try {
        // Insert diagnostic attempt
        const { data: attemptData, error: attemptError } = await supabaseServer
          .from("diagnostic_attempts")
          .insert({
            user_id: user_id,
            test_id: isValidUUID(test_id) ? test_id : null,
            total_questions: scoreResult.total_questions,
            correct_answers: scoreResult.correct_answers,
            total_score: scoreResult.total_score,
            estimated_level: scoreResult.estimated_level.code,
            status: "COMPLETED",
            started_at: new Date(Date.now() - duration_seconds * 1000).toISOString(),
            completed_at: scoreResult.completed_at,
          })
          .select("id")
          .single();

        if (!attemptError && attemptData?.id) {
          attemptId = attemptData.id;
          savedToCloud = true;

          // Insert answers snapshot
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
            await supabaseServer.from("diagnostic_answers").insert(answerInserts);
          }

          // Insert skill results
          const skillInserts = scoreResult.skill_results.map((skill) => ({
            attempt_id: attemptId,
            user_id: user_id,
            topic_id: skill.topic_id,
            topic_name: skill.topic_name,
            total_questions: skill.total_questions,
            correct_answers: skill.correct_answers,
            accuracy: skill.accuracy,
            confidence: skill.confidence,
            classification: skill.classification,
          }));

          if (skillInserts.length > 0) {
            await supabaseServer.from("diagnostic_skill_results").insert(skillInserts);
          }

          // Insert personalized learning roadmap
          const { data: roadmapData, error: roadmapError } = await supabaseServer
            .from("user_learning_roadmaps")
            .insert({
              user_id: user_id,
              diagnostic_attempt_id: attemptId,
              title: roadmap.title,
              target_level: roadmap.target_level,
              status: "ACTIVE",
            })
            .select("id")
            .single();

          if (!roadmapError && roadmapData?.id) {
            roadmap.db_id = roadmapData.id;

            // Flatten weekly tasks for roadmap_items
            const taskInserts = [];
            roadmap.weeks.forEach((week) => {
              week.tasks.forEach((task) => {
                taskInserts.push({
                  roadmap_id: roadmapData.id,
                  user_id: user_id,
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
              await supabaseServer.from("roadmap_items").insert(taskInserts);
            }
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
    });
  } catch (error) {
    console.error("Diagnostic submission error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while evaluating diagnostic test",
    });
  }
}
