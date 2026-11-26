#!/usr/bin/env node
/**
 * TOEIC Difficulty Recalibration & Audit Script (Rubric v2.1)
 *
 * Usage:
 *   node scripts/toeic/recalibrate-difficulty.mjs --dry-run   (default: audit only, writes report)
 *   node scripts/toeic/recalibrate-difficulty.mjs --apply     (updates both master JSON copies safely)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  RUBRIC_VERSION,
  A1_A2_WORDS,
  BASIC_PRONOUNS,
  scoreQuestionDifficulty,
} = require('../../lib/toeic/difficulty-rubric.js');

const ROOT_DIR = process.cwd();
const MASTER_PATHS = [
  path.join(ROOT_DIR, 'ETS_Corpus_Normalized_Enriched_Database', 'ets_toeic_ai_grammar_master.json'),
  path.join(ROOT_DIR, 'data', 'toeic', 'ets_toeic_ai_grammar_master.json'),
];
const AUDIT_REPORT_PATH = path.join(ROOT_DIR, 'data', 'reports', 'toeic_difficulty_recalibration_audit.json');

const isApply = process.argv.includes('--apply');

function summarizePart(items, partLabel) {
  const before = { 1: 0, 2: 0, 3: 0 };
  const after = { 1: 0, 2: 0, 3: 0 };
  const transitions = {};
  const bandAfter = {};
  const guardrails = {};

  let legacyAnomalies = {
    diff3WithLowBand: 0,
    diff1WithHighBand: 0,
    diff3WithA1A2Answer: 0,
    diff3WithBasicPronoun: 0,
  };
  let afterAnomalies = {
    diff3WithA1A2NonC1: 0,
    diff3WithBasicPronoun: 0,
    diffBandMismatch: 0,
  };

  const rows = [];

  for (const q of items) {
    const oldDiff = Number(q.difficulty_level || 2);
    const oldBand = Number(q.target_score_band || 550);
    const ansLow = String((q.options || {})[q.correct_answer] || '').trim().toLowerCase();

    if (oldDiff === 3 && oldBand <= 600) legacyAnomalies.diff3WithLowBand += 1;
    if (oldDiff === 1 && oldBand >= 700) legacyAnomalies.diff1WithHighBand += 1;
    if (oldDiff === 3 && A1_A2_WORDS.has(ansLow)) legacyAnomalies.diff3WithA1A2Answer += 1;
    if (oldDiff === 3 && q.primary_grammar_topic_id === 'GRM_PRON_CASE' && BASIC_PRONOUNS.has(ansLow)) {
      legacyAnomalies.diff3WithBasicPronoun += 1;
    }

    const scored = scoreQuestionDifficulty(q);
    const newDiff = scored.difficulty_level;
    const newBand = scored.target_score_band;

    before[oldDiff] = (before[oldDiff] || 0) + 1;
    after[newDiff] = (after[newDiff] || 0) + 1;

    const tk = `${oldDiff}->${newDiff}`;
    transitions[tk] = (transitions[tk] || 0) + 1;
    bandAfter[newBand] = (bandAfter[newBand] || 0) + 1;

    for (const g of scored.breakdown.guardrails) {
      guardrails[g] = (guardrails[g] || 0) + 1;
    }

    if (
      newDiff === 3 &&
      A1_A2_WORDS.has(ansLow) &&
      scored.breakdown.guardrails.includes('CAP_A1_A2_MAX_50')
    ) {
      afterAnomalies.diff3WithA1A2NonC1 += 1;
    }
    if (newDiff === 3 && q.primary_grammar_topic_id === 'GRM_PRON_CASE' && BASIC_PRONOUNS.has(ansLow)) {
      afterAnomalies.diff3WithBasicPronoun += 1;
    }
    if (
      (newDiff === 1 && newBand > 500) ||
      (newDiff === 2 && (newBand < 600 || newBand > 650)) ||
      (newDiff === 3 && newBand < 750)
    ) {
      afterAnomalies.diffBandMismatch += 1;
    }

    rows.push({
      id: q.id,
      part: q.part,
      topic: q.primary_grammar_topic_id,
      stem: String(q.stem || q.context_sentence || '').slice(0, 120),
      answer: String((q.options || {})[q.correct_answer] || ''),
      old_diff: oldDiff,
      old_band: oldBand,
      new_diff: newDiff,
      new_band: newBand,
      score: scored.difficulty_score,
      prior_irt_b: scored.prior_irt_b,
      breakdown: scored.breakdown,
    });
  }

  const majorDowngrades = rows
    .filter((r) => r.old_diff === 3 && r.new_diff === 1)
    .sort((a, b) => a.score - b.score);

  const majorUpgrades = rows
    .filter((r) => r.old_diff === 1 && r.new_diff === 3)
    .sort((a, b) => b.score - a.score);

  const topHard = [...rows].sort((a, b) => b.score - a.score).slice(0, 15);
  const topEasy = [...rows].sort((a, b) => a.score - b.score).slice(0, 15);

  return {
    part: partLabel,
    total: items.length,
    before_distribution: before,
    after_distribution: after,
    after_band_distribution: bandAfter,
    transition_matrix: transitions,
    guardrails_triggered: guardrails,
    legacy_anomalies: legacyAnomalies,
    after_anomalies: afterAnomalies,
    major_downgrades_3_to_1_count: majorDowngrades.length,
    major_upgrades_1_to_3_count: majorUpgrades.length,
    sample_major_downgrades: majorDowngrades.slice(0, 12),
    sample_major_upgrades: majorUpgrades.slice(0, 12),
    top_15_hardest: topHard,
    top_15_easiest: topEasy,
  };
}

function main() {
  const existingPaths = MASTER_PATHS.filter((p) => fs.existsSync(p));
  if (existingPaths.length === 0) {
    throw new Error('No ets_toeic_ai_grammar_master.json found!');
  }

  const primaryPath = existingPaths[0];
  const rawPrimary = fs.readFileSync(primaryPath, 'utf8').replace(/^\uFEFF/, '');
  const master = JSON.parse(rawPrimary);
  const bank = master.part5_part6_grammar_bank || [];

  // Check sync parity between dual copies
  let dualCopyStatus = 'SINGLE_COPY';
  if (existingPaths.length === 2) {
    const rawSecondary = fs.readFileSync(existingPaths[1], 'utf8').replace(/^\uFEFF/, '');
    dualCopyStatus = rawPrimary === rawSecondary ? 'IDENTICAL' : 'DRIFT_DETECTED';
  }

  const part5 = bank.filter((q) => q.part === 5);
  const part6 = bank.filter((q) => q.part === 6);

  const p5Summary = summarizePart(part5, 'Part 5');
  const p6Summary = summarizePart(part6, 'Part 6');

  const report = {
    generated_at: new Date().toISOString(),
    mode: isApply ? 'APPLY' : 'DRY_RUN',
    rubric_version: RUBRIC_VERSION,
    master_paths_found: existingPaths,
    dual_copy_status: dualCopyStatus,
    part5: p5Summary,
    part6: p6Summary,
  };

  fs.mkdirSync(path.dirname(AUDIT_REPORT_PATH), { recursive: true });
  fs.writeFileSync(AUDIT_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  if (isApply) {
    let updatedCount = 0;
    for (const q of bank) {
      if (q.part !== 5 && q.part !== 6) continue;
      const scored = scoreQuestionDifficulty(q);
      q.difficulty_level = scored.difficulty_level;
      q.target_score_band = scored.target_score_band;
      q.difficulty_score = scored.difficulty_score;
      q.difficulty_rubric_version = RUBRIC_VERSION;
      q.prior_irt_b = scored.prior_irt_b;
      updatedCount += 1;
    }

    const serialized = JSON.stringify(master, null, 2);
    for (const p of existingPaths) {
      fs.writeFileSync(p, serialized, 'utf8');
    }
    console.log(`[APPLY] Updated ${updatedCount} Part 5 & Part 6 items across ${existingPaths.length} master JSON files.`);
  }

  // Concise console readout
  console.log(`\n=== TOEIC DIFFICULTY RECALIBRATION (${report.mode} · Rubric ${RUBRIC_VERSION}) ===`);
  console.log(`Dual copy status: ${dualCopyStatus} (${existingPaths.length} files found)`);

  for (const s of [p5Summary, p6Summary]) {
    console.log(`\n--- ${s.part} (n=${s.total}) ---`);
    console.log('Before (1/2/3):', s.before_distribution);
    console.log('After  (1/2/3):', s.after_distribution);
    console.log('After Bands   :', s.after_band_distribution);
    console.log('Transitions   :', s.transition_matrix);
    console.log('Guardrails    :', s.guardrails_triggered);
    console.log('Legacy Anom.  :', s.legacy_anomalies);
    console.log('After  Anom.  :', s.after_anomalies);
    console.log(`Major shifts  : 3->1 = ${s.major_downgrades_3_to_1_count}, 1->3 = ${s.major_upgrades_1_to_3_count}`);
  }

  console.log('\n--- Part 5: Sample Major Downgrades (3 -> 1) ---');
  for (const r of p5Summary.sample_major_downgrades.slice(0, 6)) {
    console.log(`  [${r.score}đ] ${r.id} (${r.topic}) ans="${r.answer}" | ${r.stem}`);
  }

  console.log('\n--- Part 5: Sample Major Upgrades (1 -> 3) ---');
  for (const r of p5Summary.sample_major_upgrades.slice(0, 6)) {
    console.log(`  [${r.score}đ] ${r.id} (${r.topic}) ans="${r.answer}" | ${r.stem}`);
  }

  console.log('\n--- Part 5: Top 8 Hardest ---');
  for (const r of p5Summary.top_15_hardest.slice(0, 8)) {
    console.log(`  [${r.score}đ · Band ${r.new_band}] ${r.id} (${r.topic}) ans="${r.answer}" | ${r.stem}`);
  }

  console.log(`\nFull audit report written to: ${AUDIT_REPORT_PATH}`);
}

main();
