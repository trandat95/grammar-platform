import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  RUBRIC_VERSION,
  A1_A2_WORDS,
  BASIC_PRONOUNS,
  scoreQuestionDifficulty,
} = require('../lib/toeic/difficulty-rubric.js');

const ROOT = process.cwd();
const PRIMARY_PATH = path.join(ROOT, 'ETS_Corpus_Normalized_Enriched_Database', 'ets_toeic_ai_grammar_master.json');
const SECONDARY_PATH = path.join(ROOT, 'data', 'toeic', 'ets_toeic_ai_grammar_master.json');

test('Dual master JSON copies are byte-for-byte identical', () => {
  const a = fs.readFileSync(PRIMARY_PATH, 'utf8');
  const b = fs.readFileSync(SECONDARY_PATH, 'utf8');
  assert.equal(a, b, 'Master JSON files in ETS_Corpus_Normalized_Enriched_Database and data/toeic must match');
});

test('All 1,271 Part 5 & Part 6 items satisfy Rubric v2.1 invariants (0 anomalies)', () => {
  const master = JSON.parse(fs.readFileSync(SECONDARY_PATH, 'utf8').replace(/^\uFEFF/, ''));
  const items = (master.part5_part6_grammar_bank || []).filter((q) => q.part === 5 || q.part === 6);
  assert.equal(items.length, 1271, 'Expected 951 Part 5 + 320 Part 6 = 1271 items');

  for (const q of items) {
    assert.equal(q.difficulty_rubric_version, RUBRIC_VERSION, `Item ${q.id} missing rubric version`);
    assert.ok([1, 2, 3].includes(q.difficulty_level), `Item ${q.id} invalid difficulty_level`);
    assert.ok(q.difficulty_score >= 0 && q.difficulty_score <= 100, `Item ${q.id} score out of 0..100`);

    const ansLow = String((q.options || {})[q.correct_answer] || '').trim().toLowerCase();

    // No basic pronoun in Hard
    if (q.primary_grammar_topic_id === 'GRM_PRON_CASE' && BASIC_PRONOUNS.has(ansLow)) {
      assert.equal(q.difficulty_level, 1, `Basic pronoun ${q.id} (${ansLow}) must be difficulty_level 1`);
    }

    // Strict consistency between difficulty_level and target_score_band
    if (q.difficulty_level === 1) {
      assert.ok(q.target_score_band <= 500, `Item ${q.id} level 1 has band ${q.target_score_band}`);
    } else if (q.difficulty_level === 2) {
      assert.ok(
        q.target_score_band >= 600 && q.target_score_band <= 650,
        `Item ${q.id} level 2 has band ${q.target_score_band}`
      );
    } else if (q.difficulty_level === 3) {
      assert.ok(q.target_score_band >= 750, `Item ${q.id} level 3 has band ${q.target_score_band}`);
    }
  }
});

test('Rubric v2.1 unit guardrails: basic A1-A2 & pronouns stay Easy/Medium, C1 inversion is Hard', () => {
  const basicPronoun = scoreQuestionDifficulty({
    primary_grammar_topic_id: 'GRM_PRON_CASE',
    stem: 'Mr. Beaumont assured the regional branch managers that he would review ------- staffing requests personally.',
    options: { A: 'they', B: 'them', C: 'their', D: 'theirs' },
    correct_answer: 'C',
  });
  assert.equal(basicPronoun.difficulty_level, 1);
  assert.ok(basicPronoun.difficulty_score <= 32);

  const basicVocab = scoreQuestionDifficulty({
    primary_grammar_topic_id: 'VOC_COLLOCATION',
    stem: 'Guests at the hotel receive a free ------- every morning.',
    options: { A: 'drink', B: 'table', C: 'chair', D: 'room' },
    correct_answer: 'A',
  });
  assert.equal(basicVocab.difficulty_level, 1);
  assert.ok(A1_A2_WORDS.has('drink'));

  const c1Inversion = scoreQuestionDifficulty({
    primary_grammar_topic_id: 'GRM_COND_INVERSION',
    stem: 'Had the research team secured the federal grant in January, clinical trials ------- three months ahead of schedule.',
    options: {
      A: 'commence',
      B: 'will commence',
      C: 'would have commenced',
      D: 'were commencing',
    },
    correct_answer: 'C',
  });
  assert.equal(c1Inversion.difficulty_level, 3);
  assert.ok(c1Inversion.difficulty_score >= 80);
  assert.equal(c1Inversion.target_score_band, 850);

  const longCommonWord = scoreQuestionDifficulty({
    primary_grammar_topic_id: 'GRM_POS_NOUN',
    stem: 'Please contact our office for more -------.',
    options: { A: 'inform', B: 'informed', C: 'information', D: 'informative' },
    correct_answer: 'C',
  });
  assert.equal(longCommonWord.breakdown.lexical, 8);
  assert.equal(longCommonWord.difficulty_level, 1);
});

test('ETS2024 Reading answer-key integrity & anti-permutation regression (all 10 tests)', () => {
  const akPath = path.join(ROOT, 'ETS_Corpus_Normalized_Enriched_Database', 'ETS2024', 'answer_keys.json');
  const ak = JSON.parse(fs.readFileSync(akPath, 'utf8'));
  const akMap = new Map(ak.keys.map((k) => [`ETS2024_T${String(k.test).padStart(2, '0')}_Q${String(k.q).padStart(3, '0')}`, k.answer]));

  const master = JSON.parse(fs.readFileSync(SECONDARY_PATH, 'utf8').replace(/^\uFEFF/, ''));
  const masterById = new Map((master.part5_part6_grammar_bank || []).map((q) => [q.id, q]));

  // Spot-verified ground-truth canaries across Part 5 & Part 7
  const CANARIES = {
    ETS2024_T01_Q101: 'B', // his career experiences
    ETS2024_T01_Q147: 'C', // In a box
    ETS2024_T02_Q200: 'B', // The lack of information about walking distances
    ETS2024_T04_Q127: 'A', // are submitted
    ETS2024_T08_Q102: 'D', // that your personal belongings
    ETS2024_T08_Q112: 'C', // have already submitted
    ETS2024_T10_Q102: 'A', // must be strictly followed
  };
  for (const [id, expected] of Object.entries(CANARIES)) {
    assert.equal(akMap.get(id), expected, `Canary ${id} in answer_keys.json must be ${expected}`);
  }

  for (let t = 1; t <= 10; t++) {
    const pad = String(t).padStart(2, '0');
    const rPath = path.join(ROOT, 'ETS_Corpus_Normalized_Enriched_Database', 'ETS2024', `Test_${pad}`, 'reading.json');
    const rJson = JSON.parse(fs.readFileSync(rPath, 'utf8'));

    for (const q of rJson.questions || []) {
      const expected = akMap.get(q.id);
      assert.equal(q.correct_answer, expected, `${q.id} reading.json answer mismatch vs answer_keys.json`);

      const oda = q.ai_analysis?.option_deep_analysis;
      if (oda && oda[expected]) {
        assert.equal(oda[expected].is_correct, true, `${q.id} option_deep_analysis[${expected}].is_correct must be true`);
      }
      if (q.ai_analysis?.sentence_xray && q.options?.[expected]) {
        assert.equal(q.ai_analysis.sentence_xray.blank_slot, q.options[expected], `${q.id} sentence_xray.blank_slot mismatch`);
      }
      if (masterById.has(q.id)) {
        assert.equal(masterById.get(q.id).correct_answer, expected, `${q.id} master bank mismatch`);
      }
    }
  }
});
