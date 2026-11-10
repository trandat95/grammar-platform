"""
CLI entrypoint to execute STEP 6 (Sample Import) and STEP 4/5 (Full Import) and write JSON & SQLite outputs.
"""
import json
import os
from collections import Counter
from pathlib import Path
import importlib

imp_mod = importlib.import_module("importer.import")
GrammarBookImporter = imp_mod.GrammarBookImporter

MD_PATH = "/working_dir/c_8704c5ad1474dd96/user_uploaded_files/ttl=63d/user_uploaded/Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md"
BASE_DIR = Path("/working_dir/c_8704c5ad1474dd96/grammar-platform")


def run_sample_and_full():
    os.makedirs(BASE_DIR / "data" / "raw", exist_ok=True)
    os.makedirs(BASE_DIR / "data" / "normalized", exist_ok=True)
    os.makedirs(BASE_DIR / "data" / "reports", exist_ok=True)

    importer = GrammarBookImporter(MD_PATH, str(BASE_DIR / "data"))

    # 1. Run Sample Import on 3 representative chapters:
    # Chapter 1 (Tenses - theory-heavy with 13 lessons + 12 exercise groups),
    # Chapter 2 (Sequence of Tenses - Markdown tables, multiple-choice options, 30 multi-blank cloze passages),
    # Chapter 3 (Clauses & Phrases - 9 distinct lessons + 43 exercises + consolidated end-of-chapter answer keys)
    sample_chapters = [1, 2, 3]
    sample_payload = importer.run_extraction(chapter_numbers=sample_chapters)
    sample_db_counts = importer.load_into_sqlite(
        sample_payload, str(BASE_DIR / "data" / "normalized" / "sample_grammar.db")
    )

    sample_json_path = BASE_DIR / "data" / "normalized" / "sample_import_data.json"
    with open(sample_json_path, "w", encoding="utf-8") as f:
        json.dump(sample_payload, f, indent=2, ensure_ascii=False)

    # 2. Run Full Import on all 12 chapters
    full_payload = importer.run_extraction(chapter_numbers=None)
    full_db_counts = importer.load_into_sqlite(
        full_payload, str(BASE_DIR / "data" / "normalized" / "full_grammar.db")
    )

    full_json_path = BASE_DIR / "data" / "normalized" / "full_import_data.json"
    with open(full_json_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, indent=2, ensure_ascii=False)

    print("=== SAMPLE IMPORT COUNTS (Chapters 1, 2, 3) ===")
    print(json.dumps(sample_payload["validation_report"]["counts"], indent=2))
    print("Sample DB counts:", json.dumps(sample_db_counts, indent=2))
    print("Sample integrity:", json.dumps({
        k: v for k, v in sample_payload["validation_report"]["integrity"].items()
        if not isinstance(v, list)
    }, indent=2))

    print("\n=== FULL IMPORT COUNTS (All 12 Chapters) ===")
    print(json.dumps(full_payload["validation_report"]["counts"], indent=2))
    print("Full DB counts:", json.dumps(full_db_counts, indent=2))

    q_type_counts = Counter(q["question_type"] for q in full_payload["questions"])
    ex_type_counts = Counter(e["exercise_type"] for e in full_payload["exercises"])
    print("\n=== QUESTION TYPE BREAKDOWN ===")
    for qt, cnt in q_type_counts.most_common():
        print(f"  {qt}: {cnt} questions across {ex_type_counts[qt]} exercises")

    print("\n=== CHAPTER BREAKDOWN ===")
    les_by_ch = Counter(l["chapter_id"] for l in full_payload["lessons"])
    sec_by_les = {l["id"]: l["chapter_id"] for l in full_payload["lessons"]}
    lsec_by_ch = Counter(sec_by_les[ls["lesson_id"]] for ls in full_payload["lesson_sections"])
    rule_by_ch = Counter(sec_by_les[r["lesson_id"]] for r in full_payload["grammar_rules"])
    exmp_by_ch = Counter(sec_by_les[e["lesson_id"]] for e in full_payload["examples"])
    eg_by_ch = Counter(eg["chapter_id"] for eg in full_payload["exercise_groups"])
    ex_by_ch = Counter(sec_by_les[ex["lesson_id"]] for ex in full_payload["exercises"])
    ex_to_ch = {ex["id"]: sec_by_les[ex["lesson_id"]] for ex in full_payload["exercises"]}
    q_by_ch = Counter(ex_to_ch[q["exercise_id"]] for q in full_payload["questions"])
    ans_by_ch = Counter(ex_to_ch[a["exercise_id"]] for a in full_payload["question_answers"])

    for ch in full_payload["book_chapters"]:
        cid = ch["id"]
        print(
            f"Ch {ch['chapter_number']:02d} ({ch['code']} L{ch['start_line']}-{ch['end_line']}): "
            f"Lessons={les_by_ch[cid]}, TheorySecs={lsec_by_ch[cid]}, Rules={rule_by_ch[cid]}, "
            f"Examples={exmp_by_ch[cid]}, ExGroups={eg_by_ch[cid]}, Exercises={ex_by_ch[cid]}, "
            f"Questions={q_by_ch[cid]}, Answers={ans_by_ch[cid]}"
        )


if __name__ == "__main__":
    run_sample_and_full()
