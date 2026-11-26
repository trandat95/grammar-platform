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
