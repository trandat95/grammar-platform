/**
 * Milestone 2.5.7: Grammar Knowledge Graph (DAG)
 * Models all 12 chapters & 53 lessons from Ngữ pháp tiếng Anh (Mai Lan Hương & Hà Thanh Uyên)
 * as a verified Directed Acyclic Graph with prerequisite edges and root-cause traversal.
 */

import previewData from "../../data/ui/preview_data.json";

const RAW_PREREQUISITE_EDGES = [
  // Chapter 7 Foundational Parts of Speech -> Sentence Basics
  ["POS_PRONOUNS", "POS_NOUNS", "prerequisite"],
  ["POS_ARTICLES", "POS_NOUNS", "prerequisite"],
  ["POS_NUMERALS", "POS_NOUNS", "recommended"],
  ["POS_ADVERBS", "POS_ADJECTIVES", "prerequisite"],
  ["POS_PREPOSITIONS", "POS_NOUNS", "recommended"],
  ["POS_PREPOSITIONS", "POS_VERBS", "recommended"],
  ["POS_CONJUNCTIONS", "SENT_BASIC_PATTERNS", "prerequisite"],
  ["POS_COMPARISON", "POS_ADJECTIVES", "prerequisite"],
  ["POS_COMPARISON", "POS_ADVERBS", "prerequisite"],

  // Chapter 11 Sentence Foundations
  ["SENT_CLASSIFICATION_KINDS", "SENT_BASIC_PATTERNS", "prerequisite"],
  ["SENT_CLASSIFICATION_KINDS", "POS_CONJUNCTIONS", "prerequisite"],

  // Chapter 1 Tenses Progression (13 Tenses DAG)
  ["TENSE_PRES_SIMPLE", "POS_VERBS", "prerequisite"],
  ["TENSE_PRES_SIMPLE", "SENT_BASIC_PATTERNS", "prerequisite"],
  ["TENSE_PRES_CONT", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["TENSE_PAST_SIMPLE", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["TENSE_PAST_CONT", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["TENSE_PAST_CONT", "TENSE_PRES_CONT", "recommended"],
  ["TENSE_PRES_PERF", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["TENSE_PRES_PERF", "TENSE_PAST_SIMPLE", "contrast"],
  ["TENSE_PRES_PERF_CONT", "TENSE_PRES_PERF", "prerequisite"],
  ["TENSE_PRES_PERF_CONT", "TENSE_PRES_CONT", "recommended"],
  ["TENSE_PAST_PERF", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["TENSE_PAST_PERF", "TENSE_PRES_PERF", "prerequisite"],
  ["TENSE_PAST_PERF_CONT", "TENSE_PAST_PERF", "prerequisite"],
  ["TENSE_PAST_PERF_CONT", "TENSE_PAST_CONT", "recommended"],
  ["TENSE_FUT_SIMPLE", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["TENSE_NEAR_FUT", "TENSE_FUT_SIMPLE", "contrast"],
  ["TENSE_NEAR_FUT", "TENSE_PRES_CONT", "recommended"],
  ["TENSE_FUT_CONT", "TENSE_FUT_SIMPLE", "prerequisite"],
  ["TENSE_FUT_CONT", "TENSE_PRES_CONT", "recommended"],
  ["TENSE_FUT_PERF", "TENSE_FUT_SIMPLE", "prerequisite"],
  ["TENSE_FUT_PERF", "TENSE_PRES_PERF", "recommended"],
  ["TENSE_FUT_PERF_CONT", "TENSE_FUT_PERF", "prerequisite"],
  ["TENSE_FUT_PERF_CONT", "TENSE_FUT_CONT", "recommended"],

  // Chapter 2 Sequence of Tenses
  ["SEQ_MAIN_SUB", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["SEQ_MAIN_SUB", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["SEQ_MAIN_SUB", "TENSE_PAST_PERF", "prerequisite"],
  ["SEQ_TIME_CLAUSES", "SEQ_MAIN_SUB", "prerequisite"],
  ["SEQ_TIME_CLAUSES", "TENSE_FUT_SIMPLE", "prerequisite"],

  // Chapter 3 Clauses & Phrases
  ["CLAUSE_CONDITION", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["CLAUSE_CONDITION", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["CLAUSE_CONDITION", "TENSE_PAST_PERF", "prerequisite"],
  ["CLAUSE_CONDITION", "SEQ_MAIN_SUB", "recommended"],
  ["CLAUSE_WISH", "CLAUSE_CONDITION", "prerequisite"],
  ["CLAUSE_WISH", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["CLAUSE_WISH", "TENSE_PAST_PERF", "prerequisite"],
  ["CLAUSE_AS_IF_TIME_RATHER", "CLAUSE_WISH", "prerequisite"],
  ["CLAUSE_PURPOSE", "POS_CONJUNCTIONS", "prerequisite"],
  ["CLAUSE_RESULT", "POS_ADJECTIVES", "prerequisite"],
  ["CLAUSE_RESULT", "POS_ADVERBS", "recommended"],
  ["CLAUSE_REASON", "POS_CONJUNCTIONS", "prerequisite"],
  ["CLAUSE_CONCESSION", "CLAUSE_REASON", "contrast"],
  ["CLAUSE_NOUN", "SENT_CLASSIFICATION_KINDS", "prerequisite"],
  ["CLAUSE_NOUN", "POS_PRONOUNS", "prerequisite"],
  ["CLAUSE_RELATIVE", "POS_NOUNS", "prerequisite"],
  ["CLAUSE_RELATIVE", "POS_PRONOUNS", "prerequisite"],
  ["CLAUSE_RELATIVE", "SENT_CLASSIFICATION_KINDS", "recommended"],

  // Chapter 4 Expressions of Quantity
  ["QUANT_SOME_ANY", "POS_NOUNS", "prerequisite"],
  ["QUANT_SOME_ANY", "POS_ARTICLES", "recommended"],
  ["QUANT_MOST", "QUANT_SOME_ANY", "prerequisite"],
  ["QUANT_MUCH_MANY", "POS_NOUNS", "prerequisite"],
  ["QUANT_FEW_LITTLE", "QUANT_MUCH_MANY", "prerequisite"],

  // Chapter 5 & 6 Styles & Emphasis
  ["STYLE_PATTERNS", "SENT_BASIC_PATTERNS", "prerequisite"],
  ["STYLE_VERB_NOUN_PAIRS", "POS_NOUNS", "prerequisite"],
  ["STYLE_VERB_NOUN_PAIRS", "POS_VERBS", "prerequisite"],
  ["EMPH_PRONUNCIATION", "SENT_BASIC_PATTERNS", "recommended"],
  ["EMPH_WRITING", "SENT_CLASSIFICATION_KINDS", "prerequisite"],
  ["EMPH_WRITING", "POS_ADVERBS", "prerequisite"],

  // Chapter 8 Word Study
  ["WORD_FORMATIONS", "POS_NOUNS", "prerequisite"],
  ["WORD_FORMATIONS", "POS_VERBS", "prerequisite"],
  ["WORD_FORMATIONS", "POS_ADJECTIVES", "prerequisite"],
  ["WORD_FORMATIONS", "POS_ADVERBS", "prerequisite"],
  ["WORD_FORMS", "WORD_FORMATIONS", "prerequisite"],
  ["WORD_ACRONYMS", "WORD_FORMATIONS", "recommended"],
  ["WORD_IDIOMS", "WORD_FORMS", "recommended"],
  ["WORD_IDIOMS", "POS_PREPOSITIONS", "recommended"],

  // Chapter 9 Reported Speech
  ["REP_CHANGES", "SEQ_MAIN_SUB", "prerequisite"],
  ["REP_CHANGES", "POS_PRONOUNS", "prerequisite"],
  ["REP_CHANGES", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["REP_CHANGES", "TENSE_PAST_PERF", "prerequisite"],
  ["REP_TYPES", "REP_CHANGES", "prerequisite"],
  ["REP_TYPES", "SENT_CLASSIFICATION_KINDS", "prerequisite"],

  // Chapter 10 Passive Voice
  ["PASSIVE_RULES", "TENSE_PRES_SIMPLE", "prerequisite"],
  ["PASSIVE_RULES", "TENSE_PAST_SIMPLE", "prerequisite"],
  ["PASSIVE_RULES", "TENSE_PRES_PERF", "prerequisite"],
  ["PASSIVE_RULES", "POS_VERBS", "prerequisite"],
  ["PASSIVE_SPECIAL", "PASSIVE_RULES", "prerequisite"],
  ["PASSIVE_SPECIAL", "CLAUSE_NOUN", "recommended"],

  // Chapter 12 Synthesis Practice Test
  ["PRACTICE_SENTENCE_TRANSFORMATION", "CLAUSE_CONDITION", "prerequisite"],
  ["PRACTICE_SENTENCE_TRANSFORMATION", "PASSIVE_RULES", "prerequisite"],
  ["PRACTICE_SENTENCE_TRANSFORMATION", "REP_TYPES", "prerequisite"],
  ["PRACTICE_SENTENCE_TRANSFORMATION", "POS_COMPARISON", "prerequisite"],
  ["PRACTICE_SENTENCE_TRANSFORMATION", "CLAUSE_RELATIVE", "prerequisite"],
  ["PRACTICE_SENTENCE_TRANSFORMATION", "EMPH_WRITING", "recommended"],
];

function inferDifficultyLevel(chapterNumber, lessonCode) {
  if (
    chapterNumber === 7 ||
    lessonCode === "SENT_BASIC_PATTERNS" ||
    lessonCode === "TENSE_PRES_SIMPLE" ||
    lessonCode === "TENSE_PRES_CONT" ||
    lessonCode === "TENSE_PAST_SIMPLE"
  ) {
    return "Beginner";
  }
  if (chapterNumber === 1 || chapterNumber === 4) {
    return "Elementary";
  }
  if (chapterNumber === 6 || chapterNumber === 12 || lessonCode === "PASSIVE_SPECIAL") {
    return "Advanced";
  }
  return "Intermediate";
}

function buildKnowledgeGraph() {
  const nodes = {};
  const nodeList = [];
  const prerequisitesMap = {};
  const dependentsMap = {};

  for (const ch of previewData?.chapters || []) {
    for (const lesson of ch.lessons || []) {
      const code = lesson.code;
      const node = {
        id: code,
        lesson_id: lesson.id,
        lesson_code: code,
        chapter_number: ch.number,
        chapter_code: ch.code,
        chapter_title_vi: ch.title_vi,
        title_vi: lesson.title_vi,
        title_en: lesson.title_en || "",
        section_count: (lesson.sections || []).length,
        difficulty_level: inferDifficultyLevel(ch.number, code),
      };
      nodes[code] = node;
      nodeList.push(node);
      prerequisitesMap[code] = [];
      dependentsMap[code] = [];
    }
  }

  const edges = [];
  for (const [conceptId, prereqId, relationshipType] of RAW_PREREQUISITE_EDGES) {
    if (!nodes[conceptId] || !nodes[prereqId] || conceptId === prereqId) continue;
    const edge = {
      concept_id: conceptId,
      prerequisite_concept_id: prereqId,
      relationship_type: relationshipType || "prerequisite",
      weight: relationshipType === "prerequisite" ? 1.0 : relationshipType === "contrast" ? 0.85 : 0.7,
    };
    edges.push(edge);
    prerequisitesMap[conceptId].push(edge);
    dependentsMap[prereqId].push(edge);
  }

  return { nodes, nodeList, edges, prerequisitesMap, dependentsMap };
}

export const KNOWLEDGE_GRAPH = buildKnowledgeGraph();

/**
 * Validates that the Grammar Knowledge Graph has zero cycles (Acyclic Validation).
 * Runs Kahn's topological sort over prerequisite edges.
 * @returns {{ isAcyclic: boolean, nodeCount: number, edgeCount: number, sortedOrder: string[], cycleNodes: string[] }}
 */
export function validateAcyclicGraph() {
  const inDegree = {};
  const adj = {};
  const nodeIds = Object.keys(KNOWLEDGE_GRAPH.nodes);

  for (const id of nodeIds) {
    inDegree[id] = 0;
    adj[id] = [];
  }

  for (const edge of KNOWLEDGE_GRAPH.edges) {
    // Direction: prerequisite -> concept
    adj[edge.prerequisite_concept_id].push(edge.concept_id);
    inDegree[edge.concept_id] += 1;
  }

  const queue = nodeIds.filter((id) => inDegree[id] === 0);
  const sortedOrder = [];

  while (queue.length > 0) {
    const curr = queue.shift();
    sortedOrder.push(curr);
    for (const next of adj[curr]) {
      inDegree[next] -= 1;
      if (inDegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  const cycleNodes = nodeIds.filter((id) => inDegree[id] > 0);
  return {
    isAcyclic: sortedOrder.length === nodeIds.length && cycleNodes.length === 0,
    nodeCount: nodeIds.length,
    edgeCount: KNOWLEDGE_GRAPH.edges.length,
    sortedOrder,
    cycleNodes,
  };
}

/**
 * Finds direct and indirect prerequisite lessons for a given conceptId/lessonCode in < 5ms.
 * @param {string} conceptId - e.g., 'CLAUSE_CONDITION', 'PASSIVE_SPECIAL', or lesson UUID
 * @param {{ includeIndirect?: boolean, maxDepth?: number }} options
 */
export function findPrerequisites(conceptId, options = {}) {
  const { includeIndirect = true, maxDepth = 4 } = options;
  if (!conceptId) return [];

  let resolvedCode = conceptId;
  if (!KNOWLEDGE_GRAPH.nodes[resolvedCode]) {
    const byLessonId = KNOWLEDGE_GRAPH.nodeList.find((n) => n.lesson_id === conceptId);
    if (byLessonId) resolvedCode = byLessonId.id;
  }
  if (!KNOWLEDGE_GRAPH.nodes[resolvedCode]) return [];

  const visited = new Set([resolvedCode]);
  const result = [];
  const queue = (KNOWLEDGE_GRAPH.prerequisitesMap[resolvedCode] || []).map((edge) => ({
    code: edge.prerequisite_concept_id,
    relationship_type: edge.relationship_type,
    weight: edge.weight,
    depth: 1,
  }));

  while (queue.length > 0) {
    const item = queue.shift();
    if (visited.has(item.code) || item.depth > maxDepth) continue;
    visited.add(item.code);

    const node = KNOWLEDGE_GRAPH.nodes[item.code];
    if (node) {
      result.push({
        ...node,
        depth: item.depth,
        relationship_type: item.relationship_type,
        weight: item.weight,
      });
    }

    if (includeIndirect && item.depth < maxDepth) {
      for (const parentEdge of KNOWLEDGE_GRAPH.prerequisitesMap[item.code] || []) {
        if (!visited.has(parentEdge.prerequisite_concept_id)) {
          queue.push({
            code: parentEdge.prerequisite_concept_id,
            relationship_type: parentEdge.relationship_type,
            weight: parentEdge.weight,
            depth: item.depth + 1,
          });
        }
      }
    }
  }

  return result.sort((a, b) => a.depth - b.depth || a.chapter_number - b.chapter_number);
}

/**
 * Returns concepts that depend on the given prerequisite concept.
 */
export function getDependentConcepts(conceptId) {
  const edges = KNOWLEDGE_GRAPH.dependentsMap[conceptId] || [];
  return edges
    .map((e) => {
      const node = KNOWLEDGE_GRAPH.nodes[e.concept_id];
      return node ? { ...node, relationship_type: e.relationship_type, weight: e.weight } : null;
    })
    .filter(Boolean);
}

const CHAPTER_FALLBACK_LESSON = {
  1: "TENSE_PRES_SIMPLE",
  2: "SEQ_MAIN_SUB",
  3: "CLAUSE_CONDITION",
  4: "QUANT_SOME_ANY",
  5: "STYLE_PATTERNS",
  6: "EMPH_WRITING",
  7: "POS_NOUNS",
  8: "WORD_FORMS",
  9: "REP_TYPES",
  10: "PASSIVE_RULES",
  11: "SENT_CLASSIFICATION_KINDS",
  12: "PRACTICE_SENTENCE_TRANSFORMATION",
};

/**
 * Deterministically maps a question + topic/error context to a canonical concept_id (53 lesson codes).
 */
export function resolveConceptForQuestion(question, errorCategory = null) {
  const topicName = (question?.topic_name || "").toLowerCase();
  const stem = (question?.stem || "").toLowerCase();
  const instr = (question?.instruction || "").toLowerCase();
  const combined = `${topicName} ${instr} ${stem}`;

  if (topicName.includes("thì") && !topicName.includes("phối hợp")) {
    if (combined.includes("present continuous") || combined.includes("now") || combined.includes("at the moment")) return "TENSE_PRES_CONT";
    if (combined.includes("present perfect continuous")) return "TENSE_PRES_PERF_CONT";
    if (combined.includes("present perfect") || combined.includes("since") || combined.includes("already")) return "TENSE_PRES_PERF";
    if (combined.includes("past continuous")) return "TENSE_PAST_CONT";
    if (combined.includes("past perfect") || combined.includes("by the time")) return "TENSE_PAST_PERF";
    if (combined.includes("past") || combined.includes("yesterday") || combined.includes("ago")) return "TENSE_PAST_SIMPLE";
    if (combined.includes("future") || combined.includes("tomorrow")) return "TENSE_FUT_SIMPLE";
    return "TENSE_PRES_SIMPLE";
  }
  if (topicName.includes("phối hợp")) return combined.includes("time") ? "SEQ_TIME_CLAUSES" : "SEQ_MAIN_SUB";
  if (topicName.includes("mệnh đề")) {
    if (combined.includes("wish") || combined.includes("if only")) return "CLAUSE_WISH";
    if (combined.includes("who") || combined.includes("which") || combined.includes("whose") || combined.includes("relative")) return "CLAUSE_RELATIVE";
    if (combined.includes("in order") || combined.includes("so that") || combined.includes("purpose")) return "CLAUSE_PURPOSE";
    if (combined.includes("such") || combined.includes("so ") || combined.includes("too") || combined.includes("enough")) return "CLAUSE_RESULT";
    if (combined.includes("because") || combined.includes("reason")) return "CLAUSE_REASON";
    if (combined.includes("although") || combined.includes("despite") || combined.includes("even though")) return "CLAUSE_CONCESSION";
    if (combined.includes("as if") || combined.includes("would rather") || combined.includes("it's time")) return "CLAUSE_AS_IF_TIME_RATHER";
    return "CLAUSE_CONDITION";
  }
  if (topicName.includes("số lượng")) {
    if (combined.includes("few") || combined.includes("little")) return "QUANT_FEW_LITTLE";
    if (combined.includes("much") || combined.includes("many") || combined.includes("a lot")) return "QUANT_MUCH_MANY";
    if (combined.includes("most")) return "QUANT_MOST";
    return "QUANT_SOME_ANY";
  }
  if (topicName.includes("văn phong")) return "STYLE_PATTERNS";
  if (topicName.includes("nhấn mạnh")) return combined.includes("pronun") || combined.includes("stress") ? "EMPH_PRONUNCIATION" : "EMPH_WRITING";
  if (topicName.includes("từ loại")) {
    if (combined.includes("article") || combined.includes("a/an/the") || combined.includes("mạo từ")) return "POS_ARTICLES";
    if (combined.includes("preposition") || combined.includes("giới từ")) return "POS_PREPOSITIONS";
    if (combined.includes("compare") || combined.includes("so sánh") || combined.includes("than")) return "POS_COMPARISON";
    if (combined.includes("pronoun") || combined.includes("đại từ")) return "POS_PRONOUNS";
    if (combined.includes("adverb") || combined.includes("trạng từ")) return "POS_ADVERBS";
    if (combined.includes("adjective") || combined.includes("tính từ")) return "POS_ADJECTIVES";
    if (combined.includes("conjunction") || combined.includes("liên từ")) return "POS_CONJUNCTIONS";
    if (combined.includes("verb") || combined.includes("modal") || combined.includes("động từ")) return "POS_VERBS";
    return "POS_NOUNS";
  }
  if (topicName.includes("từ vựng") || errorCategory === "WORD_FORM") {
    if (combined.includes("idiom") || combined.includes("thành ngữ")) return "WORD_IDIOMS";
    if (combined.includes("formation")) return "WORD_FORMATIONS";
    return "WORD_FORMS";
  }
  if (topicName.includes("gián tiếp") || errorCategory === "REPORTED_SPEECH_ERROR") return "REP_TYPES";
  if (topicName.includes("bị động") || errorCategory === "PASSIVE_VOICE_ERROR") return "PASSIVE_RULES";
  if (topicName.includes("câu") && !topicName.includes("bị động")) return "SENT_CLASSIFICATION_KINDS";
  if (topicName.includes("tổng hợp")) return "PRACTICE_SENTENCE_TRANSFORMATION";

  if (errorCategory === "PREPOSITION_ERROR") return "POS_PREPOSITIONS";
  if (errorCategory === "ARTICLE_ERROR") return "POS_ARTICLES";
  if (errorCategory === "CONDITIONAL_ERROR") return "CLAUSE_CONDITION";
  if (errorCategory === "TENSE_CONFUSION" || errorCategory === "SUBJECT_VERB_AGREEMENT") return "TENSE_PRES_SIMPLE";

  return CHAPTER_FALLBACK_LESSON[1];
}
