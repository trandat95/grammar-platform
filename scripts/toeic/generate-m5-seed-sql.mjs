import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

const PATH_DATA_TOEIC = path.join(ROOT_DIR, "data", "toeic", "ets_toeic_ai_grammar_master.json");
const OUT_SQL = path.join(__dirname, "seed_m5_corpus_item_stats.sql");

function esc(str) {
  return String(str || "").replace(/'/g, "''");
}

function main() {
  const master = JSON.parse(fs.readFileSync(PATH_DATA_TOEIC, "utf8"));
  const exp = (master.part5_part6_grammar_bank || []).filter((q) =>
    String(q.id).startsWith("EXP2026_")
  );

  const values = exp.map((q) => {
    const id = esc(q.id);
    const part = Number(q.part || 5);
    const topic = esc(q.primary_grammar_topic_id);
    const band = Number(q.target_score_band || 550);
    const timeSec = Number(q.recommended_time_sec || 15);
    const diff = Number(q.difficulty_level || 2);
    const irtB = diff === 1 ? -0.9 : diff === 2 ? 0.0 : 0.9;
    const corr = esc(q.correct_answer || "A");
    return `('${id}', 'EXP2026', 1, ${part}, '${topic}', ${band}, ${timeSec}, 1.250, ${irtB}, 1.250, ${irtB}, '${corr}')`;
  });

  const sql = `INSERT INTO public.corpus_item_stats (
  question_id, series, test_number, part, primary_topic_id, target_band, recommended_time_sec,
  prior_irt_a, prior_irt_b, calibrated_irt_a, calibrated_irt_b, correct_option
) VALUES
${values.join(",\n")}
ON CONFLICT (question_id) DO UPDATE SET
  part = EXCLUDED.part,
  primary_topic_id = EXCLUDED.primary_topic_id,
  target_band = EXCLUDED.target_band,
  recommended_time_sec = EXCLUDED.recommended_time_sec,
  correct_option = EXCLUDED.correct_option,
  updated_at = now();
`;

  fs.writeFileSync(OUT_SQL, sql, "utf8");
  console.log(`Generated ${OUT_SQL} for ${exp.length} items (${sql.length} bytes).`);
}

main();
