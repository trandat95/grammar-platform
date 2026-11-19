import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("d:/grammarproject/grammar-platform");
const dirA = path.join(root, "ETS_Corpus_Normalized_Enriched_Database");
const dirB = path.join(root, "data", "toeic");
const snapshotPath = path.join(dirB, "baseline_920_sha256.json");

const VALID_OPTIONS = ["A", "B", "C", "D"];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hashQuestion(q) {
  return crypto.createHash("sha256").update(JSON.stringify(q)).digest("hex");
}

function runValidation({ writeSnapshot = false } = {}) {
  const masterA = path.join(dirA, "ets_toeic_ai_grammar_master.json");
  const masterB = path.join(dirB, "ets_toeic_ai_grammar_master.json");
  const taxonomyFile = path.join(dirB, "grammar_taxonomy.json");
  const errorFile = path.join(dirB, "error_pattern_catalog.json");

  const errors = [];
  const warnings = [];

  // Gate 0: Dual-directory byte-for-byte sync check
  const bufA = fs.readFileSync(masterA);
  const bufB = fs.readFileSync(masterB);
  const shaA = crypto.createHash("sha256").update(bufA).digest("hex");
  const shaB = crypto.createHash("sha256").update(bufB).digest("hex");
  if (shaA !== shaB) {
    errors.push(`[GATE-0 SYNC] ETS_Corpus_Normalized_Enriched_Database (${bufA.length}B) != data/toeic (${bufB.length}B)`);
  }

  const master = JSON.parse(bufB.toString("utf8"));
  const taxonomy = loadJson(taxonomyFile);
  const errorCatalog = loadJson(errorFile);

  const validTopicIds = new Set((taxonomy.topics || []).map((t) => t.id));
  const validErrorCodes = new Set((errorCatalog.error_patterns || []).map((e) => e.code));
  const bank = master.part5_part6_grammar_bank || [];

  const allIds = new Set();
  const allSentences = new Map();
  const idToQuestion = new Map();
  for (const q of bank) {
    if (allIds.has(q.id)) {
      errors.push(`[GATE-2 DUPLICATE_ID] Duplicate question ID: ${q.id}`);
    }
    allIds.add(q.id);
    idToQuestion.set(q.id, q);

    const normSent = String(q.context_sentence || q.stem || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (normSent && /^EXP2026_/.test(q.id)) {
      if (allSentences.has(normSent)) {
        errors.push(`[GATE-8 DUP_SENTENCE] ${q.id} duplicates sentence of ${allSentences.get(normSent)}`);
      }
      allSentences.set(normSent, q.id);
    }
  }

  for (const q of bank) {
    const qId = q.id || "UNKNOWN_ID";

    // Gate 2: ID namespace check
    if (!/^(ETS2024|ETS2026)_T\d{2}_Q\d{3}$/.test(qId) && !/^EXP2026_[A-Z0-9_]+_Q\d{3}$/.test(qId)) {
      errors.push(`[GATE-2 ID_FORMAT] ${qId}: Invalid ID namespace format`);
    }

    // Gate 4: Options & single correct_answer check
    if (!VALID_OPTIONS.includes(q.correct_answer)) {
      errors.push(`[GATE-4 CORRECT_ANS] ${qId}: Invalid correct_answer '${q.correct_answer}'`);
    }
    const optTexts = new Set();
    for (const k of VALID_OPTIONS) {
      const val = String(q.options?.[k] || "").trim();
      if (!val) {
        errors.push(`[GATE-4 MISSING_OPT] ${qId}: Missing option ${k}`);
      } else if (optTexts.has(val.toLowerCase())) {
        errors.push(`[GATE-4 DUP_OPT_TEXT] ${qId}: Duplicate option text '${val}'`);
      }
      optTexts.add(val.toLowerCase());
    }

    // Gate 5: Foreign key checks (Taxonomy & Error Patterns)
    if (!validTopicIds.has(q.primary_grammar_topic_id)) {
      errors.push(`[GATE-5 TOPIC_FK] ${qId}: Invalid primary_grammar_topic_id '${q.primary_grammar_topic_id}'`);
    }

    const ai = q.ai_analysis;
    if (!ai) {
      errors.push(`[GATE-3 MISSING_AI] ${qId}: Missing ai_analysis object`);
      continue;
    }

    if (ai.primary_topic_id !== q.primary_grammar_topic_id) {
      errors.push(`[GATE-5 TOPIC_MISMATCH] ${qId}: ai_analysis.primary_topic_id '${ai.primary_topic_id}' != '${q.primary_grammar_topic_id}'`);
    }

    // Gate 3 & Gate 8: X-Ray context & Academic Accuracy checks
    const xray = ai.sentence_xray;
    if (!xray) {
      errors.push(`[GATE-3 MISSING_XRAY] ${qId}: Missing ai_analysis.sentence_xray`);
    } else {
      const ctx = String(q.context_sentence || q.stem || "").trim();
      if (!ctx.includes("-------") && !ctx.includes("_____")) {
        errors.push(`[GATE-3 BLANK_MARKER] ${qId}: context_sentence missing blank marker '-------'`);
      }
      if (/^EXP2026_/.test(qId)) {
        const left = String(xray.left_context || "").trim();
        const right = String(xray.right_context || "").trim();
        const rebuilt = [left, "-------", right].filter(Boolean).join(" ").replace(/\s+([.,;?!])/g, "$1").replace(/\s+/g, " ").trim();
        const normCtx = ctx.replace(/\s+/g, " ").trim();
        if (rebuilt !== normCtx) {
          errors.push(`[GATE-8 XRAY_REBUILD] ${qId}: Rebuilt '${rebuilt}' != context_sentence '${normCtx}'`);
        }
        const leftAnch = String(xray.left_anchor_words || "").trim();
        if (leftAnch && left && !left.toLowerCase().includes(leftAnch.toLowerCase())) {
          errors.push(`[GATE-8 LEFT_ANCHOR] ${qId}: left_anchor_words '${leftAnch}' not found in left_context '${left}'`);
        }
        const rightAnch = String(xray.right_anchor_words || "").trim();
        if (rightAnch && right && !right.toLowerCase().includes(rightAnch.toLowerCase())) {
          errors.push(`[GATE-8 RIGHT_ANCHOR] ${qId}: right_anchor_words '${rightAnch}' not found in right_context '${right}'`);
        }
        const corrWord = String(q.options?.[q.correct_answer] || "").trim();
        const expVi = String(q.explanation_vi || "");
        if (!expVi.includes(`(${q.correct_answer})`) || !expVi.toLowerCase().includes(corrWord.toLowerCase())) {
          errors.push(`[GATE-8 EXPLANATION_CITE] ${qId}: explanation_vi must cite (${q.correct_answer}) and '${corrWord}'`);
        }
        for (const k of VALID_OPTIONS) {
          if (k !== q.correct_answer) {
            const distText = String(q.distractor_analysis?.[k] || "").trim();
            if (!distText || distText.length < 15) {
              errors.push(`[GATE-8 DISTRACTOR_ANALYSIS] ${qId}: Missing or too short distractor_analysis.${k}`);
            }
          }
        }
      }
    }

    // Gate 4 & 5 & 6: option_deep_analysis & word_family_matrix consistency
    const oda = ai.option_deep_analysis || {};
    let correctCountOda = 0;
    for (const k of VALID_OPTIONS) {
      const entry = oda[k];
      if (!entry) {
        errors.push(`[GATE-4 MISSING_ODA] ${qId}: Missing option_deep_analysis.${k}`);
        continue;
      }
      if (entry.is_correct) {
        correctCountOda++;
        if (k !== q.correct_answer) {
          errors.push(`[GATE-6 ODA_CONTRADICTION] ${qId}: option_deep_analysis.${k}.is_correct=true but correct_answer=${q.correct_answer}`);
        }
      } else {
        if (k === q.correct_answer) {
          errors.push(`[GATE-6 ODA_CONTRADICTION] ${qId}: option_deep_analysis.${k}.is_correct=false but correct_answer=${q.correct_answer}`);
        }
        if (entry.error_pattern_code && !validErrorCodes.has(entry.error_pattern_code)) {
          errors.push(`[GATE-5 ERR_CODE_FK] ${qId}: Invalid error_pattern_code '${entry.error_pattern_code}' on option ${k}`);
        }
      }
    }
    if (correctCountOda !== 1) {
      errors.push(`[GATE-4 ODA_CORRECT_COUNT] ${qId}: Expected exactly 1 correct option in option_deep_analysis, found ${correctCountOda}`);
    }

    if (Array.isArray(ai.word_family_matrix) && ai.word_family_matrix.length > 0) {
      for (const item of ai.word_family_matrix) {
        if ( Boolean(item.is_correct) !== (item.option === q.correct_answer) ) {
          errors.push(`[GATE-6 WFM_CONTRADICTION] ${qId}: word_family_matrix option ${item.option} is_correct=${item.is_correct} != (${q.correct_answer})`);
        }
      }
    }

    // Gate 7: Twin-Question graph integrity
    if (Array.isArray(ai.similar_question_ids)) {
      for (const simId of ai.similar_question_ids) {
        if (!idToQuestion.has(simId)) {
          warnings.push(`[GATE-7 TWIN_REF] ${qId}: similar_question_id '${simId}' not in part5_part6_grammar_bank`);
        }
      }
    }
  }

  // Gate 1: Baseline 920 immutability snapshot check
  const baselineQuestions = bank.filter((q) => /^(ETS2024|ETS2026)_/.test(q.id));
  if (baselineQuestions.length !== 920) {
    errors.push(`[GATE-1 BASELINE_COUNT] Expected 920 baseline ETS questions, found ${baselineQuestions.length}`);
  }

  const currentHashes = {};
  for (const q of baselineQuestions) {
    currentHashes[q.id] = hashQuestion(q);
  }
  const aggregateBaselineHash = crypto
    .createHash("sha256")
    .update(Object.entries(currentHashes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join("\n"))
    .digest("hex");

  if (writeSnapshot) {
    fs.writeFileSync(
      snapshotPath,
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          baseline_count: baselineQuestions.length,
          aggregate_sha256: aggregateBaselineHash,
          question_hashes: currentHashes,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`[SNAPSHOT WRITTEN] ${snapshotPath} (aggregate_sha256=${aggregateBaselineHash})`);
  } else if (fs.existsSync(snapshotPath)) {
    const snap = loadJson(snapshotPath);
    if (snap.aggregate_sha256 !== aggregateBaselineHash) {
      let mutated = [];
      for (const [id, h] of Object.entries(snap.question_hashes || {})) {
        if (currentHashes[id] !== h) mutated.push(id);
      }
      errors.push(`[GATE-1 IMMUTABILITY_BREACH] Baseline 920 questions modified! Mutated IDs: ${mutated.join(", ")}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        totalQuestions: bank.length,
        baselineEtsQuestions: baselineQuestions.length,
        expansionQuestions: bank.length - baselineQuestions.length,
        aggregateBaselineHash,
        errorCount: errors.length,
        warningCount: warnings.length,
        errors: errors.slice(0, 30),
        warnings: warnings.slice(0, 15),
      },
      null,
      2
    )
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

const writeSnap = process.argv.includes("--write-snapshot");
runValidation({ writeSnapshot: writeSnap });
