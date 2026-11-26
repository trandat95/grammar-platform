#!/usr/bin/env node
/**
 * Milestone FC-1 (Step 4 Foundation):
 * Builds high-precision bidirectional cross-links between TOEIC corpus questions
 * (1,451 Part 5/6 master bank + 4,000 test items) and the 1,000 TOEIC Flashcards.
 * Outputs:
 *   - data/toeic/question_flashcard_links.json
 *   - public/data/toeic-flashcards/crosslinks.json
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const fcPath = path.join(ROOT, "data", "toeic", "flashcards_lite.json");
const masterPath = path.join(ROOT, "data", "toeic", "ets_toeic_ai_grammar_master.json");

if (!fs.existsSync(fcPath) || !fs.existsSync(masterPath)) {
  console.error("Missing required data files. Run prepare-flashcard-corpus.mjs first.");
  process.exit(1);
}

const fcDb = JSON.parse(fs.readFileSync(fcPath, "utf8"));
const masterDb = JSON.parse(fs.readFileSync(masterPath, "utf8"));

const flashcards = fcDb.flashcards || [];
const masterQuestions = masterDb.part5_part6_grammar_bank || [];

const STOP_WORDS = new Set([
  "about", "after", "all", "also", "although", "always", "among", "another",
  "because", "before", "being", "between", "both", "could", "during", "each",
  "either", "every", "from", "have", "having", "however", "into", "many",
  "more", "most", "much", "must", "neither", "other", "should", "since",
  "some", "such", "than", "that", "their", "them", "then", "there", "these",
  "they", "this", "those", "through", "under", "until", "very", "were",
  "what", "when", "where", "which", "while", "will", "with", "within",
  "without", "would", "your", "been", "made", "make", "take", "took", "give",
]);

/**
 * Generates surface variants for English inflection matching without noisy false positives.
 */
function expandInflections(rawWord) {
  const w = String(rawWord || "").toLowerCase().trim();
  if (!w || w.length < 4 || STOP_WORDS.has(w)) return [];
  const variants = new Set([w]);
  if (w.includes(" ")) {
    // Phrasal verb / multi-word expression (e.g. "abide by", "comply with")
    const parts = w.split(/\s+/);
    const head = parts[0];
    const tail = parts.slice(1).join(" ");
    if (head.length >= 3 && tail) {
      variants.add(`${head}s ${tail}`);
      variants.add(`${head}ed ${tail}`);
      variants.add(`${head}ing ${tail}`);
      if (head.endsWith("e")) {
        variants.add(`${head}d ${tail}`);
        variants.add(`${head.slice(0, -1)}ing ${tail}`);
      } else if (head.endsWith("y")) {
        variants.add(`${head.slice(0, -1)}ies ${tail}`);
        variants.add(`${head.slice(0, -1)}ied ${tail}`);
      }
    }
    return [...variants];
  }

  variants.add(`${w}s`);
  variants.add(`${w}es`);
  variants.add(`${w}ed`);
  variants.add(`${w}ing`);
  variants.add(`${w}ly`);
  if (w.endsWith("e")) {
    variants.add(`${w}d`);
    variants.add(`${w.slice(0, -1)}ing`);
    variants.add(`${w.slice(0, -1)}ly`);
  }
  if (w.endsWith("y") && !/[aeiou]y$/.test(w)) {
    variants.add(`${w.slice(0, -1)}ies`);
    variants.add(`${w.slice(0, -1)}ied`);
    variants.add(`${w.slice(0, -1)}ily`);
  }
  return [...variants];
}

// Build fast inverted lookups
const exactVariantMap = new Map(); // surface form -> Set<fcId>
const phraseCards = []; // multi-word expressions

for (const fc of flashcards) {
  const base = fc.word.toLowerCase().trim();
  if (base.includes(" ")) {
    phraseCards.push({ id: fc.id, variants: expandInflections(base) });
  } else {
    for (const v of expandInflections(base)) {
      if (!exactVariantMap.has(v)) exactVariantMap.set(v, new Set());
      exactVariantMap.get(v).add(fc.id);
    }
  }
}

function tokenizeWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
}

function scoreQuestionMatch(q) {
  const scores = new Map(); // fcId -> { score, reasons: Set }
  const addScore = (fcId, pts, reason) => {
    if (!scores.has(fcId)) scores.set(fcId, { score: 0, reasons: new Set() });
    const entry = scores.get(fcId);
    entry.score += pts;
    entry.reasons.add(reason);
  };

  const correctWord = String(q.options?.[q.correct_answer] || "").toLowerCase().trim();
  const linkedVocab = (q.ai_analysis?.linked_vocabulary || []).map((v) =>
    String(typeof v === "string" ? v : v?.word || "").toLowerCase().trim()
  );
  const collocText = (q.ai_analysis?.collocation_highlights || []).join(" ").toLowerCase();
  const stemText = `${q.stem || ""} ${q.context_sentence || ""}`.toLowerCase();

  // 1. Direct match on correct answer option
  for (const tok of tokenizeWords(correctWord)) {
    const hits = exactVariantMap.get(tok);
    if (hits) hits.forEach((id) => addScore(id, 100, "correct_answer"));
  }

  // 2. Match on ai_analysis.linked_vocabulary
  for (const lv of linkedVocab) {
    if (!lv) continue;
    for (const tok of tokenizeWords(lv)) {
      const hits = exactVariantMap.get(tok);
      if (hits) hits.forEach((id) => addScore(id, 75, "linked_vocabulary"));
    }
    for (const pc of phraseCards) {
      if (pc.variants.some((v) => lv.includes(v))) {
        addScore(pc.id, 80, "linked_phrase");
      }
    }
  }

  // 3. Match on collocation highlights
  for (const tok of tokenizeWords(collocText)) {
    const hits = exactVariantMap.get(tok);
    if (hits) hits.forEach((id) => addScore(id, 45, "collocation"));
  }
  for (const pc of phraseCards) {
    if (pc.variants.some((v) => collocText.includes(v))) {
      addScore(pc.id, 65, "collocation_phrase");
    }
  }

  // 4. Match in question stem / context sentence
  for (const tok of tokenizeWords(stemText)) {
    const hits = exactVariantMap.get(tok);
    if (hits) hits.forEach((id) => addScore(id, 30, "stem_context"));
  }
  for (const pc of phraseCards) {
    if (pc.variants.some((v) => stemText.includes(v))) {
      addScore(pc.id, 55, "stem_phrase");
    }
  }

  // Also check wrong distractors ONLY on VOC_COLLOCATION / VOC_PHRASAL_PREP so learners review the confusable lexical set
  const topicId = q.primary_grammar_topic_id || "";
  if (topicId === "VOC_COLLOCATION" || topicId === "VOC_PHRASAL_PREP") {
    for (const [optKey, optText] of Object.entries(q.options || {})) {
      if (optKey === q.correct_answer) continue;
      for (const tok of tokenizeWords(optText)) {
        const hits = exactVariantMap.get(tok);
        if (hits) hits.forEach((id) => addScore(id, 20, "lexical_distractor"));
      }
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[0] - b[0])
    .slice(0, 4)
    .map(([fcId, info]) => ({
      id: fcId,
      score: info.score,
      reasons: [...info.reasons],
    }));
}

const questionToFlashcards = {};
const flashcardToQuestions = {};
let matchedMasterCount = 0;

// Index all 1,451 master Part 5 & Part 6 questions
for (const q of masterQuestions) {
  const matches = scoreQuestionMatch(q);
  if (matches.length > 0) {
    matchedMasterCount += 1;
    questionToFlashcards[q.id] = matches.map((m) => m.id);
    for (const m of matches) {
      if (!flashcardToQuestions[m.id]) flashcardToQuestions[m.id] = [];
      if (flashcardToQuestions[m.id].length < 5) {
        flashcardToQuestions[m.id].push({
          id: q.id,
          topic_id: q.primary_grammar_topic_id,
          part: q.part,
          stem: q.stem,
          score: m.score,
        });
      }
    }
  }
}

// Also index full test reading questions (ETS2024 & ETS2026 Tests 1..10)
const corpusRoot = path.join(ROOT, "ETS_Corpus_Normalized_Enriched_Database");
let extraReadingMatched = 0;
for (const series of ["ETS2024", "ETS2026"]) {
  for (let t = 1; t <= 10; t += 1) {
    const rFile = path.join(corpusRoot, series, `Test_${String(t).padStart(2, "0")}`, "reading.json");
    if (!fs.existsSync(rFile)) continue;
    const rData = JSON.parse(fs.readFileSync(rFile, "utf8"));
    for (const q of rData.questions || []) {
      if (questionToFlashcards[q.id]) continue;
      const matches = scoreQuestionMatch(q);
      if (matches.length > 0) {
        extraReadingMatched += 1;
        questionToFlashcards[q.id] = matches.map((m) => m.id);
      }
    }
  }
}

const outPayload = {
  schema_version: "1.0",
  generated_at: new Date().toISOString(),
  stats: {
    master_questions_total: masterQuestions.length,
    master_questions_linked: matchedMasterCount,
    extra_test_questions_linked: extraReadingMatched,
    total_questions_linked: Object.keys(questionToFlashcards).length,
    flashcards_with_related_questions: Object.keys(flashcardToQuestions).length,
  },
  questionToFlashcards,
  flashcardToQuestions,
};

fs.writeFileSync(
  path.join(ROOT, "data", "toeic", "question_flashcard_links.json"),
  JSON.stringify(outPayload)
);
fs.writeFileSync(
  path.join(ROOT, "public", "data", "toeic-flashcards", "crosslinks.json"),
  JSON.stringify({
    stats: outPayload.stats,
    flashcardToQuestions,
  })
);

console.log("Cross-link stats:", outPayload.stats);
