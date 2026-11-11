/**
 * Milestone 2.8.7: Diagnostic Competency Knowledge Graph & Root Cause Analysis
 * Reuses the 53-Lesson Acyclic DAG in lib/knowledge/knowledge-graph.js (zero duplication).
 */

import {
  KNOWLEDGE_GRAPH,
  validateAcyclicGraph,
  findPrerequisites,
  getDependentConcepts,
} from "../knowledge/knowledge-graph";
import { DIAGNOSTIC_TOPICS } from "./diagnostic.blueprint";

const TOPIC_TO_CONCEPT_CODE = {
  tenses: "TENSE_PRES_PERF",
  passive_voice: "PASSIVE_RULES",
  conditionals: "CLAUSE_CONDITION",
  modal_verbs: "POS_VERBS",
  relative_clauses: "CLAUSE_RELATIVE",
  determiners: "QUANT_MUCH_MANY",
  prepositions: "POS_PREPOSITIONS",
  comparisons: "POS_COMPARISON",
  reported_speech: "REP_CHANGES",
  word_forms: "WORD_FORMS",
};

export const ROOT_CAUSE_TYPES = {
  CONCEPTUAL_ERROR: {
    code: "CONCEPTUAL_ERROR",
    label_vi: "Lỗi Bản chất Khái niệm (Conceptual Error)",
    advice: "Cần nắm lại ý nghĩa cốt lõi và bối cảnh thời gian/chủ thể tác động của cấu trúc.",
  },
  RULE_CONFUSION: {
    code: "RULE_CONFUSION",
    label_vi: "Nhầm lẫn Quy tắc (Rule Confusion)",
    advice: "Dễ nhầm giữa các thì hoặc cấu trúc gần giống nhau; cần đối chiếu bảng phân biệt cặp quy tắc.",
  },
  STRUCTURAL_ERROR: {
    code: "STRUCTURAL_ERROR",
    label_vi: "Lỗi Cấu trúc & Trật tự Từ (Structural Error)",
    advice: "Sai trợ động từ, chia V2/V3 hoặc thứ tự từ trong đảo ngữ / gián tiếp / bị động.",
  },
  APPLICATION_ERROR: {
    code: "APPLICATION_ERROR",
    label_vi: "Lỗi Vận dụng Ngữ cảnh (Application Error)",
    advice: "Hiểu công thức cơ bản nhưng bỏ sót từ khóa nhận biết (signals) hoặc bẫy câu nâng cao.",
  },
};

export function validateDiagnosticKnowledgeGraph() {
  return validateAcyclicGraph();
}

export function findTopicPrerequisites(topicId) {
  const topicMeta = DIAGNOSTIC_TOPICS[topicId];
  const conceptId = topicMeta?.default_lesson_code || TOPIC_TO_CONCEPT_CODE[topicId] || "TENSE_PRES_SIMPLE";
  const node = KNOWLEDGE_GRAPH.nodes[conceptId] || null;
  const prerequisites = findPrerequisites(conceptId, { includeIndirect: true, maxDepth: 3 });
  const dependents = getDependentConcepts(conceptId);

  return {
    topicId,
    conceptId,
    node,
    prerequisites,
    dependents,
  };
}

/**
 * Performs deterministic Root Cause Analysis across wrongly answered diagnostic questions.
 * Classifies errors into Conceptual, Rule Confusion, Structural, or Application errors
 * and extracts prerequisite foundation lessons from the 53-lesson DAG.
 */
export function analyzeDiagnosticRootCauses(detailedAnswers = [], skillResults = []) {
  const incorrect = (detailedAnswers || []).filter((a) => !a.is_correct);
  const buckets = {
    CONCEPTUAL_ERROR: { ...ROOT_CAUSE_TYPES.CONCEPTUAL_ERROR, count: 0, topics: new Set(), sampleLessons: [] },
    RULE_CONFUSION: { ...ROOT_CAUSE_TYPES.RULE_CONFUSION, count: 0, topics: new Set(), sampleLessons: [] },
    STRUCTURAL_ERROR: { ...ROOT_CAUSE_TYPES.STRUCTURAL_ERROR, count: 0, topics: new Set(), sampleLessons: [] },
    APPLICATION_ERROR: { ...ROOT_CAUSE_TYPES.APPLICATION_ERROR, count: 0, topics: new Set(), sampleLessons: [] },
  };

  for (const ans of incorrect) {
    let causeKey = "APPLICATION_ERROR";
    if (["passive_voice", "reported_speech", "relative_clauses", "word_forms"].includes(ans.topic)) {
      causeKey = ans.difficulty === "hard" ? "APPLICATION_ERROR" : "STRUCTURAL_ERROR";
    } else if (["tenses", "conditionals", "comparisons"].includes(ans.topic)) {
      causeKey = ans.difficulty === "easy" ? "CONCEPTUAL_ERROR" : "RULE_CONFUSION";
    } else if (ans.difficulty === "easy") {
      causeKey = "CONCEPTUAL_ERROR";
    } else if (Number(ans.time_spent_seconds || 0) > 60) {
      causeKey = "APPLICATION_ERROR";
    }

    const bucket = buckets[causeKey];
    bucket.count += 1;
    if (ans.topic_vi) bucket.topics.add(ans.topic_vi);
    if (ans.lesson_code && !bucket.sampleLessons.some((l) => l.lesson_code === ans.lesson_code)) {
      bucket.sampleLessons.push({
        chapter_number: ans.chapter_number || 1,
        lesson_id: ans.lesson_id,
        lesson_code: ans.lesson_code,
        lesson_title: ans.lesson_title,
      });
    }
  }

  const weakSkills = (skillResults || []).filter((s) => s.accuracy < 75);
  const prerequisiteGaps = [];
  const seenPrereqCodes = new Set();

  for (const skill of weakSkills) {
    const { prerequisites } = findTopicPrerequisites(skill.topic_id);
    for (const pr of prerequisites.slice(0, 2)) {
      if (!seenPrereqCodes.has(pr.lesson_code)) {
        seenPrereqCodes.add(pr.lesson_code);
        prerequisiteGaps.push({
          for_topic: skill.topic_name,
          for_topic_id: skill.topic_id,
          topic_accuracy: skill.accuracy,
          chapter_number: pr.chapter_number,
          lesson_id: pr.lesson_id,
          lesson_code: pr.lesson_code,
          lesson_title: pr.title_vi,
          depth: pr.depth,
        });
      }
    }
  }

  const rootCauses = Object.values(buckets)
    .map((b) => ({
      code: b.code,
      label_vi: b.label_vi,
      advice: b.advice,
      count: b.count,
      topics: Array.from(b.topics),
      sampleLessons: b.sampleLessons.slice(0, 3),
    }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totalIncorrectAnalyzed: incorrect.length,
    primaryRootCause: rootCauses[0] || null,
    rootCauses,
    prerequisiteGaps: prerequisiteGaps.slice(0, 8),
  };
}
