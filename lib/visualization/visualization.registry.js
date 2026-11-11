/**
 * Visualization Registry
 * Maps grammar chapters/lessons to structured visualization engines
 */

import { TENSES_VISUALIZATION_DATA } from "../../data/grammar-visualizations/tenses.data";
import { CONDITIONALS_VISUALIZATION_DATA } from "../../data/grammar-visualizations/conditionals.data";
import { PASSIVE_VOICE_VISUALIZATION_DATA } from "../../data/grammar-visualizations/passive-voice.data";
import { REPORTED_SPEECH_VISUALIZATION_DATA } from "../../data/grammar-visualizations/reported-speech.data";

export const VISUALIZATION_TYPES = {
  TIMELINE: "timeline",
  DECISION_TREE: "decision-tree",
  TRANSFORMATION: "transformation",
  CONVERSION_FLOW: "conversion-flow",
};

export const VISUALIZATION_CATALOG = {
  [VISUALIZATION_TYPES.TIMELINE]: {
    id: "timeline",
    type: VISUALIZATION_TYPES.TIMELINE,
    title: "Trục Thời Gian 13 Thì",
    icon: "⏱️",
    data: TENSES_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.DECISION_TREE]: {
    id: "decision-tree",
    type: VISUALIZATION_TYPES.DECISION_TREE,
    title: "Cây Quyết Định Câu Điều Kiện",
    icon: "🌳",
    data: CONDITIONALS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.TRANSFORMATION]: {
    id: "transformation",
    type: VISUALIZATION_TYPES.TRANSFORMATION,
    title: "Sơ Đồ Biến Đổi Câu Bị Động",
    icon: "🔄",
    data: PASSIVE_VOICE_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.CONVERSION_FLOW]: {
    id: "conversion-flow",
    type: VISUALIZATION_TYPES.CONVERSION_FLOW,
    title: "Luồng Chuyển Đổi Câu Gián Tiếp",
    icon: "💬",
    data: REPORTED_SPEECH_VISUALIZATION_DATA,
  },
};

/**
 * Resolves appropriate visualization model for a given lesson or chapter
 */
export function getVisualizationForLesson(lesson, chapter) {
  if (!lesson && !chapter) return null;

  const lessonCode = lesson?.code || "";
  const chapterNumber = chapter?.number;

  // 1. Tenses Timeline (Chapter 1 or any TENSE_* code)
  if (chapterNumber === 1 || lessonCode.startsWith("TENSE_")) {
    return {
      type: VISUALIZATION_TYPES.TIMELINE,
      data: TENSES_VISUALIZATION_DATA,
      focusedId: lessonCode, // Initial focus on current lesson tense
    };
  }

  // 2. Conditionals Decision Tree (Chapter 3, CLAUSE_CONDITION)
  if (lessonCode === "CLAUSE_CONDITION" || lesson?.title_vi?.includes("điều kiện")) {
    return {
      type: VISUALIZATION_TYPES.DECISION_TREE,
      data: CONDITIONALS_VISUALIZATION_DATA,
    };
  }

  // 3. Passive Voice Transformation (Chapter 10 or PASSIVE_* code)
  if (chapterNumber === 10 || lessonCode.startsWith("PASSIVE_")) {
    return {
      type: VISUALIZATION_TYPES.TRANSFORMATION,
      data: PASSIVE_VOICE_VISUALIZATION_DATA,
    };
  }

  // 4. Reported Speech Conversion Flow (Chapter 9 or REP_* code)
  if (chapterNumber === 9 || lessonCode.startsWith("REP_")) {
    return {
      type: VISUALIZATION_TYPES.CONVERSION_FLOW,
      data: REPORTED_SPEECH_VISUALIZATION_DATA,
    };
  }

  return null;
}
