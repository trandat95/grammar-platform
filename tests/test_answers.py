"""
Automated Tests for Answer Key Extraction, Alternative Answers, and Verification Flags (test_answers.py).
Compatible with both unittest and pytest.
"""
import unittest
from importer.parser import MarkdownParser
from importer.exercise_extractor import ExerciseExtractor
from importer.answer_extractor import AnswerExtractor

MD_PATH = "/working_dir/c_8704c5ad1474dd96/user_uploaded_files/ttl=63d/user_uploaded/Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md"


class TestAnswerExtractor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parser = MarkdownParser(MD_PATH)
        ex_ext = ExerciseExtractor(parser)
        ex_data = ex_ext.extract_all()
        ans_ext = AnswerExtractor(parser)
        ans_data = ans_ext.extract_and_link(
            ex_data["exercise_groups"],
            ex_data["exercises"],
            ex_data["questions"],
            ex_data["question_options"],
        )
        cls.linked_data = {**ex_data, **ans_data}

    def test_complete_answer_mapping(self):
        self.assertEqual(len(self.linked_data["question_answers"]), 2956)
        self.assertEqual(len(self.linked_data["answer_explanations"]), 2956)
        self.assertEqual(len(self.linked_data["unmapped_answer_entries"]), 0)

        answered_q_ids = {a["question_id"] for a in self.linked_data["question_answers"]}
        self.assertEqual(len(answered_q_ids), 2939)

    def test_alternative_answers_extraction(self):
        ans_by_code = {a["code"]: a for a in self.linked_data["question_answers"]}

        # Slash alternative in Tenses II Q1: "have you been studying/ have you studied"
        a1 = ans_by_code["TENSE_PRES_SIMPLE:EX_II:Q_1:ANS_1"]
        self.assertEqual(a1["correct_answer"], "have you been studying")
        self.assertIn("have you studied", a1["alternative_answers"])

        # Parenthetical alternative in Practice Test Q1
        apt1 = ans_by_code["PRACTICE_SENTENCE_TRANSFORMATION:EX_I:Q_1:ANS_1"]
        self.assertIn("to Barry that he should put", apt1["alternative_answers"])

    def test_verification_status_and_anomalies(self):
        ans_by_code = {a["code"]: a for a in self.linked_data["question_answers"]}

        # Emphasis Q38 (printed as 35. Do be careful. at L6351) must be NEEDS_REVIEW
        emph38 = ans_by_code["EMPH_WRITING:EX_I:Q_38:ANS_1"]
        self.assertEqual(emph38["correct_answer"], "Do be careful.")
        self.assertFalse(emph38["is_verified"])
        self.assertEqual(emph38["verification_status"], "NEEDS_REVIEW")

        # Multi-column answer key in Clauses of Condition III Q2 ("Had you ...") must be VERIFIED
        cond_iii_2 = ans_by_code["CLAUSE_CONDITION:EX_III:Q_2:ANS_1"]
        self.assertTrue(cond_iii_2["correct_answer"].startswith("Had you"))
        self.assertTrue(cond_iii_2["is_verified"])

        # Table-embedded answer in Word Forms Q150 ("hunger") must be VERIFIED
        wf150 = ans_by_code["WORD_FORMS:EX_I:Q_150:ANS_1"]
        self.assertEqual(wf150["correct_answer"], "hunger")
        self.assertTrue(wf150["is_verified"])


if __name__ == "__main__":
    unittest.main()
