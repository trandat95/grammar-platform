"""
Exercise Group, Exercise, Question, and QuestionOption Extractor.
Supports all 12 required question types and preserves exact numbering, multi-blanks, and source lines.
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from .parser import MarkdownParser, make_id, compute_checksum


# Explicit mapping of Exercise Sections across the entire book
# Each entry maps a subtopic/lesson code to its exercise line range and answer key line range
EXERCISE_SECTION_MAP = [
    # Chapter 1: Tenses (Exercises apply across Ch1, linked to CH01_TENSES & primary lesson)
    {"chapter_code": "CH01_TENSES", "lesson_code": "TENSE_PRES_SIMPLE", "ex_range": (475, 958), "ans_range": (959, 1152), "multi_group": True},
    # Chapter 2: Sequence of Tenses
    {"chapter_code": "CH02_SEQUENCE_OF_TENSES", "lesson_code": "SEQ_TIME_CLAUSES", "ex_range": (1228, 1449), "ans_range": (1450, 1613), "multi_group": True},
    # Chapter 3: Clauses and Phrases (9 subtopics with consolidated answer key at L3921-5098)
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_CONDITION", "ex_range": (1693, 1864), "ans_range": (3923, 4046), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_WISH", "ex_range": (1923, 1998), "ans_range": (4047, 4104), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_PURPOSE", "ex_range": (2115, 2254), "ans_range": (4105, 4226), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_RESULT", "ex_range": (2357, 2626), "ans_range": (4227, 4410), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_REASON", "ex_range": (2657, 2758), "ans_range": (4411, 4490), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_CONCESSION", "ex_range": (2797, 2924), "ans_range": (4491, 4614), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_AS_IF_TIME_RATHER", "ex_range": (3029, 3114), "ans_range": (4615, 4668), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_NOUN", "ex_range": (3151, 3252), "ans_range": (4669, 4712), "multi_group": True},
    {"chapter_code": "CH03_CLAUSES_AND_PHRASES", "lesson_code": "CLAUSE_RELATIVE", "ex_range": (3449, 3920), "ans_range": (4713, 5098), "multi_group": True},
    # Chapter 4: Expression of Quantity
    {"chapter_code": "CH04_EXPRESSION_OF_QUANTITY", "lesson_code": "QUANT_SOME_ANY", "ex_range": (5241, 5448), "ans_range": (5449, 5524), "multi_group": True},
    # Chapter 5: Styles
    {"chapter_code": "CH05_STYLES", "lesson_code": "STYLE_PATTERNS", "ex_range": (5697, 5944), "ans_range": (5945, 6086), "multi_group": True},
    # Chapter 6: Emphasis
    {"chapter_code": "CH06_EMPHASIS", "lesson_code": "EMPH_WRITING", "ex_range": (6171, 6274), "ans_range": (6275, 6376), "multi_group": False},
    # Chapter 7: Parts of Speech (Consolidated answer key at L12121-12832)
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_NOUNS", "ex_range": (6777, 6874), "ans_range": (12121, 12252), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_PRONOUNS", "ex_range": (7179, 7366), "ans_range": (12253, 12318), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_ADJECTIVES", "ex_range": (7593, 7814), "ans_range": (12319, 12396), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_ADVERBS", "ex_range": (7975, 8130), "ans_range": (12397, 12468), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_COMPARISON", "ex_range": (8295, 8484), "ans_range": (12469, 12548), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_VERBS", "ex_range": (8971, 9180), "ans_range": (12549, 12652), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_NUMERALS", "ex_range": (9243, 9256), "ans_range": (12653, 12672), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_PREPOSITIONS", "ex_range": (9819, 10388), "ans_range": (12673, 12772), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_CONJUNCTIONS", "ex_range": (10449, 10506), "ans_range": (12773, 12810), "multi_group": True},
    {"chapter_code": "CH07_PARTS_OF_SPEECH", "lesson_code": "POS_ARTICLES", "ex_range": (10675, 10762), "ans_range": (12811, 12832), "multi_group": False},
    # Chapter 8: Word Study (Consolidated answer key at L12833-13029)
    {"chapter_code": "CH08_WORD_STUDY", "lesson_code": "WORD_FORMS", "ex_range": (11279, 11840), "ans_range": (12833, 12947), "multi_group": False},
    {"chapter_code": "CH08_WORD_STUDY", "lesson_code": "WORD_IDIOMS", "ex_range": (11963, 12120), "ans_range": (12948, 13029), "multi_group": False},
    # Chapter 9: Reported Speech
    {"chapter_code": "CH09_REPORTED_SPEECH", "lesson_code": "REP_TYPES", "ex_range": (13213, 13316), "ans_range": (13317, 13418), "multi_group": False},
    # Chapter 10: Passive and Active Sentences
    {"chapter_code": "CH10_PASSIVE_ACTIVE", "lesson_code": "PASSIVE_RULES", "ex_range": (13613, 13912), "ans_range": (13913, 14172), "multi_group": True},
    # Chapter 11: Sentences (Split across L14331-14438 and L14615-14658)
    {"chapter_code": "CH11_SENTENCES", "lesson_code": "SENT_CLASSIFICATION_KINDS", "ex_range": (14331, 14438), "ans_range": (14659, 14744), "multi_group": True},
    {"chapter_code": "CH11_SENTENCES", "lesson_code": "SENT_BASIC_PATTERNS", "ex_range": (14615, 14658), "ans_range": (14745, 14824), "multi_group": True},
    # Chapter 12: Practice Test
    {"chapter_code": "CH12_PRACTICE_TEST", "lesson_code": "PRACTICE_SENTENCE_TRANSFORMATION", "ex_range": (14825, 15956), "ans_range": (15957, 16559), "multi_group": False},
]


class ExerciseExtractor:
    """Extracts ExerciseGroups, Exercises, Questions, and QuestionOptions."""

    # Strict regex for Roman numeral exercise group headers (must have a dot right after the Roman numeral)
    ROMAN_HEADER_RE = re.compile(
        r"^(?:\#+\s*|\*{1,3})?(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)(?:\.\*{1,3}|\*{1,3}\.|\.)\s*(.+)$"
    )

    def __init__(self, parser: MarkdownParser):
        self.parser = parser

    def extract_all(self, selected_chapter_codes: List[str] = None) -> Dict[str, Any]:
        exercise_groups = []
        exercises = []
        questions = []
        question_options = []

        active_maps = [
            m for m in EXERCISE_SECTION_MAP
            if (selected_chapter_codes is None or m["chapter_code"] in selected_chapter_codes)
        ]

        for sec_idx, emap in enumerate(active_maps, start=1):
            ch_id = make_id("book_chapter", emap["chapter_code"])
            lesson_id = make_id("lesson", emap["lesson_code"])
            topic_id = make_id("grammar_topic", emap["lesson_code"])
            ex_start, ex_end = emap["ex_range"]
            ans_start, ans_end = emap["ans_range"]

            grp_code = f"{emap['lesson_code']}:EXGRP_{ex_start}"
            grp_id = make_id("exercise_group", grp_code)

            exercise_groups.append({
                "id": grp_id,
                "chapter_id": ch_id,
                "lesson_id": lesson_id,
                "topic_id": topic_id,
                "code": grp_code,
                "title": f"Exercises - {emap['lesson_code']}",
                "display_order": sec_idx,
                "source_file": self.parser.file_name,
                "start_line": ex_start,
                "end_line": ex_end,
                "answer_start_line": ans_start,
                "answer_end_line": ans_end,
            })

            if emap["multi_group"]:
                sub_ex_list = self._parse_multi_exercises(grp_id, lesson_id, topic_id, emap["lesson_code"], ex_start, ex_end)
            else:
                sub_ex_list = self._parse_single_exercise(grp_id, lesson_id, topic_id, emap["lesson_code"], ex_start, ex_end)

            for ex_obj, q_list, opt_list in sub_ex_list:
                exercises.append(ex_obj)
                questions.extend(q_list)
                question_options.extend(opt_list)

        return {
            "exercise_groups": exercise_groups,
            "exercises": exercises,
            "questions": questions,
            "question_options": question_options,
        }

    def _parse_single_exercise(
        self, grp_id: str, lesson_id: str, topic_id: str, lesson_code: str, start_line: int, end_line: int
    ) -> List[Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]]:
        # Find the instruction line (first non-empty line after # EXERCISES / # PRACTICE TEST)
        inst_line = start_line
        instruction = ""
        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s or s in ["# EXERCISES", "EXERCISES", "# PRACTICE TEST"]:
                continue
            instruction = s.strip("#* ")
            inst_line = lno
            break

        ex_code = f"{lesson_code}:EX_I"
        ex_id = make_id("exercise", ex_code)
        q_type = self.classify_question_type(instruction, lesson_code, "I")

        q_list, opt_list = self._extract_questions_in_range(
            ex_id, ex_code, q_type, inst_line + 1, end_line, lesson_code, "I"
        )

        ex_obj = {
            "id": ex_id,
            "exercise_group_id": grp_id,
            "lesson_id": lesson_id,
            "topic_id": topic_id,
            "code": ex_code,
            "roman_numeral": "I",
            "original_label": "I",
            "title": instruction,
            "instruction_en": instruction,
            "instruction_vi": None,
            "exercise_type": q_type,
            "display_order": 1,
            "question_count": len(q_list),
            "start_line": inst_line,
            "end_line": end_line,
            "has_numbering_anomaly": False,
            "anomaly_note": None,
        }
        return [(ex_obj, q_list, opt_list)]

    def _parse_multi_exercises(
        self, grp_id: str, lesson_id: str, topic_id: str, lesson_code: str, start_line: int, end_line: int
    ) -> List[Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]]:
        headers = []
        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue
            m = self.ROMAN_HEADER_RE.match(s)
            if m:
                roman = m.group(1)
                rest = m.group(2).strip().rstrip("*").strip()
                headers.append((lno, roman, rest, s))

        results = []
        seen_romans = {}
        ROMAN_LIST = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]

        for i, (h_line, roman, instruction, raw_h) in enumerate(headers):
            h_end = headers[i + 1][0] - 1 if i + 1 < len(headers) else end_line

            # Check if the instruction continues on the next line (e.g., Nouns III or Degrees IV)
            q_start = h_line + 1
            if q_start <= h_end:
                next_s = self.parser.lines[q_start - 1].strip()
                if next_s and not re.match(r"^(\d+[\.\)]|\(\d+\)|#\s*\d+\.|Ex\s*:|“|\"|How\s+\()", next_s):
                    # Check if it's a short continuation of instruction (like `*-s, -es*.` or `where necessary.`)
                    if len(next_s) < 65 and not next_s[0].isupper():
                        instruction = f"{instruction} {next_s.strip('* ')}"
                        q_start += 1

            # Detect duplicate Roman numeral anomaly (e.g., Relative Clauses has two `III` where the first is actually `II`)
            anomaly_note = None
            has_anomaly = False
            canonical_roman = roman
            if lesson_code == "CLAUSE_RELATIVE" and i == 1 and roman == "III":
                canonical_roman = "II"
                has_anomaly = True
                anomaly_note = "Source Markdown misprints Exercise II as '# III.' at line 3513; normalized to canonical II while preserving original_label='III'."
            elif roman in seen_romans:
                canonical_roman = ROMAN_LIST[i] if i < len(ROMAN_LIST) else f"{roman}_{i+1}"
                has_anomaly = True
                anomaly_note = f"Duplicate Roman numeral {roman} in source; mapped to {canonical_roman}."
            seen_romans[canonical_roman] = True

            ex_code = f"{lesson_code}:EX_{canonical_roman}"
            ex_id = make_id("exercise", ex_code)
            q_type = self.classify_question_type(instruction, lesson_code, canonical_roman)

            q_list, opt_list = self._extract_questions_in_range(
                ex_id, ex_code, q_type, q_start, h_end, lesson_code, canonical_roman
            )

            ex_obj = {
                "id": ex_id,
                "exercise_group_id": grp_id,
                "lesson_id": lesson_id,
                "topic_id": topic_id,
                "code": ex_code,
                "roman_numeral": canonical_roman,
                "original_label": roman,
                "title": instruction,
                "instruction_en": instruction,
                "instruction_vi": None,
                "exercise_type": q_type,
                "display_order": i + 1,
                "question_count": len(q_list),
                "start_line": h_line,
                "end_line": h_end,
                "has_numbering_anomaly": has_anomaly,
                "anomaly_note": anomaly_note,
            }
            results.append((ex_obj, q_list, opt_list))

        return results

    def classify_question_type(self, instruction: str, lesson_code: str, roman: str) -> str:
        """Map every exercise to one of the 12 canonical question types."""
        inst = instruction.lower()

        if lesson_code == "WORD_FORMS" or "word form" in inst:
            return "WORD_FORMATION"
        if "right or wrong" in inst or "correct them where necessary" in inst:
            return "ERROR_CORRECTION"
        if "vietnamese" in inst or "translate" in inst:
            return "TRANSLATION"
        if "correct position" in inst or "order" in inst and "adjective" in inst:
            return "SENTENCE_ARRANGEMENT"
        if "classify" in inst or "identify the function" in inst or "group them" in inst or "one from each group" in inst or "underline and identify" in inst:
            return "MATCHING"
        if "choose" in inst:
            return "MULTIPLE_CHOICE"
        if "make questions" in inst or "write the questions" in inst or "write these dates" in inst or "write these fractions" in inst:
            return "SHORT_ANSWER"
        if "rewrite" in inst or "beginning with" in inst or "means exactly the same" in inst or "same meaning" in inst:
            return "REWRITE_SENTENCES"
        if (
            "combine" in inst or "change " in inst or "replace " in inst or "reduce " in inst
            or "use unless" in inst or "without conjunctions" in inst or "make conditional" in inst
            or "make sentences" in inst or "make clauses" in inst or "indirect speech" in inst
            or "passive voice" in inst or "active voice" in inst or "turn the following" in inst
            or "join " in inst
        ):
            return "SENTENCE_TRANSFORMATION"
        if "complete the following sentences" in inst or "complete each of the following sentences" in inst or "read the situations and complete" in inst:
            return "COMPLETE_SENTENCES"
        if "question tag" in inst:
            return "COMPLETE_SENTENCES"
        return "FILL_IN_THE_BLANKS"

    def _extract_questions_in_range(
        self, ex_id: str, ex_code: str, q_type: str, start_line: int, end_line: int,
        lesson_code: str, roman: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        questions = []
        options = []

        # Special case 1: Passage / Word-list exercises without numbered items (Nouns I, II, III, IV; Quantifiers VII; Prepositions II)
        if (lesson_code == "POS_NOUNS" and roman in ["I", "II", "III", "IV"]) or \
           (lesson_code == "QUANT_SOME_ANY" and roman == "VII") or \
           (lesson_code == "POS_PREPOSITIONS" and roman == "II"):
            raw_passage = self.parser.slice_text(start_line, end_line).strip()
            q_code = f"{ex_code}:Q_1"
            q_id = make_id("question", q_code)
            blank_count = len(re.findall(r"\(\d+\)|\)\d+", raw_passage)) or 1
            questions.append({
                "id": q_id,
                "exercise_id": ex_id,
                "code": q_code,
                "question_number": 1,
                "original_number_label": "1",
                "sub_category": None,
                "question_type": q_type,
                "stem": raw_passage,
                "starter_prompt": None,
                "blank_count": blank_count,
                "root_word": None,
                "metadata": {"is_passage": True},
                "start_line": start_line,
                "end_line": end_line,
                "has_anomaly": False,
                "anomaly_note": None,
            })
            # If Quantifiers VII, extract inline options `(many/ much)1`
            if lesson_code == "QUANT_SOME_ANY" and roman == "VII":
                for m_opt in re.finditer(r"\(([^)]+)\)(\d+)", raw_passage):
                    choices = [c.strip() for c in m_opt.group(1).split("/")]
                    b_idx = int(m_opt.group(2))
                    for c_i, ch_text in enumerate(choices, start=1):
                        opt_code = f"{q_code}:B{b_idx}:OPT_{c_i}"
                        options.append({
                            "id": make_id("question_option", opt_code),
                            "question_id": q_id,
                            "blank_index": b_idx,
                            "option_label": chr(64 + c_i),
                            "option_text": ch_text,
                            "is_correct": False,
                            "display_order": c_i,
                        })
            return questions, options

        # Special case 2: Numerals II (`**1.** ![](data:image...) **2**. ![](data:image...)` on 2 lines!)
        if lesson_code == "POS_NUMERALS" and roman == "II":
            raw_block = self.parser.slice_text(start_line, end_line)
            pattern = re.compile(r"\*{0,2}(\d+)\.?\*{0,2}\.?\s*(!\[\]\(data:image/[^)]+\))")
            for m in pattern.finditer(raw_block):
                q_num = int(m.group(1))
                q_code = f"{ex_code}:Q_{q_num}"
                questions.append({
                    "id": make_id("question", q_code),
                    "exercise_id": ex_id,
                    "code": q_code,
                    "question_number": q_num,
                    "original_number_label": str(q_num),
                    "sub_category": None,
                    "question_type": q_type,
                    "stem": m.group(2),
                    "starter_prompt": None,
                    "blank_count": 1,
                    "root_word": None,
                    "metadata": {"contains_base64_image": True},
                    "start_line": start_line,
                    "end_line": end_line,
                    "has_anomaly": False,
                    "anomaly_note": None,
                })
            return questions, options

        # Special case 3: Numerals I (multi-column numbered items on same line: `1. 23/7/1919 3. 13/1/1063 5. 5/2/1761`)
        if lesson_code == "POS_NUMERALS" and roman == "I":
            raw_block = self.parser.slice_text(start_line, end_line)
            items = re.findall(r"(\d+)\.\s*([0-9/]+)", raw_block)
            for q_num_str, date_str in sorted(items, key=lambda x: int(x[0])):
                q_num = int(q_num_str)
                q_code = f"{ex_code}:Q_{q_num}"
                questions.append({
                    "id": make_id("question", q_code),
                    "exercise_id": ex_id,
                    "code": q_code,
                    "question_number": q_num,
                    "original_number_label": q_num_str,
                    "sub_category": None,
                    "question_type": q_type,
                    "stem": date_str.strip(),
                    "starter_prompt": None,
                    "blank_count": 1,
                    "root_word": None,
                    "metadata": {},
                    "start_line": start_line,
                    "end_line": end_line,
                    "has_anomaly": False,
                    "anomaly_note": None,
                })
            return questions, options

        # General numbered question extraction across lines
        current_sub_category = None
        current_q = None

        # Regex for question start: handles standard `1. text`, `9.I wish`, and OCR typo `35.1 (lose)`
        q_start_re = re.compile(r"^(\d+)\.(?:(1)\s+|\s*)(.+)$")
        sub_cat_re = re.compile(r"^(?:\#+\s*|\*{1,2})(\d+\.\s*[A-Za-z].+?)(?:\*{1,2})?$")

        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue

            # Ignore stray example or floating formula lines
            if s.startswith("Ex:") or s == "V (thường) + adv + enough":
                if s == "V (thường) + adv + enough" and current_q:
                    current_q["has_anomaly"] = True
                    current_q["anomaly_note"] = "Stray formula line 'V (thường) + adv + enough' from Word text-box anchor at L11311 skipped."
                continue

            # Check if this is a sub-category header in Passive Voice Exercise III (e.g. `**1. Yes - No questions:**` or `# 2. Wh- questions:`)
            if lesson_code == "PASSIVE_RULES" and roman == "III" and (s.startswith("#") or s.startswith("**")) and s.endswith(":"):
                current_sub_category = s.lstrip("#* ").rstrip("*: ")
                continue

            # Check if this is a word bank header line before question 1 (e.g., Adjectives III, V; Adverbs II, III, V; Degrees IV)
            if current_q is None and not re.match(r"^\d+\.", s):
                continue

            m_q = q_start_re.match(s)
            if m_q:
                if current_q is not None:
                    self._finalize_question(current_q, options)
                    questions.append(current_q)

                q_num = int(m_q.group(1))
                ocr_one = m_q.group(2)
                stem_text = m_q.group(3).strip()
                orig_label = f"{q_num}.1" if ocr_one else str(q_num)
                has_anom = False
                anom_note = None

                if ocr_one:
                    stem_text = f"I {stem_text}"
                    has_anom = True
                    anom_note = "OCR typo '35.1 (lose)' in source Markdown (pronoun 'I' merged as '.1'); preserved original_number_label='35.1'."
                elif re.match(r"^\d+\.[A-Za-z]", s):
                    has_anom = True
                    anom_note = f"Missing whitespace after question number period in '{s[:20]}'."

                q_code = f"{ex_code}:Q_{q_num}"
                current_q = {
                    "id": make_id("question", q_code),
                    "exercise_id": ex_id,
                    "code": q_code,
                    "question_number": q_num,
                    "original_number_label": orig_label,
                    "sub_category": current_sub_category,
                    "question_type": q_type,
                    "stem": stem_text,
                    "starter_prompt": None,
                    "blank_count": 1,
                    "root_word": None,
                    "metadata": {},
                    "start_line": lno,
                    "end_line": lno,
                    "has_anomaly": has_anom,
                    "anomaly_note": anom_note,
                    "_continuation_lines": [],
                }
            else:
                if current_q is not None:
                    current_q["_continuation_lines"].append(s)
                    current_q["end_line"] = lno

        if current_q is not None:
            self._finalize_question(current_q, options)
            questions.append(current_q)

        return questions, options

    def _finalize_question(self, q: Dict[str, Any], options: List[Dict[str, Any]]) -> None:
        cont = q.pop("_continuation_lines", [])
        q_type = q["question_type"]

        if cont:
            # In REWRITE_SENTENCES / SENTENCE_TRANSFORMATION, a short trailing line is the starter_prompt!
            if q_type in ("REWRITE_SENTENCES", "SENTENCE_TRANSFORMATION") and len(cont) == 1 and len(cont[0]) < 65:
                q["starter_prompt"] = cont[0]
            # In Adjectives I, continuation lines are sub-questions `a. ...`, `b. ...`, `c. ...`
            elif all(re.match(r"^[a-c]\.\s+", c) for c in cont):
                q["stem"] = q["stem"] + "\n" + "\n".join(cont)
                q["blank_count"] = len(cont)
                q["metadata"]["sub_items"] = cont
            else:
                q["stem"] = q["stem"] + "\n" + "\n".join(cont)

        stem = q["stem"]

        # Count blanks: numbered blanks `(1)`, `(2)` or underscore blanks `________` or parenthesized verbs `(sleep)`
        numbered_blanks = re.findall(r"\(\d+\)", stem)
        underscore_blanks = re.findall(r"_{2,}", stem)
        paren_groups = re.findall(r"\(([^)]+)\)", stem)

        if numbered_blanks:
            q["blank_count"] = len(numbered_blanks)
        elif underscore_blanks:
            q["blank_count"] = max(len(underscore_blanks), q["blank_count"])
        elif paren_groups and q_type in ("FILL_IN_THE_BLANKS", "MULTIPLE_CHOICE"):
            q["blank_count"] = len(paren_groups)

        # If WORD_FORMATION, extract root word from trailing parentheses `(curiosity)`
        if q_type == "WORD_FORMATION" and paren_groups:
            q["root_word"] = paren_groups[-1].strip()

        # If MULTIPLE_CHOICE, extract QuestionOptions from `(opt1/ opt2)`
        if q_type == "MULTIPLE_CHOICE" and paren_groups:
            for b_idx, p_text in enumerate(paren_groups, start=1):
                if "/" in p_text:
                    choices = [c.strip() for c in p_text.split("/") if c.strip()]
                    for c_i, ch_text in enumerate(choices, start=1):
                        opt_code = f"{q['code']}:B{b_idx}:OPT_{c_i}"
                        options.append({
                            "id": make_id("question_option", opt_code),
                            "question_id": q["id"],
                            "blank_index": b_idx,
                            "option_label": chr(64 + c_i),
                            "option_text": ch_text,
                            "is_correct": False,  # Updated when linking answers
                            "display_order": c_i,
                        })
