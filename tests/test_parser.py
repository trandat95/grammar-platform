"""
Automated Tests for Markdown Parser, Chapter Extractor, and Lesson Extractor (test_parser.py).
Compatible with both unittest and pytest.
"""
import unittest
from importer.parser import MarkdownParser, make_id
from importer.chapter_extractor import ChapterExtractor
from importer.lesson_extractor import LessonExtractor

MD_PATH = "/working_dir/c_8704c5ad1474dd96/user_uploaded_files/ttl=63d/user_uploaded/Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md"


class TestMarkdownParserAndLessons(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parser = MarkdownParser(MD_PATH)

    def test_source_file_metrics(self):
        self.assertEqual(self.parser.total_lines, 16559)
        self.assertEqual(len(self.parser.raw_text), 465209)

    def test_deterministic_uuid_idempotency(self):
        id_1 = make_id("lesson", "TENSE_PRES_SIMPLE")
        id_2 = make_id("lesson", "tense_pres_simple ")
        self.assertEqual(id_1, id_2)
        self.assertEqual(len(id_1), 36)

    def test_chapter_and_topic_extraction(self):
        ch_ext = ChapterExtractor(self.parser)
        result = ch_ext.extract_all()
        self.assertEqual(len(result["grammar_categories"]), 7)
        self.assertEqual(len(result["book_chapters"]), 12)
        self.assertEqual(len(result["book_sections"]), 53)
        self.assertEqual(len(result["grammar_topics"]), 65)
        self.assertEqual(result["book_chapters"][0]["start_line"], 1)
        self.assertEqual(result["book_chapters"][-1]["end_line"], 16559)

    def test_lesson_and_table_extraction(self):
        ch_ext = ChapterExtractor(self.parser)
        ch_data = ch_ext.extract_all()
        les_ext = LessonExtractor(self.parser)
        les_data = les_ext.extract_lessons(ch_data["selected_catalog"])

        self.assertEqual(len(les_data["lessons"]), 53)
        self.assertEqual(len(les_data["lesson_sections"]), 491)
        self.assertEqual(len(les_data["grammar_rules"]), 982)
        self.assertEqual(len(les_data["examples"]), 1026)
        self.assertEqual(len(les_data["tables"]), 7)

        first_lesson = les_data["lessons"][0]
        self.assertEqual(first_lesson["title_vi"], "Thì hiện tại đơn")
        self.assertIn("chân lý", first_lesson["raw_markdown"].lower())


if __name__ == "__main__":
    unittest.main()
