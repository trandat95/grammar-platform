#!/usr/bin/env node
/**
 * Idempotent dependency-free seed script for 10 TOEIC Modules, 50 Topics & 1,000 Flashcards
 * into Supabase PostgreSQL via PostgREST (`toeic_modules`, `toeic_topics`, `toeic_flashcards`).
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

async function upsertTable(table, rows, conflictCol) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictCol)}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upsert ${table} failed (${res.status}): ${errText}`);
  }
}

const fcPath = path.join(process.cwd(), "data", "toeic", "flashcards_lite.json");
const raw = JSON.parse(fs.readFileSync(fcPath, "utf8"));

const moduleRows = raw.modules.map((m) => ({
  module_id: m.module_id,
  module_name_en: m.module_name_en,
  module_name_vi: m.module_name_vi,
  topic_count: m.topic_count,
  word_count: m.word_count,
  color_hex: m.color_hex,
}));

const topicRows = raw.topics.map((t) => ({
  topic_id: t.topic_id,
  module_id: t.module_id,
  topic_name_en: t.topic_name_en,
  topic_name_vi: t.topic_name_vi,
  word_count: t.word_count,
  source_title: t.source_title,
  source_url: t.source_url,
}));

const flashcardRows = raw.flashcards.map((c) => ({
  id: c.id,
  code: c.code,
  module_id: c.module_id,
  topic_id: c.topic_id,
  word: c.word,
  part_of_speech: c.part_of_speech,
  ipa_us: c.ipa_us,
  meaning_vi: c.meaning_vi,
  definition_en: c.definition_en,
  collocation: c.collocation,
  example_en: c.example_en,
  example_vi: c.example_vi,
  cloze_sentence_en: c.cloze_sentence_en,
  cefr_level: c.cefr_level,
  toeic_score_band: c.toeic_score_band,
  synonyms: c.synonyms_str || (Array.isArray(c.synonyms) ? c.synonyms.join(", ") : ""),
  visual_scene_keywords: c.visual_media?.visual_scene_keywords || "",
  cdn_thumbnail_url: c.visual_media?.cdn_thumbnail_url || "",
  pexels_search_endpoint: c.visual_media?.pexels_search_endpoint || "",
  ai_generation_prompt: c.visual_media?.ai_generation_prompt || "",
  audio_google_tts_url: c.audio_google_tts_url || "",
  initial_difficulty: Number(c.spaced_repetition_defaults?.initial_difficulty ?? 5.0),
  source_title: c.source_title || "",
  source_url: c.source_url || "",
}));

await upsertTable("toeic_modules", moduleRows, "module_id");
await upsertTable("toeic_topics", topicRows, "topic_id");

const BATCH = 200;
for (let i = 0; i < flashcardRows.length; i += BATCH) {
  await upsertTable("toeic_flashcards", flashcardRows.slice(i, i + BATCH), "id");
}

console.log(
  `Seeded Supabase successfully: ${moduleRows.length} modules, ${topicRows.length} topics, ${flashcardRows.length} flashcards.`
);
