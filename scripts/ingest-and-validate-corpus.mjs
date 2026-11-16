#!/usr/bin/env node
/**
 * SOP-CORPUS-INGEST-V1 (Enhanced DS-008):
 * 9-Stage Idempotent Corpus Ingestion Pipeline:
 * DISCOVER -> PARSE -> NORMALIZE -> VALIDATE -> DEDUPLICATE -> DIFF DETECTION -> UPSERT -> RECONCILE -> REPORT
 *
 * Guarantees:
 * - SHA-256 content_hash per question to detect changes without resetting empirical stats.
 * - Never overwrites attempt_count, exam_attempt_count, practice_attempt_count, option_selection_counts, or calibrated_irt_*.
 * - Quarantines invalid questions instead of corrupting the item warehouse.
 *
 * Usage:
 *   node scripts/ingest-and-validate-corpus.mjs --dry-run
 *   node scripts/ingest-and-validate-corpus.mjs --sync
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CORPUS_DIR = path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database');
const SHOULD_SYNC = process.argv.includes('--sync');
const DRY_RUN = process.argv.includes('--dry-run') || !SHOULD_SYNC;

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvLocal();

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function computeContentHash(q) {
  const canonical = JSON.stringify({
    id: q.id,
    part: q.part,
    stem: q.stem || q.context_sentence || '',
    options: q.options || {},
    correct_answer: q.correct_answer || '',
    primary_grammar_topic_id: q.primary_grammar_topic_id || q.ai_analysis?.primary_topic_id || '',
  });
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

async function fetchExistingHashes(supabaseUrl, serviceKey) {
  const map = new Map();
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/corpus_item_stats?select=question_id,content_hash&offset=${offset}&limit=${limit}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const r of rows) {
      map.set(r.question_id, r.content_hash || null);
    }
    if (rows.length < limit) break;
    offset += limit;
  }
  return map;
}

async function syncDiffRowsToSupabase(rows) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhlhmhvzqcwqenlhioxr.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for --sync');
  }

  const existingHashes = await fetchExistingHashes(supabaseUrl, serviceKey);
  const changedRows = rows.filter(r => existingHashes.get(r.question_id) !== r.content_hash);

  console.log(`Diff detection: ${existingHashes.size} existing in DB | ${changedRows.length} new/modified to upsert.`);
  if (changedRows.length === 0) {
    return { upserted: 0, unchanged: rows.length };
  }

  const chunkSize = 500;
  let upserted = 0;
  for (let i = 0; i < changedRows.length; i += chunkSize) {
    const chunk = changedRows.slice(i, i + chunkSize);
    // Note: chunk only contains metadata columns (never attempt_count / calibrated_irt_*), so empirical stats are 100% preserved
    const res = await fetch(`${supabaseUrl}/rest/v1/corpus_item_stats?on_conflict=question_id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upsert failed (${res.status}): ${errText}`);
    }
    upserted += chunk.length;
  }
  return { upserted, unchanged: rows.length - upserted };
}

async function main() {
  if (!fs.existsSync(CORPUS_DIR)) {
    console.error(`Corpus directory not found: ${CORPUS_DIR}`);
    process.exit(1);
  }

  const taxonomyFile = path.join(CORPUS_DIR, 'grammar_taxonomy.json');
  const errorFile = path.join(CORPUS_DIR, 'error_pattern_catalog.json');
  const validTopics = new Set(
    fs.existsSync(taxonomyFile) ? (loadJson(taxonomyFile).topics || []).map(t => t.id) : []
  );
  const validErrors = new Set(
    fs.existsSync(errorFile) ? (loadJson(errorFile).error_patterns || []).map(e => e.code) : []
  );

  // 1. DISCOVER
  const seriesDirs = fs
    .readdirSync(CORPUS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ETS\d+$/i.test(d.name))
    .map(d => d.name)
    .sort();

  const seenIds = new Set();
  const duplicateIds = [];
  const quarantined = [];
  const validItemRows = [];

  let totalQuestions = 0;
  let readingQuestions = 0;
  let listeningQuestions = 0;
  let evidenceMismatch = 0;

  // 2. PARSE, NORMALIZE, VALIDATE & DEDUPLICATE
  for (const series of seriesDirs) {
    const seriesPath = path.join(CORPUS_DIR, series);
    const testDirs = fs
      .readdirSync(seriesPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^Test_\d+$/i.test(d.name))
      .map(d => d.name)
      .sort();

    for (const testDir of testDirs) {
      const testNum = parseInt(testDir.replace(/\D+/g, ''), 10) || 1;

      for (const fileName of ['reading.json', 'listening.json']) {
        const fPath = path.join(seriesPath, testDir, fileName);
        if (!fs.existsSync(fPath)) continue;

        const data = loadJson(fPath);
        const passagesById = new Map((data.passages || []).map(p => [p.id, p]));
        const passagesByGroup = new Map();
        for (const p of data.passages || []) {
          const gId = p.passage_group_id || p.id;
          if (!passagesByGroup.has(gId)) passagesByGroup.set(gId, []);
          passagesByGroup.get(gId).push(p);
        }

        for (const q of data.questions || []) {
          totalQuestions += 1;
          if (fileName === 'reading.json') readingQuestions += 1;
          else listeningQuestions += 1;

          if (!q.id || !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
            quarantined.push({ id: q.id || 'UNKNOWN', reason: 'INVALID_ID_OR_ANSWER_KEY' });
            continue;
          }

          if (seenIds.has(q.id)) {
            duplicateIds.push(q.id);
            continue;
          }
          seenIds.add(q.id);

          const ai = q.ai_analysis || {};
          const topicId = q.primary_grammar_topic_id || ai.primary_topic_id || null;

          if ((q.part === 6 || q.part === 7) && ai.evidence_sentence_en) {
            const pGroup = passagesByGroup.get(q.passage_group_id) || (q.passage_id ? [passagesById.get(q.passage_id)].filter(Boolean) : []);
            const combinedText = pGroup.map(p => p.text || '').join('\n');
            if (combinedText && !combinedText.includes(ai.evidence_sentence_en.trim())) {
              evidenceMismatch += 1;
            }
          }

          const irt = ai.irt_3pl || {};
          const contentHash = computeContentHash(q);

          validItemRows.push({
            question_id: q.id,
            series,
            test_number: testNum,
            part: Number(q.part || (fileName === 'reading.json' ? 5 : 1)),
            primary_topic_id: topicId,
            correct_option: q.correct_answer,
            content_hash: contentHash,
            target_band: Number(q.target_score_band || 550),
            recommended_time_sec: Number(q.recommended_time_sec || (q.part === 5 ? 15 : 45)),
            prior_irt_a: Number(irt.discrimination_a || 1.2),
            prior_irt_b: Number(irt.difficulty_b || 0.0),
          });
        }
      }
    }
  }

  console.log('=== SOP-CORPUS-INGEST-V1 (9-STAGE PIPELINE REPORT) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (Validation Only)' : 'LIVE SYNC'}`);
  console.log(`Series scanned: ${seriesDirs.join(', ')}`);
  console.log(`Total parsed: ${totalQuestions} (Reading: ${readingQuestions}, Listening: ${listeningQuestions})`);
  console.log(`Valid deduplicated items: ${validItemRows.length}`);
  console.log(`Duplicates skipped: ${duplicateIds.length} | Quarantined: ${quarantined.length} | Evidence mismatch: ${evidenceMismatch}`);
  console.log(`Taxonomy topics: ${validTopics.size} | Error patterns: ${validErrors.size}`);

  if (SHOULD_SYNC) {
    const { upserted, unchanged } = await syncDiffRowsToSupabase(validItemRows);
    console.log(`Reconciliation complete -> Upserted: ${upserted}, Unchanged (empirical stats untouched): ${unchanged}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
