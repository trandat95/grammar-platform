import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  generateM4RcDetailQuestions,
  generateM4RcInferenceQuestions,
} from "./m4_items_part1.mjs";

import {
  generateM4LcPart12Questions,
  generateM4LcPart34Questions,
} from "./m4_items_part2.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

const PATH_DATA_TOEIC = path.join(ROOT_DIR, "data", "toeic", "ets_toeic_ai_grammar_master.json");
const PATH_ETS_CORPUS = path.join(
  ROOT_DIR,
  "ETS_Corpus_Normalized_Enriched_Database",
  "ets_toeic_ai_grammar_master.json"
);

const M4_TOPICS = new Set([
  "RC_P7_DETAIL_MAIN",
  "RC_P7_INFERENCE_CROSS",
  "LC_P1_P2_DIRECT_INDIRECT",
  "LC_P3_P4_CONVERSATION_TALK",
]);

function main() {
  const raw = fs.readFileSync(PATH_DATA_TOEIC, "utf8");
  const master = JSON.parse(raw);

  const existingQuestions = master.part5_part6_grammar_bank || [];

  // Keep all 920 baseline items + M2/M3 EXP2026 items (filter out only M4 EXP2026 items for idempotency)
  const retained = existingQuestions.filter((q) => {
    if (/^(ETS2024|ETS2026)_/.test(q.id)) return true;
    const topicId = q?.primary_grammar_topic_id;
    return !M4_TOPICS.has(topicId);
  });

  const m4Items = [
    ...generateM4RcDetailQuestions(),
    ...generateM4RcInferenceQuestions(),
    ...generateM4LcPart12Questions(),
    ...generateM4LcPart34Questions(),
  ];

  console.log(`Retained baseline + M2 + M3 items: ${retained.length}`);
  console.log(`Generated M4 academic items:       ${m4Items.length}`);

  master.part5_part6_grammar_bank = [...retained, ...m4Items];

  if (master.metadata && typeof master.metadata === "object") {
    master.metadata.total_part5_part6_questions = master.part5_part6_grammar_bank.length;
    master.metadata.m4_expansion_applied_at = "2026-11-19";
  }

  const serialized = JSON.stringify(master, null, 2) + "\n";
  fs.writeFileSync(PATH_DATA_TOEIC, serialized, "utf8");
  fs.writeFileSync(PATH_ETS_CORPUS, serialized, "utf8");

  console.log("\n=== MILESTONE M4 TOPIC DISTRIBUTION ===");
  for (const topicId of M4_TOPICS) {
    const topicQs = master.part5_part6_grammar_bank.filter(
      (q) => q?.primary_grammar_topic_id === topicId
    );
    const baselineCount = topicQs.filter((q) => /^(ETS2024|ETS2026)_/.test(q.id)).length;
    const expCount = topicQs.filter((q) => /^EXP2026_/.test(q.id)).length;
    const d1 = topicQs.filter((q) => q?.difficulty_level === 1).length;
    const d2 = topicQs.filter((q) => q?.difficulty_level === 2).length;
    const d3 = topicQs.filter((q) => q?.difficulty_level === 3).length;
    console.log(
      `${topicId.padEnd(28)} | Total: ${String(topicQs.length).padStart(2)} (Base: ${String(
        baselineCount
      ).padStart(2)} + EXP: ${String(expCount).padStart(2)}) | D1:${String(d1).padStart(
        2
      )} D2:${String(d2).padStart(2)} D3:${String(d3).padStart(2)}`
    );
  }
  console.log(`\nTotal corpus size: ${master.part5_part6_grammar_bank.length} questions`);
}

main();
