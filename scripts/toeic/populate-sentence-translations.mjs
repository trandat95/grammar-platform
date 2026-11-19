import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

const PATH_DATA_TOEIC = path.join(ROOT_DIR, "data", "toeic", "ets_toeic_ai_grammar_master.json");
const PATH_ETS_CORPUS = path.join(
  ROOT_DIR,
  "ETS_Corpus_Normalized_Enriched_Database",
  "ets_toeic_ai_grammar_master.json"
);

function buildFullEnglishSentence(q) {
  const correctWord = q.options?.[q.correct_answer] || "";
  const rawBase = q.context_sentence || q.stem || "";
  return rawBase
    .replace(/-------|_____/g, correctWord)
    .replace(/^\[([^\]]+)\]\s*/, "$1 — ")
    .replace(/\s+/g, " ")
    .trim();
}

async function translateSingle(text, retries = 3) {
  const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
    text
  )}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(gtxUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const vi = data[0]
          .map((seg) => (Array.isArray(seg) && seg[0] ? seg[0] : ""))
          .join("")
          .trim();
        if (vi) return vi;
      }
    } catch (e) {
      if (attempt === retries) return "";
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  return "";
}

async function main() {
  const master = JSON.parse(fs.readFileSync(PATH_DATA_TOEIC, "utf8"));
  const bank = master.part5_part6_grammar_bank || [];

  const needTranslation = bank.filter(
    (q) => !q?.ai_analysis?.sentence_translation_vi
  );
  console.log(
    `Total questions: ${bank.length} | Need sentence_translation_vi: ${needTranslation.length}`
  );

  const CONCURRENCY = 20;
  let completed = 0;

  for (let i = 0; i < needTranslation.length; i += CONCURRENCY) {
    const chunk = needTranslation.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (q) => {
        const en = buildFullEnglishSentence(q);
        const vi = await translateSingle(en);
        if (q.ai_analysis && vi) {
          q.ai_analysis.sentence_translation_vi = vi;
        }
        completed++;
      })
    );
    if (completed % 100 === 0 || completed === needTranslation.length) {
      console.log(`Translated ${completed} / ${needTranslation.length}...`);
    }
  }

  const missingAfter = bank.filter(
    (q) => !q?.ai_analysis?.sentence_translation_vi
  ).length;
  console.log(`Missing translations after run: ${missingAfter}`);

  const serialized = JSON.stringify(master, null, 2) + "\n";
  fs.writeFileSync(PATH_DATA_TOEIC, serialized, "utf8");
  fs.writeFileSync(PATH_ETS_CORPUS, serialized, "utf8");
  console.log("Saved enriched corpus to both directories.");
}

main();
