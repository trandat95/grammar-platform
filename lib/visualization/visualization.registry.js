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
    title: "Trục Thời Gian 13 Thì",
    icon: "⏱️",
    badge: "Tenses Axis",
    description: "Trục thời gian 3 miền (Quá khứ - Hiện tại - Tương lai) kết hợp 4 thể ngữ pháp và chế độ so sánh 2 thì song song.",
    data: TENSES_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.DECISION_TREE]: {
    id: "decision-tree",
    type: VISUALIZATION_TYPES.DECISION_TREE,
    title: "Cây Quyết Định Câu Điều Kiện",
    icon: "🌳",
    badge: "Conditionals Tree",
    description: "Cây phân nhánh logic lựa chọn Zero, Loại 1, 2, 3 và Mixed Conditionals kèm công thức đảo ngữ nâng cao.",
    data: CONDITIONALS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.TRANSFORMATION]: {
    id: "transformation",
    type: VISUALIZATION_TYPES.TRANSFORMATION,
    title: "Sơ Đồ Biến Đổi Câu Bị Động",
    icon: "🔄",
    badge: "Passive Voice",
    description: "Quy trình chuyển đổi 5 bước chủ động sang bị động, mã màu S-V-O và cẩm nang lược bỏ 'By + Agent'.",
    data: PASSIVE_VOICE_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.CONVERSION_FLOW]: {
    id: "conversion-flow",
    type: VISUALIZATION_TYPES.CONVERSION_FLOW,
    title: "Luồng Chuyển Đổi Câu Gián Tiếp",
    icon: "💬",
    badge: "Reported Speech",
    description: "Quy trình 7 giai đoạn liên hoàn, Ma trận Lùi thì (Backshift Matrix) và Bảng biến đổi trạng từ nơi chốn/thời gian.",
    data: REPORTED_SPEECH_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.SENTENCE_TREE]: {
    id: "sentence-tree",
    type: VISUALIZATION_TYPES.SENTENCE_TREE,
    title: "Sơ Đồ Mệnh Đề Quan Hệ",
    icon: "🌿",
    badge: "Relative Clauses",
    description: "Sơ đồ liên kết đại từ (Who, Whom, Which, Whose, That), phân biệt mệnh đề xác định và quy tắc rút gọn V-ing / V3.",
    data: RELATIVE_CLAUSES_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.COMPARISON_SCALE]: {
    id: "comparison-scale",
    type: VISUALIZATION_TYPES.COMPARISON_SCALE,
    title: "Thang Đo So Sánh Đa Cấp",
    icon: "📊",
    badge: "Comparison Scale",
    description: "Biểu diễn trực quan tỷ lệ Bằng nhau (=), Hơn (>), Nhất (MAX), so sánh kép và bảng bất quy tắc cốt lõi.",
    data: COMPARISONS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.MODAL_MATRIX]: {
    id: "modal-matrix",
    type: VISUALIZATION_TYPES.MODAL_MATRIX,
    title: "Ma Trận Động Từ Khuyết Thiếu",
    icon: "🎯",
    badge: "Modal Verbs",
    description: "Thang đo mức độ chắc chắn 0% - 100%, ma trận phân loại chức năng và sơ đồ suy đoán quá khứ Perfect Modals.",
    data: MODAL_VERBS_VISUALIZATION_DATA,
  },
  [VISUALIZATION_TYPES.WORD_FAMILY_TREE]: {
    id: "word-family-tree",
    type: VISUALIZATION_TYPES.WORD_FAMILY_TREE,
    title: "Cây Họ Từ & Động Cơ Hậu Tố",
    icon: "🌱",
    badge: "Word Families",
    description: "Mạng lưới phân nhánh gốc từ sang Danh - Động - Tính - Trạng từ và bộ quy tắc hậu tố nhận diện vàng trong đề thi.",
    data: WORD_FORMS_VISUALIZATION_DATA,
  },
};

/**
 * Resolves appropriate visualization model for a given lesson or chapter
 */
export function getVisualizationForLesson(lesson, chapter) {
  if (!lesson && !chapter) {
    return {
      type: VISUALIZATION_TYPES.TIMELINE,
      data: TENSES_VISUALIZATION_DATA,
    };
  }

  const lessonCode = lesson?.code || "";
  const chapterNumber = chapter?.number;
  const title = (lesson?.title_vi || "").toLowerCase();

  // 1. Tenses Timeline (Chapter 1 or any TENSE_* code)
  if (chapterNumber === 1 || lessonCode.startsWith("TENSE_")) {
    return {
      type: VISUALIZATION_TYPES.TIMELINE,
      data: TENSES_VISUALIZATION_DATA,
      focusedId: lessonCode,
    };
  }

  // 2. Conditionals Decision Tree (Chapter 3, CLAUSE_CONDITION)
  if (lessonCode === "CLAUSE_CONDITION" || title.includes("điều kiện")) {
    return {
      type: VISUALIZATION_TYPES.DECISION_TREE,
      data: CONDITIONALS_VISUALIZATION_DATA,
    };
  }

  // 3. Relative Clauses (Chapter 3 CLAUSE_RELATIVE, or title contains 'quan hệ')
  if (lessonCode === "CLAUSE_RELATIVE" || title.includes("quan hệ")) {
    return {
      type: VISUALIZATION_TYPES.SENTENCE_TREE,
      data: RELATIVE_CLAUSES_VISUALIZATION_DATA,
    };
  }

  // 4. Comparisons (Chapter 7 POS_COMPARISON, or title contains 'so sánh')
  if (lessonCode === "POS_COMPARISON" || title.includes("so sánh")) {
    return {
      type: VISUALIZATION_TYPES.COMPARISON_SCALE,
      data: COMPARISONS_VISUALIZATION_DATA,
    };
  }

  // 5. Modal Verbs (Chapter 7 POS_VERBS, or title contains 'khuyết thiếu' or 'modal')
  if (lessonCode.startsWith("MODAL_") || title.includes("khuyết thiếu") || title.includes("modal")) {
    return {
      type: VISUALIZATION_TYPES.MODAL_MATRIX,
      data: MODAL_VERBS_VISUALIZATION_DATA,
    };
  }

  // 6. Word Forms & Morphology (Chapter 8, WORD_FORMS, WORD_FORMATIONS)
  if (
    chapterNumber === 8 ||
    lessonCode === "WORD_FORMS" ||
    lessonCode === "WORD_FORMATIONS" ||
    title.includes("từ loại") ||
    title.includes("cấu tạo từ")
  ) {
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

  // Smart fallback for other chapters:
  if (chapterNumber === 2) {
    return {
      type: VISUALIZATION_TYPES.TIMELINE,
      data: TENSES_VISUALIZATION_DATA,
    };
  }
  if (chapterNumber === 7) {
    return {
      type: VISUALIZATION_TYPES.WORD_FAMILY_TREE,
      data: WORD_FORMS_VISUALIZATION_DATA,
    };
  }

  // General default fallback
  return {
    type: VISUALIZATION_TYPES.TIMELINE,
    data: TENSES_VISUALIZATION_DATA,
  };
}
