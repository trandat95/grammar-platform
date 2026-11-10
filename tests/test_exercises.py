"""
Automated Tests for Exercise, Question, and Option Extraction (test_exercises.py).
Compatible with both unittest and pytest.
"""
import unittest
from importer.parser import MarkdownParser
from importer.exercise_extractor import ExerciseExtractor

MD_PATH = "/working_dir/c_8704c5ad1474dd96/user_uploaded_files/ttl=63d/user_uploaded/Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md"


class TestExerciseExtractor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parser = MarkdownParser(MD_PATH)
        extractor = ExerciseExtractor(parser)
        cls.ex_data = extractor.extract_all()

    def test_exercise_and_question_counts(self):
        self.assertEqual(len(self.ex_data["exercise_groups"]), 31)
        self.assertEqual(len(self.ex_data["exercises"]), 134)
        self.assertEqual(len(self.ex_data["questions"]), 2939)
        self.assertEqual(len(self.ex_data["question_options"]), 327)

    def test_question_types_coverage(self):
        types_present = {q["question_type"] for q in self.ex_data["questions"]}
        expected_types = {
            "FILL_IN_THE_BLANKS",
            "REWRITE_SENTENCES",
            "SENTENCE_TRANSFORMATION",
            "WORD_FORMATION",
            "MULTIPLE_CHOICE",
            "COMPLETE_SENTENCES",
            "SHORT_ANSWER",
            "MATCHING",
            "SENTENCE_ARRANGEMENT",
            "ERROR_CORRECTION",
            "TRANSLATION",
        }
        self.assertTrue(expected_types.issubset(types_present))

    def test_special_question_structures(self):
        q_by_code = {q["code"]: q for q in self.ex_data["questions"]}

        # 1. OCR merged question 35.1 in Tenses XII
        q35 = q_by_code["TENSE_PRES_SIMPLE:EX_XII:Q_35"]
        self.assertEqual(q35["original_number_label"], "35.1")
        self.assertTrue(q35["has_anomaly"])
        self.assertTrue(q35["stem"].startswith("I (lose) my key"))

        # 2. Multi-blank narrative paragraph in Sequence of Tenses III
        q_para = q_by_code["SEQ_TIME_CLAUSES:EX_III:Q_2"]
        self.assertEqual(q_para["blank_count"], 10)

        # 3. Word formation root word extraction
        q_wf = q_by_code["WORD_FORMS:EX_I:Q_1"]
        self.assertEqual(q_wf["question_type"], "WORD_FORMATION")
        self.assertEqual(q_wf["root_word"], "curiosity")

        # 4. Practice test starter prompt extraction
        q_pt = q_by_code["PRACTICE_SENTENCE_TRANSFORMATION:EX_I:Q_1"]
        self.assertEqual(q_pt["starter_prompt"], "John suggested")

        # 5. Embedded base64 fraction image in Numerals II
        q_num = q_by_code["POS_NUMERALS:EX_II:Q_1"]
        self.assertTrue(q_num["metadata"].get("contains_base64_image"))
        self.assertIn("data:image/png;base64", q_num["stem"])


if __name__ == "__main__":
    unittest.main()
