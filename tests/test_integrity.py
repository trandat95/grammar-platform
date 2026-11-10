"""
Automated End-to-End Database Integrity & Idempotency Tests (test_integrity.py).
Compatible with both unittest and pytest.
"""
import importlib
import os
import tempfile
import unittest

imp_mod = importlib.import_module("importer.import")
GrammarBookImporter = imp_mod.GrammarBookImporter

MD_PATH = "/working_dir/c_8704c5ad1474dd96/user_uploaded_files/ttl=63d/user_uploaded/Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md"


class TestEndToEndIntegrity(unittest.TestCase):
    def test_sample_and_full_validation_pass(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            importer = GrammarBookImporter(MD_PATH, tmpdir)

            # Sample Import (Chapters 1, 2, 3)
            sample_payload = importer.run_extraction(chapter_numbers=[1, 2, 3])
            s_rep = sample_payload["validation_report"]
            self.assertTrue(s_rep["passed"])
            self.assertEqual(s_rep["integrity"]["errors"], [])
            self.assertEqual(s_rep["integrity"]["unanswered_questions_count"], 0)
            self.assertEqual(s_rep["integrity"]["unmapped_answers_count"], 0)

            # Full Import (All 12 Chapters)
            full_payload = importer.run_extraction(chapter_numbers=None)
            f_rep = full_payload["validation_report"]
            self.assertTrue(f_rep["passed"])
            self.assertEqual(f_rep["integrity"]["errors"], [])
            self.assertEqual(f_rep["integrity"]["unanswered_questions_count"], 0)
            self.assertEqual(f_rep["integrity"]["unmapped_answers_count"], 0)

            # Idempotent SQLite Database Load (Run 1 vs Run 2)
            db_path = os.path.join(tmpdir, "test_idempotent.db")
            counts_run_1 = importer.load_into_sqlite(full_payload, db_path)
            counts_run_2 = importer.load_into_sqlite(full_payload, db_path)
            self.assertEqual(counts_run_1, counts_run_2)
            self.assertEqual(counts_run_1["questions"], 2939)
            self.assertEqual(counts_run_1["question_answers"], 2956)
            self.assertEqual(counts_run_1["lessons"], 53)


if __name__ == "__main__":
    unittest.main()
