/**
 * Milestone 2.8.8: Adaptive Learning & Dynamic Roadmap Adjustment Engine
 * Dynamically recalibrates 4-week study plans across 3 pedagogical rules:
 *   1. Exceeding Pace (Accuracy > 90%): Fast-tracks foundational tasks -> Synthesis challenges
 *   2. Persistent Difficulty (Accuracy < 60%): Injects Knowledge Graph prerequisite lessons
 *   3. Application Gap (Theory read/completed + Practice < 50%): Switches to Scaffolded Practice + Visualizer
 */

import { findTopicPrerequisites } from "./knowledge.graph";
import { KNOWLEDGE_GRAPH } from "../knowledge/knowledge-graph";

/**
 * Re-evaluates and adjusts a personalized roadmap dynamically using latest performance signals.
 */
export function evaluateAdaptiveAdjustments({
  roadmap,
  scoreResult = null,
  conceptProgress = [],
  userTracker = {},
  triggerReason = "manual_recalibration",
}) {
  if (!roadmap || !Array.isArray(roadmap.weeks)) {
    return { adjustedRoadmap: roadmap, adjustmentsApplied: [], changeSummary: "Chưa có lộ trình để điều chỉnh." };
  }

  const nextWeeks = roadmap.weeks.map((w) => ({
    ...w,
    tasks: (w.tasks || []).map((t) => ({ ...t })),
  }));

  const completedLessons = new Set(userTracker?.completedLessons || userTracker?.completed_lessons || []);
  const masteryByLessonCode = new Map(
    (conceptProgress || []).map((c) => [c.concept_id || c.lesson_code, Number(c.decayed_score ?? c.mastery_score ?? 0)])
  );
  const skillByTopic = new Map((scoreResult?.skill_results || []).map((s) => [s.topic_id, s]));

  const adjustmentsApplied = [];

  // Build quick helper map between skill topic name / lesson_code and current performance
  const resolvePerformanceForTask = (task) => {
    const code = task.lesson_code;
    const masteryPct = masteryByLessonCode.has(code) ? masteryByLessonCode.get(code) : null;

    let matchingSkill = null;
    for (const sk of skillByTopic.values()) {
      if (sk.remedial_lesson_code === code || sk.remedial_lesson_id === task.lesson_id) {
        matchingSkill = sk;
        break;
      }
    }
    const accuracy = masteryPct !== null ? masteryPct : matchingSkill?.accuracy ?? null;
    return { accuracy, masteryPct, matchingSkill, isTheoryDone: completedLessons.has(task.lesson_id) };
  };

  // Rule 1: Fast-Track Exceeding Pace (Accuracy > 90%)
  for (const week of nextWeeks) {
    for (const task of week.tasks) {
      if (task.status === "completed") continue;
      const perf = resolvePerformanceForTask(task);
      if (perf.accuracy !== null && perf.accuracy > 90 && task.action_type !== "retake_diagnostic") {
        task.status = "completed";
        task.adaptive_badge = "⚡ Fast-Tracked (>90%)";
        adjustmentsApplied.push({
          rule: "ACCELERATION",
          taskId: task.id,
          detail: `Tự động hoàn tất sớm "${task.title}" vì độ thành thạo đạt ${perf.accuracy}% (>90%).`,
        });
      }
    }
  }

  // Rule 2: Reinforce Persistent Weaknesses (< 60%) via Knowledge Graph Prerequisites
  const existingPrereqCodes = new Set(
    nextWeeks.flatMap((w) => w.tasks.map((t) => t.lesson_code)).filter(Boolean)
  );

  for (const [topicId, sk] of skillByTopic.entries()) {
    const livePct = masteryByLessonCode.get(sk.remedial_lesson_code) ?? sk.accuracy;
    if (livePct < 60 && nextWeeks[0]) {
      const { prerequisites } = findTopicPrerequisites(topicId);
      const topPrereq = prerequisites.find((pr) => !existingPrereqCodes.has(pr.lesson_code));
      if (topPrereq) {
        existingPrereqCodes.add(topPrereq.lesson_code);
        const insertedTask = {
          id: `task_adapt_prereq_${topPrereq.lesson_code.toLowerCase()}`,
          sequence_order: nextWeeks[0].tasks.length + 1,
          action_type: "prerequisite_lesson",
          priority: "HIGH",
          title: `[Nền tảng Tiên quyết] ${topPrereq.title_vi}`,
          description: `Kiến thức gốc bắt buộc trước khi chinh phục ${sk.topic_name}. Học lý thuyết kèm mô hình trực quan.`,
          chapter_number: topPrereq.chapter_number,
          lesson_id: topPrereq.lesson_id,
          lesson_code: topPrereq.lesson_code,
          lesson_title: topPrereq.title_vi,
          status: "pending",
          duration_est: "15 phút",
          adaptive_badge: "🕸️ Knowledge Graph Inserted",
          reason: `Độ chính xác ${sk.topic_name} còn thấp (${livePct}% < 60%). Hệ thống bổ sung bài tiên quyết Chương ${topPrereq.chapter_number}.`,
        };
        nextWeeks[0].tasks.unshift(insertedTask);
        adjustmentsApplied.push({
          rule: "REINFORCEMENT_PREREQUISITE",
          lessonCode: topPrereq.lesson_code,
          detail: `Bổ sung bài tiên quyết "${topPrereq.title_vi}" vào Tuần 1 do "${sk.topic_name}" đạt ${livePct}%.`,
        });
      }
    }
  }

  // Rule 3: Application Gap Detection (Theory Completed yet Practice Accuracy < 50%)
  for (const week of nextWeeks) {
    for (const task of week.tasks) {
      if (task.status === "completed") continue;
      const perf = resolvePerformanceForTask(task);
      if (perf.isTheoryDone && perf.accuracy !== null && perf.accuracy < 50 && task.action_type !== "scaffolded_practice") {
        task.action_type = "scaffolded_practice";
        task.adaptive_badge = "🧩 Scaffolded Practice (Chống lệch pha)";
        task.description = `Bạn đã đọc lý thuyết bài "${task.lesson_title}" nhưng thực hành đạt ${perf.accuracy}%. Hãy chuyển sang luyện tập từng bước kèm Sơ đồ Trực quan.`;
        adjustmentsApplied.push({
          rule: "APPLICATION_GAP_SCAFFOLDING",
          taskId: task.id,
          detail: `Chuyển "${task.title}" sang Scaffolded Practice + Visualizer vì đã học lý thuyết nhưng thực hành đạt ${perf.accuracy}%.`,
        });
      }
    }
  }

  // Also append synthesis practice if Week 3/4 lacks Ch.12 challenge & learner accuracy average >= 75%
  const trackedScores = Array.from(masteryByLessonCode.values());
  const avgMastery = trackedScores.length > 0 ? trackedScores.reduce((a, b) => a + b, 0) / trackedScores.length : 0;
  if (avgMastery >= 75 && nextWeeks[2] && !existingPrereqCodes.has("PRACTICE_SENTENCE_TRANSFORMATION")) {
    const ch12 = KNOWLEDGE_GRAPH.nodes["PRACTICE_SENTENCE_TRANSFORMATION"];
    if (ch12) {
      nextWeeks[2].tasks.push({
        id: "task_adapt_synthesis_ch12",
        sequence_order: nextWeeks[2].tasks.length + 1,
        action_type: "practice_quiz",
        priority: "MEDIUM",
        title: `Nâng cao: ${ch12.title_vi}`,
        description: "Mở khóa bài tập biến đổi câu tổng hợp trình độ cao nhờ duy trì tốc độ vượt chuẩn.",
        chapter_number: ch12.chapter_number,
        lesson_id: ch12.lesson_id,
        lesson_code: ch12.lesson_code,
        lesson_title: ch12.title_vi,
        status: "pending",
        duration_est: "25 phút",
        adaptive_badge: "🚀 Advanced Unlocked",
        reason: `Mastery trung bình đạt ${Math.round(avgMastery)}% — sẵn sàng cho thử thách tổng hợp.`,
      });
      adjustmentsApplied.push({
        rule: "ADVANCED_UNLOCK",
        lessonCode: ch12.lesson_code,
        detail: `Mở khóa bài nâng cao Chương 12 (${ch12.title_vi}) cho lộ trình Tuần 3.`,
      });
    }
  }

  const nextVersion = Number(roadmap.current_version || 1) + 1;
  const totalTasks = nextWeeks.reduce((sum, w) => sum + w.tasks.length, 0);
  const completedTasks = nextWeeks.reduce((sum, w) => sum + w.tasks.filter((t) => t.status === "completed").length, 0);

  const changeSummary =
    adjustmentsApplied.length > 0
      ? adjustmentsApplied.map((a) => a.detail).join(" ")
      : "Lộ trình hiện tại đang khớp tối ưu với tiến độ thực tế của bạn.";

  const updatedHistory = [
    ...(roadmap.version_history || []),
    {
      version_number: nextVersion,
      trigger_reason: triggerReason,
      adjustments_count: adjustmentsApplied.length,
      summary: changeSummary,
      created_at: new Date().toISOString(),
    },
  ].slice(-10);

  const adjustedRoadmap = {
    ...roadmap,
    current_version: nextVersion,
    last_adjusted_at: new Date().toISOString(),
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    progress_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    version_history: updatedHistory,
    weeks: nextWeeks,
  };

  return {
    adjustedRoadmap,
    adjustmentsApplied,
    changeSummary,
    triggerReason,
    versionNumber: nextVersion,
  };
}
