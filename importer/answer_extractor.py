"""
Answer Key Extractor and Question-Answer Linker.
Strictly enforces data integrity rules:
- Never invents missing answers.
- Preserves original answer text verbatim.
- Handles multi-column flattened answer blocks (where {1..N} appear in column-major order).
- Handles multi-blank cloze passage answers (mapping blank_index 1..K to the passage question).
- Extracts alternative acceptable answers (separated by '/' or parenthetical variants).
- Marks genuine source numbering typos/shifts as NEEDS_REVIEW (is_verified=False).
"""
import re
from typing import List, Dict, Any, Tuple, Optional
from .parser import MarkdownParser, make_id


class AnswerExtractor:
    """Extracts Answer Keys from ĐÁP ÁN sections and links them to Questions."""

    ROMAN_ANS_RE = re.compile(
        r"^(?:\#+\s*|\*{1,3})?(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|IIX)(?:\.\*{1,3}|\*{1,3}\.|\.)\s*(.*)$"
    )

    def __init__(self, parser: MarkdownParser):
        self.parser = parser

    def extract_and_link(
        self,
        exercise_groups: List[Dict[str, Any]],
        exercises: List[Dict[str, Any]],
        questions: List[Dict[str, Any]],
        question_options: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        question_answers = []
        answer_explanations = []
        unmapped_answer_entries = []

        ex_by_group: Dict[str, List[Dict[str, Any]]] = {}
        for ex in exercises:
            ex_by_group.setdefault(ex["exercise_group_id"], []).append(ex)

        q_by_ex: Dict[str, Dict[int, Dict[str, Any]]] = {}
        for q in questions:
            q_by_ex.setdefault(q["exercise_id"], {})[q["question_number"]] = q

        opts_by_q: Dict[str, List[Dict[str, Any]]] = {}
        for opt in question_options:
            opts_by_q.setdefault(opt["question_id"], []).append(opt)

        for grp in exercise_groups:
            grp_id = grp["id"]
            ans_start = grp["answer_start_line"]
            ans_end = grp["answer_end_line"]
            grp_exercises = sorted(ex_by_group.get(grp_id, []), key=lambda x: x["display_order"])

            if not grp_exercises:
                continue

            if len(grp_exercises) == 1 and grp["code"].split(":")[0] in (
                "EMPH_WRITING", "POS_ARTICLES", "WORD_FORMS", "WORD_IDIOMS",
                "REP_TYPES", "PRACTICE_SENTENCE_TRANSFORMATION", "SENT_BASIC_PATTERNS"
            ):
                ex = grp_exercises[0]
                q_map = q_by_ex.get(ex["id"], {})
                ans_items = self._parse_answer_block(
                    ex["code"], ans_start, ans_end, len(q_map)
                )
                self._link_answers_to_questions(
                    ex, q_map, opts_by_q, ans_items,
                    question_answers, answer_explanations, unmapped_answer_entries
                )
            else:
                sub_blocks = self._split_roman_answer_blocks(ans_start, ans_end)
                ex_by_roman = {ex["roman_numeral"]: ex for ex in grp_exercises}

                for roman_key, b_start, b_end, first_line_rest in sub_blocks:
                    canonical_roman = "VIII" if roman_key == "IIX" else roman_key
                    ex = ex_by_roman.get(canonical_roman)
                    if not ex:
                        continue
                    if roman_key == "IIX":
                        ex["has_numbering_anomaly"] = True
                        ex["anomaly_note"] = (ex.get("anomaly_note") or "") + " Answer key header misprinted as '**IIX.**' at line 5009."

                    q_map = q_by_ex.get(ex["id"], {})
                    ans_items = self._parse_answer_block(
                        ex["code"], b_start, b_end, len(q_map), first_line_rest=first_line_rest
                    )
                    self._link_answers_to_questions(
                        ex, q_map, opts_by_q, ans_items,
                        question_answers, answer_explanations, unmapped_answer_entries
                    )

        return {
            "question_answers": question_answers,
            "answer_explanations": answer_explanations,
            "unmapped_answer_entries": unmapped_answer_entries,
        }

    def _split_roman_answer_blocks(self, start_line: int, end_line: int) -> List[Tuple[str, int, int, str]]:
        headers = []
        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue
            m = self.ROMAN_ANS_RE.match(s)
            if m:
                headers.append((lno, m.group(1), m.group(2).strip()))

        blocks = []
        for i, (h_line, roman, rest) in enumerate(headers):
            b_end = headers[i + 1][0] - 1 if i + 1 < len(headers) else end_line
            blocks.append((roman, h_line, b_end, rest))
        return blocks

    def _parse_answer_block(
        self, ex_code: str, start_line: int, end_line: int, expected_count: int,
        first_line_rest: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Parse an answer block into individual numbered answer records with anomaly detection."""
        lesson_prefix = ex_code.split(":")[0]

        # Special Case A: Sequence of Tenses Exercise III (30 paragraphs, each with sub-answers 1..N)
        if ex_code == "SEQ_TIME_CLAUSES:EX_III":
            return self._parse_seq_tenses_ex_iii(start_line, end_line)

        # Special Case B: Nouns I, II, III, IV (single passage/word-list answer block)
        if ex_code in ("POS_NOUNS:EX_I", "POS_NOUNS:EX_II", "POS_NOUNS:EX_III", "POS_NOUNS:EX_IV"):
            raw_ans = self.parser.slice_text(start_line, end_line).strip()
            return [{
                "question_number": 1,
                "blank_index": 1,
                "original_label": "1",
                "raw_text": raw_ans,
                "line": start_line,
                "has_anomaly": False,
                "anomaly_note": None,
            }]

        # Special Case C: Sentences Exercise IV (`1. He /wrote /a letter.` followed by `# S V O`)
        if ex_code == "SENT_BASIC_PATTERNS:EX_IV":
            return self._parse_sentences_ex_iv(start_line, end_line)

        # Normalize known OCR spacing/dot omissions in source answer lines before tokenizing
        lines_to_scan: List[Tuple[int, str, bool, Optional[str]]] = []
        for lno in range(start_line, end_line + 1):
            raw_s = self.parser.lines[lno - 1].strip()
            if not raw_s:
                continue
            if lno == start_line and first_line_rest is not None:
                if first_line_rest:
                    lines_to_scan.append((lno, first_line_rest, False, None))
                continue
            if raw_s.startswith("#") or "ĐÁP ÁN" in raw_s:
                continue
            if raw_s.startswith("|") and raw_s.endswith("|"):
                cells = [c.strip() for c in raw_s.strip("|").split("|") if c.strip()]
                if all(re.match(r"^-+$", c.replace(" ", "")) for c in cells):
                    continue
                raw_s = " ".join(cells)
            lines_to_scan.append((lno, raw_s, False, None))

        # Tokenize numbered answers across lines
        # Handles:
        # - `11. am usually12. was – had been` (L1085 missing space before `12.`)
        # - `1.... why` (L4987, L5079 dot ellipsis right after `1.`)
        # - `3.13th January` (L12656 missing space after `3.`)
        # - Missing dot in `2 to go to the cinema` (L4211), `20 he` (L12261), `2 didn’t he?` (L14685)
        raw_entries: List[Dict[str, Any]] = []
        item_token_re = re.compile(
            r"(?:^|(?<=\s)|(?<=usually))\*{0,2}(\d{1,3})(?:\.(?:\*{0,2})?(?=\s|$|[A-Za-z0-9…\.‘“\(])|(?=\s+(?:to\s+go\s+to\s+the\s+cinema|he\b|didn’t\s+he\?)))"
        )

        # Determine if this exercise is a 1-per-line full-sentence answer key
        single_per_line_ex = ex_code in (
            "REP_TYPES:EX_I",
            "PASSIVE_RULES:EX_I",
            "PASSIVE_RULES:EX_II",
            "PASSIVE_RULES:EX_III",
            "EMPH_WRITING:EX_I",
            "STYLE_PATTERNS:EX_I",
            "STYLE_PATTERNS:EX_II",
            "STYLE_PATTERNS:EX_III",
            "PRACTICE_SENTENCE_TRANSFORMATION:EX_I",
        )

        for lno, s, _, _ in lines_to_scan:
            matches = list(item_token_re.finditer(s))
            if not matches:
                if raw_entries:
                    raw_entries[-1]["raw_text"] += " " + s
                continue

            valid_matches = []
            for m_idx, m in enumerate(matches):
                num_val = int(m.group(1))
                max_bound = 10 if ex_code in ("QUANT_SOME_ANY:EX_VII", "POS_PREPOSITIONS:EX_II") else max(expected_count + 5, 300)
                if num_val > max_bound or num_val == 0:
                    continue
                if single_per_line_ex and m_idx > 0:
                    continue
                valid_matches.append(m)

            if not valid_matches:
                if raw_entries:
                    raw_entries[-1]["raw_text"] += " " + s
                continue

            for idx, m in enumerate(valid_matches):
                num_str = m.group(1)
                matched_token = m.group(0)
                seg_start = m.end()
                seg_end = valid_matches[idx + 1].start() if idx + 1 < len(valid_matches) else len(s)
                ans_text = s[seg_start:seg_end].strip()

                # Check if token had missing period or missing space
                tok_anom = False
                tok_note = None
                if "." not in matched_token:
                    tok_anom = True
                    tok_note = f"Missing period after answer number '{num_str}' at line {lno} in source Markdown."
                elif lno in (1085, 12656):
                    tok_anom = True
                    tok_note = f"Missing space around answer number '{num_str}.' at line {lno} in source Markdown."

                raw_entries.append({
                    "printed_number": int(num_str),
                    "original_label": num_str,
                    "raw_text": ans_text,
                    "line": lno,
                    "has_anomaly": tok_anom,
                    "anomaly_note": tok_note,
                })

        # Special Case D: Cloze passage exercises where 1 question has K numbered blanks (Quantifiers VII, Prepositions II)
        if ex_code in ("QUANT_SOME_ANY:EX_VII", "POS_PREPOSITIONS:EX_II"):
            reconciled_cloze = []
            for entry in sorted(raw_entries, key=lambda x: x["printed_number"]):
                reconciled_cloze.append({
                    "question_number": 1,
                    "blank_index": entry["printed_number"],
                    "original_label": entry["original_label"],
                    "raw_text": entry["raw_text"],
                    "line": entry["line"],
                    "has_anomaly": entry["has_anomaly"],
                    "anomaly_note": entry["anomaly_note"],
                })
            return reconciled_cloze

        # Special Case E: EMPHASIS numbering shift (positions 38..43 printed as 35..40)
        if ex_code == "EMPH_WRITING:EX_I":
            return self._reconcile_emphasis_answers(raw_entries)

        # Check if raw_entries is a multi-column table where the exact set {1..expected_count} is present
        printed_set = {e["printed_number"] for e in raw_entries}
        if len(raw_entries) == expected_count and printed_set == set(range(1, expected_count + 1)):
            # Exact bijective match {1..N}! Sort by printed_number so column-major layout maps 1->Q1..N->QN
            raw_entries = sorted(raw_entries, key=lambda x: x["printed_number"])

        reconciled: List[Dict[str, Any]] = []
        for idx, entry in enumerate(raw_entries):
            expected_num = idx + 1
            printed_num = entry["printed_number"]
            has_anom = entry["has_anomaly"]
            anom_note = entry["anomaly_note"]

            if printed_num != expected_num and len(raw_entries) == expected_count:
                has_anom = True
                anom_note = (
                    f"Source answer key numbering typo at line {entry['line']}: printed as '{printed_num}.' "
                    f"at position {expected_num} of {expected_count}. Flagged for manual verification."
                )
                target_q_num = expected_num
            else:
                target_q_num = printed_num

            reconciled.append({
                "question_number": target_q_num,
                "blank_index": 1,
                "original_label": entry["original_label"],
                "raw_text": entry["raw_text"],
                "line": entry["line"],
                "has_anomaly": has_anom,
                "anomaly_note": anom_note,
            })

        return reconciled

    def _reconcile_emphasis_answers(self, raw_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        reconciled = []
        for idx, entry in enumerate(raw_entries):
            pos = idx + 1
            printed = entry["printed_number"]
            has_anom = (printed != pos) or entry["has_anomaly"]
            anom_note = entry["anomaly_note"]
            if printed != pos:
                anom_note = (
                    f"Source book numbering shift in Emphasis ĐÁP ÁN at line {entry['line']}: "
                    f"answer for Question {pos} is printed with number '{printed}.'. Flagged for manual review."
                )
            reconciled.append({
                "question_number": pos,
                "blank_index": 1,
                "original_label": entry["original_label"],
                "raw_text": entry["raw_text"],
                "line": entry["line"],
                "has_anomaly": has_anom,
                "anomaly_note": anom_note,
            })
        return reconciled

    def _parse_seq_tenses_ex_iii(self, start_line: int, end_line: int) -> List[Dict[str, Any]]:
        para_blocks: Dict[int, List[Tuple[int, str]]] = {}
        current_para = None
        para_start_re = re.compile(r"^\*{0,2}(\d{1,2})\.\*{0,2}\s+(.+)$")

        for lno in range(start_line + 1, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue
            m = para_start_re.match(s)
            if m:
                p_num = int(m.group(1))
                rest = m.group(2).strip()
                if p_num == 5 and current_para == 4 and not rest.startswith("1."):
                    para_blocks[4].append((lno, f"5. {rest}"))
                    continue
                current_para = p_num
                para_blocks.setdefault(current_para, []).append((lno, rest))
            elif current_para is not None:
                para_blocks[current_para].append((lno, s))

        results = []
        for p_num in sorted(para_blocks.keys()):
            lines_list = para_blocks[p_num]
            first_line = lines_list[0][0]
            combined = " ".join(txt for _, txt in lines_list)
            has_anom = (p_num == 4)
            anom_note = "Sub-blank 5 of paragraph 4 was bolded as '**5.** arranged' at line 1496 in source Markdown." if has_anom else None
            results.append({
                "question_number": p_num,
                "blank_index": 1,
                "original_label": str(p_num),
                "raw_text": combined,
                "line": first_line,
                "has_anomaly": has_anom,
                "anomaly_note": anom_note,
            })
        return results

    def _parse_sentences_ex_iv(self, start_line: int, end_line: int) -> List[Dict[str, Any]]:
        results = []
        current_item = None
        q_re = re.compile(r"^(?:\*\*IV\.\*\*\s*)?(\d+)\.\s*(.+)$")

        for lno in range(start_line, end_line + 1):
            s = self.parser.lines[lno - 1].strip()
            if not s:
                continue
            m = q_re.match(s)
            if m:
                if current_item:
                    results.append(current_item)
                q_num = int(m.group(1))
                current_item = {
                    "question_number": q_num,
                    "blank_index": 1,
                    "original_label": str(q_num),
                    "raw_text": m.group(2).strip(),
                    "line": lno,
                    "has_anomaly": False,
                    "anomaly_note": None,
                }
            elif current_item:
                clean_pat = s.lstrip("#* ").rstrip("* ").strip()
                current_item["raw_text"] += f" -> [{clean_pat}]"
                q_num = current_item["question_number"]
                if q_num == 11 and clean_pat == "A V O A":
                    current_item["has_anomaly"] = True
                    current_item["anomaly_note"] = "Source answer key prints '# A V O A' instead of '# S V O A' for 'They / treated / him / badly.' at line 14787."
                elif q_num == 12 and clean_pat == "S C O Co":
                    current_item["has_anomaly"] = True
                    current_item["anomaly_note"] = "Source answer key prints '# S C O Co' instead of '# S V O Co' for 'We / consider / him / the class leader.' at line 14791."
        if current_item:
            results.append(current_item)
        return results

    def _link_answers_to_questions(
        self,
        ex: Dict[str, Any],
        q_map: Dict[int, Dict[str, Any]],
        opts_by_q: Dict[str, List[Dict[str, Any]]],
        ans_items: List[Dict[str, Any]],
        question_answers: List[Dict[str, Any]],
        answer_explanations: List[Dict[str, Any]],
        unmapped_answer_entries: List[Dict[str, Any]],
    ) -> None:
        for item in ans_items:
            q_num = item["question_number"]
            b_idx = item.get("blank_index", 1)
            q = q_map.get(q_num)
            if not q:
                unmapped_answer_entries.append({
                    "exercise_code": ex["code"],
                    "printed_number": item["original_label"],
                    "raw_text": item["raw_text"],
                    "line": item["line"],
                })
                continue

            raw_text = item["raw_text"].strip("* ").strip()
            primary_ans, alt_answers = self._parse_alternatives(raw_text)

            is_verified = not (item["has_anomaly"] or q["has_anomaly"] or ex["has_numbering_anomaly"])
            verification_status = "VERIFIED" if is_verified else "NEEDS_REVIEW"
            review_note = item["anomaly_note"] or q["anomaly_note"] or ex["anomaly_note"]

            ans_code = f"{q['code']}:ANS_{b_idx}"
            ans_id = make_id("question_answer", ans_code)

            question_answers.append({
                "id": ans_id,
                "question_id": q["id"],
                "exercise_id": ex["id"],
                "code": ans_code,
                "blank_index": b_idx,
                "original_answer_text": item["raw_text"],
                "correct_answer": primary_ans,
                "alternative_answers": alt_answers,
                "is_verified": is_verified,
                "verification_status": verification_status,
                "review_note": review_note,
                "source_line": item["line"],
            })

            q_opts = opts_by_q.get(q["id"], [])
            if q_opts:
                ans_parts = [p.strip().lower() for p in re.split(r"[-–/]", primary_ans) if p.strip()]
                for opt in q_opts:
                    if opt["blank_index"] == b_idx or len(ans_parts) > 1:
                        if opt["option_text"].lower() in ans_parts or opt["option_text"].lower() == primary_ans.lower():
                            opt["is_correct"] = True

            exp_code = f"{ans_code}:EXP"
            answer_explanations.append({
                "id": make_id("answer_explanation", exp_code),
                "question_answer_id": ans_id,
                "question_id": q["id"],
                "grammar_rule_id": None,
                "explanation_vi": f"Đáp án gốc trong sách: {item['raw_text']}",
                "explanation_en": f"Original book answer key: {item['raw_text']}",
                "source_type": "BOOK_ANSWER_KEY",
                "is_verified": is_verified,
            })

    def _parse_alternatives(self, raw_text: str) -> Tuple[str, List[str]]:
        if not raw_text:
            return "∅ (No word needed)", ["", "∅"]

        alternatives = []
        if "/" in raw_text and "->" not in raw_text:
            parts = [p.strip() for p in raw_text.split("/") if p.strip()]
            if len(parts) > 1:
                primary = parts[0]
                alternatives.extend(parts[1:])
                return primary, alternatives

        paren_matches = re.findall(r"\(([^)]+)\)", raw_text)
        if paren_matches:
            base_clean = re.sub(r"\s*\([^)]+\)", "", raw_text).strip()
            alternatives.extend([m.strip() for m in paren_matches])
            return base_clean, alternatives

        return raw_text, alternatives
