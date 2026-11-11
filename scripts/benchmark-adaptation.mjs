#!/usr/bin/env node
/**
 * Milestone 2.5.13: Pedagogical Adaptation & Acyclic Knowledge Graph Verification
 * Benchmarks adaptExplanationForLevel() over 1,000 sample questions across all 4 levels (< 1ms/item)
 * and verifies validateAcyclicGraph() + findPrerequisites() (< 5ms).
 */

import fs from "node:fs";
import path from "node:path";
import { DIFFICULTY_LEVELS, adaptExplanationForLevel, validateExplanation } from "../lib/explanation/explanation.schema.js";
import { migrateQuestionExplanation } from "../lib/explanation/explanation.migrator.js";
import { validateAcyclicGraph, findPrerequisites, KNOWLEDGE_GRAPH } from "../lib/knowledge/knowledge-graph.js";

const quizPath = path.resolve(process.cwd(), "data/ui/quiz_bank.json");
const quizData = JSON.parse(fs.readFileSync(quizPath, "utf-8"));
const sampleQuestions = quizData.topics.flatMap((t) => t.questions || []).slice(0, 1000);
const levels = Object.values(DIFFICULTY_LEVELS);

const tGraph0 = performance.now();
const dagCheck = validateAcyclicGraph();
const prereqSample = findPrerequisites("CLAUSE_CONDITION");
const tGraphMs = performance.now() - tGraph0;

if (!dagCheck.isAcyclic) {
  throw new Error(`Knowledge graph cycle detected: ${dagCheck.cycleNodes.join(", ")}`);
}

const baseExpls = sampleQuestions.map((q) => migrateQuestionExplanation(q, DIFFICULTY_LEVELS.INTERMEDIATE));
for (const e of baseExpls) {
  const { isValid, errors } = validateExplanation(e);
  if (!isValid) throw new Error(`Schema error on ${e.question_id}: ${errors.join("; ")}`);
}

const t0 = performance.now();
let totalOps = 0;
for (const expl of baseExpls) {
  for (const lvl of levels) {
    const adapted = adaptExplanationForLevel(expl, lvl);
    if (!adapted || adapted.difficulty !== lvl) {
      throw new Error(`Adaptation failed for ${expl.question_id} level=${lvl}`);
    }
    totalOps += 1;
  }
}
const elapsedMs = performance.now() - t0;
const avgPerOpMs = elapsedMs / totalOps;

console.log(
  JSON.stringify(
    {
      graphNodes: KNOWLEDGE_GRAPH.nodeList.length,
      graphEdges: KNOWLEDGE_GRAPH.edges.length,
      isAcyclic: dagCheck.isAcyclic,
      clauseConditionPrereqs: prereqSample.map((p) => p.id),
      graphCheckMs: Number(tGraphMs.toFixed(3)),
      questionsTested: sampleQuestions.length,
      totalAdaptations: totalOps,
      totalElapsedMs: Number(elapsedMs.toFixed(2)),
      avgMsPerAdaptation: Number(avgPerOpMs.toFixed(4)),
    },
    null,
    2
  )
);
