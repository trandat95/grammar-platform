"""
Lesson, Theory Section, Grammar Rule, Formula, and Example Extractor.
"""
import re
from typing import List, Dict, Any, Tuple
from .parser import MarkdownParser, make_id, compute_checksum


class LessonExtractor:
    """Extracts Lessons, LessonSections, GrammarRules, Formulas, Examples, and Tables."""

    def __init__(self, parser: MarkdownParser):
        self.parser = parser

    def extract_lessons(self, selected_catalog: List[Dict[str, Any]]) -> Dict[str, Any]:
        lessons = []
        lesson_sections = []
        grammar_rules = []
        examples = []
        tables = []

        for ch_meta in selected_catalog:
            ch_id = make_id("book_chapter", ch_meta["code"])
            for idx, sub in enumerate(ch_meta["subtopics"], start=1):
                topic_id = make_id("grammar_topic", sub["code"])
                book_sec_id = make_id("book_section", f"{ch_meta['code']}:{sub['code']}")
                lesson_id = make_id("lesson", sub["code"])

                t_start = sub["start_line"]
                t_end = sub.get("theory_end") if "theory_end" in sub else sub["end_line"]

                has_theory = t_end is not None and t_end >= t_start
                raw_theory = self.parser.slice_text(t_start, t_end) if has_theory else ""

                lessons.append({
                    "id": lesson_id,
                    "chapter_id": ch_id,
                    "book_section_id": book_sec_id,
                    "topic_id": topic_id,
                    "code": sub["code"],
                    "title_en": sub["title_en"],
                    "title_vi": sub["title_vi"],
                    "lesson_order": idx,
                    "has_theory": has_theory,
                    "source_file": self.parser.file_name,
                    "start_line": t_start,
                    "end_line": t_end if has_theory else sub["end_line"],
                    "raw_markdown": raw_theory,
                    "checksum": compute_checksum(raw_theory) if has_theory else "",
                })

                if not has_theory:
                    continue

                extracted_secs = self._segment_lesson_sections(lesson_id, sub["code"], t_start, t_end)
                lesson_sections.extend(extracted_secs)

                sec_tables = self.parser.extract_tables(t_start, t_end)
                for tb in sec_tables:
                    tb["lesson_id"] = lesson_id
                    tables.append(tb)

                for sec in extracted_secs:
                    sec_rules, sec_examples = self._extract_rules_and_examples(
                        lesson_id, sec["id"], sec["code"], sec["start_line"], sec["end_line"]
                    )
                    grammar_rules.extend(sec_rules)
                    examples.extend(sec_examples)

        return {
            "lessons": lessons,
            "lesson_sections": lesson_sections,
            "grammar_rules": grammar_rules,
            "examples": examples,
            "tables": tables,
        }

    def _segment_lesson_sections(self, lesson_id: str, lesson_code: str, start_line: int, end_line: int) -> List[Dict[str, Any]]:
        boundaries: List[Tuple[int, str, str]] = []
        sub_heading_re = re.compile(
            r"^(?:\#+\s*|\*{1,3})?([a-g]\.|[IVX]+\.|[1-9]\d*\.)\s*(.+?)(?:\*{1,3})?$"
        )
        note_re = re.compile(r"^(?:\#+\s*|\*{1,3})?(Lưu ý|GHI NHỚ|QUAN SÁT|QUY TẮC)\b", re.IGNORECASE)

        for lno in range(start_line + 1, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue
            m_note = note_re.match(s)
            if m_note:
                boundaries.append((lno, "NOTE", s))
                continue
            m_sub = sub_heading_re.match(s)
            if m_sub and (s.startswith("#") or s.startswith("**") or s.startswith("*")):
                title = s.lstrip("#* ").rstrip("* ")
                sec_type = self._classify_section_type(title)
                boundaries.append((lno, sec_type, title))

        sections = []
        if not boundaries:
            raw_md = self.parser.slice_text(start_line, end_line)
            sec_code = f"{lesson_code}:SEC_01"
            sections.append({
                "id": make_id("lesson_section", sec_code),
                "lesson_id": lesson_id,
                "code": sec_code,
                "title": self.parser.lines[start_line - 1].strip().lstrip("#* ").rstrip("* "),
                "section_type": "THEORY",
                "display_order": 1,
                "start_line": start_line,
                "end_line": end_line,
                "raw_markdown": raw_md,
                "structured_blocks": self._build_structured_blocks(start_line, end_line),
            })
            return sections

        if boundaries[0][0] > start_line + 1:
            intro_end = boundaries[0][0] - 1
            raw_md = self.parser.slice_text(start_line, intro_end)
            if raw_md.strip():
                sec_code = f"{lesson_code}:SEC_INTRO"
                sections.append({
                    "id": make_id("lesson_section", sec_code),
                    "lesson_id": lesson_id,
                    "code": sec_code,
                    "title": self.parser.lines[start_line - 1].strip().lstrip("#* ").rstrip("* "),
                    "section_type": "OVERVIEW",
                    "display_order": 1,
                    "start_line": start_line,
                    "end_line": intro_end,
                    "raw_markdown": raw_md,
                    "structured_blocks": self._build_structured_blocks(start_line, intro_end),
                })

        for i, (b_line, sec_type, b_title) in enumerate(boundaries):
            b_end = boundaries[i + 1][0] - 1 if i + 1 < len(boundaries) else end_line
            sec_order = len(sections) + 1
            sec_code = f"{lesson_code}:SEC_{sec_order:02d}"
            raw_md = self.parser.slice_text(b_line, b_end)
            sections.append({
                "id": make_id("lesson_section", sec_code),
                "lesson_id": lesson_id,
                "code": sec_code,
                "title": b_title,
                "section_type": sec_type,
                "display_order": sec_order,
                "start_line": b_line,
                "end_line": b_end,
                "raw_markdown": raw_md,
                "structured_blocks": self._build_structured_blocks(b_line, b_end),
            })

        return sections

    def _classify_section_type(self, title: str) -> str:
        t = title.lower()
        if "cấu trúc" in t or "form" in t or "hình thức" in t:
            return "FORMULA_AND_FORM"
        if "cách dùng" in t or "usage" in t or "uses" in t:
            return "USAGE"
        if "phủ định" in t or "negative" in t or "nghi vấn" in t or "interrogative" in t:
            return "GRAMMAR_FORM"
        if "phó từ" in t or "trạng từ" in t:
            return "SIGNAL_WORDS"
        if "lưu ý" in t or "ghi nhớ" in t:
            return "NOTE"
        if "phân loại" in t or "classification" in t or "kinds" in t:
            return "CLASSIFICATION"
        if "chức năng" in t or "function" in t:
            return "FUNCTION"
        return "THEORY"

    def _build_structured_blocks(self, start_line: int, end_line: int) -> List[Dict[str, Any]]:
        blocks = []
        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue
            if s.startswith("|"):
                blocks.append({"type": "table_row", "line": lno, "text": s})
            elif re.search(r"\bEx\s*:", s, re.IGNORECASE):
                blocks.append({"type": "example", "line": lno, "text": s})
            elif s.startswith("**") and s.endswith("**") and ("+" in s or "=>" in s or "" in s):
                blocks.append({"type": "formula", "line": lno, "text": s.strip("*")})
            elif s.startswith("-") or s.startswith("+") or s.startswith("•") or s.startswith("♦"):
                blocks.append({"type": "rule_bullet", "line": lno, "text": s})
            else:
                blocks.append({"type": "paragraph", "line": lno, "text": s})
        return blocks

    def _extract_rules_and_examples(
        self, lesson_id: str, section_id: str, section_code: str, start_line: int, end_line: int
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        rules = []
        examples = []
        current_rule = None
        in_example_block = False

        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s or s.startswith("|"):
                continue

            is_formula = (
                (s.startswith("**") and s.endswith("**") and ("+" in s or "=>" in s or "" in s or "V" in s or "Subject" in s))
                or re.match(r"^\*?\s*Thể (phủ định|nghi vấn)\s*:", s)
            )
            if is_formula and not re.search(r"\bEx\s*:", s, re.IGNORECASE):
                in_example_block = False
                rule_code = f"{section_code}:RULE_L{lno}"
                rule_obj = {
                    "id": make_id("grammar_rule", rule_code),
                    "lesson_id": lesson_id,
                    "section_id": section_id,
                    "code": rule_code,
                    "rule_type": "FORMULA",
                    "title": s.strip("* "),
                    "explanation_vi": "",
                    "explanation_en": "",
                    "formula": s.strip("* "),
                    "display_order": len(rules) + 1,
                    "start_line": lno,
                    "end_line": lno,
                }
                rules.append(rule_obj)
                current_rule = rule_obj
                continue

            if (s.startswith("- ") or s.startswith("+ ") or s.startswith("• ") or s.startswith("♦ ")) and not re.search(r"^\s*[-+•♦]?\s*Ex\s*:", s, re.IGNORECASE):
                in_example_block = False
                parts = re.split(r"\bEx\s*:\s*", s, maxsplit=1)
                rule_text = parts[0].lstrip("-+•♦ ").strip()
                rule_code = f"{section_code}:RULE_L{lno}"
                rule_obj = {
                    "id": make_id("grammar_rule", rule_code),
                    "lesson_id": lesson_id,
                    "section_id": section_id,
                    "code": rule_code,
                    "rule_type": "USAGE_RULE",
                    "title": rule_text[:120],
                    "explanation_vi": rule_text,
                    "explanation_en": "",
                    "formula": None,
                    "display_order": len(rules) + 1,
                    "start_line": lno,
                    "end_line": lno,
                }
                rules.append(rule_obj)
                current_rule = rule_obj

                if len(parts) > 1 and parts[1].strip():
                    ex_obj = self._build_example(
                        lesson_id, section_id, current_rule["id"] if current_rule else None,
                        section_code, lno, parts[1].strip(), len(examples) + 1
                    )
                    examples.append(ex_obj)
                    in_example_block = True
                continue

            m_ex = re.search(r"\bEx\s*:\s*(.+)$", s, re.IGNORECASE)
            if m_ex:
                prefix = s[:m_ex.start()].strip()
                if prefix and not prefix.startswith("*"):
                    rule_code = f"{section_code}:RULE_L{lno}"
                    rule_obj = {
                        "id": make_id("grammar_rule", rule_code),
                        "lesson_id": lesson_id,
                        "section_id": section_id,
                        "code": rule_code,
                        "rule_type": "USAGE_RULE",
                        "title": prefix[:120],
                        "explanation_vi": prefix,
                        "explanation_en": "",
                        "formula": None,
                        "display_order": len(rules) + 1,
                        "start_line": lno,
                        "end_line": lno,
                    }
                    rules.append(rule_obj)
                    current_rule = rule_obj

                ex_text = m_ex.group(1).strip()
                ex_obj = self._build_example(
                    lesson_id, section_id, current_rule["id"] if current_rule else None,
                    section_code, lno, ex_text, len(examples) + 1
                )
                examples.append(ex_obj)
                in_example_block = True
                continue

            if in_example_block and examples and s.startswith("*(") and s.endswith(")*"):
                examples[-1]["sentence_vi"] = s.strip("*() ")
                examples[-1]["end_line"] = lno
                continue

            if in_example_block and not s.startswith("#") and not s.startswith("*") and not re.match(r"^[0-9IVX]+[\.\)]", s):
                vi_chars = set("ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ")
                has_vi = any(ch in vi_chars for ch in s.lower())
                if not has_vi and len(s) > 8 and s[0].isupper():
                    ex_obj = self._build_example(
                        lesson_id, section_id, current_rule["id"] if current_rule else None,
                        section_code, lno, s, len(examples) + 1
                    )
                    examples.append(ex_obj)
                    continue
                else:
                    in_example_block = False

        if not rules:
            raw_clean = self.parser.slice_text(start_line, end_line).strip()
            if raw_clean:
                rule_code = f"{section_code}:RULE_MAIN"
                rules.append({
                    "id": make_id("grammar_rule", rule_code),
                    "lesson_id": lesson_id,
                    "section_id": section_id,
                    "code": rule_code,
                    "rule_type": "THEORY_SUMMARY",
                    "title": self.parser.lines[start_line - 1].strip().lstrip("#* ").rstrip("* ")[:120],
                    "explanation_vi": raw_clean[:500],
                    "explanation_en": "",
                    "formula": None,
                    "display_order": 1,
                    "start_line": start_line,
                    "end_line": end_line,
                })

        return rules, examples

    def _build_example(
        self, lesson_id: str, section_id: str, rule_id: str, section_code: str,
        lno: int, ex_text: str, order: int
    ) -> Dict[str, Any]:
        vi_trans = None
        m_vi = re.search(r"\*\(([^)]+)\)\*", ex_text)
        if m_vi:
            vi_trans = m_vi.group(1).strip()
        neg_note = None
        m_neg = re.search(r"\[NOT?\s+([^\]]+)\]", ex_text, re.IGNORECASE)
        if m_neg:
            neg_note = m_neg.group(0)

        ex_code = f"{section_code}:EX_L{lno}"
        return {
            "id": make_id("example", ex_code),
            "lesson_id": lesson_id,
            "section_id": section_id,
            "grammar_rule_id": rule_id,
            "code": ex_code,
            "sentence_en": ex_text,
            "sentence_vi": vi_trans,
            "negative_example_note": neg_note,
            "display_order": order,
            "start_line": lno,
            "end_line": lno,
        }
