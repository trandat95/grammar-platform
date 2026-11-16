#!/usr/bin/env node
/**
 * SOP-CORPUS-INGEST-V1: Universal TOEIC Corpus Validator & Item Stats Seeder
 * Usage:
 *   node scripts/ingest-and-validate-corpus.mjs          # Validate all series/tests
 *   node scripts/ingest-and-validate-corpus.mjs --sync   # Validate + upsert into public.corpus_item_stats
 */

import fs from 'fs';
import path from 'path';

const CORPUS_DIR = path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database');
const SHOULD_SYNC = process.argv.includes('--sync');

// Load .env.local if present and env vars are unset
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

async function syncBatchToSupabase(rows) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhlhmhvzqcwqenlhioxr.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for --sync');
  }

  const chunkSize = 500;
  let totalSynced = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
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
    totalSynced += chunk.length;
  }
  return totalSynced;
}

async function main() {
  if (!fs.existsSync(CORPUS_DIR)) {
    console.error(`Corpus directory not found: ${CORPUS_DIR}`);
    process.exit(1);
  }

  // Load valid taxonomy & error codes if present
  const taxonomyFile = path.join(CORPUS_DIR, 'grammar_taxonomy.json');
  const errorFile = path.join(CORPUS_DIR, 'error_pattern_catalog.json');
  const validTopics = new Set(
    fs.existsSync(taxonomyFile) ? (loadJson(taxonomyFile).topics || []).map(t => t.id) : []
  );
  const validErrors = new Set(
    fs.existsSync(errorFile) ? (loadJson(errorFile).error_patterns || []).map(e => e.code) : []
  );

  const seriesDirs = fs
    .readdirSync(CORPUS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ETS\d+$/i.test(d.name))
    .map(d => d.name)
    .sort();

  let totalQuestions = 0;
  let readingQuestions = 0;
  let listeningQuestions = 0;
  let missingOptionAnalysis = 0;
  let missingTopic = 0;
  let evidenceMismatch = 0;
  let missingTwins = 0;
  const itemStatRows = [];

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

          const ai = q.ai_analysis || {};
          const topicId = q.primary_grammar_topic_id || ai.primary_topic_id || null;
          if (!topicId || (validTopics.size > 0 && !validTopics.has(topicId) && q.part >= 5)) {
            missingTopic += 1;
          }

          if (!ai.option_deep_analysis || !ai.option_deep_analysis[q.correct_answer]) {
            missingOptionAnalysis += 1;
          }

          if (!Array.isArray(ai.similar_question_ids) || ai.similar_question_ids.length === 0) {
            missingTwins += 1;
          }

          if ((q.part === 6 || q.part === 7) && ai.evidence_sentence_en) {
            const pGroup = passagesByGroup.get(q.passage_group_id) || (q.passage_id ? [passagesById.get(q.passage_id)].filter(Boolean) : []);
            const combinedText = pGroup.map(p => p.text || '').join('\n');
            if (combinedText && !combinedText.includes(ai.evidence_sentence_en.trim())) {
              evidenceMismatch += 1;
            }
          }

          const irt = ai.irt_3pl || {};
          itemStatRows.push({
            question_id: q.id,
            series,
            test_number: testNum,
            part: Number(q.part || (fileName === 'reading.json' ? 5 : 1)),
            primary_topic_id: topicId,
            target_band: Number(q.target_score_band || 550),
            recommended_time_sec: Number(q.recommended_time_sec || (q.part === 5 ? 15 : 45)),
            prior_irt_a: Number(irt.discrimination_a || 1.2),
            prior_irt_b: Number(irt.difficulty_b || 0.0),
            calibrated_irt_a: Number(irt.discrimination_a || 1.2),
            calibrated_irt_b: Number(irt.difficulty_b || 0.0),
          });
        }
      }
    }
  }

  console.log('=== SOP-CORPUS-INGEST-V1 QA REPORT ===');
  console.log(`Series scanned: ${seriesDirs.join(', ')}`);
  console.log(`Total questions: ${totalQuestions} (Reading: ${readingQuestions}, Listening: ${listeningQuestions})`);
  console.log(`Valid taxonomy topics: ${validTopics.size} | Valid error patterns: ${validErrors.size}`);
  console.log(`Warnings -> missingTopic: ${missingTopic}, missingOptionAnalysis: ${missingOptionAnalysis}, missingTwins: ${missingTwins}, evidenceMismatch: ${evidenceMismatch}`);

  if (SHOULD_SYNC) {
    console.log(`\nSyncing ${itemStatRows.length} items to public.corpus_item_stats...`);
    const synced = await syncBatchToSupabase(itemStatRows);
    console.log(`Synced ${synced} rows to public.corpus_item_stats successfully.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
