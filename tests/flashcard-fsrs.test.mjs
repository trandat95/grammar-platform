import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  FSRS_RATINGS,
  FSRS_STATES,
  buildQueuedSrsPayload,
  computeRetrievability,
  formatIntervalVi,
  previewAllRatings,
  reviewFlashcardFSRS,
  summarizeFlashcardSrs,
} from "../lib/toeic/flashcard-fsrs.js";

const require = createRequire(import.meta.url);
const FlashcardRepository = require("../lib/toeic/flashcard-repository.js");

test("FSRS-4.5 initial ratings follow monotonic ordering and proper states", () => {
  const now = new Date("2026-11-26T00:00:00.000Z");
  const defaults = { initial_difficulty: 5.0, initial_stability: 1.0, initial_ease_factor: 2.5 };

  const r1 = reviewFlashcardFSRS(null, defaults, FSRS_RATINGS.AGAIN, now);
  const r2 = reviewFlashcardFSRS(null, defaults, FSRS_RATINGS.HARD, now);
  const r3 = reviewFlashcardFSRS(null, defaults, FSRS_RATINGS.GOOD, now);
  const r4 = reviewFlashcardFSRS(null, defaults, FSRS_RATINGS.EASY, now);

  assert.equal(r1.srs_state, FSRS_STATES.LEARNING);
  assert.equal(r2.srs_state, FSRS_STATES.LEARNING);
  assert.equal(r3.srs_state, FSRS_STATES.REVIEW);
  assert.equal(r4.srs_state, FSRS_STATES.REVIEW);

  assert.ok(r1.interval_days < r2.interval_days);
  assert.ok(r2.interval_days < r3.interval_days);
  assert.ok(r3.interval_days < r4.interval_days);
});

test("FSRS-4.5 lapse on a REVIEW card transitions to RELEARNING and increments lapses", () => {
  const day0 = new Date("2026-11-01T00:00:00.000Z");
  const day5 = new Date("2026-11-06T00:00:00.000Z");
  const defaults = { initial_difficulty: 5.2, initial_stability: 1.0, initial_ease_factor: 2.5 };

  const afterGood = reviewFlashcardFSRS(null, defaults, FSRS_RATINGS.GOOD, day0);
  assert.equal(afterGood.srs_state, FSRS_STATES.REVIEW);
  assert.equal(afterGood.reps, 1);

  const afterLapse = reviewFlashcardFSRS(afterGood, defaults, FSRS_RATINGS.AGAIN, day5);
  assert.equal(afterLapse.srs_state, FSRS_STATES.RELEARNING);
  assert.equal(afterLapse.lapses, 1);
  assert.ok(afterLapse.stability < afterGood.stability);
  assert.equal(formatIntervalVi(afterLapse.interval_days), "10 phút");
});

test("FSRS-4.5 retrievability decays over elapsed days and previews 4 intervals", () => {
  const r0 = computeRetrievability(0, 5);
  const r5 = computeRetrievability(5, 5);
  assert.equal(r0, 1);
  assert.ok(r5 < 1 && r5 > 0.8);

  const preview = previewAllRatings(null, { initial_difficulty: 4.5 });
  assert.equal(preview[1], "10 phút");
  assert.equal(preview[2], "1 ngày");
  assert.ok(preview[3].includes("ngày"));
  assert.ok(preview[4].includes("ngày"));
});

test("buildQueuedSrsPayload queues new words as LEARNING and reviewed words as RELEARNING", () => {
  const now = new Date("2026-11-26T04:00:00.000Z");
  const qNew = buildQueuedSrsPayload({
    existingRecord: null,
    flashcard: { id: 1, spaced_repetition_defaults: { initial_difficulty: 5.0 } },
    sourceContext: "MISTAKE_AUTO_QUEUE",
    sourceQuestionId: "ETS2024_T01_Q101",
    now,
  });
  assert.equal(qNew.srs_state, FSRS_STATES.LEARNING);
  assert.equal(qNew.due_at, now.toISOString());

  const qOld = buildQueuedSrsPayload({
    existingRecord: { flashcard_id: 1, reps: 3, lapses: 0, srs_state: FSRS_STATES.REVIEW, stability: 12 },
    flashcard: { id: 1 },
    sourceContext: "EXAM_REMEDIATION",
    sourceQuestionId: "ETS2024_T01_Q105",
    now,
  });
  assert.equal(qOld.srs_state, FSRS_STATES.RELEARNING);
  assert.equal(qOld.lapses, 1);

  const summary = summarizeFlashcardSrs([qNew, qOld], 1000, now);
  assert.equal(summary.tracked, 2);
  assert.equal(summary.dueNow, 2);
  assert.equal(summary.mistakeLinkedDue, 2);
});

test("FlashcardRepository loads 1000 cards, cross-links, and deterministic offline SVG fallback", () => {
  const meta = FlashcardRepository.getCatalogMeta();
  assert.equal(meta.modules.length, 10);
  assert.equal(meta.topics.length, 50);
  assert.equal(meta.totalWords, 1000);

  const fc = FlashcardRepository.getById(1);
  assert.equal(fc.code, "TOEIC-0001");
  assert.equal(fc.word, "abide by");

  const inflected = FlashcardRepository.findByWord("obligated");
  assert.equal(inflected?.word, "obligate");
  assert.equal(FlashcardRepository.findByWord("agreements")?.word, "agreement");

  const svgUri = FlashcardRepository.buildOfflineFlashcardSvgDataUri(fc);
  assert.ok(svgUri.startsWith("data:image/svg+xml;base64,"));
});
