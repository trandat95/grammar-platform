/**
 * Milestone 2.5: Standardized JSON Explanation Schema & Runtime Validator
 * Strict 5-field Pedagogical Contract
 */

export const SCHEMA_VERSION = "1.0";

export const DIFFICULTY_LEVELS = {
  BEGINNER: "Beginner",
  ELEMENTARY: "Elementary",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const DIFFICULTY_SCORES = {
  [DIFFICULTY_LEVELS.BEGINNER]: 1,
  [DIFFICULTY_LEVELS.ELEMENTARY]: 2,
  [DIFFICULTY_LEVELS.INTERMEDIATE]: 3,
  [DIFFICULTY_LEVELS.ADVANCED]: 4,
};

export const ESTIMATED_TIME_SECONDS = {
  [DIFFICULTY_LEVELS.BEGINNER]: 30,
  [DIFFICULTY_LEVELS.ELEMENTARY]: 45,
  [DIFFICULTY_LEVELS.INTERMEDIATE]: 60,
  [DIFFICULTY_LEVELS.ADVANCED]: 90,
};

export const FEEDBACK_ERROR_CATEGORIES = [
  "incorrect_grammar_rule",
  "incorrect_translation",
  "confusing_explanation",
  "missing_information",
  "incorrect_exam_tip",
  "other",
];

/**
 * Validates whether an explanation object conforms to the strict 5-field pedagogical contract.
 * @param {Object} data - Explanation object to validate
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateExplanation(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Explanation data must be a non-null object."] };
  }

  // 1. Mandatory metadata fields
  if (!data.question_id || typeof data.question_id !== "string") {
    errors.push("Missing or invalid 'question_id' (string required).");
  }

  if (!data.difficulty || !Object.values(DIFFICULTY_LEVELS).includes(data.difficulty)) {
    errors.push(`Invalid 'difficulty'. Must be one of: ${Object.values(DIFFICULTY_LEVELS).join(", ")}`);
  }

  // 2. Field 1: signal
  if (!data.signal || typeof data.signal !== "object") {
    errors.push("Missing mandatory field 'signal' (object required).");
  } else {
    if (!Array.isArray(data.signal.keywords)) {
      errors.push("'signal.keywords' must be an array of string tokens.");
    }
    if (!Array.isArray(data.signal.grammar_clues)) {
      errors.push("'signal.grammar_clues' must be an array of strings.");
    }
    if (typeof data.signal.identified_pattern !== "string") {
      errors.push("'signal.identified_pattern' must be a string.");
    }
  }

  // 3. Field 2: rule
  if (!data.rule || typeof data.rule !== "object") {
    errors.push("Missing mandatory field 'rule' (object required).");
  } else {
    if (typeof data.rule.topic !== "string") {
      errors.push("'rule.topic' must be a string.");
    }
    if (typeof data.rule.formula !== "string") {
      errors.push("'rule.formula' must be a string.");
    }
    if (typeof data.rule.explanation !== "string") {
      errors.push("'rule.explanation' must be a string.");
    }
    if (!Array.isArray(data.rule.conditions)) {
      errors.push("'rule.conditions' must be an array of strings.");
    }
    if (!Array.isArray(data.rule.exceptions)) {
      errors.push("'rule.exceptions' must be an array of strings.");
    }
  }

  // 4. Field 3: translation
  if (!data.translation || typeof data.translation !== "object") {
    errors.push("Missing mandatory field 'translation' (object required).");
  } else {
    if (typeof data.translation.original !== "string") {
      errors.push("'translation.original' must be a string.");
    }
    if (typeof data.translation.vietnamese !== "string") {
      errors.push("'translation.vietnamese' must be a string.");
    }
    if (!Array.isArray(data.translation.vocabulary)) {
      errors.push("'translation.vocabulary' must be an array of word objects.");
    }
  }

  // 5. Field 4: common_mistakes
  if (!Array.isArray(data.common_mistakes)) {
    errors.push("Missing mandatory field 'common_mistakes' (array required).");
  } else {
    data.common_mistakes.forEach((cm, idx) => {
      if (!cm.mistake || !cm.reason || !cm.correction || !cm.prevention_tip) {
        errors.push(`common_mistakes[${idx}] must contain 'mistake', 'reason', 'correction', 'prevention_tip'.`);
      }
    });
  }

  // 6. Field 5: exam_tips
  if (!Array.isArray(data.exam_tips)) {
    errors.push("Missing mandatory field 'exam_tips' (array required).");
  } else {
    data.exam_tips.forEach((et, idx) => {
      if (!et.strategy || !et.example || !et.warning) {
        errors.push(`exam_tips[${idx}] must contain 'strategy', 'example', 'warning'.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates an empty canonical explanation compliant with the 5-field schema
 */
export function createEmptyExplanation(questionId, topicId = "general", difficulty = DIFFICULTY_LEVELS.INTERMEDIATE) {
  return {
    schema_version: SCHEMA_VERSION,
    question_id: questionId,
    topic_id: topicId,
    difficulty,
    difficulty_score: DIFFICULTY_SCORES[difficulty] || 3,
    estimated_time_seconds: ESTIMATED_TIME_SECONDS[difficulty] || 60,
    language: "vi",
    signal: {
      keywords: [],
      grammar_clues: [],
      identified_pattern: "",
    },
    rule: {
      topic: "",
      formula: "",
      explanation: "",
      conditions: [],
      exceptions: [],
    },
    translation: {
      original: "",
      vietnamese: "",
      vocabulary: [],
    },
    common_mistakes: [],
    exam_tips: [],
  };
}

/**
 * Adapts an explanation's presentation depth based on the learner's chosen difficulty level.
 * Dynamically controls visible pedagogical steps, rule conditions, exceptions,
 * error breakdown depth, and solving heuristics while preserving the canonical answer.
 */
export function adaptExplanationForLevel(explanation, targetDifficulty) {
  if (!explanation) return null;
  const level = targetDifficulty || explanation.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;

  // Clone to avoid mutating original
  const adapted = JSON.parse(JSON.stringify(explanation));
  adapted.difficulty = level;
  adapted.difficulty_score = DIFFICULTY_SCORES[level] || 3;
  adapted.estimated_time_seconds = ESTIMATED_TIME_SECONDS[level] || 60;

  if (!adapted.rule) adapted.rule = { topic: "", formula: "", explanation: "", conditions: [], exceptions: [] };
  if (!Array.isArray(adapted.rule.conditions)) adapted.rule.conditions = [];
  if (!Array.isArray(adapted.rule.exceptions)) adapted.rule.exceptions = [];
  if (!Array.isArray(adapted.common_mistakes)) adapted.common_mistakes = [];
  if (!Array.isArray(adapted.exam_tips)) adapted.exam_tips = [];

  if (level === DIFFICULTY_LEVELS.BEGINNER) {
    adapted.pedagogical_focus = "Cơ bản (~30s): Nhận diện nhanh dấu hiệu chính, công thức cốt lõi và nghĩa tiếng Việt.";
    adapted.rule.exceptions = []; // Simplify for beginners
    adapted.presentation = {
      levelLabelVi: "Cơ bản",
      visibleSteps: [1, 2, 3],
      showConditions: false,
      showExceptions: false,
      showMistakeReason: false,
      showMistakeCorrection: false,
      showExamWarning: false,
      highlightAdvancedTraps: false,
      summaryBadge: "3 bước nền tảng • ~30 giây",
    };
  } else if (level === DIFFICULTY_LEVELS.ELEMENTARY) {
    adapted.pedagogical_focus = "Sơ cấp (~45s): Kết hợp công thức chuẩn, điều kiện áp dụng và lỗi sai thường gặp.";
    adapted.rule.exceptions = [];
    adapted.presentation = {
      levelLabelVi: "Sơ cấp",
      visibleSteps: [1, 2, 3, 4],
      showConditions: true,
      showExceptions: false,
      showMistakeReason: true,
      showMistakeCorrection: false,
      showExamWarning: false,
      highlightAdvancedTraps: false,
      summaryBadge: "4 bước thực hành + Điều kiện • ~45 giây",
    };
  } else if (level === DIFFICULTY_LEVELS.INTERMEDIATE) {
    adapted.pedagogical_focus = "Trung cấp (~60s): Phân tích đủ 5 bước, nguyên nhân dễ nhầm và chiến thuật làm bài.";
    adapted.presentation = {
      levelLabelVi: "Trung cấp",
      visibleSteps: [1, 2, 3, 4, 5],
      showConditions: true,
      showExceptions: adapted.rule.exceptions.length > 0,
      showMistakeReason: true,
      showMistakeCorrection: true,
      showExamWarning: true,
      highlightAdvancedTraps: false,
      summaryBadge: "Đầy đủ 5 bước + Đối chiếu lỗi • ~60 giây",
    };
  } else if (level === DIFFICULTY_LEVELS.ADVANCED) {
    adapted.pedagogical_focus = "Nâng cao (~90s): Đào sâu ngoại lệ, bẫy ngữ pháp hay đánh lừa và mẹo loại trừ nhanh.";
    if (adapted.rule.exceptions.length === 0) {
      adapted.rule.exceptions = [
        `Chú ý kiểm tra thì động từ, dạng phủ định/nghi vấn và ngữ cảnh toàn câu trước khi chốt đáp án cho chủ điểm ${adapted.rule.topic || "ngữ pháp"}.`,
      ];
    }
    adapted.presentation = {
      levelLabelVi: "Nâng cao",
      visibleSteps: [1, 2, 3, 4, 5],
      showConditions: true,
      showExceptions: true,
      showMistakeReason: true,
      showMistakeCorrection: true,
      showExamWarning: true,
      highlightAdvancedTraps: true,
      summaryBadge: "5 bước chuyên sâu + Bẫy & Ngoại lệ • ~90 giây",
    };
  }

  return adapted;
}
