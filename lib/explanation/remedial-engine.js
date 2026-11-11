/**
 * Milestone 2.5: Deterministic Remedial Lesson Recommendation Engine
 */

import { classifyError, ERROR_CATEGORIES } from "./error-taxonomy";

/**
 * Generates an automatic remedial recommendation when a learner answers incorrectly.
 * @param {Object} question - The question object
 * @param {string} userAnswer - The learner's submitted answer
 * @param {string} correctAnswer - The authoritative correct answer
 * @param {Object} previewData - The curriculum preview data (12 chapters, 53 lessons)
 * @param {Object} userTracker - Current learner progress (completed lessons, XP)
 * @returns {Object} Structured remedial recommendation
 */
export function generateRemedialRecommendation(
  question,
  userAnswer,
  correctAnswer,
  previewData,
  userTracker = {}
) {
  if (!question) return null;

  // 1. Classify the error category
  const errorInfo = classifyError(question, userAnswer, correctAnswer);

  // 2. Identify target chapter and lesson
  let targetChapter = null;
  let targetLesson = null;

  if (previewData?.chapters) {
    targetChapter = previewData.chapters.find((c) => c.number === errorInfo.remedial_chapter) || previewData.chapters[0];
    if (targetChapter?.lessons) {
      targetLesson =
        targetChapter.lessons.find((l) => l.code === errorInfo.remedial_lesson_code) ||
        targetChapter.lessons[0];
    }
  }

  // Fallback defaults if previewData is missing
  const chapterNumber = targetChapter?.number || errorInfo.remedial_chapter || 1;
  const chapterId = targetChapter?.id || "";
  const chapterTitle = targetChapter?.title_vi || "Các thì trong tiếng Anh";
  const lessonId = targetLesson?.id || "";
  const lessonCode = targetLesson?.code || errorInfo.remedial_lesson_code || "TENSE_PRES_SIMPLE";
  const lessonTitle = targetLesson?.title_vi || "Thì hiện tại đơn";

  // 3. Compute deterministic confidence score based on signal strength
  let confidence = 0.88;
  const stemLower = (question.stem || "").toLowerCase();
  const instructionLower = (question.instruction || "").toLowerCase();

  if (errorInfo.code === "CONDITIONAL_ERROR" && stemLower.includes("if")) confidence = 0.98;
  else if (errorInfo.code === "PASSIVE_VOICE_ERROR" && stemLower.includes(" by ")) confidence = 0.96;
  else if (errorInfo.code === "TENSE_CONFUSION" && (stemLower.includes("since") || stemLower.includes("yesterday") || stemLower.includes("now"))) confidence = 0.95;
  else if (errorInfo.code === "SUBJECT_VERB_AGREEMENT") confidence = 0.92;
  else if (errorInfo.code === "WORD_FORM" && instructionLower.includes("word form")) confidence = 0.95;

  // 4. Check if student has already completed this lesson
  const isLessonCompleted = userTracker.completedLessons?.includes(lessonId);
  const recommendationType = isLessonCompleted ? "targeted_review" : "remedial_lesson";

  // 5. Build reason explanation
  let reasonText = `Bạn chọn "${userAnswer || 'chưa nhập'}" trong khi đáp án chuẩn là "${correctAnswer}". `;
  if (errorInfo.code === "TENSE_CONFUSION") {
    reasonText += "Câu này yêu cầu nhận diện đúng mốc thời gian và ngữ cảnh diễn ra của hành động.";
  } else if (errorInfo.code === "SUBJECT_VERB_AGREEMENT") {
    reasonText += "Cần chú ý chia động từ số ít hoặc số nhiều phù hợp với ngôi của chủ ngữ.";
  } else if (errorInfo.code === "CONDITIONAL_ERROR") {
    reasonText += "Mệnh đề điều kiện có sự phối hợp thì đặc trưng giữa mệnh đề IF và mệnh đề chính.";
  } else if (errorInfo.code === "PASSIVE_VOICE_ERROR") {
    reasonText += "Chủ ngữ nhận tác động của hành động, đòi hỏi công thức 'TO BE + V3/V-ed'.";
  } else if (errorInfo.code === "WORD_FORM") {
    reasonText += "Vị trí trong câu đòi hỏi dạng từ loại chính xác (Danh từ/Động từ/Tính từ/Trạng từ).";
  } else {
    reasonText += errorInfo.description;
  }

  return {
    id: `remedial_${question.id || "gen"}_${Date.now()}`,
    question_id: question.id,
    recommendation_type: recommendationType,
    title: `Ôn tập: ${lessonTitle}`,
    reason: reasonText,
    detected_error: errorInfo.code,
    error_label: errorInfo.label,
    knowledge_gap: errorInfo.description,
    remedial_tip: errorInfo.remedial_tip,
    chapter_number: chapterNumber,
    chapter_id: chapterId,
    chapter_title: chapterTitle,
    lesson_id: lessonId,
    lesson_code: lessonCode,
    lesson_title: lessonTitle,
    difficulty: isLessonCompleted ? "Elementary" : "Beginner",
    confidence,
    status: "suggested",
    created_at: new Date().toISOString(),
    suggested_actions: [
      `1. Đọc lại lý thuyết bài "${lessonTitle}"`,
      "2. Nắm vững công thức và từ nhận biết vàng",
      "3. Làm 5 bài tập thực hành tương tự để củng cố",
    ],
  };
}
