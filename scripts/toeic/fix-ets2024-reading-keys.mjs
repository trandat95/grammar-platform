#!/usr/bin/env node
/**
 * Fix ETS2024 Reading Answer Key Permutation (Q101-Q200 across Tests 01-10)
 *
 * Root Cause (verified 100% across Part 5, Part 6, and Part 7):
 * When ETS2024/Global_Materials/Reading_Answer_Keys.pdf was originally parsed,
 * the 10 test blocks for Q101-Q200 were mapped to the wrong test numbers:
 *   Real Test 01 <- stored in Test 10
 *   Real Test 02 <- stored in Test 01
 *   Real Test 03 <- stored in Test 02
 *   Real Test 04 <- stored in Test 03
 *   Real Test 05 <- stored in Test 04
 *   Real Test 06 <- stored in Test 08
 *   Real Test 07 <- stored in Test 05
 *   Real Test 08 <- stored in Test 07
 *   Real Test 09 <- stored in Test 06
 *   Real Test 10 <- stored in Test 09
 *
 * This script is idempotent-guarded: it checks a signature canary
 * (ETS2024_T01_Q101 === 'C' && ETS2024_T08_Q102 === 'B') before applying,
 * so running it twice will NEVER double-permute!
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CORPUS_DIR = path.join(ROOT, 'ETS_Corpus_Normalized_Enriched_Database');
const ETS2024_DIR = path.join(CORPUS_DIR, 'ETS2024');
const MASTER_PATHS = [
  path.join(CORPUS_DIR, 'ets_toeic_ai_grammar_master.json'),
  path.join(ROOT, 'data', 'toeic', 'ets_toeic_ai_grammar_master.json'),
];

const REAL_TO_SOURCE_TEST = {
  1: 10,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 8,
  7: 5,
  8: 7,
  9: 6,
  10: 9,
};

function escapeRegExp(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function repairQuestionForNewAnswer(q, newAns) {
  const oldAns = q.correct_answer;
  const opts = q.options || {};
  const oldText = String(opts[oldAns] || '');
  const newText = String(opts[newAns] || '');

  q.correct_answer = newAns;
  if (oldAns === newAns) {
    return false;
  }

  // 1. key_clue
  if (typeof q.key_clue === 'string' && oldText && newText) {
    q.key_clue = q.key_clue.replace(`[ ${oldText} ]`, `[ ${newText} ]`);
    if (q.key_clue.includes(`"${oldText}"`)) {
      q.key_clue = q.key_clue.replace(`"${oldText}"`, `"${newText}"`);
    }
  }

  // 2. explanation_vi
  if (typeof q.explanation_vi === 'string') {
    const oldPattern = new RegExp(
      `Đáp án đúng là \\(${escapeRegExp(oldAns)}\\)\\s*(?:\\()?"${escapeRegExp(oldText)}"(?:\\))?`,
      'g'
    );
    if (oldPattern.test(q.explanation_vi)) {
      q.explanation_vi = q.explanation_vi.replace(oldPattern, `Đáp án đúng là (${newAns}) "${newText}"`);
    } else {
      q.explanation_vi = q.explanation_vi.replace(
        new RegExp(`Đáp án đúng là \\(${escapeRegExp(oldAns)}\\)`, 'g'),
        `Đáp án đúng là (${newAns})`
      );
    }
    if (oldText && newText && q.explanation_vi.includes(`[ ${oldText} ]`)) {
      q.explanation_vi = q.explanation_vi.replace(`[ ${oldText} ]`, `[ ${newText} ]`);
    }
  }

  // 3. distractor_analysis (rebuild for the 3 wrong options)
  if (q.distractor_analysis && typeof q.distractor_analysis === 'object') {
    const templateReason =
      Object.values(q.distractor_analysis).find((v) => typeof v === 'string' && v.length > 0) ||
      'không phù hợp về cấu trúc ngữ pháp hoặc ngữ nghĩa trong ngữ cảnh câu.';
    const genericSuffix = templateReason.replace(/^"[^"]+"\s*/, '').trim();
    const nextDistractors = {};
    for (const k of ['A', 'B', 'C', 'D']) {
      if (k === newAns || !(k in opts)) continue;
      if (q.distractor_analysis[k]) {
        nextDistractors[k] = q.distractor_analysis[k];
      } else {
        nextDistractors[k] = `"${opts[k]}" ${genericSuffix}`;
      }
    }
    q.distractor_analysis = nextDistractors;
  }

  // 4. ai_analysis
  const ai = q.ai_analysis;
  if (ai && typeof ai === 'object') {
    // 4a. sentence_xray
    if (ai.sentence_xray && typeof ai.sentence_xray === 'object') {
      ai.sentence_xray.blank_slot = newText;
      if (typeof ai.sentence_xray.xray_pattern_display === 'string' && oldText) {
        ai.sentence_xray.xray_pattern_display = ai.sentence_xray.xray_pattern_display.replace(
          `: ${oldText}]`,
          `: ${newText}]`
        );
      }
    }

    // 4b. option_deep_analysis
    if (ai.option_deep_analysis && typeof ai.option_deep_analysis === 'object') {
      const oda = ai.option_deep_analysis;
      const sampleWrong = Object.entries(oda).find(([k, v]) => k !== oldAns && v?.error_pattern_code)?.[1];
      const fallbackErrCode = sampleWrong?.error_pattern_code || 'ERR_VOCAB_COLLOCATION_MISMATCH';
      const fallbackErrName = sampleWrong?.error_pattern_name_vi || 'Sai cấu trúc hoặc ngữ nghĩa trong ngữ cảnh';

      for (const k of ['A', 'B', 'C', 'D']) {
        if (!oda[k]) continue;
        const txt = String(opts[k] || oda[k].text || '');
        if (k === newAns) {
          oda[k].is_correct = true;
          oda[k].error_pattern_code = null;
          delete oda[k].error_pattern_name_vi;
          oda[k].ai_feedback_vi = `Chính xác! "${txt}" khớp hoàn toàn với cấu trúc ngữ pháp và ngữ cảnh của câu.`;
        } else {
          oda[k].is_correct = false;
          if (!oda[k].error_pattern_code) {
            oda[k].error_pattern_code = fallbackErrCode;
            oda[k].error_pattern_name_vi = fallbackErrName;
          }
          if (k === oldAns) {
            oda[k].ai_feedback_vi = `Bẫy ${oda[k].error_pattern_name_vi || fallbackErrName}: "${txt}" không phù hợp với vị trí chỗ trống này.`;
          }
        }
      }
    }

    // 4c. solving_steps_vi
    if (Array.isArray(ai.solving_steps_vi)) {
      ai.solving_steps_vi = ai.solving_steps_vi.map((step) => {
        if (typeof step !== 'string') return step;
        return step
          .replace(
            new RegExp(`Chọn \\(${escapeRegExp(oldAns)}\\)\\s*"${escapeRegExp(oldText)}"`, 'g'),
            `Chọn (${newAns}) "${newText}"`
          )
          .replace(new RegExp(`\\(${escapeRegExp(oldAns)}\\)`, 'g'), `(${newAns})`);
      });
    }

    // 4d. ai_tutor_rag_context
    if (typeof ai.ai_tutor_rag_context === 'string') {
      ai.ai_tutor_rag_context = ai.ai_tutor_rag_context
        .replace(
          new RegExp(`Đáp án đúng: \\(${escapeRegExp(oldAns)}\\)\\s*${escapeRegExp(oldText)}`, 'g'),
          `Đáp án đúng: (${newAns}) ${newText}`
        )
        .replace(
          new RegExp(`Đáp án đúng là \\(${escapeRegExp(oldAns)}\\)\\s*(?:\\()?"${escapeRegExp(oldText)}"(?:\\))?`, 'g'),
          `Đáp án đúng là (${newAns}) "${newText}"`
        );
    }
  }

  return true;
}

function main() {
  const akPath = path.join(ETS2024_DIR, 'answer_keys.json');
  const ak = JSON.parse(fs.readFileSync(akPath, 'utf8'));

  // Idempotency canary check: verify the exact broken state before un-permuting!
  const canaryT1Q101 = ak.keys.find((k) => k.test === 1 && k.q === 101)?.answer;
  const canaryT8Q102 = ak.keys.find((k) => k.test === 8 && k.q === 102)?.answer;
  if (canaryT1Q101 === 'B' && canaryT8Q102 === 'D') {
    console.log('Canary check: ETS2024 answer_keys.json is ALREADY fixed (T1_Q101=B, T8_Q102=D). Aborting to avoid double-permutation.');
    return;
  }
  if (canaryT1Q101 !== 'C' || canaryT8Q102 !== 'B') {
    throw new Error(`Unexpected canary state: T1_Q101=${canaryT1Q101}, T8_Q102=${canaryT8Q102}. Aborting safely.`);
  }

  // Snapshot original Reading keys (q 101..200)
  const origReadingMap = new Map();
  for (const row of ak.keys) {
    if (row.q >= 101 && row.q <= 200) {
      origReadingMap.set(`${row.test}:${row.q}`, row.answer);
    }
  }

  // 1. Fix answer_keys.json
  let akChanged = 0;
  for (const row of ak.keys) {
    if (row.q >= 101 && row.q <= 200) {
      const srcTest = REAL_TO_SOURCE_TEST[row.test];
      const trueAns = origReadingMap.get(`${srcTest}:${row.q}`);
      if (!trueAns) throw new Error(`Missing key for srcTest=${srcTest} q=${row.q}`);
      if (row.answer !== trueAns) akChanged += 1;
      row.answer = trueAns;
    }
  }
  fs.writeFileSync(akPath, JSON.stringify(ak, null, 2), 'utf8');
  console.log(`[1/4] Updated ETS2024/answer_keys.json (${akChanged} Reading keys corrected).`);

  // Also keep ETS2024/answer_keys.md in sync
  const akMdPath = path.join(ETS2024_DIR, 'answer_keys.md');
  if (fs.existsSync(akMdPath)) {
    const mdRaw = fs.readFileSync(akMdPath, 'utf8');
    const headerEnd = mdRaw.indexOf('|---|---|---|---|');
    if (headerEnd !== -1) {
      const header = mdRaw.slice(0, headerEnd + '|---|---|---|---|'.length);
      const rows = ak.keys.map((r) => `| ${r.test} | ${r.q} | ${r.part} | ${r.answer} |`);
      fs.writeFileSync(akMdPath, `${header}\n${rows.join('\n')}\n`, 'utf8');
      console.log('[1b/4] Updated ETS2024/answer_keys.md.');
    }
  }

  // 2. Fix all 10 reading.json files & collect repaired Part 5/6 items by ID
  const repairedById = new Map();
  let totalReadingUpdated = 0;
  let totalReadingChanged = 0;

  for (let t = 1; t <= 10; t++) {
    const pad = String(t).padStart(2, '0');
    const rPath = path.join(ETS2024_DIR, `Test_${pad}`, 'reading.json');
    const rJson = JSON.parse(fs.readFileSync(rPath, 'utf8'));

    for (const q of rJson.questions || []) {
      const trueAns = ak.keys.find((k) => k.test === t && k.q === q.number)?.answer;
      if (!trueAns) continue;
      const changed = repairQuestionForNewAnswer(q, trueAns);
      totalReadingUpdated += 1;
      if (changed) totalReadingChanged += 1;
      if (q.part === 5 || q.part === 6) {
        repairedById.set(q.id, q);
      }
    }

    fs.writeFileSync(rPath, JSON.stringify(rJson, null, 2), 'utf8');
  }
  console.log(`[2/4] Updated ETS2024/Test_01..10/reading.json (${totalReadingChanged}/${totalReadingUpdated} questions had answers changed).`);

  // 3. Propagate repaired ETS2024 Part 5/6 items into BOTH master JSON files
  const master = JSON.parse(fs.readFileSync(MASTER_PATHS[0], 'utf8').replace(/^\uFEFF/, ''));
  let masterSynced = 0;
  let masterChanged = 0;

  for (const q of master.part5_part6_grammar_bank || []) {
    const repaired = repairedById.get(q.id);
    if (!repaired) continue;
    const changed = repairQuestionForNewAnswer(q, repaired.correct_answer);
    masterSynced += 1;
    if (changed) masterChanged += 1;
  }

  const serializedMaster = JSON.stringify(master, null, 2);
  for (const p of MASTER_PATHS) {
    fs.writeFileSync(p, serializedMaster, 'utf8');
  }
  console.log(`[3/4] Synced ${masterSynced} ETS2024 items (${masterChanged} changed) across ${MASTER_PATHS.length} master JSON files.`);
  console.log('[4/4] Done! Next: run recalibrate-difficulty.mjs --apply, ingest-and-validate-corpus.mjs --sync, and sync-recalibrated-priors.mjs.');
}

main();
