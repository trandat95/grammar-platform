"""
Chapter and Topic Extractor for Ngữ pháp tiếng Anh - Mai Lan Hương & Hà Thanh Uyên.
Preserves exact book structure while mapping to hierarchical Grammar Categories and Topics.
"""
from typing import List, Dict, Any
from .parser import MarkdownParser, make_id, compute_checksum


# Canonical Book Chapter & Topic catalog grounded in full 16,559-line audit
CHAPTER_CATALOG = [
    {
        "chapter_number": 1,
        "code": "CH01_TENSES",
        "title_en": "Tenses",
        "title_vi": "Các thì",
        "original_heading": "# TENSES (CÁC THÌ)",
        "category_code": "CAT_VERBS_TENSES",
        "category_name_en": "Verbs & Tenses",
        "category_name_vi": "Động từ và Các thì",
        "start_line": 1,
        "end_line": 1152,
        "theory_ranges": [(1, 474)],
        "exercise_ranges": [(475, 958)],
        "answer_ranges": [(959, 1152)],
        "subtopics": [
            {"code": "TENSE_PRES_SIMPLE", "title_en": "The Present Simple Tense", "title_vi": "Thì hiện tại đơn", "start_line": 3, "end_line": 72},
            {"code": "TENSE_PRES_CONT", "title_en": "The Present Continuous Tense", "title_vi": "Thì hiện tại tiếp diễn", "start_line": 73, "end_line": 116},
            {"code": "TENSE_PRES_PERF", "title_en": "The Present Perfect Tense", "title_vi": "Thì hiện tại hoàn thành", "start_line": 117, "end_line": 184},
            {"code": "TENSE_PRES_PERF_CONT", "title_en": "The Present Perfect Continuous Tense", "title_vi": "Thì hiện tại hoàn thành tiếp diễn", "start_line": 185, "end_line": 210},
            {"code": "TENSE_PAST_SIMPLE", "title_en": "The Past Simple Tense", "title_vi": "Thì quá khứ đơn", "start_line": 211, "end_line": 262},
            {"code": "TENSE_PAST_CONT", "title_en": "The Past Continuous Tense", "title_vi": "Thì quá khứ tiếp diễn", "start_line": 263, "end_line": 310},
            {"code": "TENSE_PAST_PERF", "title_en": "The Past Perfect Tense", "title_vi": "Thì quá khứ hoàn thành / Tiền quá khứ", "start_line": 311, "end_line": 330},
            {"code": "TENSE_PAST_PERF_CONT", "title_en": "The Past Perfect Continuous Tense", "title_vi": "Thì quá khứ hoàn thành tiếp diễn", "start_line": 331, "end_line": 344},
            {"code": "TENSE_FUT_SIMPLE", "title_en": "The Simple Future Tense", "title_vi": "Thì tương lai đơn", "start_line": 345, "end_line": 380},
            {"code": "TENSE_NEAR_FUT", "title_en": "Near Future", "title_vi": "Tương lai gần", "start_line": 381, "end_line": 414},
            {"code": "TENSE_FUT_CONT", "title_en": "The Future Continuous Tense", "title_vi": "Thì tương lai tiếp diễn", "start_line": 415, "end_line": 432},
            {"code": "TENSE_FUT_PERF", "title_en": "The Future Perfect Tense", "title_vi": "Thì tương lai hoàn thành", "start_line": 433, "end_line": 452},
            {"code": "TENSE_FUT_PERF_CONT", "title_en": "The Future Perfect Continuous Tense", "title_vi": "Thì tương lai hoàn thành tiếp diễn", "start_line": 453, "end_line": 474},
        ],
    },
    {
        "chapter_number": 2,
        "code": "CH02_SEQUENCE_OF_TENSES",
        "title_en": "Sequence of Tenses",
        "title_vi": "Sự phối hợp các thì",
        "original_heading": "# SEQUENCE OF TENSES (SỰ PHỐI HỢP CÁC THÌ)",
        "category_code": "CAT_VERBS_TENSES",
        "category_name_en": "Verbs & Tenses",
        "category_name_vi": "Động từ và Các thì",
        "start_line": 1153,
        "end_line": 1613,
        "theory_ranges": [(1153, 1227)],
        "exercise_ranges": [(1228, 1449)],
        "answer_ranges": [(1450, 1613)],
        "subtopics": [
            {"code": "SEQ_MAIN_SUB", "title_en": "Main Clause and Subordinate Clause", "title_vi": "Sự phối hợp trong mệnh đề chính và mệnh đề phụ", "start_line": 1159, "end_line": 1178},
            {"code": "SEQ_TIME_CLAUSES", "title_en": "Main Clause and Adverbial Clause of Time", "title_vi": "Sự phối hợp trong mệnh đề chính và mệnh đề trạng ngữ chỉ thời gian", "start_line": 1179, "end_line": 1227},
        ],
    },
    {
        "chapter_number": 3,
        "code": "CH03_CLAUSES_AND_PHRASES",
        "title_en": "Clauses and Phrases",
        "title_vi": "Mệnh đề và Cụm từ",
        "original_heading": "# CLAUSES AND PHRASES (MỆNH ĐỀ VÀ CỤM TỪ)",
        "category_code": "CAT_CLAUSES_PHRASES",
        "category_name_en": "Clauses & Phrases",
        "category_name_vi": "Mệnh đề và Cụm từ",
        "start_line": 1614,
        "end_line": 5098,
        "theory_ranges": [
            (1614, 1692), (1865, 1922), (1999, 2114), (2255, 2356),
            (2627, 2656), (2759, 2796), (2925, 3028), (3115, 3150), (3253, 3448)
        ],
        "exercise_ranges": [
            (1693, 1864), (1923, 1998), (2115, 2254), (2357, 2626),
            (2657, 2758), (2797, 2924), (3029, 3114), (3151, 3252), (3449, 3920)
        ],
        "answer_ranges": [(3921, 5098)],
        "subtopics": [
            {"code": "CLAUSE_CONDITION", "title_en": "Clauses of Condition", "title_vi": "Mệnh đề chỉ điều kiện", "start_line": 1614, "end_line": 1864, "theory_end": 1692, "ex_start": 1693, "ans_range": (3921, 4046)},
            {"code": "CLAUSE_WISH", "title_en": "Clauses after Wish, If Only", "title_vi": "Mệnh đề sau Wish, If Only", "start_line": 1865, "end_line": 1998, "theory_end": 1922, "ex_start": 1923, "ans_range": (4047, 4104)},
            {"code": "CLAUSE_PURPOSE", "title_en": "Phrases and Clauses of Purpose", "title_vi": "Cụm từ và mệnh đề chỉ mục đích", "start_line": 1999, "end_line": 2254, "theory_end": 2114, "ex_start": 2115, "ans_range": (4105, 4226)},
            {"code": "CLAUSE_RESULT", "title_en": "Phrases and Clauses of Result", "title_vi": "Cụm từ và mệnh đề chỉ kết quả", "start_line": 2255, "end_line": 2626, "theory_end": 2356, "ex_start": 2357, "ans_range": (4227, 4410)},
            {"code": "CLAUSE_REASON", "title_en": "Phrases and Clauses of Reason", "title_vi": "Cụm từ và mệnh đề chỉ lý do", "start_line": 2627, "end_line": 2758, "theory_end": 2656, "ex_start": 2657, "ans_range": (4411, 4490)},
            {"code": "CLAUSE_CONCESSION", "title_en": "Phrases and Clauses of Concession", "title_vi": "Cụm từ và mệnh đề chỉ sự nhượng bộ", "start_line": 2759, "end_line": 2924, "theory_end": 2796, "ex_start": 2797, "ans_range": (4491, 4614)},
            {"code": "CLAUSE_AS_IF_TIME_RATHER", "title_en": "Clauses after As If, As Though, It's High Time, Would Rather", "title_vi": "Mệnh đề sau As If, As Though, It's Time, Would Rather", "start_line": 2925, "end_line": 3114, "theory_end": 3028, "ex_start": 3029, "ans_range": (4615, 4668)},
            {"code": "CLAUSE_NOUN", "title_en": "Noun Clauses", "title_vi": "Mệnh đề danh từ", "start_line": 3115, "end_line": 3252, "theory_end": 3150, "ex_start": 3151, "ans_range": (4669, 4712)},
            {"code": "CLAUSE_RELATIVE", "title_en": "Relative Clauses", "title_vi": "Mệnh đề quan hệ", "start_line": 3253, "end_line": 3920, "theory_end": 3448, "ex_start": 3449, "ans_range": (4713, 5098)},
        ],
    },
    {
        "chapter_number": 4,
        "code": "CH04_EXPRESSION_OF_QUANTITY",
        "title_en": "Expression of Quantity",
        "title_vi": "Sự diễn tả về số lượng",
        "original_heading": "# EXPRESSION OF QUANTITY (SỰ DIỄN TẢ VỀ SỐ LƯỢNG)",
        "category_code": "CAT_DETERMINERS_QUANTIFIERS",
        "category_name_en": "Determiners & Quantifiers",
        "category_name_vi": "Từ hạn định và Lượng từ",
        "start_line": 5099,
        "end_line": 5524,
        "theory_ranges": [(5099, 5240)],
        "exercise_ranges": [(5241, 5448)],
        "answer_ranges": [(5449, 5524)],
        "subtopics": [
            {"code": "QUANT_SOME_ANY", "title_en": "Some / Any", "title_vi": "Some / Any (một ít, một vài)", "start_line": 5103, "end_line": 5130},
            {"code": "QUANT_MOST", "title_en": "Most / Most of", "title_vi": "Most / Most of (phần lớn, đa số)", "start_line": 5131, "end_line": 5162},
            {"code": "QUANT_MUCH_MANY", "title_en": "Much, Many, A great deal of, A large number of, A lot of", "title_vi": "Much, Many, A great deal of, A lot of (nhiều)", "start_line": 5163, "end_line": 5206},
            {"code": "QUANT_FEW_LITTLE", "title_en": "Few, A Few, Little, A Little", "title_vi": "Few, A Few, Little, A Little (ít, một ít, một vài)", "start_line": 5207, "end_line": 5240},
        ],
    },
    {
        "chapter_number": 5,
        "code": "CH05_STYLES",
        "title_en": "Styles",
        "title_vi": "Văn phong",
        "original_heading": "# STYLES (VĂN PHONG)",
        "category_code": "CAT_SENTENCE_TRANSFORM_STYLE",
        "category_name_en": "Sentence Structure, Voice & Style",
        "category_name_vi": "Cấu trúc câu, Thể và Văn phong",
        "start_line": 5525,
        "end_line": 6086,
        "theory_ranges": [(5525, 5696)],
        "exercise_ranges": [(5697, 5944)],
        "answer_ranges": [(5945, 6086)],
        "subtopics": [
            {"code": "STYLE_PATTERNS", "title_en": "Stylistic Sentence Patterns", "title_vi": "Các cách diễn đạt câu văn", "start_line": 5525, "end_line": 5608},
            {"code": "STYLE_VERB_NOUN_PAIRS", "title_en": "Verb and Noun Equivalence Expressions", "title_vi": "Một số từ được sử dụng dưới dạng động từ và danh từ", "start_line": 5609, "end_line": 5696},
        ],
    },
    {
        "chapter_number": 6,
        "code": "CH06_EMPHASIS",
        "title_en": "Emphasis",
        "title_vi": "Dạng nhấn mạnh",
        "original_heading": "# EMPHASIS (DẠNG NHẤN MẠNH)",
        "category_code": "CAT_SENTENCE_TRANSFORM_STYLE",
        "category_name_en": "Sentence Structure, Voice & Style",
        "category_name_vi": "Cấu trúc câu, Thể và Văn phong",
        "start_line": 6087,
        "end_line": 6376,
        "theory_ranges": [(6087, 6170)],
        "exercise_ranges": [(6171, 6274)],
        "answer_ranges": [(6275, 6376)],
        "subtopics": [
            {"code": "EMPH_PRONUNCIATION", "title_en": "Emphasis in Pronunciation", "title_vi": "Nhấn mạnh trong phát âm", "start_line": 6095, "end_line": 6100},
            {"code": "EMPH_WRITING", "title_en": "Emphasis in Writing (Verbs, Adjectives, Cleft Sentences, Commands)", "title_vi": "Nhấn mạnh trong cách viết", "start_line": 6101, "end_line": 6170},
        ],
    },
    {
        "chapter_number": 7,
        "code": "CH07_PARTS_OF_SPEECH",
        "title_en": "The Parts of Speech",
        "title_vi": "Từ loại",
        "original_heading": "# THE PARTS OF SPEECH (TỪ LOẠI)",
        "category_code": "CAT_PARTS_OF_SPEECH",
        "category_name_en": "Parts of Speech",
        "category_name_vi": "Từ loại",
        "start_line": 6377,
        "end_line": 10762,
        "theory_ranges": [
            (6377, 6776), (6875, 7178), (7367, 7592), (7815, 7974), (8131, 8294),
            (8485, 8970), (9181, 9242), (9257, 9818), (10389, 10448), (10507, 10674)
        ],
        "exercise_ranges": [
            (6777, 6874), (7179, 7366), (7593, 7814), (7975, 8130), (8295, 8484),
            (8971, 9180), (9243, 9256), (9819, 10388), (10449, 10506), (10675, 10762)
        ],
        "answer_ranges": [(12121, 12832)],
        "subtopics": [
            {"code": "POS_NOUNS", "title_en": "Nouns & Subject-Verb Agreement", "title_vi": "Danh từ", "start_line": 6381, "end_line": 6874, "theory_end": 6776, "ex_start": 6777, "ans_range": (12121, 12252)},
            {"code": "POS_PRONOUNS", "title_en": "Pronouns", "title_vi": "Đại từ", "start_line": 6875, "end_line": 7366, "theory_end": 7178, "ex_start": 7179, "ans_range": (12253, 12318)},
            {"code": "POS_ADJECTIVES", "title_en": "Adjectives", "title_vi": "Tính từ", "start_line": 7367, "end_line": 7814, "theory_end": 7592, "ex_start": 7593, "ans_range": (12319, 12396)},
            {"code": "POS_ADVERBS", "title_en": "Adverbs & Inversion", "title_vi": "Trạng từ", "start_line": 7815, "end_line": 8130, "theory_end": 7974, "ex_start": 7975, "ans_range": (12397, 12468)},
            {"code": "POS_COMPARISON", "title_en": "Degrees of Comparison of Adjectives and Adverbs", "title_vi": "Các mức độ so sánh của tính từ và trạng từ", "start_line": 8131, "end_line": 8484, "theory_end": 8294, "ex_start": 8295, "ans_range": (12469, 12548)},
            {"code": "POS_VERBS", "title_en": "Verbs (Infinitives, Gerunds, Participles & Modals)", "title_vi": "Động từ", "start_line": 8485, "end_line": 9180, "theory_end": 8970, "ex_start": 8971, "ans_range": (12549, 12652)},
            {"code": "POS_NUMERALS", "title_en": "Numerals", "title_vi": "Số từ", "start_line": 9181, "end_line": 9256, "theory_end": 9242, "ex_start": 9243, "ans_range": (12653, 12672)},
            {"code": "POS_PREPOSITIONS", "title_en": "Prepositions & Phrasal Combinations", "title_vi": "Giới từ", "start_line": 9257, "end_line": 10388, "theory_end": 9818, "ex_start": 9819, "ans_range": (12673, 12772)},
            {"code": "POS_CONJUNCTIONS", "title_en": "Conjunctions", "title_vi": "Liên từ", "start_line": 10389, "end_line": 10506, "theory_end": 10448, "ex_start": 10449, "ans_range": (12773, 12810)},
            {"code": "POS_ARTICLES", "title_en": "Articles (A, An, The)", "title_vi": "Mạo từ", "start_line": 10507, "end_line": 10762, "theory_end": 10674, "ex_start": 10675, "ans_range": (12811, 12832)},
        ],
    },
    {
        "chapter_number": 8,
        "code": "CH08_WORD_STUDY",
        "title_en": "Word Study",
        "title_vi": "Từ vựng học",
        "original_heading": "# WORD STUDY (TỪ VỰNG HỌC)",
        "category_code": "CAT_WORD_STUDY",
        "category_name_en": "Word Study, Formation & Idioms",
        "category_name_vi": "Từ vựng học, Cấu tạo từ và Thành ngữ",
        "start_line": 10763,
        "end_line": 12120,
        "theory_ranges": [(10763, 11084), (11085, 11278), (11841, 11914), (11915, 11962)],
        "exercise_ranges": [(11279, 11840), (11963, 12120)],
        "answer_ranges": [(12833, 13029)],
        "subtopics": [
            {"code": "WORD_FORMATIONS", "title_en": "Word Formations (Prefixes & Suffixes)", "title_vi": "Cách thành lập từ", "start_line": 10763, "end_line": 11084, "theory_end": 11084, "ex_start": None, "ans_range": None},
            {"code": "WORD_FORMS", "title_en": "Word Forms (Syntactic Positions)", "title_vi": "Hình thức của từ", "start_line": 11085, "end_line": 11840, "theory_end": 11278, "ex_start": 11279, "ans_range": (12833, 12947)},
            {"code": "WORD_ACRONYMS", "title_en": "Acronyms", "title_vi": "Từ viết tắt (Acronyms)", "start_line": 11841, "end_line": 11914, "theory_end": 11914, "ex_start": None, "ans_range": None},
            {"code": "WORD_IDIOMS", "title_en": "Idiomatic Expressions", "title_vi": "Thành ngữ", "start_line": 11915, "end_line": 12120, "theory_end": 11962, "ex_start": 11963, "ans_range": (12948, 13029)},
        ],
    },
    {
        "chapter_number": 9,
        "code": "CH09_REPORTED_SPEECH",
        "title_en": "Reported Speech",
        "title_vi": "Lời nói gián tiếp",
        "original_heading": "# REPORTED SPEECH (LỜI NÓI GIÁN TIẾP)",
        "category_code": "CAT_SENTENCE_TRANSFORM_STYLE",
        "category_name_en": "Sentence Structure, Voice & Style",
        "category_name_vi": "Cấu trúc câu, Thể và Văn phong",
        "start_line": 13030,
        "end_line": 13418,
        "theory_ranges": [(13030, 13212)],
        "exercise_ranges": [(13213, 13316)],
        "answer_ranges": [(13317, 13418)],
        "subtopics": [
            {"code": "REP_CHANGES", "title_en": "Tense and Deictic Shifts in Reported Speech", "title_vi": "Thay đổi thì, tính từ và trạng từ", "start_line": 13030, "end_line": 13102},
            {"code": "REP_TYPES", "title_en": "Reporting Orders, Questions, Exclamations, and Statements", "title_vi": "Cách đổi câu trực tiếp sang câu gián tiếp", "start_line": 13103, "end_line": 13212},
        ],
    },
    {
        "chapter_number": 10,
        "code": "CH10_PASSIVE_ACTIVE",
        "title_en": "The Passive and Active Sentences",
        "title_vi": "Câu chủ động - Câu bị động",
        "original_heading": "# THE PASSIVE AND ACTIVE SENTENCES (CÂU CHỦ ĐỘNG CÂU BỊ ĐỘNG)",
        "category_code": "CAT_SENTENCE_TRANSFORM_STYLE",
        "category_name_en": "Sentence Structure, Voice & Style",
        "category_name_vi": "Cấu trúc câu, Thể và Văn phong",
        "start_line": 13419,
        "end_line": 14172,
        "theory_ranges": [(13419, 13612)],
        "exercise_ranges": [(13613, 13912)],
        "answer_ranges": [(13913, 14172)],
        "subtopics": [
            {"code": "PASSIVE_RULES", "title_en": "Core Rules of Passive Transformation", "title_vi": "Quy tắc chuyển câu chủ động sang câu bị động", "start_line": 13419, "end_line": 13536},
            {"code": "PASSIVE_SPECIAL", "title_en": "Special Passive Constructions (Causative, Perception, Opinion, Imperative)", "title_vi": "Một số dạng câu bị động đặc biệt", "start_line": 13537, "end_line": 13612},
        ],
    },
    {
        "chapter_number": 11,
        "code": "CH11_SENTENCES",
        "title_en": "Sentences",
        "title_vi": "Câu",
        "original_heading": "# SENTENCES (CÂU)",
        "category_code": "CAT_SENTENCE_TRANSFORM_STYLE",
        "category_name_en": "Sentence Structure, Voice & Style",
        "category_name_vi": "Cấu trúc câu, Thể và Văn phong",
        "start_line": 14173,
        "end_line": 14824,
        "theory_ranges": [(14173, 14330), (14439, 14614)],
        "exercise_ranges": [(14331, 14438), (14615, 14658)],
        "answer_ranges": [(14659, 14824)],
        "subtopics": [
            {"code": "SENT_CLASSIFICATION_KINDS", "title_en": "Classification and Kinds of Sentences (Declarative, Interrogative, Tag, Imperative, Exclamatory)", "title_vi": "Phân loại câu và Các loại câu", "start_line": 14173, "end_line": 14438, "theory_end": 14330, "ex_start": 14331},
            {"code": "SENT_BASIC_PATTERNS", "title_en": "Basic Sentence Patterns in English (S, V, O, C, A)", "title_vi": "Các mẫu câu cơ bản", "start_line": 14439, "end_line": 14658, "theory_end": 14614, "ex_start": 14615},
        ],
    },
    {
        "chapter_number": 12,
        "code": "CH12_PRACTICE_TEST",
        "title_en": "Comprehensive Practice Test",
        "title_vi": "Bài tập tổng hợp (Practice Test)",
        "original_heading": "# PRACTICE TEST",
        "category_code": "CAT_COMPREHENSIVE_PRACTICE",
        "category_name_en": "Comprehensive Assessment & Practice",
        "category_name_vi": "Kiểm tra và Luyện tập tổng hợp",
        "start_line": 14825,
        "end_line": 16559,
        "theory_ranges": [],
        "exercise_ranges": [(14825, 15956)],
        "answer_ranges": [(15957, 16559)],
        "subtopics": [
            {"code": "PRACTICE_SENTENCE_TRANSFORMATION", "title_en": "Comprehensive Sentence Transformation (283 Questions)", "title_vi": "Viết lại câu sao cho nghĩa không đổi (283 câu)", "start_line": 14825, "end_line": 15956, "theory_end": None, "ex_start": 14825, "ans_range": (15957, 16559)},
        ],
    },
]


class ChapterExtractor:
    """Extracts Book, BookChapters, BookSections, GrammarCategories, and GrammarTopics."""

    def __init__(self, parser: MarkdownParser):
        self.parser = parser

    def extract_all(self, chapter_numbers: List[int] = None) -> Dict[str, Any]:
        book_id = make_id("book", self.parser.file_name)
        book = {
            "id": book_id,
            "title": "Ngữ pháp tiếng Anh (English Grammar)",
            "authors": ["Mai Lan Hương", "Hà Thanh Uyên"],
            "edition_note": "Bản Word Full (Markdown Migration)",
            "source_file": self.parser.file_name,
            "total_lines": self.parser.total_lines,
            "checksum": compute_checksum(self.parser.raw_text),
        }

        categories_map = {}
        chapters = []
        book_sections = []
        topics = []

        selected_catalog = [
            c for c in CHAPTER_CATALOG
            if (chapter_numbers is None or c["chapter_number"] in chapter_numbers)
        ]

        for ch_meta in selected_catalog:
            cat_code = ch_meta["category_code"]
            if cat_code not in categories_map:
                categories_map[cat_code] = {
                    "id": make_id("grammar_category", cat_code),
                    "code": cat_code,
                    "name_en": ch_meta["category_name_en"],
                    "name_vi": ch_meta["category_name_vi"],
                    "display_order": len(categories_map) + 1,
                }
            cat_id = categories_map[cat_code]["id"]

            ch_id = make_id("book_chapter", ch_meta["code"])
            raw_slice = self.parser.slice_text(ch_meta["start_line"], ch_meta["end_line"])
            chapters.append({
                "id": ch_id,
                "book_id": book_id,
                "chapter_number": ch_meta["chapter_number"],
                "code": ch_meta["code"],
                "title_en": ch_meta["title_en"],
                "title_vi": ch_meta["title_vi"],
                "original_heading": ch_meta["original_heading"],
                "display_order": ch_meta["chapter_number"],
                "source_file": self.parser.file_name,
                "start_line": ch_meta["start_line"],
                "end_line": ch_meta["end_line"],
                "checksum": compute_checksum(raw_slice),
            })

            # Create parent GrammarTopic for the chapter
            parent_topic_id = make_id("grammar_topic", ch_meta["code"])
            topics.append({
                "id": parent_topic_id,
                "category_id": cat_id,
                "parent_topic_id": None,
                "chapter_id": ch_id,
                "code": ch_meta["code"],
                "title_en": ch_meta["title_en"],
                "title_vi": ch_meta["title_vi"],
                "hierarchy_level": 1,
                "display_order": ch_meta["chapter_number"],
                "start_line": ch_meta["start_line"],
                "end_line": ch_meta["end_line"],
            })

            # Create child GrammarTopics & BookSections for each subtopic
            for idx, sub in enumerate(ch_meta["subtopics"], start=1):
                sub_topic_id = make_id("grammar_topic", sub["code"])
                topics.append({
                    "id": sub_topic_id,
                    "category_id": cat_id,
                    "parent_topic_id": parent_topic_id,
                    "chapter_id": ch_id,
                    "code": sub["code"],
                    "title_en": sub["title_en"],
                    "title_vi": sub["title_vi"],
                    "hierarchy_level": 2,
                    "display_order": idx,
                    "start_line": sub["start_line"],
                    "end_line": sub["end_line"],
                })
                sec_id = make_id("book_section", f"{ch_meta['code']}:{sub['code']}")
                book_sections.append({
                    "id": sec_id,
                    "book_id": book_id,
                    "chapter_id": ch_id,
                    "section_number": f"{ch_meta['chapter_number']}.{idx}",
                    "code": sub["code"],
                    "title_en": sub["title_en"],
                    "title_vi": sub["title_vi"],
                    "section_type": "LESSON_UNIT",
                    "display_order": idx,
                    "source_file": self.parser.file_name,
                    "start_line": sub["start_line"],
                    "end_line": sub["end_line"],
                })

        return {
            "book": book,
            "grammar_categories": list(categories_map.values()),
            "book_chapters": chapters,
            "book_sections": book_sections,
            "grammar_topics": topics,
            "selected_catalog": selected_catalog,
        }
