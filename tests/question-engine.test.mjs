import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUDITED_MC_IDS,
  AUDITED_MC_ID_SET,
  isAuditedMcId,
} from "../components/question-engine/resolver/auditedMcIds.js";
import {
  normalizeAnswer,
  isAnswerCompatibleWithOptions,
} from "../components/question-engine/resolver/AnswerCompatibility.js";
import {
  parseStructuredChoices,
  parseInlineParentheticalChoices,
  hasMultiBlankPattern,
} from "../components/question-engine/resolver/ChoiceParser.js";
import {
  QUESTION_MODES,
  resolveQuestionPresentation,
} from "../components/question-engine/resolver/QuestionTypeResolver.js";
import {
  buildQuestionStateKey,
  readPersistedQuestionState,
  writePersistedQuestionState,
  clearPersistedQuestionState,
} from "../components/question-engine/hooks/useQuestionState.js";

const ROOT = process.cwd();
const quizBank = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/ui/quiz_bank.json"), "utf8")
);
const previewData = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/ui/preview_data.json"), "utf8")
);

const allQuizQuestions = [];
for (const topic of quizBank.topics || []) {
  for (const q of topic.questions || []) {
    allQuizQuestions.push(q);
  }
}

const allPreviewQuestions = [];
for (const ch of previewData.chapters || []) {
  for (const ex of ch.exercises || []) {
    for (const q of ex.questions || []) {
      allPreviewQuestions.push({ question: q, exType: ex.type });
    }
  }
  for (const lesson of ch.lessons || []) {
    for (const ex of lesson.exercises || []) {
      for (const q of ex.questions || []) {
        allPreviewQuestions.push({ question: q, exType: ex.type });
      }
    }
  }
}

test("Fixture 1: All 142 valid inline MC IDs in quiz_bank.json & preview_data.json resolve to multiple_choice with matching answers", () => {
  assert.equal(AUDITED_MC_IDS.length, 142);
  assert.equal(AUDITED_MC_ID_SET.size, 142);

  const mcInQuizBank = allQuizQuestions.filter((q) => q.type === "MULTIPLE_CHOICE");
  assert.equal(mcInQuizBank.length, 151);

  let resolvedMcCount = 0;
  for (const q of mcInQuizBank) {
    const answersSnapshot = JSON.stringify(q.answers);
    const stemSnapshot = q.stem;
    const res = resolveQuestionPresentation(q);

    if (isAuditedMcId(q.id)) {
      resolvedMcCount += 1;
      assert.equal(res.mode, QUESTION_MODES.MULTIPLE_CHOICE, `Expected MC for ${q.id}`);
      assert.ok(res.options.length >= 2 && res.options.length <= 4);
      assert.equal(
        isAnswerCompatibleWithOptions(res.options, q.answers),
        true,
        `Answer mismatch for audited MC ${q.id}`
      );
    } else {
      assert.notEqual(
        res.mode,
        QUESTION_MODES.MULTIPLE_CHOICE,
        `Non-audited MC ${q.id} should not resolve to multiple_choice`
      );
    }

    // Never mutate source question or answers
    assert.equal(JSON.stringify(q.answers), answersSnapshot);
    assert.equal(q.stem, stemSnapshot);
  }
  assert.equal(resolvedMcCount, 142);

  // Verify preview_data.json MC questions (using exType as fallbackType)
  const mcInPreview = allPreviewQuestions.filter(
    ({ question, exType }) => (question.type || exType) === "MULTIPLE_CHOICE"
  );
  assert.equal(mcInPreview.length, 49);

  let previewResolvedMc = 0;
  for (const { question, exType } of mcInPreview) {
    const res = resolveQuestionPresentation(question, exType);
    if (isAuditedMcId(question.id)) {
      previewResolvedMc += 1;
      assert.equal(res.mode, QUESTION_MODES.MULTIPLE_CHOICE);
      assert.equal(isAnswerCompatibleWithOptions(res.options, question.answers), true);
    } else {
      assert.notEqual(res.mode, QUESTION_MODES.MULTIPLE_CHOICE);
    }
  }
  assert.equal(previewResolvedMc, 46);
});

test("Fixture 2: Structured choices array resolves directly to multiple_choice", () => {
  const qStringChoices = {
    id: "synthetic-structured-1",
    stem: "She ___ to school yesterday.",
    choices: ["go", "went", "gone", "going"],
    answers: ["went"],
  };
  const res1 = resolveQuestionPresentation(qStringChoices);
  assert.equal(res1.mode, QUESTION_MODES.MULTIPLE_CHOICE);
  assert.equal(res1.reason, "structured_choices");
  assert.equal(res1.options.length, 4);
  assert.deepEqual(
    res1.options.map((o) => o.key),
    ["A", "B", "C", "D"]
  );
  assert.equal(isAnswerCompatibleWithOptions(res1.options, qStringChoices.answers), true);

  const qObjectChoices = {
    id: "synthetic-structured-2",
    type: "FILL_IN_THE_BLANKS",
    stem: "Select the correct option.",
    choices: [
      { key: "A", label: "am", value: "am" },
      { key: "B", label: "is", value: "is" },
      { key: "C", label: "are", value: "are" },
    ],
    answers: ["is"],
  };
  const res2 = resolveQuestionPresentation(qObjectChoices);
  assert.equal(res2.mode, QUESTION_MODES.MULTIPLE_CHOICE);
  assert.equal(res2.options[1].value, "is");
  assert.equal(parseStructuredChoices(qObjectChoices).valid, true);
});

test("Fixture 3: Multi-blank paragraph questions resolve to multi_blank (safe text input)", () => {
  const multiBlank9 = allQuizQuestions.find(
    (q) => q.id === "02c5d5ec-778b-5d37-8c1e-e9677e3ec11d"
  );
  assert.ok(multiBlank9, "Expected 9-blank paragraph question in quiz_bank.json");
  assert.equal(hasMultiBlankPattern(multiBlank9.stem), true);

  const res9 = resolveQuestionPresentation(multiBlank9);
  assert.equal(res9.mode, QUESTION_MODES.MULTI_BLANK);
  assert.equal(res9.options.length, 0);
  assert.equal(res9.reason, "multi_blank_excluded");

  // Also verify 2-blank MC questions are excluded into multi_blank
  const twoBlankIds = [
    "1a1def05-6b7a-51d6-89f6-163f6080a156",
    "253ccf56-4388-5812-8a54-d9ee04b10657",
    "2cbff3ab-462a-5915-b646-9ee3cc4fd795",
  ];
  for (const id of twoBlankIds) {
    const q = allQuizQuestions.find((item) => item.id === id);
    assert.ok(q, `Missing multi-blank question ${id}`);
    const res = resolveQuestionPresentation(q);
    assert.equal(res.mode, QUESTION_MODES.MULTI_BLANK);
    assert.equal(res.options.length, 0);
  }
});

test("Fixture 4: SENTENCE_TRANSFORMATION questions resolve to text_input", () => {
  const transformations = allQuizQuestions.filter(
    (q) => q.type === "SENTENCE_TRANSFORMATION"
  );
  assert.ok(transformations.length > 0);
  for (const q of transformations) {
    const res = resolveQuestionPresentation(q);
    assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
    assert.equal(res.options.length, 0);
  }
});

test("Fixture 5: ERROR_CORRECTION questions resolve to text_input", () => {
  const errorQuestions = allQuizQuestions.filter(
    (q) => q.type === "ERROR_CORRECTION"
  );
  assert.ok(errorQuestions.length > 0);
  for (const q of errorQuestions) {
    const res = resolveQuestionPresentation(q);
    assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
    assert.equal(res.options.length, 0);
  }
});

test("Fixture 6: Questions with starter_prompt stay text_input even when type is MULTIPLE_CHOICE", () => {
  const withStarter = allQuizQuestions.filter(
    (q) => q.starter_prompt && String(q.starter_prompt).trim()
  );
  assert.ok(withStarter.length > 0);
  for (const q of withStarter) {
    const res = resolveQuestionPresentation(q);
    assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
  }

  const syntheticMcWithStarter = {
    id: "synthetic-starter-mc",
    type: "MULTIPLE_CHOICE",
    stem: "He (goes/ went) to school.",
    starter_prompt: "He...",
    answers: ["went"],
  };
  const res = resolveQuestionPresentation(syntheticMcWithStarter);
  assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
  assert.equal(res.reason, "has_starter_prompt");
  assert.equal(res.options.length, 0);
});

test("Fixture 7: Long 749-char stem resolves safely without truncation or mutation", () => {
  const longStemQ = allQuizQuestions.find(
    (q) => q.id === "04db7fd8-0b63-52cc-b68b-840d8c52edf7"
  );
  assert.ok(longStemQ, "Expected 749-char stem question");
  assert.equal(longStemQ.stem.length, 749);

  const res = resolveQuestionPresentation(longStemQ);
  assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
  assert.equal(longStemQ.stem.length, 749);
});

test("Fixture 8: Long 1,190-char explanation metadata is preserved intact", () => {
  const longExplQ = allQuizQuestions.find(
    (q) => q.id === "a2495080-3753-545b-98ff-cd2be14ae751"
  );
  assert.ok(longExplQ, "Expected 1,190-char explanation question");
  assert.equal(longExplQ.explanation.length, 1190);

  const res = resolveQuestionPresentation(longExplQ);
  assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
  assert.equal(longExplQ.explanation.length, 1190);
  assert.ok(longExplQ.pedagogy && typeof longExplQ.pedagogy.rule === "string");
});

test("Fixture 9: Invalid or mismatched answer key falls back to text_input", () => {
  const mismatched = {
    id: "synthetic-mismatch-1",
    type: "MULTIPLE_CHOICE",
    stem: "She (go/ went) home early.",
    answers: ["gone"],
  };
  const resMismatch = resolveQuestionPresentation(mismatched);
  assert.equal(resMismatch.mode, QUESTION_MODES.TEXT_INPUT);
  assert.equal(resMismatch.reason, "answer_mismatch");
  assert.equal(resMismatch.options.length, 0);

  const emptyAnswers = {
    id: "synthetic-mismatch-2",
    type: "MULTIPLE_CHOICE",
    stem: "She (go/ went) home early.",
    answers: [],
  };
  const resEmpty = resolveQuestionPresentation(emptyAnswers);
  assert.equal(resEmpty.mode, QUESTION_MODES.TEXT_INPUT);
  assert.equal(resEmpty.reason, "answer_mismatch");

  assert.equal(normalizeAnswer("  Is \u2018Writing\u2019  "), "is 'writing'");
});

test("Fixture 10: Ambiguous and malformed slash stems fall back to text_input", () => {
  const malformedIds = [
    "1a466168-ba56-57f0-9636-ec26400750c8", // (rise)
    "18b1b567-524e-5fc5-9b20-1d26ab1f1750", // (yourself, yourselves)
    "95bd5ac9-dd73-56f7-aec5-26581bc93017", // Nothing/ Anything)
  ];
  for (const id of malformedIds) {
    const q = allQuizQuestions.find((item) => item.id === id);
    assert.ok(q, `Expected malformed question ${id}`);
    const res = resolveQuestionPresentation(q);
    assert.equal(res.mode, QUESTION_MODES.TEXT_INPUT);
    assert.equal(res.options.length, 0);
  }

  const andOrQuestion = {
    id: "synthetic-and-or",
    type: "MULTIPLE_CHOICE",
    stem: "Bring your ID (and/or) passport.",
    answers: ["and/or"],
  };
  const parsedAndOr = parseInlineParentheticalChoices(andOrQuestion.stem);
  assert.equal(parsedAndOr.valid, false);
  assert.equal(parsedAndOr.reason, "ambiguous_slash_token");
  assert.equal(resolveQuestionPresentation(andOrQuestion).mode, QUESTION_MODES.TEXT_INPUT);

  const plainSlash = {
    id: "synthetic-plain-slash",
    type: "MULTIPLE_CHOICE",
    stem: "Choose and/or fill the speed 60 km/h.",
    answers: ["60 km/h"],
  };
  assert.equal(resolveQuestionPresentation(plainSlash).mode, QUESTION_MODES.TEXT_INPUT);
});

test("Session persistence helpers and zero-HEX / A11y invariants", () => {
  // Persistence helpers roundtrip cleanly in Node memory fallback
  const key = buildQuestionStateKey("quiz", "q-123");
  assert.match(key, /quiz:q-123$/);
  writePersistedQuestionState("quiz", "q-123", {
    draftValue: "is writing",
    attempts: 2,
    lastAttemptAt: 1700000000000,
  });
  const loaded = readPersistedQuestionState("quiz", "q-123");
  assert.equal(loaded.draftValue, "is writing");
  assert.equal(loaded.attempts, 2);
  clearPersistedQuestionState("quiz", "q-123");
  assert.equal(readPersistedQuestionState("quiz", "q-123").draftValue, "");

  // Zero hardcoded HEX colors inside components/question-engine/
  const engineDir = path.join(ROOT, "components/question-engine");
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|mjs|css)$/.test(entry.name)) files.push(full);
    }
  }
  walk(engineDir);
  assert.ok(files.length >= 14);

  const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(hexRegex);
    assert.equal(
      matches,
      null,
      `Hardcoded HEX found in ${path.relative(ROOT, file)}: ${matches}`
    );
  }

  // Accessibility & mascot-free BeforeAnswer checks
  const radioSrc = fs.readFileSync(
    path.join(engineDir, "components/RadioChoiceCard.jsx"),
    "utf8"
  );
  assert.ok(radioSrc.includes('role="radio"'));
  assert.ok(radioSrc.includes('minHeight: "48px"'));

  const mcRendererSrc = fs.readFileSync(
    path.join(engineDir, "renderers/MultipleChoiceRenderer.jsx"),
    "utf8"
  );
  assert.ok(mcRendererSrc.includes('role="radiogroup"'));
  assert.ok(mcRendererSrc.includes("ArrowDown"));
  assert.ok(mcRendererSrc.includes("ArrowUp"));

  const beforeAnswerSrc = fs.readFileSync(
    path.join(engineDir, "states/BeforeAnswer.jsx"),
    "utf8"
  );
  const beforeAnswerCodeOnly = beforeAnswerSrc.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
  assert.equal(/mascot|<img|assetMap/i.test(beforeAnswerCodeOnly), false);
});
