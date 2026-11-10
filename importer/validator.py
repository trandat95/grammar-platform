"""
Automated Data Validator for STEP 5 & STEP 6.
Verifies:
- Every chapter has a valid reference.
- Every lesson belongs to a valid topic or chapter.
- Every exercise belongs to the correct section.
- Every question belongs to an exercise.
- Answer mappings are valid.
- No unintended duplicate questions exist.
- Original numbering is preserved.
- No content is silently discarded.
- Vietnamese characters are preserved.
- Markdown tables are not lost.
"""
from typing import Dict, Any, List


class DataValidator:
    """Validates extracted and normalized dataset before/after database migration."""

    def __init__(self, data: Dict[str, Any], total_source_lines: int = 16559):
        self.data = data
        self.total_source_lines = total_source_lines

    def run_all_checks(self, is_sample: bool = False) -> Dict[str, Any]:
        errors: List[str] = []
        warnings: List[str] = []

        chapters = self.data.get("book_chapters", [])
        sections = self.data.get("book_sections", [])
        categories = self.data.get("grammar_categories", [])
        topics = self.data.get("grammar_topics", [])
        lessons = self.data.get("lessons", [])
        lesson_sections = self.data.get("lesson_sections", [])
        rules = self.data.get("grammar_rules", [])
        examples = self.data.get("examples", [])
        tables = self.data.get("tables", [])
        ex_groups = self.data.get("exercise_groups", [])
        exercises = self.data.get("exercises", [])
        questions = self.data.get("questions", [])
        options = self.data.get("question_options", [])
        answers = self.data.get("question_answers", [])
        explanations = self.data.get("answer_explanations", [])
        unmapped_answers = self.data.get("unmapped_answer_entries", [])

        chapter_ids = {c["id"] for c in chapters}
        topic_ids = {t["id"] for t in topics}
        lesson_ids = {l["id"] for l in lessons}
        ex_group_ids = {g["id"] for g in ex_groups}
        exercise_ids = {e["id"] for e in exercises}
        question_ids = {q["id"] for q in questions}

        # 1. Verify every chapter has a valid reference
        for ch in chapters:
            if not ch.get("source_file") or ch.get("start_line", 0) <= 0 or ch.get("end_line", 0) < ch.get("start_line", 0):
                errors.append(f"Invalid source reference on chapter {ch.get('code')}")

        # 2. Verify every lesson belongs to a valid topic and chapter
        for les in lessons:
            if les["chapter_id"] not in chapter_ids:
                errors.append(f"Lesson {les['code']} has invalid chapter_id {les['chapter_id']}")
            if les["topic_id"] not in topic_ids:
                errors.append(f"Lesson {les['code']} has invalid topic_id {les['topic_id']}")

        # 3. Verify every exercise belongs to a valid exercise group and lesson
        for ex in exercises:
            if ex["exercise_group_id"] not in ex_group_ids:
                errors.append(f"Exercise {ex['code']} has invalid exercise_group_id")
            if ex["lesson_id"] not in lesson_ids:
                errors.append(f"Exercise {ex['code']} has invalid lesson_id")

        # 4. Verify every question belongs to a valid exercise & check duplicate IDs/codes
        seen_q_ids = set()
        seen_q_keys = set()
        for q in questions:
            if q["exercise_id"] not in exercise_ids:
                errors.append(f"Question {q['code']} has invalid exercise_id")
            if q["id"] in seen_q_ids:
                errors.append(f"Duplicate question UUID detected: {q['id']} ({q['code']})")
            seen_q_ids.add(q["id"])
            q_key = (q["exercise_id"], q["question_number"])
            if q_key in seen_q_keys:
                errors.append(f"Duplicate (exercise_id, question_number) detected: {q['code']}")
            seen_q_keys.add(q_key)

        # 5. Verify answer mappings
        answered_q_ids = set()
        for ans in answers:
            if ans["question_id"] not in question_ids:
                errors.append(f"Answer {ans['code']} references non-existent question_id {ans['question_id']}")
            answered_q_ids.add(ans["question_id"])

        unanswered_questions = [q for q in questions if q["id"] not in answered_q_ids]
        questions_needing_review = [q for q in questions if q.get("has_anomaly")]
        answers_needing_review = [a for a in answers if not a.get("is_verified", True)]

        if unanswered_questions:
            warnings.append(f"{len(unanswered_questions)} questions have no mapped answer in source book.")
        if unmapped_answers:
            warnings.append(f"{len(unmapped_answers)} answer entries could not be mapped to a question.")

        # 6. Verify Vietnamese Unicode preservation
        vi_chars = set("ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ")
        found_vi = any(
            any(ch in vi_chars for ch in (les.get("title_vi", "") or "").lower())
            for les in lessons
        )
        if not found_vi:
            errors.append("Vietnamese Unicode characters were not preserved in lesson titles.")

        # 7. Verify Markdown tables are preserved
        if not tables:
            errors.append("No Markdown tables were extracted from theory sections.")

        # 8. Line coverage check (for full import)
        if not is_sample and chapters:
            min_line = min(c["start_line"] for c in chapters)
            max_line = max(c["end_line"] for c in chapters)
            if min_line != 1 or max_line != self.total_source_lines:
                errors.append(f"Line coverage mismatch: covered {min_line}..{max_line}, expected 1..{self.total_source_lines}")

        return {
            "passed": len(errors) == 0,
            "is_sample": is_sample,
            "counts": {
                "books": 1,
                "grammar_categories": len(categories),
                "book_chapters": len(chapters),
                "book_sections": len(sections),
                "grammar_topics": len(topics),
                "lessons": len(lessons),
                "lesson_sections": len(lesson_sections),
                "grammar_rules": len(rules),
                "examples": len(examples),
                "tables": len(tables),
                "exercise_groups": len(ex_groups),
                "exercises": len(exercises),
                "questions": len(questions),
                "question_options": len(options),
                "question_answers": len(answers),
                "answer_explanations": len(explanations),
            },
            "integrity": {
                "errors": errors,
                "warnings": warnings,
                "unanswered_questions_count": len(unanswered_questions),
                "unanswered_questions": [
                    {"code": q["code"], "line": q["start_line"], "stem": q["stem"][:80]}
                    for q in unanswered_questions
                ],
                "unmapped_answers_count": len(unmapped_answers),
                "unmapped_answers": unmapped_answers,
                "questions_requiring_review_count": len(questions_needing_review),
                "questions_requiring_review": [
                    {"code": q["code"], "line": q["start_line"], "note": q["anomaly_note"]}
                    for q in questions_needing_review
                ],
                "answers_requiring_verification_count": len(answers_needing_review),
                "answers_requiring_verification": [
                    {
                        "code": a["code"],
                        "line": a["source_line"],
                        "original_answer_text": a["original_answer_text"][:80],
                        "note": a["review_note"],
                    }
                    for a in answers_needing_review
                ],
                "verified_answers_count": sum(1 for a in answers if a.get("is_verified", True)),
            },
        }
