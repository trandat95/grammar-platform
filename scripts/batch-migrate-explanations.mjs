#!/usr/bin/env node
/**
 * Milestone 2.5.8: CLI Batch Explanation Migration & Verification Script
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/batch-migrate-explanations.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { DIFFICULTY_LEVELS, validateExplanation } from "../lib/explanation/explanation.schema.js";
import { migrateQuestionExplanation } from "../lib/explanation/explanation.migrator.js";
import { KNOWLEDGE_GRAPH, resolveConceptForQuestion } from "../lib/knowledge/knowledge-graph.js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wtvlbbcyvtqqygtojxay.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const quizPath = path.resolve(process.cwd(), "data/ui/quiz_bank.json");
  const quizData = JSON.parse(fs.readFileSync(quizPath, "utf-8"));

  const explanations = [];
  const conceptLinks = [];
  let invalidCount = 0;

  for (const topic of quizData.topics || []) {
    for (const q of topic.questions || []) {
      const enriched = { ...q, topic_id: q.topic_id || topic.id, topic_name: q.topic_name || topic.name };
      const expl = migrateQuestionExplanation(enriched, DIFFICULTY_LEVELS.INTERMEDIATE);
      const { isValid } = validateExplanation(expl);
      if (!isValid) {
        invalidCount += 1;
        continue;
      }
      explanations.push({ ...expl, status: "published", version: 1 });
      const cid = resolveConceptForQuestion(enriched);
      const node = KNOWLEDGE_GRAPH.nodes[cid];
      conceptLinks.push({
        question_id: q.id,
        primary_topic: enriched.topic_name,
        concept_id: cid,
        concept_name: node?.title_vi || enriched.topic_name,
        lesson_id: node?.lesson_id || null,
        weight: 1.0,
      });
    }
  }

  console.log(`[Batch Migrator] Validated ${explanations.length} explanations (invalid: ${invalidCount})`);

  if (!SERVICE_KEY) {
    console.log("[Batch Migrator] SUPABASE_SERVICE_ROLE_KEY not set — dry-run validation complete.");
    return;
  }

  const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const CHUNK = 500;
  for (let i = 0; i < explanations.length; i += CHUNK) {
    const { error } = await client
      .from("explanations")
      .upsert(explanations.slice(i, i + CHUNK), { onConflict: "question_id,difficulty,version", ignoreDuplicates: true });
    if (error) throw error;
  }
  for (let i = 0; i < conceptLinks.length; i += CHUNK) {
    const { error } = await client
      .from("question_concepts")
      .upsert(conceptLinks.slice(i, i + CHUNK), { onConflict: "question_id,concept_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  console.log("[Batch Migrator] Supabase batch ingestion completed.");
}

main().catch((err) => {
  console.error("[Batch Migrator] Failed:", err);
  process.exit(1);
});
