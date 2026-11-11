/**
 * Milestone 2.5: Standardized Error Classification Taxonomy & Concept Mapping
 */

export const ERROR_CATEGORIES = {
  TENSE_CONFUSION: {
    code: "TENSE_CONFUSION",
    label: "Nhầm lẫn giữa các thì",
    description: "Nhầm lẫn mốc thời gian, tính liên tục hoặc thể của động từ trong câu.",
    remedial_chapter: 1,
    remedial_lesson_code: "TENSE_PRES_PERF",
    remedial_tip: "Quan sát kỹ trạng từ chỉ thời gian (since, yesterday, next week, now) trước khi chia động từ.",
  },
  SUBJECT_VERB_AGREEMENT: {
    code: "SUBJECT_VERB_AGREEMENT",
    label: "Hòa hợp Chủ ngữ - Động từ",
    description: "Chia sai động từ theo số ít/số nhiều hoặc ngôi của chủ ngữ.",
    remedial_chapter: 1,
    remedial_lesson_code: "TENSE_PRES_SIMPLE",
    remedial_tip: "Xác định rõ danh từ chính làm chủ ngữ trước các cụm giới từ để chọn s/es hoặc số nhiều.",
  },
  WORD_FORM: {
    code: "WORD_FORM",
    label: "Sai từ loại (Danh/Động/Tính/Trạng)",
    description: "Sử dụng sai vị trí hoặc hậu tố của từ loại trong câu.",
    remedial_chapter: 7,
    remedial_lesson_code: "PARTS_NOUN",
    remedial_tip: "Nhìn từ đứng ngay trước và ngay sau chỗ trống để xác định từ loại cần điền.",
  },
  PREPOSITION_ERROR: {
    code: "PREPOSITION_ERROR",
    label: "Sai giới từ (in/on/at/for/since...)",
    description: "Dùng sai giới từ chỉ thời gian, nơi chốn hoặc giới từ đi kèm động từ/tính từ.",
    remedial_chapter: 7,
    remedial_lesson_code: "PARTS_PREP",
    remedial_tip: "Ghi nhớ các cụm cố định (collocations) như interested in, depend on, at night.",
  },
  ARTICLE_ERROR: {
    code: "ARTICLE_ERROR",
    label: "Sai mạo từ (a/an/the)",
    description: "Dùng sai mạo từ xác định 'the' hoặc mạo từ không xác định 'a/an'.",
    remedial_chapter: 7,
    remedial_lesson_code: "PARTS_ARTICLE",
    remedial_tip: "Kiểm tra xem danh từ đã được nhắc đến trước đó hoặc có tính xác định duy nhất hay chưa.",
  },
  CONDITIONAL_ERROR: {
    code: "CONDITIONAL_ERROR",
    label: "Sai cấu trúc câu điều kiện",
    description: "Nhầm lẫn giữa câu điều kiện loại 0, 1, 2, 3 hoặc đảo ngữ.",
    remedial_chapter: 3,
    remedial_lesson_code: "CLAUSE_CONDITION",
    remedial_tip: "Xác định mệnh đề IF hay mệnh đề chính, và xem giả định có thật ở hiện tại hay trái ngược quá khứ.",
  },
  PASSIVE_VOICE_ERROR: {
    code: "PASSIVE_VOICE_ERROR",
    label: "Sai thể bị động",
    description: "Quên chia động từ TO BE hoặc chia sai thì của câu bị động.",
    remedial_chapter: 10,
    remedial_lesson_code: "PASSIVE_GENERAL",
    remedial_tip: "Câu bị động luôn bắt buộc phải có dạng 'TO BE + V3/V-ed'.",
  },
  REPORTED_SPEECH_ERROR: {
    code: "REPORTED_SPEECH_ERROR",
    label: "Sai câu gián tiếp / Lùi thì",
    description: "Quên lùi thì, chia sai đại từ hoặc không chuyển đổi trạng từ thời gian/nơi chốn.",
    remedial_chapter: 9,
    remedial_lesson_code: "REP_STATEMENTS",
    remedial_tip: "Quy tắc 3 bước: Đổi đại từ ➔ Lùi 1 thì về quá khứ ➔ Đổi trạng từ (this ➔ that, now ➔ then).",
  },
  VOCABULARY_ERROR: {
    code: "VOCABULARY_ERROR",
    label: "Hiểu sai nghĩa từ vựng",
    description: "Chọn sai từ do hiểu chưa đúng nghĩa trong ngữ cảnh cụ thể.",
    remedial_chapter: 8,
    remedial_lesson_code: "VOCAB_GENERAL",
    remedial_tip: "Đọc toàn bộ ngữ cảnh câu trước khi lựa chọn từ mang nghĩa phù hợp nhất.",
  },
  CONTEXT_MISUNDERSTANDING: {
    code: "CONTEXT_MISUNDERSTANDING",
    label: "Hiểu sai ngữ cảnh câu",
    description: "Bỏ qua các từ liên kết, từ nối hoặc ý nghĩa phủ định/nghi vấn của câu.",
    remedial_chapter: 3,
    remedial_lesson_code: "CLAUSE_ADVERB",
    remedial_tip: "Chú ý các từ nối tương phản như although, however, but để xác định chiều hướng nghĩa.",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    label: "Chưa xác định loại lỗi",
    description: "Cần xem xét kỹ lại câu hỏi và quy tắc ngữ pháp tương ứng.",
    remedial_chapter: 1,
    remedial_lesson_code: "TENSE_PRES_SIMPLE",
    remedial_tip: "Ôn lại lý thuyết nền tảng của bài học trước khi làm lại câu hỏi.",
  },
};

/**
 * Maps a question to an error category based on question metadata, user input and correct answer
 */
export function classifyError(question, userAnswer, correctAnswer) {
  if (!question) return ERROR_CATEGORIES.UNKNOWN_ERROR;

  const stem = (question.stem || "").toLowerCase();
  const instruction = (question.instruction || "").toLowerCase();
  const topic = (question.topic_name || "").toLowerCase();
  const userAns = (userAnswer || "").trim().toLowerCase();
  const correctAns = (correctAnswer || "").trim().toLowerCase();

  // 1. Conditional Sentences check
  if (topic.includes("điều kiện") || instruction.includes("condition") || stem.includes("if ") || stem.includes("if,")) {
    return ERROR_CATEGORIES.CONDITIONAL_ERROR;
  }

  // 2. Passive Voice check
  if (topic.includes("bị động") || instruction.includes("passive") || stem.includes(" by ")) {
    return ERROR_CATEGORIES.PASSIVE_VOICE_ERROR;
  }

  // 3. Reported Speech check
  if (topic.includes("gián tiếp") || instruction.includes("reported") || instruction.includes("indirect") || stem.includes("said that") || stem.includes("told")) {
    return ERROR_CATEGORIES.REPORTED_SPEECH_ERROR;
  }

  // 4. Word Forms check
  if (instruction.includes("word form") || instruction.includes("correct form of word") || topic.includes("từ loại") || topic.includes("cấu tạo từ")) {
    return ERROR_CATEGORIES.WORD_FORM;
  }

  // 5. Prepositions check
  if (instruction.includes("preposition") || topic.includes("giới từ") || ["in", "on", "at", "for", "since", "with", "about", "of"].includes(correctAns)) {
    return ERROR_CATEGORIES.PREPOSITION_ERROR;
  }

  // 6. Articles check
  if (["a", "an", "the"].includes(correctAns) || instruction.includes("article")) {
    return ERROR_CATEGORIES.ARTICLE_ERROR;
  }

  // 7. Subject-Verb Agreement check
  if (
    (correctAns.endsWith("s") || correctAns.endsWith("es")) &&
    userAns.length > 0 &&
    (userAns === correctAns.replace(/e?s$/, "") || correctAns === userAns + "s" || correctAns === userAns + "es")
  ) {
    return ERROR_CATEGORIES.SUBJECT_VERB_AGREEMENT;
  }

  // 8. Tense Confusion check (Default for Chapter 1 questions or verb form instructions)
  if (
    topic.includes("thì") ||
    topic.includes("tense") ||
    instruction.includes("tense") ||
    instruction.includes("verb form")
  ) {
    return ERROR_CATEGORIES.TENSE_CONFUSION;
  }

  return ERROR_CATEGORIES.CONTEXT_MISUNDERSTANDING;
}
