"""
Milestone 2.5.7 & 2.5.8: Batch Pedagogical Explanation Validator, Knowledge Graph Seeder
& SQL Batch Generator for all 2,939 Practice Questions + 53 Concepts + 11 Error Categories.
Preserves all original educational content in data/ui/quiz_bank.json and data/ui/preview_data.json.
"""

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREVIEW_PATH = ROOT / "data" / "ui" / "preview_data.json"
QUIZ_PATH = ROOT / "data" / "ui" / "quiz_bank.json"
OUT_DIR = ROOT / "scratch" / "ingest_batches"

DIFFICULTY_LEVELS = {
    "Beginner": (1, 30),
    "Elementary": (2, 45),
    "Intermediate": (3, 60),
    "Advanced": (4, 90),
}

ERROR_CATEGORIES = [
    ("TENSE_CONFUSION", "Nhầm lẫn giữa các thì", "Nhầm lẫn mốc thời gian, tính liên tục hoặc thể của động từ trong câu.", 1, "TENSE_PRES_PERF", "Quan sát kỹ trạng từ chỉ thời gian (since, yesterday, next week, now) trước khi chia động từ.", "high"),
    ("SUBJECT_VERB_AGREEMENT", "Hòa hợp Chủ ngữ - Động từ", "Chia sai động từ theo số ít/số nhiều hoặc ngôi của chủ ngữ.", 1, "TENSE_PRES_SIMPLE", "Xác định rõ danh từ chính làm chủ ngữ trước các cụm giới từ để chọn s/es hoặc số nhiều.", "high"),
    ("WORD_FORM", "Sai từ loại (Danh/Động/Tính/Trạng)", "Sử dụng sai vị trí hoặc hậu tố của từ loại trong câu.", 8, "WORD_FORMS", "Nhìn từ đứng ngay trước và ngay sau chỗ trống để xác định từ loại cần điền.", "medium"),
    ("PREPOSITION_ERROR", "Sai giới từ (in/on/at/for/since...)", "Dùng sai giới từ chỉ thời gian, nơi chốn hoặc giới từ đi kèm động từ/tính từ.", 7, "POS_PREPOSITIONS", "Ghi nhớ các cụm cố định (collocations) như interested in, depend on, at night.", "medium"),
    ("ARTICLE_ERROR", "Sai mạo từ (a/an/the)", "Dùng sai mạo từ xác định 'the' hoặc mạo từ không xác định 'a/an'.", 7, "POS_ARTICLES", "Kiểm tra xem danh từ đã được nhắc đến trước đó hoặc có tính xác định duy nhất hay chưa.", "medium"),
    ("CONDITIONAL_ERROR", "Sai cấu trúc câu điều kiện", "Nhầm lẫn giữa câu điều kiện loại 0, 1, 2, 3 hoặc đảo ngữ.", 3, "CLAUSE_CONDITION", "Xác định mệnh đề IF hay mệnh đề chính, và xem giả định có thật ở hiện tại hay trái ngược quá khứ.", "high"),
    ("PASSIVE_VOICE_ERROR", "Sai thể bị động", "Quên chia động từ TO BE hoặc chia sai thì của câu bị động.", 10, "PASSIVE_RULES", "Câu bị động luôn bắt buộc phải có dạng 'TO BE + V3/V-ed'.", "high"),
    ("REPORTED_SPEECH_ERROR", "Sai quy tắc câu tường thuật", "Quên lùi thì động từ hoặc không đổi đại từ, trạng từ thời gian/nơi chốn.", 9, "REP_TYPES", "Kiểm tra động từ tường thuật ở quá khứ (said/told) để áp dụng ma trận lùi thì chuẩn.", "medium"),
    ("VOCABULARY_ERROR", "Nhầm lẫn nghĩa từ vựng & Cụm từ", "Hiểu sai nghĩa từ vựng hoặc chọn sai từ đồng nghĩa trong ngữ cảnh câu.", 8, "WORD_IDIOMS", "Dịch nghĩa toàn bộ câu sang tiếng Việt và chú ý sắc thái ngữ cảnh đi kèm.", "medium"),
    ("CONTEXT_MISUNDERSTANDING", "Hiểu sai ngữ cảnh câu", "Áp dụng quy tắc máy móc mà không xem xét ý nghĩa toàn câu hoặc mệnh đề phụ thuộc.", 2, "SEQ_MAIN_SUB", "Đọc trọn vẹn cả câu trước và sau dấu câu nối (but, however, although, so).", "medium"),
    ("UNKNOWN_ERROR", "Lỗi ngữ pháp tổng hợp", "Sai sót kiến thức tổng hợp hoặc nhầm lẫn cấu trúc câu nâng cao.", 12, "PRACTICE_SENTENCE_TRANSFORMATION", "Đọc lại 5 bước giải thích chuẩn hóa (Signal -> Rule -> Translation) để củng cố kiến thức gốc.", "low"),
]

PREREQUISITE_EDGES = [
    ("POS_PRONOUNS", "POS_NOUNS", "prerequisite", 1.00),
    ("POS_ARTICLES", "POS_NOUNS", "prerequisite", 1.00),
    ("POS_NUMERALS", "POS_NOUNS", "recommended", 0.70),
    ("POS_ADVERBS", "POS_ADJECTIVES", "prerequisite", 1.00),
    ("POS_PREPOSITIONS", "POS_NOUNS", "recommended", 0.70),
    ("POS_PREPOSITIONS", "POS_VERBS", "recommended", 0.70),
    ("POS_CONJUNCTIONS", "SENT_BASIC_PATTERNS", "prerequisite", 1.00),
    ("POS_COMPARISON", "POS_ADJECTIVES", "prerequisite", 1.00),
    ("POS_COMPARISON", "POS_ADVERBS", "prerequisite", 1.00),
    ("SENT_CLASSIFICATION_KINDS", "SENT_BASIC_PATTERNS", "prerequisite", 1.00),
    ("SENT_CLASSIFICATION_KINDS", "POS_CONJUNCTIONS", "prerequisite", 1.00),
    ("TENSE_PRES_SIMPLE", "POS_VERBS", "prerequisite", 1.00),
    ("TENSE_PRES_SIMPLE", "SENT_BASIC_PATTERNS", "prerequisite", 1.00),
    ("TENSE_PRES_CONT", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("TENSE_PAST_SIMPLE", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("TENSE_PAST_CONT", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("TENSE_PAST_CONT", "TENSE_PRES_CONT", "recommended", 0.70),
    ("TENSE_PRES_PERF", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("TENSE_PRES_PERF", "TENSE_PAST_SIMPLE", "contrast", 0.85),
    ("TENSE_PRES_PERF_CONT", "TENSE_PRES_PERF", "prerequisite", 1.00),
    ("TENSE_PRES_PERF_CONT", "TENSE_PRES_CONT", "recommended", 0.70),
    ("TENSE_PAST_PERF", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("TENSE_PAST_PERF", "TENSE_PRES_PERF", "prerequisite", 1.00),
    ("TENSE_PAST_PERF_CONT", "TENSE_PAST_PERF", "prerequisite", 1.00),
    ("TENSE_PAST_PERF_CONT", "TENSE_PAST_CONT", "recommended", 0.70),
    ("TENSE_FUT_SIMPLE", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("TENSE_NEAR_FUT", "TENSE_FUT_SIMPLE", "contrast", 0.85),
    ("TENSE_NEAR_FUT", "TENSE_PRES_CONT", "recommended", 0.70),
    ("TENSE_FUT_CONT", "TENSE_FUT_SIMPLE", "prerequisite", 1.00),
    ("TENSE_FUT_CONT", "TENSE_PRES_CONT", "recommended", 0.70),
    ("TENSE_FUT_PERF", "TENSE_FUT_SIMPLE", "prerequisite", 1.00),
    ("TENSE_FUT_PERF", "TENSE_PRES_PERF", "recommended", 0.70),
    ("TENSE_FUT_PERF_CONT", "TENSE_FUT_PERF", "prerequisite", 1.00),
    ("TENSE_FUT_PERF_CONT", "TENSE_FUT_CONT", "recommended", 0.70),
    ("SEQ_MAIN_SUB", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("SEQ_MAIN_SUB", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("SEQ_MAIN_SUB", "TENSE_PAST_PERF", "prerequisite", 1.00),
    ("SEQ_TIME_CLAUSES", "SEQ_MAIN_SUB", "prerequisite", 1.00),
    ("SEQ_TIME_CLAUSES", "TENSE_FUT_SIMPLE", "prerequisite", 1.00),
    ("CLAUSE_CONDITION", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("CLAUSE_CONDITION", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("CLAUSE_CONDITION", "TENSE_PAST_PERF", "prerequisite", 1.00),
    ("CLAUSE_CONDITION", "SEQ_MAIN_SUB", "recommended", 0.70),
    ("CLAUSE_WISH", "CLAUSE_CONDITION", "prerequisite", 1.00),
    ("CLAUSE_WISH", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("CLAUSE_WISH", "TENSE_PAST_PERF", "prerequisite", 1.00),
    ("CLAUSE_AS_IF_TIME_RATHER", "CLAUSE_WISH", "prerequisite", 1.00),
    ("CLAUSE_PURPOSE", "POS_CONJUNCTIONS", "prerequisite", 1.00),
    ("CLAUSE_RESULT", "POS_ADJECTIVES", "prerequisite", 1.00),
    ("CLAUSE_RESULT", "POS_ADVERBS", "recommended", 0.70),
    ("CLAUSE_REASON", "POS_CONJUNCTIONS", "prerequisite", 1.00),
    ("CLAUSE_CONCESSION", "CLAUSE_REASON", "contrast", 0.85),
    ("CLAUSE_NOUN", "SENT_CLASSIFICATION_KINDS", "prerequisite", 1.00),
    ("CLAUSE_NOUN", "POS_PRONOUNS", "prerequisite", 1.00),
    ("CLAUSE_RELATIVE", "POS_NOUNS", "prerequisite", 1.00),
    ("CLAUSE_RELATIVE", "POS_PRONOUNS", "prerequisite", 1.00),
    ("CLAUSE_RELATIVE", "SENT_CLASSIFICATION_KINDS", "recommended", 0.70),
    ("QUANT_SOME_ANY", "POS_NOUNS", "prerequisite", 1.00),
    ("QUANT_SOME_ANY", "POS_ARTICLES", "recommended", 0.70),
    ("QUANT_MOST", "QUANT_SOME_ANY", "prerequisite", 1.00),
    ("QUANT_MUCH_MANY", "POS_NOUNS", "prerequisite", 1.00),
    ("QUANT_FEW_LITTLE", "QUANT_MUCH_MANY", "prerequisite", 1.00),
    ("STYLE_PATTERNS", "SENT_BASIC_PATTERNS", "prerequisite", 1.00),
    ("STYLE_VERB_NOUN_PAIRS", "POS_NOUNS", "prerequisite", 1.00),
    ("STYLE_VERB_NOUN_PAIRS", "POS_VERBS", "prerequisite", 1.00),
    ("EMPH_PRONUNCIATION", "SENT_BASIC_PATTERNS", "recommended", 0.70),
    ("EMPH_WRITING", "SENT_CLASSIFICATION_KINDS", "prerequisite", 1.00),
    ("EMPH_WRITING", "POS_ADVERBS", "prerequisite", 1.00),
    ("WORD_FORMATIONS", "POS_NOUNS", "prerequisite", 1.00),
    ("WORD_FORMATIONS", "POS_VERBS", "prerequisite", 1.00),
    ("WORD_FORMATIONS", "POS_ADJECTIVES", "prerequisite", 1.00),
    ("WORD_FORMATIONS", "POS_ADVERBS", "prerequisite", 1.00),
    ("WORD_FORMS", "WORD_FORMATIONS", "prerequisite", 1.00),
    ("WORD_ACRONYMS", "WORD_FORMATIONS", "recommended", 0.70),
    ("WORD_IDIOMS", "WORD_FORMS", "recommended", 0.70),
    ("WORD_IDIOMS", "POS_PREPOSITIONS", "recommended", 0.70),
    ("REP_CHANGES", "SEQ_MAIN_SUB", "prerequisite", 1.00),
    ("REP_CHANGES", "POS_PRONOUNS", "prerequisite", 1.00),
    ("REP_CHANGES", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("REP_CHANGES", "TENSE_PAST_PERF", "prerequisite", 1.00),
    ("REP_TYPES", "REP_CHANGES", "prerequisite", 1.00),
    ("REP_TYPES", "SENT_CLASSIFICATION_KINDS", "prerequisite", 1.00),
    ("PASSIVE_RULES", "TENSE_PRES_SIMPLE", "prerequisite", 1.00),
    ("PASSIVE_RULES", "TENSE_PAST_SIMPLE", "prerequisite", 1.00),
    ("PASSIVE_RULES", "TENSE_PRES_PERF", "prerequisite", 1.00),
    ("PASSIVE_RULES", "POS_VERBS", "prerequisite", 1.00),
    ("PASSIVE_SPECIAL", "PASSIVE_RULES", "prerequisite", 1.00),
    ("PASSIVE_SPECIAL", "CLAUSE_NOUN", "recommended", 0.70),
    ("PRACTICE_SENTENCE_TRANSFORMATION", "CLAUSE_CONDITION", "prerequisite", 1.00),
    ("PRACTICE_SENTENCE_TRANSFORMATION", "PASSIVE_RULES", "prerequisite", 1.00),
    ("PRACTICE_SENTENCE_TRANSFORMATION", "REP_TYPES", "prerequisite", 1.00),
    ("PRACTICE_SENTENCE_TRANSFORMATION", "POS_COMPARISON", "prerequisite", 1.00),
    ("PRACTICE_SENTENCE_TRANSFORMATION", "CLAUSE_RELATIVE", "prerequisite", 1.00),
    ("PRACTICE_SENTENCE_TRANSFORMATION", "EMPH_WRITING", "recommended", 0.70),
]

TIME_KEYWORDS = [
    "since", "for", "yesterday", "ago", "last week", "now", "at the moment",
    "already", "just", "yet", "tomorrow", "if", "unless", "seldom", "always",
    "usually", "often", "never", "although", "despite", "because", "so that",
]


def sql_str(val):
    if val is None:
        return "NULL"
    s = str(val).replace("\x00", "")
    return "'" + s.replace("'", "''") + "'"


def sql_jsonb(obj):
    raw = json.dumps(obj, ensure_ascii=False).replace("\x00", "")
    return "'" + raw.replace("'", "''") + "'::jsonb"


def infer_difficulty(chapter_num, q_type):
    if chapter_num in (6, 9, 10, 12) or q_type == "SENTENCE_TRANSFORMATION":
        return "Intermediate"
    if chapter_num in (1, 4):
        return "Elementary"
    return "Intermediate"


def resolve_concept_and_error(q):
    topic_name = (q.get("topic_name") or "").lower()
    stem = (q.get("stem") or "").lower()
    instr = (q.get("instruction") or "").lower()
    combined = f"{topic_name} {instr} {stem}"

    if "thì" in topic_name and "phối hợp" not in topic_name:
        if "present continuous" in combined or "now" in combined or "at the moment" in combined:
            return "TENSE_PRES_CONT", "TENSE_CONFUSION"
        if "present perfect continuous" in combined:
            return "TENSE_PRES_PERF_CONT", "TENSE_CONFUSION"
        if "present perfect" in combined or "since" in combined or "already" in combined:
            return "TENSE_PRES_PERF", "TENSE_CONFUSION"
        if "past continuous" in combined:
            return "TENSE_PAST_CONT", "TENSE_CONFUSION"
        if "past perfect" in combined or "by the time" in combined:
            return "TENSE_PAST_PERF", "TENSE_CONFUSION"
        if "past" in combined or "yesterday" in combined or "ago" in combined:
            return "TENSE_PAST_SIMPLE", "TENSE_CONFUSION"
        if "future" in combined or "tomorrow" in combined:
            return "TENSE_FUT_SIMPLE", "TENSE_CONFUSION"
        return "TENSE_PRES_SIMPLE", "TENSE_CONFUSION"
    if "phối hợp" in topic_name:
        return ("SEQ_TIME_CLAUSES" if "time" in combined else "SEQ_MAIN_SUB"), "TENSE_CONFUSION"
    if "mệnh đề" in topic_name:
        if "wish" in combined or "if only" in combined:
            return "CLAUSE_WISH", "CONDITIONAL_ERROR"
        if "who" in combined or "which" in combined or "whose" in combined or "relative" in combined:
            return "CLAUSE_RELATIVE", "CONTEXT_MISUNDERSTANDING"
        if "in order" in combined or "so that" in combined or "purpose" in combined:
            return "CLAUSE_PURPOSE", "CONTEXT_MISUNDERSTANDING"
        if "such" in combined or "too" in combined or "enough" in combined:
            return "CLAUSE_RESULT", "CONTEXT_MISUNDERSTANDING"
        if "because" in combined or "reason" in combined:
            return "CLAUSE_REASON", "CONTEXT_MISUNDERSTANDING"
        if "although" in combined or "despite" in combined or "even though" in combined:
            return "CLAUSE_CONCESSION", "CONTEXT_MISUNDERSTANDING"
        if "as if" in combined or "would rather" in combined or "it's time" in combined:
            return "CLAUSE_AS_IF_TIME_RATHER", "CONDITIONAL_ERROR"
        return "CLAUSE_CONDITION", "CONDITIONAL_ERROR"
    if "số lượng" in topic_name:
        if "few" in combined or "little" in combined:
            return "QUANT_FEW_LITTLE", "VOCABULARY_ERROR"
        if "much" in combined or "many" in combined or "a lot" in combined:
            return "QUANT_MUCH_MANY", "VOCABULARY_ERROR"
        if "most" in combined:
            return "QUANT_MOST", "VOCABULARY_ERROR"
        return "QUANT_SOME_ANY", "VOCABULARY_ERROR"
    if "văn phong" in topic_name:
        return "STYLE_PATTERNS", "VOCABULARY_ERROR"
    if "nhấn mạnh" in topic_name:
        return ("EMPH_PRONUNCIATION" if "pronun" in combined or "stress" in combined else "EMPH_WRITING"), "CONTEXT_MISUNDERSTANDING"
    if "từ loại" in topic_name:
        if "article" in combined or "mạo từ" in combined or "a/an" in combined:
            return "POS_ARTICLES", "ARTICLE_ERROR"
        if "preposition" in combined or "giới từ" in combined:
            return "POS_PREPOSITIONS", "PREPOSITION_ERROR"
        if "compare" in combined or "so sánh" in combined or "than" in combined:
            return "POS_COMPARISON", "WORD_FORM"
        if "pronoun" in combined or "đại từ" in combined:
            return "POS_PRONOUNS", "WORD_FORM"
        if "adverb" in combined or "trạng từ" in combined:
            return "POS_ADVERBS", "WORD_FORM"
        if "adjective" in combined or "tính từ" in combined:
            return "POS_ADJECTIVES", "WORD_FORM"
        if "conjunction" in combined or "liên từ" in combined:
            return "POS_CONJUNCTIONS", "CONTEXT_MISUNDERSTANDING"
        if "verb" in combined or "modal" in combined or "động từ" in combined:
            return "POS_VERBS", "SUBJECT_VERB_AGREEMENT"
        return "POS_NOUNS", "WORD_FORM"
    if "từ vựng" in topic_name:
        if "idiom" in combined or "thành ngữ" in combined:
            return "WORD_IDIOMS", "VOCABULARY_ERROR"
        if "formation" in combined:
            return "WORD_FORMATIONS", "WORD_FORM"
        return "WORD_FORMS", "WORD_FORM"
    if "gián tiếp" in topic_name:
        return "REP_TYPES", "REPORTED_SPEECH_ERROR"
    if "bị động" in topic_name:
        return "PASSIVE_RULES", "PASSIVE_VOICE_ERROR"
    if "câu" in topic_name:
        return "SENT_CLASSIFICATION_KINDS", "CONTEXT_MISUNDERSTANDING"
    return "PRACTICE_SENTENCE_TRANSFORMATION", "UNKNOWN_ERROR"


def migrate_question_to_5_fields(q):
    qid = q.get("id") or "Q_UNKNOWN"
    topic_name = q.get("topic_name") or "Ngữ pháp tổng hợp"
    stem = q.get("stem") or ""
    answers = q.get("answers") or []
    correct = answers[0] if isinstance(answers, list) and answers else (q.get("answer") or "")
    raw_expl = q.get("explanation") or ""
    ped = q.get("pedagogy") or {}
    concept_id, error_cat = resolve_concept_and_error(q)

    # 1. Signal
    keywords = [kw for kw in TIME_KEYWORDS if kw in stem.lower()]
    if not keywords:
        keywords = ["context-clue"]
    grammar_clues = []
    if ped.get("signal"):
        grammar_clues.append(ped["signal"])
    elif "【Dấu hiệu & Ngữ cảnh】" in raw_expl:
        s_txt = raw_expl.split("【Dấu hiệu & Ngữ cảnh】")[1].split("【")[0].strip()
        grammar_clues.append(s_txt or f"Ngữ cảnh câu: {stem}")
    elif q.get("instruction"):
        grammar_clues.append(q["instruction"])
    else:
        grammar_clues.append(f"Dựa vào cấu trúc ngữ pháp và ngữ cảnh câu: {stem}")

    signal = {
        "keywords": keywords,
        "grammar_clues": grammar_clues,
        "identified_pattern": topic_name,
    }

    # 2. Rule
    formula = "S + V"
    rule_expl = ped.get("rule") or f"Áp dụng quy tắc chia theo chuyên đề {topic_name}."
    if not ped.get("rule") and "【Quy tắc & Công thức】" in raw_expl:
        r_txt = raw_expl.split("【Quy tắc & Công thức】")[1].split("【")[0].strip()
        if r_txt:
            rule_expl = r_txt
    m = re.search(r"(S\s*\+[^.\n]+)", rule_expl, re.IGNORECASE)
    if m:
        formula = m.group(1).strip()

    rule = {
        "topic": topic_name,
        "formula": formula,
        "explanation": rule_expl,
        "conditions": ["Phù hợp với mốc thời gian và ngữ cảnh của câu."],
        "exceptions": [],
    }

    # 3. Translation
    vietnamese = ped.get("translation") or ""
    if not vietnamese and "【Dịch nghĩa câu】" in raw_expl:
        vietnamese = raw_expl.split("【Dịch nghĩa câu】")[1].split("【")[0].strip()
    if not vietnamese:
        vietnamese = f"(Câu dịch tham khảo: {stem})"

    words = [w for w in re.sub(r"[^a-zA-Z\s]", "", stem).split() if len(w) > 4]
    seen = []
    for w in words:
        lw = w.lower()
        if lw not in seen:
            seen.append(lw)
        if len(seen) >= 3:
            break
    vocab = [{"word": w, "meaning": "Từ vựng trọng tâm trong câu"} for w in seen]

    translation = {
        "original": stem,
        "vietnamese": vietnamese,
        "vocabulary": vocab,
    }

    # 4. Common Mistakes
    common_mistakes = [
        {
            "mistake": f"Chọn nhầm dạng hoặc chia sai cấu trúc so với đáp án '{correct}'.",
            "reason": "Thường bỏ qua dấu hiệu nhận biết hoặc sự hòa hợp chủ-vị.",
            "correction": f"Đáp án chuẩn là '{correct}' ({formula}).",
            "prevention_tip": "Gạch chân từ nhận biết và chủ ngữ chính trước khi chọn đáp án.",
        }
    ]

    # 5. Exam Tips
    exam_tips = [
        {
            "strategy": f"Nhận diện nhanh quy tắc chuyên đề {topic_name}:",
            "example": f"Từ khóa gợi ý [{', '.join(keywords)}] -> áp dụng {formula}",
            "warning": "Kiểm tra thì động từ, thể chủ/bị động và số ít/số nhiều trước khi chốt.",
        }
    ]

    difficulty = "Intermediate"
    diff_score, est_secs = DIFFICULTY_LEVELS[difficulty]

    record = {
        "schema_version": "1.0",
        "question_id": str(qid),
        "topic_id": concept_id,
        "error_category": error_cat,
        "difficulty": difficulty,
        "difficulty_score": diff_score,
        "estimated_time_seconds": est_secs,
        "language": "vi",
        "signal": signal,
        "rule": rule,
        "translation": translation,
        "common_mistakes": common_mistakes,
        "exam_tips": exam_tips,
        "status": "published",
        "version": 1,
    }
    return record


def validate_5_field_explanation(data):
    errors = []
    if not data.get("question_id") or not isinstance(data["question_id"], str):
        errors.append("question_id")
    if data.get("difficulty") not in DIFFICULTY_LEVELS:
        errors.append("difficulty")
    sig = data.get("signal") or {}
    if not isinstance(sig.get("keywords"), list) or not isinstance(sig.get("grammar_clues"), list) or not isinstance(sig.get("identified_pattern"), str):
        errors.append("signal")
    rule = data.get("rule") or {}
    if not all(isinstance(rule.get(k), str) for k in ("topic", "formula", "explanation")):
        errors.append("rule_str")
    if not isinstance(rule.get("conditions"), list) or not isinstance(rule.get("exceptions"), list):
        errors.append("rule_arr")
    tr = data.get("translation") or {}
    if not isinstance(tr.get("original"), str) or not isinstance(tr.get("vietnamese"), str) or not isinstance(tr.get("vocabulary"), list):
        errors.append("translation")
    cms = data.get("common_mistakes")
    if not isinstance(cms, list) or not all(cm.get("mistake") and cm.get("reason") and cm.get("correction") and cm.get("prevention_tip") for cm in cms):
        errors.append("common_mistakes")
    ets = data.get("exam_tips")
    if not isinstance(ets, list) or not all(et.get("strategy") and et.get("example") and et.get("warning") for et in ets):
        errors.append("exam_tips")
    return len(errors) == 0, errors


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    preview = json.load(open(PREVIEW_PATH, encoding="utf-8"))
    quiz = json.load(open(QUIZ_PATH, encoding="utf-8"))

    # 1. Seed 53 Concepts + Edges + 11 Error Categories
    concepts_rows = []
    concept_nodes = {}
    for ch in preview.get("chapters", []):
        for lesson in ch.get("lessons", []):
            code = lesson["code"]
            ch_num = ch["number"]
            diff = "Beginner" if ch_num == 7 or code in ("SENT_BASIC_PATTERNS", "TENSE_PRES_SIMPLE", "TENSE_PRES_CONT", "TENSE_PAST_SIMPLE") else (
                "Elementary" if ch_num in (1, 4) else (
                    "Advanced" if ch_num in (6, 12) or code == "PASSIVE_SPECIAL" else "Intermediate"
                )
            )
            concept_nodes[code] = lesson["id"]
            concepts_rows.append(
                f"({sql_str(code)}, {ch_num}, {sql_str(ch['code'])}, {sql_str(lesson['id'])}, {sql_str(code)}, {sql_str(lesson['title_vi'])}, {sql_str(lesson.get('title_en') or '')}, {sql_str('Chuyên đề ' + ch['title_vi'] + ' - ' + lesson['title_vi'])}, {len(lesson.get('sections', []))}, {sql_str(diff)})"
            )

    edge_rows = []
    for cid, pid, rtype, weight in PREREQUISITE_EDGES:
        if cid in concept_nodes and pid in concept_nodes:
            edge_rows.append(f"({sql_str(cid)}, {sql_str(pid)}, {sql_str(rtype)}, {weight:.2f})")

    err_rows = []
    for code, label, desc, chap, lcode, tip, sev in ERROR_CATEGORIES:
        err_rows.append(f"({sql_str(code)}, {sql_str(label)}, {sql_str(desc)}, {chap}, {sql_str(lcode)}, {sql_str(tip)}, {sql_str(sev)})")

    seed_sql = (
        "INSERT INTO public.concepts (id, chapter_number, chapter_code, lesson_id, lesson_code, title_vi, title_en, description, section_count, difficulty_level) VALUES\n"
        + ",\n".join(concepts_rows)
        + "\nON CONFLICT (id) DO UPDATE SET title_vi = EXCLUDED.title_vi, title_en = EXCLUDED.title_en, section_count = EXCLUDED.section_count, updated_at = now();\n\n"
        + "INSERT INTO public.concept_dependencies (concept_id, prerequisite_concept_id, relationship_type, weight) VALUES\n"
        + ",\n".join(edge_rows)
        + "\nON CONFLICT (concept_id, prerequisite_concept_id) DO UPDATE SET relationship_type = EXCLUDED.relationship_type, weight = EXCLUDED.weight;\n\n"
        + "INSERT INTO public.error_taxonomy_registry (code, label_vi, description, remedial_chapter, remedial_lesson_code, remedial_tip, severity) VALUES\n"
        + ",\n".join(err_rows)
        + "\nON CONFLICT (code) DO UPDATE SET label_vi = EXCLUDED.label_vi, description = EXCLUDED.description, remedial_tip = EXCLUDED.remedial_tip;\n"
    )
    (OUT_DIR / "01_seed_concepts_kg_taxonomy.sql").write_text(seed_sql, encoding="utf-8")

    # 2. Validate and migrate ALL 2,939 questions
    all_questions = []
    for t in quiz.get("topics", []):
        all_questions.extend(t.get("questions", []))

    seen_qids = set()
    migrated = []
    invalid_count = 0
    for q in all_questions:
        rec = migrate_question_to_5_fields(q)
        if rec["question_id"] in seen_qids:
            continue
        seen_qids.add(rec["question_id"])
        ok, errs = validate_5_field_explanation(rec)
        if not ok:
            invalid_count += 1
        migrated.append(rec)

    print(f"Concepts seeded: {len(concepts_rows)}")
    print(f"DAG Edges seeded: {len(edge_rows)}")
    print(f"Error Categories: {len(err_rows)}")
    print(f"Total Questions Validated: {len(migrated)} | Invalid: {invalid_count}")

    # Compact SQL batches using jsonb_to_recordset (cuts repeated boilerplate completely)
    batch_size = 500
    batch_files = []
    for i in range(0, len(migrated), batch_size):
        chunk = migrated[i : i + batch_size]
        idx = (i // batch_size) + 1
        compact_rows = []
        for r in chunk:
            lid = concept_nodes.get(r["topic_id"], "")
            compact_rows.append({
                "qid": r["question_id"],
                "tid": r["topic_id"],
                "ec": r["error_category"],
                "lid": lid,
                "kw": r["signal"]["keywords"],
                "gc": r["signal"]["grammar_clues"],
                "pat": r["signal"]["identified_pattern"],
                "f": r["rule"]["formula"],
                "re": r["rule"]["explanation"],
                "st": r["translation"]["original"],
                "vi": r["translation"]["vietnamese"],
                "vb": [v["word"] for v in r["translation"]["vocabulary"]],
                "cmm": r["common_mistakes"][0]["mistake"],
                "cmc": r["common_mistakes"][0]["correction"],
                "ete": r["exam_tips"][0]["example"],
            })

        payload_json = sql_jsonb(compact_rows)
        batch_sql = f"""WITH src AS (
  SELECT * FROM jsonb_to_recordset({payload_json}) AS t(
    qid text, tid text, ec text, lid text,
    kw jsonb, gc jsonb, pat text,
    f text, re text,
    st text, vi text, vb jsonb,
    cmm text, cmc text, ete text
  )
),
ins_expl AS (
  INSERT INTO public.explanations (
    question_id, topic_id, schema_version, difficulty, difficulty_score, estimated_time_seconds,
    language, signal, rule, translation, common_mistakes, exam_tips, status, version
  )
  SELECT
    qid, tid, '1.0', 'Intermediate', 3, 60, 'vi',
    jsonb_build_object('keywords', kw, 'grammar_clues', gc, 'identified_pattern', pat),
    jsonb_build_object('topic', pat, 'formula', f, 'explanation', re, 'conditions', jsonb_build_array('Phù hợp với mốc thời gian và ngữ cảnh của câu.'), 'exceptions', '[]'::jsonb),
    jsonb_build_object(
      'original', st,
      'vietnamese', vi,
      'vocabulary', COALESCE((SELECT jsonb_agg(jsonb_build_object('word', w, 'meaning', 'Từ vựng trọng tâm trong câu')) FROM jsonb_array_elements_text(vb) AS w), '[]'::jsonb)
    ),
    jsonb_build_array(jsonb_build_object(
      'mistake', cmm,
      'reason', 'Thường bỏ qua dấu hiệu nhận biết hoặc sự hòa hợp chủ-vị.',
      'correction', cmc,
      'prevention_tip', 'Gạch chân từ nhận biết và chủ ngữ chính trước khi chọn đáp án.'
    )),
    jsonb_build_array(jsonb_build_object(
      'strategy', 'Nhận diện nhanh quy tắc chuyên đề ' || pat || ':',
      'example', ete,
      'warning', 'Kiểm tra thì động từ, thể chủ/bị động và số ít/số nhiều trước khi chốt.'
    )),
    'published', 1
  FROM src
  ON CONFLICT (question_id, difficulty, version) DO UPDATE SET
    signal = EXCLUDED.signal,
    rule = EXCLUDED.rule,
    translation = EXCLUDED.translation,
    common_mistakes = EXCLUDED.common_mistakes,
    exam_tips = EXCLUDED.exam_tips,
    updated_at = now()
)
INSERT INTO public.question_concepts (
  question_id, primary_topic, concept_id, concept_name, related_topics, tested_concepts, error_categories, lesson_id, weight
)
SELECT
  qid, tid, tid, pat, jsonb_build_array(tid), jsonb_build_array(tid), jsonb_build_array(ec), lid, 1.00
FROM src
ON CONFLICT (question_id, concept_id) DO UPDATE SET
  error_categories = EXCLUDED.error_categories,
  lesson_id = EXCLUDED.lesson_id;
"""
        fname = OUT_DIR / f"02_batch_{idx}.sql"
        fname.write_text(batch_sql, encoding="utf-8")
        batch_files.append(fname.name)

    print("Generated SQL batches:", batch_files)


if __name__ == "__main__":
    main()
