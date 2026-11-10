"""
Main CLI and Orchestrator for Markdown Grammar Book Migration (STEP 4, STEP 5, STEP 6).
Supports:
- Sample Import (e.g., Chapters 1, 3, 12) into SQLite test database & normalized JSON
- Full Book Import (All 12 chapters) into SQLite verification database, PostgreSQL seed SQL, & normalized JSON
- Idempotent re-imports using deterministic UUIDv5 primary keys (`ON CONFLICT DO UPDATE` / `INSERT OR REPLACE`)
"""
import argparse
import json
import os
import sqlite3
from pathlib import Path
from typing import List, Dict, Any

from .parser import MarkdownParser
from .chapter_extractor import ChapterExtractor
from .lesson_extractor import LessonExtractor
from .exercise_extractor import ExerciseExtractor
from .answer_extractor import AnswerExtractor
from .validator import DataValidator


class GrammarBookImporter:
    """End-to-end idempotent importer from raw Markdown to normalized JSON and relational database."""

    def __init__(self, markdown_path: str, output_dir: str):
        self.markdown_path = markdown_path
        self.output_dir = Path(output_dir)
        self.parser = MarkdownParser(markdown_path)

    def run_extraction(self, chapter_numbers: List[int] = None) -> Dict[str, Any]:
        ch_ext = ChapterExtractor(self.parser)
        ch_data = ch_ext.extract_all(chapter_numbers=chapter_numbers)

        selected_catalog = ch_data.pop("selected_catalog")
        selected_chapter_codes = [c["code"] for c in selected_catalog]

        les_ext = LessonExtractor(self.parser)
        les_data = les_ext.extract_lessons(selected_catalog)

        ex_ext = ExerciseExtractor(self.parser)
        ex_data = ex_ext.extract_all(selected_chapter_codes=selected_chapter_codes)

        ans_ext = AnswerExtractor(self.parser)
        ans_data = ans_ext.extract_and_link(
            ex_data["exercise_groups"],
            ex_data["exercises"],
            ex_data["questions"],
            ex_data["question_options"],
        )

        payload = {
            **ch_data,
            **les_data,
            **ex_data,
            **ans_data,
        }

        validator = DataValidator(payload, total_source_lines=self.parser.total_lines)
        validation_report = validator.run_all_checks(is_sample=(chapter_numbers is not None))
        payload["validation_report"] = validation_report
        return payload

    def load_into_sqlite(self, payload: Dict[str, Any], db_path: str) -> Dict[str, int]:
        """Load extracted relational entities into a test SQLite database with idempotent upserts."""
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON;")
        cur = conn.cursor()

        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                authors_json TEXT NOT NULL,
                edition_note TEXT,
                source_file TEXT NOT NULL,
                total_lines INTEGER NOT NULL,
                checksum TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS grammar_categories (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                name_en TEXT NOT NULL,
                name_vi TEXT NOT NULL,
                display_order INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS book_chapters (
                id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL REFERENCES books(id),
                chapter_number INTEGER NOT NULL,
                code TEXT UNIQUE NOT NULL,
                title_en TEXT NOT NULL,
                title_vi TEXT NOT NULL,
                original_heading TEXT NOT NULL,
                display_order INTEGER NOT NULL,
                source_file TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                checksum TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS book_sections (
                id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL REFERENCES books(id),
                chapter_id TEXT NOT NULL REFERENCES book_chapters(id),
                section_number TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                title_en TEXT NOT NULL,
                title_vi TEXT NOT NULL,
                section_type TEXT NOT NULL,
                display_order INTEGER NOT NULL,
                source_file TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS grammar_topics (
                id TEXT PRIMARY KEY,
                category_id TEXT NOT NULL REFERENCES grammar_categories(id),
                parent_topic_id TEXT REFERENCES grammar_topics(id),
                chapter_id TEXT REFERENCES book_chapters(id),
                code TEXT UNIQUE NOT NULL,
                title_en TEXT NOT NULL,
                title_vi TEXT NOT NULL,
                hierarchy_level INTEGER NOT NULL,
                display_order INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                chapter_id TEXT NOT NULL REFERENCES book_chapters(id),
                book_section_id TEXT NOT NULL REFERENCES book_sections(id),
                topic_id TEXT NOT NULL REFERENCES grammar_topics(id),
                code TEXT UNIQUE NOT NULL,
                title_en TEXT NOT NULL,
                title_vi TEXT NOT NULL,
                lesson_order INTEGER NOT NULL,
                has_theory INTEGER NOT NULL,
                source_file TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                raw_markdown TEXT,
                checksum TEXT
            );
            CREATE TABLE IF NOT EXISTS lesson_sections (
                id TEXT PRIMARY KEY,
                lesson_id TEXT NOT NULL REFERENCES lessons(id),
                code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                section_type TEXT NOT NULL,
                display_order INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                raw_markdown TEXT NOT NULL,
                structured_blocks_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS grammar_rules (
                id TEXT PRIMARY KEY,
                lesson_id TEXT NOT NULL REFERENCES lessons(id),
                section_id TEXT NOT NULL REFERENCES lesson_sections(id),
                code TEXT UNIQUE NOT NULL,
                rule_type TEXT NOT NULL,
                title TEXT NOT NULL,
                explanation_vi TEXT,
                explanation_en TEXT,
                formula TEXT,
                display_order INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS examples (
                id TEXT PRIMARY KEY,
                lesson_id TEXT NOT NULL REFERENCES lessons(id),
                section_id TEXT NOT NULL REFERENCES lesson_sections(id),
                grammar_rule_id TEXT REFERENCES grammar_rules(id),
                code TEXT UNIQUE NOT NULL,
                sentence_en TEXT NOT NULL,
                sentence_vi TEXT,
                negative_example_note TEXT,
                display_order INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS exercise_groups (
                id TEXT PRIMARY KEY,
                chapter_id TEXT NOT NULL REFERENCES book_chapters(id),
                lesson_id TEXT NOT NULL REFERENCES lessons(id),
                topic_id TEXT NOT NULL REFERENCES grammar_topics(id),
                code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                display_order INTEGER NOT NULL,
                source_file TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                answer_start_line INTEGER NOT NULL,
                answer_end_line INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS exercises (
                id TEXT PRIMARY KEY,
                exercise_group_id TEXT NOT NULL REFERENCES exercise_groups(id),
                lesson_id TEXT NOT NULL REFERENCES lessons(id),
                topic_id TEXT NOT NULL REFERENCES grammar_topics(id),
                code TEXT UNIQUE NOT NULL,
                roman_numeral TEXT NOT NULL,
                original_label TEXT NOT NULL,
                title TEXT NOT NULL,
                instruction_en TEXT NOT NULL,
                instruction_vi TEXT,
                exercise_type TEXT NOT NULL,
                display_order INTEGER NOT NULL,
                question_count INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                has_numbering_anomaly INTEGER NOT NULL,
                anomaly_note TEXT
            );
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                exercise_id TEXT NOT NULL REFERENCES exercises(id),
                code TEXT UNIQUE NOT NULL,
                question_number INTEGER NOT NULL,
                original_number_label TEXT NOT NULL,
                sub_category TEXT,
                question_type TEXT NOT NULL,
                stem TEXT NOT NULL,
                starter_prompt TEXT,
                blank_count INTEGER NOT NULL,
                root_word TEXT,
                metadata_json TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                has_anomaly INTEGER NOT NULL,
                anomaly_note TEXT
            );
            CREATE TABLE IF NOT EXISTS question_options (
                id TEXT PRIMARY KEY,
                question_id TEXT NOT NULL REFERENCES questions(id),
                blank_index INTEGER NOT NULL,
                option_label TEXT NOT NULL,
                option_text TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                display_order INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS question_answers (
                id TEXT PRIMARY KEY,
                question_id TEXT NOT NULL REFERENCES questions(id),
                exercise_id TEXT NOT NULL REFERENCES exercises(id),
                code TEXT UNIQUE NOT NULL,
                blank_index INTEGER NOT NULL,
                original_answer_text TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                alternative_answers_json TEXT NOT NULL,
                is_verified INTEGER NOT NULL,
                verification_status TEXT NOT NULL,
                review_note TEXT,
                source_line INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS answer_explanations (
                id TEXT PRIMARY KEY,
                question_answer_id TEXT NOT NULL REFERENCES question_answers(id),
                question_id TEXT NOT NULL REFERENCES questions(id),
                grammar_rule_id TEXT REFERENCES grammar_rules(id),
                explanation_vi TEXT NOT NULL,
                explanation_en TEXT,
                source_type TEXT NOT NULL,
                is_verified INTEGER NOT NULL
            );
            """
        )

        b = payload["book"]
        cur.execute(
            "INSERT OR REPLACE INTO books VALUES (?, ?, ?, ?, ?, ?, ?)",
            (b["id"], b["title"], json.dumps(b["authors"], ensure_ascii=False), b["edition_note"], b["source_file"], b["total_lines"], b["checksum"]),
        )

        for c in payload["grammar_categories"]:
            cur.execute(
                "INSERT OR REPLACE INTO grammar_categories VALUES (?, ?, ?, ?, ?)",
                (c["id"], c["code"], c["name_en"], c["name_vi"], c["display_order"]),
            )

        for ch in payload["book_chapters"]:
            cur.execute(
                "INSERT OR REPLACE INTO book_chapters VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (ch["id"], ch["book_id"], ch["chapter_number"], ch["code"], ch["title_en"], ch["title_vi"], ch["original_heading"], ch["display_order"], ch["source_file"], ch["start_line"], ch["end_line"], ch["checksum"]),
            )

        for s in payload["book_sections"]:
            cur.execute(
                "INSERT OR REPLACE INTO book_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (s["id"], s["book_id"], s["chapter_id"], s["section_number"], s["code"], s["title_en"], s["title_vi"], s["section_type"], s["display_order"], s["source_file"], s["start_line"], s["end_line"]),
            )

        for t in payload["grammar_topics"]:
            cur.execute(
                "INSERT OR REPLACE INTO grammar_topics VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (t["id"], t["category_id"], t["parent_topic_id"], t["chapter_id"], t["code"], t["title_en"], t["title_vi"], t["hierarchy_level"], t["display_order"], t["start_line"], t["end_line"]),
            )

        for l in payload["lessons"]:
            cur.execute(
                "INSERT OR REPLACE INTO lessons VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (l["id"], l["chapter_id"], l["book_section_id"], l["topic_id"], l["code"], l["title_en"], l["title_vi"], l["lesson_order"], int(l["has_theory"]), l["source_file"], l["start_line"], l["end_line"], l["raw_markdown"], l["checksum"]),
            )

        for ls in payload["lesson_sections"]:
            cur.execute(
                "INSERT OR REPLACE INTO lesson_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (ls["id"], ls["lesson_id"], ls["code"], ls["title"], ls["section_type"], ls["display_order"], ls["start_line"], ls["end_line"], ls["raw_markdown"], json.dumps(ls["structured_blocks"], ensure_ascii=False)),
            )

        for r in payload["grammar_rules"]:
            cur.execute(
                "INSERT OR REPLACE INTO grammar_rules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (r["id"], r["lesson_id"], r["section_id"], r["code"], r["rule_type"], r["title"], r["explanation_vi"], r["explanation_en"], r["formula"], r["display_order"], r["start_line"], r["end_line"]),
            )

        for ex_item in payload["examples"]:
            cur.execute(
                "INSERT OR REPLACE INTO examples VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (ex_item["id"], ex_item["lesson_id"], ex_item["section_id"], ex_item["grammar_rule_id"], ex_item["code"], ex_item["sentence_en"], ex_item["sentence_vi"], ex_item["negative_example_note"], ex_item["display_order"], ex_item["start_line"], ex_item["end_line"]),
            )

        for eg in payload["exercise_groups"]:
            cur.execute(
                "INSERT OR REPLACE INTO exercise_groups VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (eg["id"], eg["chapter_id"], eg["lesson_id"], eg["topic_id"], eg["code"], eg["title"], eg["display_order"], eg["source_file"], eg["start_line"], eg["end_line"], eg["answer_start_line"], eg["answer_end_line"]),
            )

        for ex in payload["exercises"]:
            cur.execute(
                "INSERT OR REPLACE INTO exercises VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (ex["id"], ex["exercise_group_id"], ex["lesson_id"], ex["topic_id"], ex["code"], ex["roman_numeral"], ex["original_label"], ex["title"], ex["instruction_en"], ex["instruction_vi"], ex["exercise_type"], ex["display_order"], ex["question_count"], ex["start_line"], ex["end_line"], int(ex["has_numbering_anomaly"]), ex["anomaly_note"]),
            )

        for q in payload["questions"]:
            cur.execute(
                "INSERT OR REPLACE INTO questions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (q["id"], q["exercise_id"], q["code"], q["question_number"], q["original_number_label"], q["sub_category"], q["question_type"], q["stem"], q["starter_prompt"], q["blank_count"], q["root_word"], json.dumps(q["metadata"], ensure_ascii=False), q["start_line"], q["end_line"], int(q["has_anomaly"]), q["anomaly_note"]),
            )

        for opt in payload["question_options"]:
            cur.execute(
                "INSERT OR REPLACE INTO question_options VALUES (?, ?, ?, ?, ?, ?, ?)",
                (opt["id"], opt["question_id"], opt["blank_index"], opt["option_label"], opt["option_text"], int(opt["is_correct"]), opt["display_order"]),
            )

        for qa in payload["question_answers"]:
            cur.execute(
                "INSERT OR REPLACE INTO question_answers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (qa["id"], qa["question_id"], qa["exercise_id"], qa["code"], qa["blank_index"], qa["original_answer_text"], qa["correct_answer"], json.dumps(qa["alternative_answers"], ensure_ascii=False), int(qa["is_verified"]), qa["verification_status"], qa["review_note"], qa["source_line"]),
            )

        for ae in payload["answer_explanations"]:
            cur.execute(
                "INSERT OR REPLACE INTO answer_explanations VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (ae["id"], ae["question_answer_id"], ae["question_id"], ae["grammar_rule_id"], ae["explanation_vi"], ae["explanation_en"], ae["source_type"], int(ae["is_verified"])),
            )

        conn.commit()

        tables_to_count = [
            "books", "grammar_categories", "book_chapters", "book_sections",
            "grammar_topics", "lessons", "lesson_sections", "grammar_rules",
            "examples", "exercise_groups", "exercises", "questions",
            "question_options", "question_answers", "answer_explanations"
        ]
        db_counts = {}
        for tbl in tables_to_count:
            cur.execute(f"SELECT COUNT(*) FROM {tbl}")
            db_counts[tbl] = cur.fetchone()[0]
        conn.close()
        return db_counts
