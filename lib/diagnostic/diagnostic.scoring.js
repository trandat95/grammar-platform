/**
 * Milestone 2.8: Deterministic Assessment Scorer (Layer 1 - Zero Hallucination)
 * Server-side mathematical validation, accuracy, confidence level, and mastery classification.
 */

import { DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_TOPICS } from "./diagnostic.blueprint";

export const MASTERY_LEVELS = {
  MASTERED: {
    key: "Mastered",
    label_vi: "Đã làm chủ kiến thức",
    badge: "🌟 Mastered",
    color: "#10b981", // green-500
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.3)",
    priority: "LOW",
  },
  GOOD: {
    key: "Good",
    label_vi: "Nắm vững tốt",
    badge: "✅ Good",
    color: "#3b82f6", // blue-500
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.3)",
    priority: "LOW",
  },
  DEVELOPING: {
    key: "Developing",
    label_vi: "Đang phát triển",
    badge: "⚠️ Developing",
    color: "#f59e0b", // amber-500
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.3)",
    priority: "MEDIUM",
  },
  NEEDS_IMPROVEMENT: {
    key: "Needs Improvement",
    label_vi: "Cần củng cố nền tảng",
    badge: "🟡 Needs Improvement",
    color: "#f97316", // orange-500
    bg: "rgba(249, 115, 22, 0.15)",
    border: "rgba(249, 115, 22, 0.3)",
    priority: "HIGH",
  },
  CRITICAL_WEAKNESS: {
    key: "Critical Weakness",
    label_vi: "Điểm yếu chí mạng",
    badge: "🔴 Critical Weakness",
    color: "#ef4444", // red-500
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.3)",
    priority: "HIGH",
  },
};

/**
 * Classifies a skill accuracy percentage into a deterministic mastery level.
 * @param {number} accuracy - 0 to 100
 * @returns {Object} Mastery configuration
 */
export function classifyAccuracy(accuracy) {
  if (accuracy >= 90) return MASTERY_LEVELS.MASTERED;
  if (accuracy >= 75) return MASTERY_LEVELS.GOOD;
  if (accuracy >= 60) return MASTERY_LEVELS.DEVELOPING;
  if (accuracy >= 40) return MASTERY_LEVELS.NEEDS_IMPROVEMENT;
  return MASTERY_LEVELS.CRITICAL_WEAKNESS;
}

/**
 * Maps an overall percentage score to an estimated CEFR-aligned Grammar Level.
 * Note: Transparent internal metric measuring digitized grammar curriculum proficiency.
 * @param {number} percentage - 0 to 100
 * @returns {Object} Estimated level metadata
 */
export function estimateGrammarLevel(percentage) {
  if (percentage >= 90) {
    return {
      code: "C1",
      name: "C1 - Advanced Grammar Mastery",
      title_vi: "C1 - Nâng Cao Xuất Sắc",
      description: "Làm chủ ngữ pháp phức hợp, cấu trúc câu nâng cao và các ngoại lệ tinh vi.",
      next_target: "Hoàn thiện ngữ pháp học thuật & văn phong chuyên sâu",
    };
  }
  if (percentage >= 75) {
    return {
      code: "B2",
      name: "B2 - Upper Intermediate",
      title_vi: "B2 - Trung Cấp Trên",
      description: "Nắm vững hầu hết cấu trúc ngữ pháp thông dụng, thỉnh thoảng nhầm lẫn ở dạng đặc biệt.",
      next_target: "Chinh phục C1 - Đi sâu vào đảo ngữ, câu điều kiện hỗn hợp & thể bị động kép",
    };
  }
  if (percentage >= 60) {
    return {
      code: "B1",
      name: "B1 - Intermediate",
      title_vi: "B1 - Trung Cấp",
      description: "Đã có nền tảng vững về các thì cơ bản và cấu trúc câu thông thường.",
      next_target: "Nâng cấp lên B2 - Làm chủ mệnh đề quan hệ nâng cao & các thì hoàn thành tiếp diễn",
    };
  }
  if (percentage >= 40) {
    return {
      code: "A2",
      name: "A2 - Elementary",
      title_vi: "A2 - Sơ Cấp",
      description: "Nhận biết được câu đơn giản nhưng còn nhiều lỗ hổng ở thì hoàn thành và câu bị động.",
      next_target: "Bứt phá lên B1 - Lấp đầy các lỗ hổng thì hiện tại hoàn thành & câu điều kiện",
    };
  }
  return {
    code: "A1",
    name: "A1 - Beginner",
    title_vi: "A1 - Mới Bắt Đầu",
    description: "Cần xây dựng lại hệ thống ngữ pháp căn bản từ các thì cơ bản và danh từ/đại từ.",
    next_target: "Xây chắc nền móng A2 - Làm chủ 12 thì cơ bản và trật tự từ loại",
  };
}

/**
 * Pure deterministic scorer for the 30-question diagnostic assessment.
 * @param {Array} submittedAnswers - Array of { question_id, selected_answer, time_spent_seconds }
 * @param {number} totalDurationSeconds - Total time elapsed
 * @returns {Object} Complete deterministic assessment evaluation
 */
export function scoreDiagnosticAttempt(submittedAnswers = [], totalDurationSeconds = 0) {
  const answerMap = new Map();
  submittedAnswers.forEach((ans) => {
    if (ans && ans.question_id) {
      answerMap.set(ans.question_id, {
        selected_answer: (ans.selected_answer || "").trim().toUpperCase(),
        time_spent_seconds: ans.time_spent_seconds || 0,
      });
    }
  });

  let totalQuestions = DIAGNOSTIC_QUESTIONS.length;
  let correctCount = 0;
  const detailedAnswers = [];

  // Track per-topic scores
  const topicStats = {};
  Object.keys(DIAGNOSTIC_TOPICS).forEach((tKey) => {
    topicStats[tKey] = {
      topic_id: tKey,
      topic_name: DIAGNOSTIC_TOPICS[tKey].title_vi,
      chapter_number: DIAGNOSTIC_TOPICS[tKey].chapter_number,
      total_questions: 0,
      correct_answers: 0,
      remedial_lesson_id: DIAGNOSTIC_TOPICS[tKey].default_lesson_id,
      remedial_lesson_code: DIAGNOSTIC_TOPICS[tKey].default_lesson_code,
      remedial_lesson_title: DIAGNOSTIC_TOPICS[tKey].default_lesson_title,
    };
  });

  // Evaluate each question deterministically
  DIAGNOSTIC_QUESTIONS.forEach((q) => {
    const userSubmission = answerMap.get(q.id) || { selected_answer: "", time_spent_seconds: 0 };
    const isCorrect = userSubmission.selected_answer === q.correct_answer;

    if (isCorrect) {
      correctCount++;
    }

    if (!topicStats[q.topic]) {
      topicStats[q.topic] = {
        topic_id: q.topic,
        topic_name: q.topic_vi,
        chapter_number: q.chapter_number,
        total_questions: 0,
        correct_answers: 0,
        remedial_lesson_id: q.lesson_id,
        remedial_lesson_code: q.lesson_code,
        remedial_lesson_title: q.lesson_title,
      };
    }

    topicStats[q.topic].total_questions++;
    if (isCorrect) {
      topicStats[q.topic].correct_answers++;
    }

    // Keep the most relevant remedial lesson if student failed this question
    if (!isCorrect) {
      topicStats[q.topic].remedial_lesson_id = q.lesson_id;
      topicStats[q.topic].remedial_lesson_code = q.lesson_code;
      topicStats[q.topic].remedial_lesson_title = q.lesson_title;
    }

    detailedAnswers.push({
      question_id: q.id,
      index: q.index,
      topic: q.topic,
      topic_vi: q.topic_vi,
      difficulty: q.difficulty,
      stem: q.stem,
      options: q.options,
      selected_answer: userSubmission.selected_answer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
      time_spent_seconds: userSubmission.time_spent_seconds,
      lesson_id: q.lesson_id,
      lesson_code: q.lesson_code,
      lesson_title: q.lesson_title,
      chapter_number: q.chapter_number,
      pedagogy: q.pedagogy,
    });
  });

  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const estimatedLevel = estimateGrammarLevel(percentage);

  // Compile skill results
  const skillResults = Object.values(topicStats).map((stat) => {
    const accuracy = stat.total_questions > 0
      ? Math.round((stat.correct_answers / stat.total_questions) * 100)
      : 0;

    let confidence = "low";
    if (stat.total_questions >= 5) confidence = "high";
    else if (stat.total_questions >= 3) confidence = "medium";

    const classification = classifyAccuracy(accuracy);

    return {
      topic_id: stat.topic_id,
      topic_name: stat.topic_name,
      chapter_number: stat.chapter_number,
      total_questions: stat.total_questions,
      correct_answers: stat.correct_answers,
      accuracy,
      confidence,
      classification: classification.key,
      classification_label: classification.label_vi,
      badge: classification.badge,
      color: classification.color,
      bg: classification.bg,
      border: classification.border,
      priority: classification.priority,
      remedial_lesson_id: stat.remedial_lesson_id,
      remedial_lesson_code: stat.remedial_lesson_code,
      remedial_lesson_title: stat.remedial_lesson_title,
    };
  });

  // Sort skills: lowest accuracy first (critical weaknesses on top)
  skillResults.sort((a, b) => a.accuracy - b.accuracy);

  const criticalWeaknesses = skillResults.filter(
    (s) => s.classification === "Critical Weakness" || s.classification === "Needs Improvement"
  );
  const developingSkills = skillResults.filter((s) => s.classification === "Developing");
  const masteredSkills = skillResults.filter(
    (s) => s.classification === "Mastered" || s.classification === "Good"
  );

  return {
    total_questions: totalQuestions,
    correct_answers: correctCount,
    percentage,
    total_score: percentage,
    estimated_level: estimatedLevel,
    duration_seconds: totalDurationSeconds,
    skill_results: skillResults,
    critical_weaknesses: criticalWeaknesses,
    developing_skills: developingSkills,
    mastered_skills: masteredSkills,
    detailed_answers: detailedAnswers,
    completed_at: new Date().toISOString(),
  };
}
