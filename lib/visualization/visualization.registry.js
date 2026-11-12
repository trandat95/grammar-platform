/**
 * Visualization Registry
 * Maps grammar chapters/lessons to 8 structured interactive visualization engines
 */

import { TENSES_VISUALIZATION_DATA } from "../../data/grammar-visualizations/tenses.data";
import { CONDITIONALS_VISUALIZATION_DATA } from "../../data/grammar-visualizations/conditionals.data";
import { PASSIVE_VOICE_VISUALIZATION_DATA } from "../../data/grammar-visualizations/passive-voice.data";
import { REPORTED_SPEECH_VISUALIZATION_DATA } from "../../data/grammar-visualizations/reported-speech.data";
import { RELATIVE_CLAUSES_VISUALIZATION_DATA } from "../../data/grammar-visualizations/relative-clauses.data";
import { COMPARISONS_VISUALIZATION_DATA } from "../../data/grammar-visualizations/comparisons.data";
import { MODAL_VERBS_VISUALIZATION_DATA } from "../../data/grammar-visualizations/modal-verbs.data";
import { WORD_FORMS_VISUALIZATION_DATA } from "../../data/grammar-visualizations/word-forms.data";

export const VISUALIZATION_TYPES = {
  TIMELINE: "timeline",
  DECISION_TREE: "decision-tree",
  TRANSFORMATION: "transformation",
  CONVERSION_FLOW: "conversion-flow",
  SENTENCE_TREE: "sentence-tree",
  COMPARISON_SCALE: "comparison-scale",
  MODAL_MATRIX: "modal-matrix",
  WORD_FAMILY_TREE: "word-family-tree",
};

export const VISUALIZATION_CATALOG = {
  [VISUALIZATION_TYPES.TIMELINE]: {
    id: "timeline",
    type: VISUALIZATION_TYPES.TIMELINE,
    title: "Trục thời gian 13 thì",
    icon: "⏱️",
    badge: "Biểu đồ các thì",
    description: "Trục thời gian 3 miền (Quá khứ - Hiện tại - Tương lai) giúp nắm bản chất thì đang học và đối chiếu trực tiếp.",
    data: TENSES_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.DECISION_TREE]: {
    id: "decision-tree",
    type: VISUALIZATION_TYPES.DECISION_TREE,
    title: "Cây quyết định câu điều kiện",
    icon: "🌳",
    badge: "Câu điều kiện",
    description: "Cây phân nhánh logic lựa chọn điều kiện loại 0, 1, 2, 3, hỗn hợp và công thức đảo ngữ.",
    data: CONDITIONALS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.TRANSFORMATION]: {
    id: "transformation",
    type: VISUALIZATION_TYPES.TRANSFORMATION,
    title: "Sơ đồ biến đổi câu bị động",
    icon: "🔄",
    badge: "Câu bị động",
    description: "Quy trình 5 bước chuyển chủ động sang bị động, mã màu S-V-O và quy tắc lược bỏ 'By + Agent'.",
    data: PASSIVE_VOICE_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.CONVERSION_FLOW]: {
    id: "conversion-flow",
    type: VISUALIZATION_TYPES.CONVERSION_FLOW,
    title: "Luồng chuyển đổi câu gián tiếp",
    icon: "💬",
    badge: "Câu gián tiếp",
    description: "Quy trình 7 bước đổi câu trực tiếp sang gián tiếp, bảng lùi thì và đổi trạng từ chỉ thời gian/nơi chốn.",
    data: REPORTED_SPEECH_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.SENTENCE_TREE]: {
    id: "sentence-tree",
    type: VISUALIZATION_TYPES.SENTENCE_TREE,
    title: "Sơ đồ mệnh đề quan hệ",
    icon: "🌿",
    badge: "Mệnh đề quan hệ",
    description: "Liên kết đại từ (Who, Whom, Which, Whose, That), phân biệt mệnh đề xác định và quy tắc rút gọn V-ing / V3.",
    data: RELATIVE_CLAUSES_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.COMPARISON_SCALE]: {
    id: "comparison-scale",
    type: VISUALIZATION_TYPES.COMPARISON_SCALE,
    title: "Thang đo các cấp độ so sánh",
    icon: "📊",
    badge: "Cấp độ so sánh",
    description: "Trực quan hóa so sánh bằng (=), so sánh hơn (>), so sánh nhất (MAX), so sánh kép và trường hợp bất quy tắc.",
    data: COMPARISONS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.MODAL_MATRIX]: {
    id: "modal-matrix",
    type: VISUALIZATION_TYPES.MODAL_MATRIX,
    title: "Ma trận động từ khuyết thiếu",
    icon: "🎯",
    badge: "Động từ khuyết thiếu",
    description: "Thang đo mức độ chắc chắn 0% - 100%, phân loại chức năng và suy đoán quá khứ với Perfect Modals.",
    data: MODAL_VERBS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.WORD_FAMILY_TREE]: {
    id: "word-family-tree",
    type: VISUALIZATION_TYPES.WORD_FAMILY_TREE,
    title: "Cây họ từ & quy tắc hậu tố",
    icon: "🌱",
    badge: "Cấu tạo từ",
    description: "Mạng lưới phân nhánh Danh - Động - Tính - Trạng từ cùng hậu tố nhận diện nhanh trong bài thi.",
    data: WORD_FORMS_VISUALIZATION_DATA,
  },
};

/**
 * Resolves appropriate visualization model for a given lesson or chapter.
 * Returns null if the lesson does not have a matching visual diagram
 * (preventing unrelated topics from showing the 13-tense timeline).
 */
export function getVisualizationForLesson(lesson, chapter) {
  if (!lesson && !chapter) {
    return null;
  }

  const lessonCode = lesson?.code || "";
  const chapterNumber = Number(chapter?.number || 0);
  const title = (lesson?.title_vi || "").toLowerCase();

  // 1. Tenses Timeline (Chapter 1 Tenses OR Chapter 2 Sequence of Tenses)
  if (chapterNumber === 1 || lessonCode.startsWith("TENSE_")) {
    return {
      type: VISUALIZATION_TYPES.TIMELINE,
      data: TENSES_VISUALIZATION_DATA,
      focusedId: lessonCode,
    };
  }
  if (chapterNumber === 2 || lessonCode.startsWith("SEQ_")) {
    return {
      type: VISUALIZATION_TYPES.TIMELINE,
      data: TENSES_VISUALIZATION_DATA,
      focusedId: null,
    };
  }

  // 2. Conditionals Decision Tree (Chapter 3 CLAUSE_CONDITION)
  if (lessonCode === "CLAUSE_CONDITION" || title.includes("điều kiện")) {
    return {
      type: VISUALIZATION_TYPES.DECISION_TREE,
      data: CONDITIONALS_VISUALIZATION_DATA,
    };
  }

  // 3. Relative Clauses (Chapter 3 CLAUSE_RELATIVE)
  if (lessonCode === "CLAUSE_RELATIVE" || title.includes("mệnh đề quan hệ")) {
    return {
      type: VISUALIZATION_TYPES.SENTENCE_TREE,
      data: RELATIVE_CLAUSES_VISUALIZATION_DATA,
    };
  }

  // 4. Comparisons (Chapter 7 POS_COMPARISON)
  if (lessonCode === "POS_COMPARISON" || title.includes("so sánh")) {
    return {
      type: VISUALIZATION_TYPES.COMPARISON_SCALE,
      data: COMPARISONS_VISUALIZATION_DATA,
    };
  }

  // 5. Modal Verbs (only when specifically targeting modals)
  if (lessonCode.startsWith("MODAL_") || title.includes("khuyết thiếu") || title.includes("modal")) {
    return {
      type: VISUALIZATION_TYPES.MODAL_MATRIX,
      data: MODAL_VERBS_VISUALIZATION_DATA,
    };
  }

  // 6. Word Forms & Morphology (Chapter 8 WORD_FORMS / WORD_FORMATIONS only)
  if (lessonCode === "WORD_FORMS" || lessonCode === "WORD_FORMATIONS") {
    return {
      type: VISUALIZATION_TYPES.WORD_FAMILY_TREE,
      data: WORD_FORMS_VISUALIZATION_DATA,
    };
  }

  // 7. Passive Voice Transformation (Chapter 10 or PASSIVE_* code)
  if (chapterNumber === 10 || lessonCode.startsWith("PASSIVE_") || title.includes("bị động")) {
    return {
      type: VISUALIZATION_TYPES.TRANSFORMATION,
      data: PASSIVE_VOICE_VISUALIZATION_DATA,
    };
  }

  // 8. Reported Speech Conversion Flow (Chapter 9 or REP_* code)
  if (chapterNumber === 9 || lessonCode.startsWith("REP_") || title.includes("gián tiếp")) {
    return {
      type: VISUALIZATION_TYPES.CONVERSION_FLOW,
      data: REPORTED_SPEECH_VISUALIZATION_DATA,
    };
  }

  // Lessons without a specific diagram among the 8 engines should not show an unrelated fallback chart
  return null;
}
