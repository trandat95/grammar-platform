/**
 * Milestone 2.5: Explanation Migrator & Pedagogical Generator
 * Converts raw question explanations into standardized 5-field structured JSON
 */

import {
  SCHEMA_VERSION,
  DIFFICULTY_LEVELS,
  DIFFICULTY_SCORES,
  ESTIMATED_TIME_SECONDS,
  createEmptyExplanation,
  validateExplanation,
} from "./explanation.schema";

/**
 * Extracts and structures raw explanation text into the canonical 5-field schema.
 * @param {Object} question - The raw question object
 * @param {string} targetDifficulty - Target difficulty level
 * @returns {Object} Validated 5-field explanation object
 */
export function migrateQuestionExplanation(question, targetDifficulty = DIFFICULTY_LEVELS.INTERMEDIATE) {
  if (!question) return null;

  const qId = question.id || "Q_UNKNOWN";
  const topicName = question.topic_name || "Ngữ pháp tổng hợp";
  const stem = question.stem || "";
  const correctAnswer = Array.isArray(question.answers) ? question.answers[0] : (question.answer || "");
  const rawExpl = question.explanation || "";

  // 1. Extract Signal
  let keywords = [];
  let grammarClues = [];
  let identifiedPattern = topicName;

  // Keyword identification from stem
  const timeKeywords = ["since", "for", "yesterday", "ago", "last week", "now", "at the moment", "already", "just", "yet", "tomorrow", "if", "unless", "seldom", "always", "usually", "often", "never"];
  timeKeywords.forEach((kw) => {
    if (stem.toLowerCase().includes(kw)) {
      keywords.push(kw);
    }
  });

  if (rawExpl.includes("【Dấu hiệu & Ngữ cảnh】")) {
    const signalText = rawExpl.split("【Dấu hiệu & Ngữ cảnh】")[1]?.split("【")[0]?.trim() || "";
    grammarClues.push(signalText);
  } else if (question.instruction) {
    grammarClues.push(question.instruction);
  } else {
    grammarClues.push(`Dựa vào cấu trúc ngữ pháp và ngữ cảnh của câu: "${stem}"`);
  }

  // 2. Extract Rule
  let ruleFormula = "S + V";
  let ruleExpl = `Áp dụng quy tắc chia theo chuyên đề ${topicName}.`;
  let conditions = ["Phù hợp với mốc thời gian và ngữ cảnh của câu."];
  let exceptions = [];

  if (rawExpl.includes("【Quy tắc & Công thức】")) {
    const ruleText = rawExpl.split("【Quy tắc & Công thức】")[1]?.split("【")[0]?.trim() || "";
    ruleExpl = ruleText;
    
    // Attempt formula extraction
    const formulaMatch = ruleText.match(/(S\s*\+[^.\n]+)/i);
    if (formulaMatch) {
      ruleFormula = formulaMatch[1].trim();
    }
  }

  // 3. Extract Translation
  let vietnamese = "";
  if (rawExpl.includes("【Dịch nghĩa câu】")) {
    vietnamese = rawExpl.split("【Dịch nghĩa câu】")[1]?.split("【")[0]?.trim() || "";
  } else if (question.pedagogy?.translation) {
    vietnamese = question.pedagogy.translation;
  } else {
    vietnamese = `(Câu dịch tham khảo cho: ${stem})`;
  }

  // Vocabulary extraction from stem tokens
  const vocabulary = [];
  const words = stem.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter((w) => w.length > 4);
  const sampleWords = [...new Set(words)].slice(0, 3);
  sampleWords.forEach((w) => {
    vocabulary.push({
      word: w,
      meaning: "Từ vựng quan trọng trong câu",
      contextual_meaning: `Được sử dụng trong ngữ cảnh bài học ${topicName}`,
    });
  });

  // 4. Common Mistakes
  const commonMistakes = [
    {
      mistake: `Điền sai dạng động từ hoặc chia sai thì so với đáp án chuẩn "${correctAnswer}".`,
      reason: "Học viên thường chỉ chú ý đến một từ đơn lẻ mà bỏ qua ngữ cảnh tổng thể hoặc quy tắc hòa hợp chủ vị.",
      correction: `Đáp án chính xác là "${correctAnswer}". Cần đối chiếu với công thức chuẩn ${ruleFormula}.`,
      prevention_tip: "Gạch chân từ nhận biết và chủ ngữ chính trước khi chọn đáp án cuối cùng.",
    },
  ];

  // 5. Exam Tips
  const examTips = [
    {
      strategy: `Kỹ thuật nhận diện nhanh cho chuyên đề ${topicName}:`,
      example: keywords.length > 0 ? `Nhận diện ngay từ khóa [${keywords.join(", ")}] để định hình quy tắc áp dụng.` : `Quan sát chủ ngữ và động từ chính trong câu "${stem}".`,
      warning: "Không chọn đáp án theo cảm tính. Luôn kiểm tra xem chủ ngữ là số ít hay số nhiều.",
    },
  ];

  // Construct complete standardized object
  const explanation = {
    schema_version: SCHEMA_VERSION,
    question_id: qId,
    topic_id: question.topic_id || "general",
    difficulty: targetDifficulty,
    difficulty_score: DIFFICULTY_SCORES[targetDifficulty] || 3,
    estimated_time_seconds: ESTIMATED_TIME_SECONDS[targetDifficulty] || 60,
    language: "vi",
    signal: {
      keywords: keywords.length > 0 ? keywords : ["context-clue"],
      grammar_clues: grammarClues,
      identified_pattern: identifiedPattern,
    },
    rule: {
      topic: topicName,
      formula: ruleFormula,
      explanation: ruleExpl,
      conditions,
      exceptions,
    },
    translation: {
      original: stem,
      vietnamese,
      vocabulary,
    },
    common_mistakes: commonMistakes,
    exam_tips: examTips,
    status: "published",
    version: 1,
  };

  const validation = validateExplanation(explanation);
  if (!validation.isValid) {
    console.warn(`[Migrator] Validation warnings for question ${qId}:`, validation.errors);
  }

  return explanation;
}
