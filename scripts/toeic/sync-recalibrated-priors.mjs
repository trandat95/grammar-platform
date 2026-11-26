#!/usr/bin/env node
/**
 * Sync recalibrated target_band & prior_irt_b (Rubric v2.1) for Part 5 & Part 6
 * items into Supabase public.corpus_item_stats.
 *
 * Safety guarantees:
 * - Only updates rows that already exist in corpus_item_stats.
 * - Never modifies attempt_count, exam_attempt_count, practice_attempt_count,
 *   option_selection_counts, or calibrated_irt_*.
 */

import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

async function fetchExistingItemIds(supabaseUrl, serviceKey) {
  const existing = new Map();
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/corpus_item_stats?select=question_id,series,test_number,part,primary_topic_id,correct_option,content_hash,recommended_time_sec,prior_irt_a,target_band,prior_irt_b&offset=${offset}&limit=${limit}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Fetch corpus_item_stats failed (${res.status}): ${await res.text()}`);
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const r of rows) {
      existing.set(r.question_id, r);
    }
    if (rows.length < limit) break;
    offset += limit;
  }
  return existing;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhlhmhvzqcwqenlhioxr.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in .env.local');
  }

  const masterPath = path.join(process.cwd(), 'data', 'toeic', 'ets_toeic_ai_grammar_master.json');
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8').replace(/^\uFEFF/, ''));
  const bank = (master.part5_part6_grammar_bank || []).filter((q) => q.part === 5 || q.part === 6);

  const existing = await fetchExistingItemIds(supabaseUrl, serviceKey);
  const toUpdate = [];

  for (const q of bank) {
    const row = existing.get(q.id);
    if (!row) continue;

    const newBand = Number(q.target_score_band);
    const newPriorB = Number(q.prior_irt_b);
    if (!Number.isFinite(newBand) || !Number.isFinite(newPriorB)) continue;

    if (Number(row.target_band) !== newBand || Math.abs(Number(row.prior_irt_b) - newPriorB) > 0.001) {
      toUpdate.push({
        question_id: row.question_id,
        series: row.series,
        test_number: row.test_number,
        part: row.part,
        primary_topic_id: row.primary_topic_id,
        correct_option: row.correct_option,
        content_hash: row.content_hash,
        recommended_time_sec: row.recommended_time_sec,
        prior_irt_a: row.prior_irt_a,
        target_band: newBand,
        prior_irt_b: newPriorB,
      });
    }
  }

  console.log(`Found ${existing.size} items in corpus_item_stats. Matched Part 5/6 needing prior update: ${toUpdate.length}.`);
  if (toUpdate.length === 0) return;

  const chunkSize = 250;
  let updated = 0;
  for (let i = 0; i < toUpdate.length; i += chunkSize) {
    const chunk = toUpdate.slice(i, i + chunkSize);
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
      throw new Error(`Upsert failed (${res.status}): ${await res.text()}`);
    }
    updated += chunk.length;
  }

  console.log(`Successfully synced ${updated} recalibrated priors to Supabase corpus_item_stats (empirical stats untouched).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
