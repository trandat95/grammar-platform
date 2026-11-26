#!/usr/bin/env node
/**
 * Prepare New TOEIC 1,000 Flashcard Corpus for Hybrid 3-Tier Delivery:
 * 1. data/toeic/flashcards_lite.json          (Server & API authoritative O(1) source)
 * 2. public/data/toeic-flashcards/manifest.json (Tiny ~95 KB index: modules, topics, slim search rows)
 * 3. public/data/toeic-flashcards/modules/M01..M10.json (Per-module ~300 KB chunks for instant load)
 * 4. public/data/toeic-flashcards/lite.json   (Full static edge JSON for IndexedDB offline sync)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_SRC =
  process.env.FLASHCARD_SRC ||
  "C:/Users/SurFace/.gemini/antigravity/brain/85dd7d55-23af-4439-9972-027c21f83c13/scratch/toeic_flashcard_suite/New_TOEIC_1000_Flashcard_Lite_Web.json";

const srcPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;
if (!fs.existsSync(srcPath)) {
  console.error("Source Lite JSON not found:", srcPath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(srcPath, "utf8"));
const modules = Array.isArray(raw.modules) ? raw.modules : [];
const topics = Array.isArray(raw.topics) ? raw.topics : [];
const flashcards = Array.isArray(raw.flashcards) ? raw.flashcards : [];

if (modules.length !== 10 || topics.length !== 50 || flashcards.length !== 1000) {
  console.error("Unexpected corpus counts:", {
    modules: modules.length,
    topics: topics.length,
    flashcards: flashcards.length,
  });
  process.exit(1);
}

const serverDir = path.join(ROOT, "data", "toeic");
const publicDir = path.join(ROOT, "public", "data", "toeic-flashcards");
const modulesDir = path.join(publicDir, "modules");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(modulesDir, { recursive: true });

// 1. Server authoritative copy (compact JSON to keep repo & Vercel trace light)
const canonicalPayload = {
  schema_version: raw.schema_version || "3.0-PRO",
  dataset_title: raw.dataset_title,
  generated_at: raw.generated_at,
  total_words: flashcards.length,
  total_modules: modules.length,
  total_topics: topics.length,
  sources: raw.sources || [],
  modules,
  topics,
  flashcards,
};

fs.writeFileSync(
  path.join(serverDir, "flashcards_lite.json"),
  JSON.stringify(canonicalPayload)
);

// 2. Full public lite.json (compact for Vercel CDN + IndexedDB offline caching)
fs.writeFileSync(
  path.join(publicDir, "lite.json"),
  JSON.stringify(canonicalPayload)
);

// 3. Per-module chunks M01..M10
for (const mod of modules) {
  const modCards = flashcards.filter((c) => c.module_id === mod.module_id);
  const modTopics = topics.filter((t) => t.module_id === mod.module_id);
  fs.writeFileSync(
    path.join(modulesDir, `${mod.module_id}.json`),
    JSON.stringify({
      module: mod,
      topics: modTopics,
      flashcards: modCards,
    })
  );
}

// 4. Tiny manifest (~90 KB) for instant global search & 10-Module/50-Topic browsing
const slimIndex = flashcards.map((c) => ({
  id: c.id,
  code: c.code,
  module_id: c.module_id,
  topic_id: c.topic_id,
  word: c.word,
  part_of_speech: c.part_of_speech,
  ipa_us: c.ipa_us,
  meaning_vi: c.meaning_vi,
  cefr_level: c.cefr_level,
  toeic_score_band: c.toeic_score_band,
  initial_difficulty: c.spaced_repetition_defaults?.initial_difficulty ?? 5.0,
}));

fs.writeFileSync(
  path.join(publicDir, "manifest.json"),
  JSON.stringify({
    schema_version: canonicalPayload.schema_version,
    total_words: flashcards.length,
    total_modules: modules.length,
    total_topics: topics.length,
    modules,
    topics,
    index: slimIndex,
  })
);

console.log(
  `Prepared TOEIC 1000 Flashcards: ${modules.length} modules, ${topics.length} topics, ${flashcards.length} cards.`
);
