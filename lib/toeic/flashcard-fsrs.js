/**
 * Milestone FC-2: FSRS-4.5 Spaced Repetition Engine for New TOEIC 1,000 Flashcards
 * - Supports 4 canonical ratings: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 * - Models Difficulty (D in [1, 10]), Stability (S in days), Retrievability (R in [0, 1])
 * - Compatible with `user_toeic_flashcard_srs` PostgreSQL table & IndexedDB offline store
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

export const FSRS_STATES = {
  NEW: "NEW",
  LEARNING: "LEARNING",
  REVIEW: "REVIEW",
  RELEARNING: "RELEARNING",
};

export const FSRS_RATINGS = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
};

// Standard FSRS-4.5 17-parameter weights
export const DEFAULT_FSRS_W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
];

const FSRS_FACTOR = 19 / 81;
const FSRS_DECAY = -0.5;
const REQUEST_RETENTION = 0.9;
const MAX_INTERVAL_DAYS = 365;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function roundTo(val, digits = 4) {
  const m = 10 ** digits;
  return Math.round(Number(val || 0) * m) / m;
}

/**
 * FSRS-4.5 power-law forgetting curve: R(t, S) = (1 + F * t / S) ^ C
 */
export function computeRetrievability(elapsedDays, stabilityDays) {
  const t = Math.max(0, Number(elapsedDays || 0));
  const s = Math.max(0.1, Number(stabilityDays || 1));
  return Math.pow(1 + (FSRS_FACTOR * t) / s, FSRS_DECAY);
}

/**
 * Converts desired retention (default 0.9) and stability S into next interval in days.
 */
function stabilityToIntervalDays(stabilityDays) {
  const s = Math.max(0.1, Number(stabilityDays || 1));
  const raw = (s / FSRS_FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / FSRS_DECAY) - 1);
  return clamp(Math.round(raw), 1, MAX_INTERVAL_DAYS);
}

function computeInitialDifficulty(rating, baseDifficulty = 5.0) {
  const d0 = Number(baseDifficulty || 5.0) - DEFAULT_FSRS_W[5] * (rating - 3);
  return roundTo(clamp(d0, 1.0, 10.0), 2);
}

/**
 * Computes next FSRS-4.5 state given current record, card defaults, and rating (1..4).
 */
export function reviewFlashcardFSRS(
  existingRecord = null,
  defaults = {},
  rating = FSRS_RATINGS.GOOD,
  now = new Date(),
  responseTimeMs = null
) {
  const g = clamp(Math.round(Number(rating || 3)), 1, 4);
  const nowDate = now instanceof Date ? now : new Date(now);

  const prevReps = Number(existingRecord?.reps || 0);
  const prevLapses = Number(existingRecord?.lapses || 0);
  const prevEase = Number(
    existingRecord?.ease_factor || defaults?.initial_ease_factor || 2.5
  );
  const baseDifficulty = Number(
    defaults?.initial_difficulty || existingRecord?.difficulty || 5.0
  );
  const prevDifficulty = Number(existingRecord?.difficulty || baseDifficulty);
  const prevStability = Number(
    existingRecord?.stability || defaults?.initial_stability || 1.0
  );
  const prevInterval = Number(existingRecord?.interval_days || 0);
  const prevState = existingRecord?.srs_state || FSRS_STATES.NEW;
  const isFirstReview =
    !existingRecord || prevState === FSRS_STATES.NEW || prevReps === 0;

  let nextState = FSRS_STATES.LEARNING;
  let nextReps = prevReps;
  let nextLapses = prevLapses;
  let nextStability = prevStability;
  let nextDifficulty = prevDifficulty;
  let nextIntervalDays = 0;
  let nextEase = prevEase;
  let dueAt;

  // Adjust SM-2 compatible ease_factor alongside FSRS D/S
  const qMapped = g === 1 ? 1 : g === 2 ? 3 : g === 3 ? 4 : 5;
  nextEase = roundTo(
    clamp(prevEase + (0.1 - (5 - qMapped) * (0.08 + (5 - qMapped) * 0.02)), 1.3, 3.0),
    2
  );

  if (isFirstReview) {
    nextDifficulty = computeInitialDifficulty(g, baseDifficulty);
    nextStability = roundTo(DEFAULT_FSRS_W[g - 1], 4);

    if (g === FSRS_RATINGS.AGAIN) {
      nextState = prevState === FSRS_STATES.RELEARNING ? FSRS_STATES.RELEARNING : FSRS_STATES.LEARNING;
      nextLapses = prevState === FSRS_STATES.NEW ? 0 : prevLapses + 1;
      nextIntervalDays = 0.01; // ~10 minutes intra-day re-test
      dueAt = new Date(nowDate.getTime() + 10 * MS_PER_MINUTE);
    } else if (g === FSRS_RATINGS.HARD) {
      nextState = FSRS_STATES.LEARNING;
      nextReps = prevReps + 1;
      nextIntervalDays = 1;
      dueAt = new Date(nowDate.getTime() + 1 * MS_PER_DAY);
    } else if (g === FSRS_RATINGS.GOOD) {
      nextState = FSRS_STATES.REVIEW;
      nextReps = prevReps + 1;
      nextIntervalDays = clamp(Math.round(nextStability), 3, 7);
      dueAt = new Date(nowDate.getTime() + nextIntervalDays * MS_PER_DAY);
    } else {
      nextState = FSRS_STATES.REVIEW;
      nextReps = prevReps + 1;
      nextIntervalDays = clamp(Math.round(nextStability), 7, 14);
      dueAt = new Date(nowDate.getTime() + nextIntervalDays * MS_PER_DAY);
    }
  } else {
    const lastMs = existingRecord?.last_reviewed_at
      ? new Date(existingRecord.last_reviewed_at).getTime()
      : nowDate.getTime();
    const elapsedDays = Math.max(0, (nowDate.getTime() - lastMs) / MS_PER_DAY);
    const retrievability = computeRetrievability(elapsedDays, prevStability);

    // Mean-reversion difficulty update (FSRS-4.5)
    const d0Good = computeInitialDifficulty(FSRS_RATINGS.GOOD, baseDifficulty);
    const linearD = prevDifficulty - DEFAULT_FSRS_W[6] * (g - 3);
    nextDifficulty = roundTo(
      clamp(DEFAULT_FSRS_W[7] * d0Good + (1 - DEFAULT_FSRS_W[7]) * linearD, 1.0, 10.0),
      2
    );

    if (g === FSRS_RATINGS.AGAIN) {
      nextState = FSRS_STATES.RELEARNING;
      nextLapses = prevLapses + 1;
      const lapseStability =
        DEFAULT_FSRS_W[11] *
        Math.pow(nextDifficulty, -DEFAULT_FSRS_W[12]) *
        (Math.pow(prevStability + 1, DEFAULT_FSRS_W[13]) - 1) *
        Math.exp(DEFAULT_FSRS_W[14] * (1 - retrievability));
      nextStability = roundTo(clamp(lapseStability, 0.25, Math.max(0.5, prevStability * 0.7)), 4);
      nextIntervalDays = 0.01;
      dueAt = new Date(nowDate.getTime() + 10 * MS_PER_MINUTE);
    } else {
      nextState = FSRS_STATES.REVIEW;
      nextReps = prevReps + 1;

      const hardPenalty = g === FSRS_RATINGS.HARD ? DEFAULT_FSRS_W[15] : 1.0;
      const easyBonus = g === FSRS_RATINGS.EASY ? DEFAULT_FSRS_W[16] : 1.0;
      const growthFactor =
        Math.exp(DEFAULT_FSRS_W[8]) *
        (11 - nextDifficulty) *
        Math.pow(Math.max(0.2, prevStability), -DEFAULT_FSRS_W[9]) *
        (Math.exp((1 - retrievability) * DEFAULT_FSRS_W[10]) - 1) *
        hardPenalty *
        easyBonus;

      nextStability = roundTo(
        clamp(prevStability * (1 + Math.max(0.05, growthFactor)), 0.5, MAX_INTERVAL_DAYS),
        4
      );

      let candidateInterval = stabilityToIntervalDays(nextStability);
      if (g === FSRS_RATINGS.HARD) {
        candidateInterval = Math.max(1, Math.min(candidateInterval, Math.max(2, Math.round(prevInterval * 1.2))));
      } else if (g === FSRS_RATINGS.GOOD) {
        candidateInterval = Math.max(Math.max(1, Math.round(prevInterval) + 1), candidateInterval);
      } else if (g === FSRS_RATINGS.EASY) {
        const goodInterval = stabilityToIntervalDays(
          prevStability *
            (1 +
              Math.exp(DEFAULT_FSRS_W[8]) *
                (11 - nextDifficulty) *
                Math.pow(Math.max(0.2, prevStability), -DEFAULT_FSRS_W[9]) *
                (Math.exp((1 - retrievability) * DEFAULT_FSRS_W[10]) - 1))
        );
        candidateInterval = Math.max(goodInterval + 1, candidateInterval);
      }

      nextIntervalDays = clamp(candidateInterval, 1, MAX_INTERVAL_DAYS);
      dueAt = new Date(nowDate.getTime() + nextIntervalDays * MS_PER_DAY);
    }
  }

  return {
    flashcard_id: existingRecord?.flashcard_id ?? defaults?.flashcard_id ?? null,
    srs_state: nextState,
    reps: nextReps,
    lapses: nextLapses,
    ease_factor: nextEase,
    stability: nextStability,
    difficulty: nextDifficulty,
    interval_days: nextIntervalDays,
    last_rating: g,
    last_response_ms:
      responseTimeMs !== null && responseTimeMs !== undefined
        ? Math.max(0, Math.round(Number(responseTimeMs)))
        : existingRecord?.last_response_ms ?? null,
    due_at: dueAt.toISOString(),
    last_reviewed_at: nowDate.toISOString(),
  };
}

/**
 * Formats interval_days into concise Vietnamese label for FSRS action buttons.
 */
export function formatIntervalVi(intervalDays) {
  const days = Number(intervalDays || 0);
  if (days <= 0.05) return "10 phút";
  if (days < 1) return "Hôm nay";
  const rounded = Math.round(days);
  if (rounded === 1) return "1 ngày";
  if (rounded >= 30) {
    const months = Math.round((rounded / 30) * 10) / 10;
    return Number.isInteger(months) ? `${months} tháng` : `${rounded} ngày`;
  }
  return `${rounded} ngày`;
}

/**
 * Previews next intervals for all 4 ratings (1..4) without mutating state.
 */
export function previewAllRatings(existingRecord = null, defaults = {}, now = new Date()) {
  return {
    1: formatIntervalVi(reviewFlashcardFSRS(existingRecord, defaults, 1, now).interval_days),
    2: formatIntervalVi(reviewFlashcardFSRS(existingRecord, defaults, 2, now).interval_days),
    3: formatIntervalVi(reviewFlashcardFSRS(existingRecord, defaults, 3, now).interval_days),
    4: formatIntervalVi(reviewFlashcardFSRS(existingRecord, defaults, 4, now).interval_days),
  };
}

/**
 * Prepares an FSRS record transition when a learner misses a linked grammar/TOEIC question
 * or saves a vocabulary/collocation item from Sentence X-Ray (Step 4).
 */
export function buildQueuedSrsPayload({
  existingRecord = null,
  flashcard = {},
  sourceContext = "MISTAKE_AUTO_QUEUE",
  sourceQuestionId = null,
  now = new Date(),
}) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const hasPriorReviews =
    existingRecord &&
    (Number(existingRecord.reps || 0) > 0 ||
      existingRecord.srs_state === FSRS_STATES.REVIEW ||
      existingRecord.srs_state === FSRS_STATES.RELEARNING);

  return {
    flashcard_id: Number(flashcard.id || existingRecord?.flashcard_id),
    srs_state: hasPriorReviews ? FSRS_STATES.RELEARNING : FSRS_STATES.LEARNING,
    reps: Number(existingRecord?.reps || 0),
    lapses: hasPriorReviews ? Number(existingRecord?.lapses || 0) + 1 : Number(existingRecord?.lapses || 0),
    ease_factor: Number(
      existingRecord?.ease_factor || flashcard?.spaced_repetition_defaults?.initial_ease_factor || 2.5
    ),
    stability: hasPriorReviews
      ? roundTo(Math.max(0.5, Number(existingRecord?.stability || 1) * 0.5), 4)
      : Number(flashcard?.spaced_repetition_defaults?.initial_stability || 1.0),
    difficulty: Number(
      existingRecord?.difficulty ||
        flashcard?.spaced_repetition_defaults?.initial_difficulty ||
        flashcard?.initial_difficulty ||
        5.0
    ),
    interval_days: 0,
    source_context: sourceContext,
    source_question_id: sourceQuestionId || existingRecord?.source_question_id || null,
    due_at: nowIso,
    last_reviewed_at: existingRecord?.last_reviewed_at || null,
  };
}

/**
 * Summarizes user's FSRS flashcard progress across states and due queue.
 */
export function summarizeFlashcardSrs(records = [], totalCorpus = 1000, now = new Date()) {
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  const counts = {
    tracked: 0,
    NEW: 0,
    LEARNING: 0,
    REVIEW: 0,
    RELEARNING: 0,
    dueNow: 0,
    mistakeLinkedDue: 0,
  };

  for (const r of records || []) {
    counts.tracked += 1;
    const st = r.srs_state || FSRS_STATES.NEW;
    if (counts[st] !== undefined) counts[st] += 1;
    const dueMs = r.due_at ? new Date(r.due_at).getTime() : 0;
    if (dueMs <= nowMs) {
      counts.dueNow += 1;
      if (
        r.source_context === "MISTAKE_AUTO_QUEUE" ||
        r.source_context === "EXAM_REMEDIATION" ||
        r.source_context === "XRAY_SAVE"
      ) {
        counts.mistakeLinkedDue += 1;
      }
    }
  }

  counts.NEW = Math.max(0, totalCorpus - (counts.LEARNING + counts.REVIEW + counts.RELEARNING));
  return counts;
}
