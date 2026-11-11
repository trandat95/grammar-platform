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
 * Does NOT alter the underlying grammar rule or correct answer.
 */
export function adaptExplanationForLevel(explanation, targetDifficulty) {
  if (!explanation) return null;
  const level = targetDifficulty || explanation.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;
  
  // Clone to avoid mutating original
  const adapted = JSON.parse(JSON.stringify(explanation));
  adapted.difficulty = level;
  adapted.difficulty_score = DIFFICULTY_SCORES[level] || 3;
  adapted.estimated_time_seconds = ESTIMATED_TIME_SECONDS[level] || 60;

  if (level === DIFFICULTY_LEVELS.BEGINNER) {
    // Beginner: Focus on keyword spotting, clear formula, simplified translation
    adapted.pedagogical_focus = "Nhận diện từ khóa và ghi nhớ công thức nền tảng.";
    adapted.rule.exceptions = []; // Hide complex exceptions for beginners
  } else if (level === DIFFICULTY_LEVELS.ELEMENTARY) {
    // Elementary: Formula + subject-verb agreement + conditions
    adapted.pedagogical_focus = "Áp dụng công thức và nguyên tắc hòa hợp chủ vị cơ bản.";
  } else if (level === DIFFICULTY_LEVELS.INTERMEDIATE) {
    // Intermediate: In-depth rationale, contrast with similar tenses/structures
    adapted.pedagogical_focus = "Phân tích ngữ cảnh và phân biệt các cấu trúc gần giống.";
  } else if (level === DIFFICULTY_LEVELS.ADVANCED) {
    // Advanced: Nuance, exceptions, time-saving examination heuristics
    adapted.pedagogical_focus = "Xử lý ngoại lệ, cấu trúc bẫy và kỹ thuật loại trừ nâng cao.";
  }

  return adapted;
}
