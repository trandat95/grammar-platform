# 📘 CHUẨN HÓA & NHẬP DỮ LIỆU ĐỀ THI TOEIC (TOEIC CORPUS IMPORT & NORMALIZATION SPECIFICATION)

> **Dành cho:** AI Agent / Data Engineer chịu trách nhiệm chuyển đổi (parse, normalize, enrich) các bộ đề TOEIC mới (VD: `ETS2025`, `ETS2023`, `HACKERS2026`, `YBM2025`...) trước khi import vào hệ thống **Grammar Platform (`grammar-platform`)**.
> **Phiên bản chuẩn:** `SOP-CORPUS-INGEST-V1` + **Difficulty Rubric `v2.1`**
> **Cập nhật:** 26/11/2026

---

## 1. QUY TẮC VÀNG BẮT BUỘC (NON-NEGOTIABLE RULES)

1. **Tuyệt đối không dùng nhãn độ khó cảm tính cho Part 5 & Part 6:**
   - Mọi câu Part 5 & Part 6 sau khi nhập liệu **BẮT BUỘC** phải đi qua bộ chấm điểm ngôn ngữ khách quan **Rubric v2.1** (`lib/toeic/difficulty-rubric.js`) để tính `difficulty_score (0–100)`, `difficulty_level (1|2|3)`, `target_score_band (450–850)` và `prior_irt_b (-1.20 .. +1.50)`.
   - Cấm tuyệt đối câu đáp án A1–A2 cơ bản (`drink`, `table`, `his`, `her`, `their`, `you`, `from`...) lọt vào `difficulty_level = 3`.
2. **Đồng bộ 2 bản sao Master JSON (Dual-Copy Parity):**
   - Hệ thống đọc ưu tiên `ETS_Corpus_Normalized_Enriched_Database/ets_toeic_ai_grammar_master.json` trước, sau đó fallback sang `data/toeic/ets_toeic_ai_grammar_master.json`.
   - Khi cập nhật `ets_toeic_ai_grammar_master.json` hoặc `sentence_translations_vi.json`, **BẮT BUỘC ghi giống nhau 100% ở cả 2 thư mục**.
3. **Bảo vệ dữ liệu thực nghiệm trên Supabase (`corpus_item_stats`):**
   - Khi sync lên Supabase, chỉ upsert các cột metadata (`question_id`, `series`, `test_number`, `part`, `primary_topic_id`, `correct_option`, `content_hash`, `target_band`, `recommended_time_sec`, `prior_irt_a`, `prior_irt_b`).
   - **KHÔNG BAO GIỜ** ghi đè `attempt_count`, `exam_attempt_count`, `practice_attempt_count`, `option_selection_counts`, hoặc `calibrated_irt_*`.
4. **Encoding & Ký tự chuẩn:**
   - Toàn bộ file JSON lưu ở **UTF-8 (không BOM)**, indent 2 spaces.
   - Chỗ trống trong câu Part 5 & đoạn văn Part 6 **BẮT BUỘC dùng đúng 7 dấu gạch ngang**: `-------` (không dùng `____`, không dùng `...`).
   - Marker vị trí chỗ trống trong `passages[].text` của Part 6 dùng đúng định dạng: `[131] -------`, `[132] -------`...
   - Đáp án đúng `correct_answer` chỉ chấp nhận 1 trong 4 ký tự in hoa: `"A"`, `"B"`, `"C"`, `"D"`.

---

## 2. CẤU TRÚC THƯ MỤC & QUY ƯỚC ĐẶT TÊN ID

### 2.1. Cây thư mục chuẩn cho 1 bộ đề mới (`<SERIES>`)

Đặt trong `ETS_Corpus_Normalized_Enriched_Database/`:

```text
ETS_Corpus_Normalized_Enriched_Database/
├── ets_toeic_ai_grammar_master.json     # Ngân hàng tổng hợp Part 5/6 (PHẢI đồng bộ với data/toeic/)
├── sentence_translations_vi.json        # Map { "<question_id>": "<bản dịch tiếng Việt>" } (PHẢI đồng bộ với data/toeic/)
├── grammar_taxonomy.json                # 24 chủ điểm chuẩn (KHÔNG tự ý thêm ID ngoài danh sách)
├── error_pattern_catalog.json           # 15 mã bẫy lỗi chuẩn (KHÔNG tự ý thêm code ngoài danh sách)
├── milestone_templates.json             # 7 cột mốc lộ trình
├── ETS2024/                             # Bộ đề hiện có (Test_01 .. Test_10)
├── ETS2026/                             # Bộ đề hiện có (Test_01 .. Test_10)
└── <NEW_SERIES>/                        # VD: ETS2025, HACKERS2026 (VIẾT HOA, chỉ [A-Z0-9_])
    ├── answer_keys.json                 # (Khuyến nghị) Bảng đáp án tổng 10 test
    ├── Test_01/                         # Zero-padded 2 chữ số: Test_01 .. Test_10
    │   ├── reading.json                 # BẮT BUỘC (100 câu: Part 5 [101-130], Part 6 [131-146], Part 7 [147-200])
    │   ├── listening.json               # BẮT BUỘC nếu có Listening (100 câu: Part 1 [1-6], Part 2 [7-31], Part 3 [32-70], Part 4 [71-100])
    │   └── dictation.json               # TÙY CHỌN (cho Dictation Studio — audio + cloze)
    ├── Test_02/
    ...
    └── Test_10/
```

### 2.2. Quy ước đặt ID (Duy nhất toàn hệ thống — Global Unique)

| Loại thực thể | Công thức chuẩn | Ví dụ hợp lệ |
|---|---|---|
| **Series Code** | `^[A-Z0-9_]{3,20}$` | `ETS2025`, `HACKERS2026`, `YBM2025` |
| **Question ID** | `<SERIES>_T<XX>_Q<NNN>` (`XX` = `01..10`, `NNN` = `001..200`) | `ETS2025_T01_Q001`, `ETS2025_T01_Q101`, `ETS2025_T10_Q200` |
| **Passage ID (Part 6 & 7)** | `<SERIES>_T<XX>_P<start>-<end>_D<docIndex>` | `ETS2025_T01_P131-134_D1`, `ETS2025_T01_P176-180_D2` |
| **Passage Group ID** | `<SERIES>_T<XX>_P<start>-<end>` | `ETS2025_T01_P131-134`, `ETS2025_T01_P176-180` |
| **Listening Set ID** | `L<NN>` (Part 1–2) hoặc `L<start>-<end>` (Part 3–4) | `L01`, `L07`, `L32-34`, `L98-100` |
| **Listening `test_set_id`** | `<SERIES>_T<XX>_<set_id>` | `ETS2025_T01_L32-34` |
| **Dictation Track ID** | `<SHORT>-T<XX>-<range>` | `E25-T01-01`, `E25-T01-32-34` |

> **Lưu ý:** Nếu import đề **Reading-only** (chỉ có câu 101–200), chỉ cần tạo `reading.json`. Nếu import ngân hàng câu rời không thuộc đề 200 câu, dùng prefix riêng như `EXP2026_<TOPIC>_Q<NNN>` và chỉ nạp vào `ets_toeic_ai_grammar_master.json`.

---

## 3. BẢNG ENUM BẮT BUỘC (STRICT ENUMS — PHẢI KHỚP 100%)

### 3.1. Danh sách 24 `primary_grammar_topic_id` hợp lệ

Mọi câu hỏi **BẮT BUỘC** chọn đúng 1 trong 24 mã sau (từ `grammar_taxonomy.json`):

#### A. Ngữ pháp & Từ vựng (Part 5 & Part 6 — 20 mã)
| `primary_grammar_topic_id` | Nhóm kiến thức | `skill_category` | `skill_weight_vector` chuẩn |
|---|---|---|---|
| `GRM_POS_NOUN` | Danh từ & Danh từ ghép | `GRAMMAR` | `{"G1_POS": 0.85, "G6_VOC_COH": 0.15}` |
| `GRM_POS_ADJ` | Tính từ & Bổ ngữ Linking Verb | `GRAMMAR` | `{"G1_POS": 0.85, "G6_VOC_COH": 0.15}` |
| `GRM_POS_ADV` | Trạng từ & Vị trí bổ nghĩa | `GRAMMAR` | `{"G1_POS": 0.85, "G6_VOC_COH": 0.15}` |
| `GRM_POS_VERB` | Nhận diện Động từ chính (Finite Verb) | `GRAMMAR` | `{"G1_POS": 0.4, "G2_VERB": 0.6}` |
| `GRM_VERB_SVA` | Hòa hợp Chủ ngữ – Động từ (SVA) | `GRAMMAR` | `{"G2_VERB": 0.85, "G1_POS": 0.15}` |
| `GRM_VERB_TENSE` | Thì & Phối hợp thì | `GRAMMAR` | `{"G2_VERB": 0.9, "G5_MOD": 0.1}` |
| `GRM_VERB_PASSIVE` | Câu bị động & Nội/Ngoại động từ | `GRAMMAR` | `{"G2_VERB": 0.9, "G1_POS": 0.1}` |
| `GRM_VERB_INFINITIVE_GERUND` | Danh động từ (`V-ing`) & `To-V` | `GRAMMAR` | `{"G2_VERB": 0.8, "G1_POS": 0.2}` |
| `GRM_VERB_PARTICIPLE` | Phân từ (`V-ing`/`V-ed`) & Rút gọn mệnh đề | `GRAMMAR` | `{"G2_VERB": 0.7, "G5_MOD": 0.3}` |
| `GRM_PRON_CASE` | Đại từ nhân xưng, Sở hữu & Phản thân | `GRAMMAR` | `{"G3_PRON": 0.9, "G1_POS": 0.1}` |
| `GRM_PRON_RELATIVE` | Đại từ quan hệ & Mệnh đề quan hệ | `GRAMMAR` | `{"G3_PRON": 0.7, "G4_CONN": 0.3}` |
| `GRM_CONN_PREP_VS_CONJ` | Phân biệt Giới từ (+ NP/V-ing) vs Liên từ (+ S+V) | `GRAMMAR` | `{"G4_CONN": 0.8, "G6_VOC_COH": 0.2}` |
| `GRM_CONN_PREP_MEANING` | Giới từ theo nghĩa (thời gian, nơi chốn, chức năng) | `GRAMMAR` | `{"G4_CONN": 0.7, "G6_VOC_COH": 0.3}` |
| `GRM_CONN_CORRELATIVE_COORD` | Liên từ kết hợp & Tương quan (`both..and`, `neither..nor`) | `GRAMMAR` | `{"G4_CONN": 0.85, "G5_MOD": 0.15}` |
| `GRM_CONN_TRANSITION` | Trạng từ liên kết chuyển ý (`however`, `nevertheless`) | `COHERENCE` | `{"G4_CONN": 0.6, "G6_VOC_COH": 0.4}` |
| `GRM_COMP_QUANTIFIER` | So sánh, Lượng từ & Từ hạn định | `GRAMMAR` | `{"G5_MOD": 0.8, "G1_POS": 0.2}` |
| `GRM_COND_INVERSION` | Câu điều kiện, Thức giả định & Đảo ngữ | `GRAMMAR` | `{"G5_MOD": 0.6, "G2_VERB": 0.4}` |
| `VOC_COLLOCATION` | Từ vựng thương mại & Collocations | `VOCABULARY` | `{"G6_VOC_COH": 0.9, "G1_POS": 0.1}` |
| `VOC_PHRASAL_PREP` | Cụm động từ & Cụm giới từ cố định | `VOCABULARY` | `{"G6_VOC_COH": 0.7, "G4_CONN": 0.3}` |
| `COH_P6_SENTENCE_INSERT` | Điền câu hoàn chỉnh vào đoạn văn Part 6 | `COHERENCE` | `{"G6_VOC_COH": 0.7, "G7_READING": 0.3}` |

#### B. Đọc hiểu & Nghe hiểu (Part 7 & Part 1–4 — 4 mã)
| `primary_grammar_topic_id` | Nhóm kiến thức | `skill_category` | `skill_weight_vector` chuẩn |
|---|---|---|---|
| `RC_P7_DETAIL_MAIN` | Part 7: Ý chính & Chi tiết trực tiếp (Scanning) | `READING_COMPREHENSION` | `{"G7_READING": 0.85, "G6_VOC_COH": 0.15}` |
| `RC_P7_INFERENCE_CROSS` | Part 7: Suy luận, Ngụ ý, Điền câu & Đa văn bản | `READING_COMPREHENSION` | `{"G7_READING": 0.9, "G6_VOC_COH": 0.1}` |
| `LC_P1_P2_DIRECT_INDIRECT` | Listening Part 1 (Tranh) & Part 2 (Hỏi – Đáp) | `LISTENING_COMPREHENSION` | `{"G8_LISTENING": 0.9, "G6_VOC_COH": 0.1}` |
| `LC_P3_P4_CONVERSATION_TALK` | Listening Part 3 (Hội thoại) & Part 4 (Bài nói) | `LISTENING_COMPREHENSION` | `{"G8_LISTENING": 0.9, "G6_VOC_COH": 0.1}` |

---

### 3.2. Danh sách 15 `error_pattern_code` hợp lệ (cho `option_deep_analysis`)

Chỉ gắn cho **đáp án sai** (`is_correct: false`). Với đáp án đúng (`is_correct: true`), để `error_pattern_code: null`:

1. `ERR_POS_NOUN_FOR_ADJ` — Nhầm Danh từ vào vị trí Tính từ bổ nghĩa
2. `ERR_POS_ADJ_FOR_ADV` — Nhầm Tính từ vào vị trí Trạng từ (`-ly`)
3. `ERR_POS_ADV_FOR_ADJ` — Nhầm Trạng từ vào vị trí Tính từ (trước Danh từ / sau Linking Verb)
4. `ERR_POS_NONFINITE_FOR_MAIN_VERB` — Chọn `V-ing`/`To-V`/Danh từ vào vị trí Động từ chính
5. `ERR_POS_MAIN_VERB_IN_NP` — Chọn Động từ chia thì vào vị trí Danh từ/Tính từ khi câu đã đủ động từ chính
6. `ERR_PRON_CASE_MISMATCH` — Sai chức năng Đại từ (Chủ ngữ / Tân ngữ / Sở hữu / Phản thân)
7. `ERR_REL_PRONOUN_MISMATCH` — Chọn sai Đại từ quan hệ (`who`/`whom`/`whose`/`which`/`what`)
8. `ERR_PREP_VS_CONJ_STRUCTURE` — Nhầm cấu trúc Giới từ (+ NP/V-ing) vs Liên từ (+ S+V)
9. `ERR_VERB_SVA_TRAP` — Mắc bẫy Hòa hợp Chủ ngữ – Động từ do cụm giới từ chen giữa
10. `ERR_VERB_VOICE_DIRECTION` — Nhầm thể Chủ động (Active) vs Bị động (Passive)
11. `ERR_VERB_TENSE_MARKER` — Chọn sai Thì so với mốc thời gian
12. `ERR_VERB_PARTICIPLE_DIRECTION` — Nhầm Phân từ hiện tại (`V-ing`) vs Phân từ quá khứ (`V-ed`/`V3`)
13. `ERR_VOCAB_COLLOCATION_MISMATCH` — Sai nghĩa từ vựng hoặc sai Collocation thương mại
14. `ERR_COHERENCE_DISCOURSE_FLOW` — Đứt gãy mạch liên kết câu/đoạn văn (Part 6)
15. `ERR_COMPREHENSION_TRAP` — Bẫy lặp từ nguyên văn (Word Repetition) hoặc suy diễn sai chi tiết (Part 3, 4, 7)

---

## 4. CHI TIẾT JSON SCHEMA CHO TỪNG LOẠI FILE

### 4.1. File `reading.json` (Part 5, 6, 7 — 100 câu: 101–200)

#### Cấu trúc gốc (Top-Level)
```json
{
  "series": "ETS2025",
  "test": 1,
  "doc_type": "reading",
  "passages": [ /* Mảng các bài đọc Part 6 & Part 7 */ ],
  "questions": [ /* Mảng 100 câu hỏi từ 101 đến 200 */ ]
}
```

#### Schema phần tử trong `passages[]` (Part 6 & Part 7)
```json
{
  "id": "ETS2025_T01_P131-134_D1",
  "part": 6,
  "questions": [131, 132, 133, 134],
  "type": "email",
  "text": "Dear Mr. Tanaka,\n\nThank you for your recent order. [131] ------- We expect delivery by Friday..."
}
```
* `type` hợp lệ (gợi ý chuẩn hóa): `"email"`, `"letter"`, `"memo"`, `"notice"`, `"advertisement"`, `"article"`, `"flyer"`, `"form"`, `"schedule"`, `"table"`, `"chart"`, `"text_message_chain"`, `"web_page"`, `"review"`, `"announcement"`.
* Với bài đọc **Double / Triple Passage (Part 7)** (VD: câu 176–180 có 2 đoạn, câu 186–190 có 3 đoạn): tạo từng object riêng với `_D1`, `_D2`, `_D3` cùng mảng `questions: [176, 177, 178, 179, 180]`.

#### Schema phần tử trong `questions[]` — Mẫu **Part 5** (đầy đủ X-Ray & Rubric v2.1)
```json
{
  "id": "ETS2025_T01_Q101",
  "number": 101,
  "part": 5,
  "passage_id": null,
  "passage_group_id": null,
  "passage_doc_ids": [],
  "source_page": 2,
  "stem": "The lecture will take place at 6:00 P.M., ------- which attendees may ask questions.",
  "context_sentence": "The lecture will take place at 6:00 P.M., ------- which attendees may ask questions.",
  "options": {
    "A": "across",
    "B": "after",
    "C": "inside",
    "D": "among"
  },
  "correct_answer": "B",
  "primary_grammar_topic_id": "GRM_CONN_PREP_VS_CONJ",
  "secondary_topic_ids": [],
  "skill_category": "GRAMMAR",
  "difficulty_level": 2,
  "target_score_band": 600,
  "difficulty_score": 48,
  "difficulty_rubric_version": "v2.1",
  "prior_irt_b": -0.014,
  "recommended_time_sec": 15,
  "key_clue": "... 6:00 P.M., [ after ] which attendees ...",
  "explanation_vi": "Đáp án đúng là (B) \"after\". Cụm giới từ + đại từ quan hệ \"after which\" (sau đó) dùng để nối mốc thời gian 6:00 P.M. với hành động diễn ra tiếp theo.",
  "distractor_analysis": {
    "A": "\"across\" chỉ không gian (băng qua), không dùng cho mốc thời gian.",
    "C": "\"inside\" chỉ vị trí bên trong, không hợp nghĩa.",
    "D": "\"among\" dùng giữa từ 3 đối tượng trở lên, không dùng với mốc thời gian."
  },
  "ai_analysis": {
    "primary_topic_id": "GRM_CONN_PREP_VS_CONJ",
    "primary_topic_name_vi": "Phân biệt Giới từ (+ Cụm danh từ/V-ing) và Liên từ (+ Mệnh đề S + V)",
    "micro_rule_formula_vi": "Giới từ thời gian + which (after which / during which / by which) = trạng ngữ thời gian nối mệnh đề quan hệ.",
    "common_trap_warning_vi": "Tránh chọn giới từ chỉ vị trí (across, inside, among) khi danh từ tiền ngữ là mốc thời gian.",
    "sentence_translation_vi": "Bài giảng sẽ diễn ra lúc 6 giờ tối, sau đó người tham dự có thể đặt câu hỏi.",
    "irt_3pl": {
      "discrimination_a": 1.25,
      "difficulty_b": -0.014,
      "guessing_c": 0.25
    },
    "skill_weight_vector": {
      "G4_CONN": 0.8,
      "G6_VOC_COH": 0.2
    },
    "sentence_xray": {
      "left_context": "The lecture will take place at 6:00 P.M.,",
      "blank_slot": "after",
      "right_context": "which attendees may ask questions.",
      "left_anchor_words": "at 6:00 P.M.,",
      "right_anchor_words": "which attendees may",
      "required_grammatical_role": "Preposition of Time (Giới từ thời gian)",
      "xray_pattern_display": "at 6:00 P.M., ➔ [Preposition of Time: after] ➔ which attendees may"
    },
    "option_deep_analysis": {
      "A": {
        "text": "across",
        "is_correct": false,
        "pos_or_role": "Preposition of Place",
        "error_pattern_code": "ERR_PREP_VS_CONJ_STRUCTURE",
        "error_pattern_name_vi": "Nhầm lẫn cấu trúc Giới từ và Liên từ",
        "ai_feedback_vi": "\"across\" là giới từ chỉ không gian, không kết hợp với mốc thời gian 6:00 P.M."
      },
      "B": {
        "text": "after",
        "is_correct": true,
        "pos_or_role": "Preposition of Time",
        "error_pattern_code": null,
        "ai_feedback_vi": "Chính xác! \"after which\" mang nghĩa \"sau thời điểm đó\"."
      },
      "C": {
        "text": "inside",
        "is_correct": false,
        "pos_or_role": "Preposition of Place",
        "error_pattern_code": "ERR_PREP_VS_CONJ_STRUCTURE",
        "error_pattern_name_vi": "Nhầm lẫn cấu trúc Giới từ và Liên từ",
        "ai_feedback_vi": "\"inside\" chỉ không gian bên trong, không dùng cho thời gian."
      },
      "D": {
        "text": "among",
        "is_correct": false,
        "pos_or_role": "Preposition of Group",
        "error_pattern_code": "ERR_PREP_VS_CONJ_STRUCTURE",
        "error_pattern_name_vi": "Nhầm lẫn cấu trúc Giới từ và Liên từ",
        "ai_feedback_vi": "\"among\" dùng giữa nhiều người/vật, không hợp với \"which\" chỉ thời gian."
      }
    },
    "linked_vocabulary": [
      { "word": "lecture", "pos": "n", "meaning_vi": "bài giảng, buổi thuyết trình" },
      { "word": "attendee", "pos": "n", "meaning_vi": "người tham dự" }
    ],
    "solving_steps_vi": [
      "Bước 1: Xác định từ ngay trước và sau chỗ trống: 'at 6:00 P.M., ------- which'.",
      "Bước 2: Nhận diện cấu trúc Giới từ thời gian + which.",
      "Bước 3: Chọn (B) 'after' (sau thời điểm 6 giờ tối)."
    ],
    "ai_tutor_rag_context": "[ETS2025_T01_Q101 | Part 5 | Band 600] Câu hỏi: The lecture will take place at 6:00 P.M., ------- which attendees may ask questions. | Đáp án đúng: (B) after.",
    "similar_question_ids": []
  }
}
```

#### Điểm khác biệt cho **Part 6** (`number: 131..146`)
* `passage_id`: `"ETS2025_T01_P131-134_D1"`
* `passage_group_id`: `"ETS2025_T01_P131-134"`
* `passage_doc_ids`: `["ETS2025_T01_P131-134_D1"]`
* `stem`: câu chứa chỗ trống `[131] -------` trích từ đoạn văn (không được để `null` hoặc chuỗi rỗng).
* `recommended_time_sec`: `20` (câu ngữ pháp/từ vựng) hoặc `35` (câu `COH_P6_SENTENCE_INSERT`).

#### Điểm khác biệt cho **Part 7** (`number: 147..200`)
* `passage_id`: ID của đoạn chính (`_D1`)
* `passage_group_id`: `"ETS2025_T01_P176-180"`
* `passage_doc_ids`: `["ETS2025_T01_P176-180_D1", "ETS2025_T01_P176-180_D2"]` (liệt kê tất cả các văn bản trong nhóm câu đó)
* `ai_analysis.sentence_xray`: `null`
* `ai_analysis.evidence_sentence_en`: **BẮT BUỘC LÀ CHUỖI TRÍCH NGUYÊN VĂN (EXACT SUBSTRING)** nằm trong `passages[].text` của nhóm đó (dùng cho tính năng Auto-Highlight Evidence trong `SplitPassageReader.jsx` và được script ingest kiểm định tự động!).
* `recommended_time_sec`: `45` (Single Passage) hoặc `60` (Double/Triple Passage).

---

### 4.2. File `listening.json` (Part 1, 2, 3, 4 — 100 câu: 1–100)

```json
{
  "series": "ETS2025",
  "test": 1,
  "doc_type": "listening",
  "questions": [
    {
      "id": "ETS2025_T01_Q001",
      "number": 1,
      "part": 1,
      "set_id": "L01",
      "test_set_id": "ETS2025_T01_L01",
      "stem": null,
      "options": null,
      "image_description": "Mô tả ngắn bức tranh bằng tiếng Anh (bắt buộc cho Part 1, null cho Part 2-4).",
      "source_page": 3,
      "correct_answer": "B",
      "primary_grammar_topic_id": "LC_P1_P2_DIRECT_INDIRECT",
      "secondary_topic_ids": [],
      "skill_category": "LISTENING_COMPREHENSION",
      "difficulty_level": 1,
      "target_score_band": 450,
      "recommended_time_sec": 8,
      "key_clue": "Nghe động từ hành động chính và loại trừ bẫy đồng âm.",
      "explanation_vi": "Đáp án đúng là (B)...",
      "distractor_analysis": {},
      "ai_analysis": {
        "primary_topic_id": "LC_P1_P2_DIRECT_INDIRECT",
        "primary_topic_name_vi": "Nghe hiểu Part 1 (Mô tả tranh) & Part 2 (Hỏi - Đáp trực tiếp & gián tiếp)",
        "micro_rule_formula_vi": "...",
        "common_trap_warning_vi": "...",
        "irt_3pl": { "discrimination_a": 1.2, "difficulty_b": -1.0, "guessing_c": 0.25 },
        "skill_weight_vector": { "G8_LISTENING": 0.9, "G6_VOC_COH": 0.1 },
        "sentence_xray": null,
        "option_deep_analysis": {},
        "linked_vocabulary": [],
        "listening_script_sync": {
          "dictation_track_id": "E25-T01-01",
          "audio_ref": "ETS2025/Test_01/Listening/audio/Part_1/E25-T01-01.mp3",
          "full_audio_script_en": "(A) ... (B) ... (C) ... (D) ..."
        },
        "solving_steps_vi": ["Bước 1...", "Bước 2...", "Bước 3..."],
        "ai_tutor_rag_context": "[ETS2025_T01_Q001 | Part 1 | Band 450] ...",
        "similar_question_ids": []
      }
    }
  ]
}
```
* **Part 1 (`1..6`) & Part 2 (`7..31`):** `stem: null`, `options: null` (vì học viên nghe audio), `correct_answer` của Part 2 chỉ là `"A" | "B" | "C"`.
* **Part 3 (`32..70`) & Part 4 (`71..100`):** `stem` là câu hỏi tiếng Anh, `options` là `{ "A": "...", "B": "...", "C": "...", "D": "..." }`, `set_id` nhóm theo cụm 3 câu (`L32-34`, `L35-37`... `L98-100`).

---

### 4.3. File `dictation.json` (Tùy chọn cho Dictation Studio)

```json
{
  "series": "ETS2025",
  "test": 1,
  "doc_type": "dictation",
  "tracks": [
    {
      "part": 1,
      "track": "E25-T01-01",
      "question_range": "1",
      "cloze_text": "[Câu 1: (B)] (A) The woman is _____ a _____ of food. ...",
      "full_text": "(A) The woman is carrying a tray of food. ...",
      "audio_ref": "ETS2025/Test_01/Listening/audio/Part_1/E25-T01-01.mp3",
      "blank_answers": ["carrying", "tray"],
      "blank_count": 2
    }
  ]
}
```
* Số lượng `_____` trong `cloze_text` **BẮT BUỘC bằng `blank_answers.length` và bằng `blank_count`**.

---

### 4.4. File `sentence_translations_vi.json` (Bản dịch câu cho X-Ray)

Object phẳng (flat dictionary) ánh xạ trực tiếp `question_id` → câu dịch tiếng Việt tự nhiên:
```json
{
  "ETS2025_T01_Q101": "Bài giảng sẽ diễn ra lúc 6 giờ tối, sau đó người tham dự có thể đặt câu hỏi.",
  "ETS2025_T01_Q102": "..."
}
```
* Phải được cập nhật đồng bộ ở **cả 2 file**:
  - `ETS_Corpus_Normalized_Enriched_Database/sentence_translations_vi.json`
  - `data/toeic/sentence_translations_vi.json`

---

## 5. QUY TẮC CHUẨN HÓA ĐỘ KHÓ & IRT PRIOR (RUBRIC `v2.1`)

Agent nhập liệu **KHÔNG tự ước lượng `difficulty_level` hay `target_score_band` bằng tay** cho Part 5 & Part 6. Thay vào đó, sau khi gộp câu mới vào `ets_toeic_ai_grammar_master.json`, chạy `scripts/toeic/recalibrate-difficulty.mjs` để tính theo chuẩn `lib/toeic/difficulty-rubric.js`:

| Chiều đánh giá | Thang điểm | Quy tắc chấm |
|---|---:|---|
| 1. Độ khó cấu trúc Ngữ pháp / Diễn ngôn | `0–32` | Theo bảng `TOPIC_BASE_SCORE` (VD: `GRM_PRON_CASE = 8`, `GRM_POS_* = 10–12`, `GRM_VERB_* = 20–24`, `COH_P6_SENTENCE_INSERT = 26`, `GRM_COND_INVERSION = 32`). |
| 2. Mức độ bẫy 4 đáp án nhiễu | `0–24` | Cụm động từ phức / câu Part 6 (`20–24`), bẫy chia động từ cùng gốc (`22`), từ vựng B2–C1 dễ nhầm (`21`), họ từ POS (`14`), từ cơ bản rời rạc (`6`). |
| 3. Cấp độ Từ vựng CEFR đáp án đúng | `0–24` | Từ A1–A2 (`0đ`), từ dài phổ thông A2–B1 như `information/department` (`8đ`), từ ngắn C1 như `via/amid/waive/deem` (`24đ`), từ học thuật dài (`14–22đ`). |
| 4. Độ phức tạp cú pháp câu đề | `0–20` | Độ dài câu (`≥10 / ≥14 / ≥18` từ), số dấu phẩy/mệnh đề, và cấu trúc C1 (`Had S V3`, `Were S to V`, `mandate that...`). |
| **Hard Guardrails** | Chặn cứng | • Đáp án A1–A2 đơn lẻ (không kèm đảo ngữ/C1) → cap tối đa `50đ` (không bao giờ vào Khó).<br>• Đại từ cơ bản (`his/her/my/their/you...`) → cap tối đa `32đ` (luôn là Dễ). |

**Bảng quy đổi bắt buộc (1-to-1, không được mâu thuẫn):**
* `0 – 39đ` → `difficulty_level: 1` · `target_score_band: 450 | 500` · `prior_irt_b: -1.20 .. -0.35`
* `40 – 61đ` → `difficulty_level: 2` · `target_score_band: 600 | 650` · `prior_irt_b: -0.30 .. +0.45`
* `62 – 100đ` → `difficulty_level: 3` · `target_score_band: 750 | 800 | 850` · `prior_irt_b: +0.50 .. +1.50`

---

## 6. CODE HOOKS CẦN CẬP NHẬT KHI THÊM BỘ ĐỀ (SERIES) MỚI

Nếu chỉ thêm câu vào `ETS2024` / `ETS2026` thì không cần sửa code. Nhưng nếu bạn tạo **Series mới** (VD: `ETS2025` hoặc `HACKERS2026`), cần mở whitelist ở **6 vị trí** sau trong `grammar-platform`:

1. `lib/toeic/toeic-repository.js`:
   - Thêm mã series vào `ALLOWED_TOEIC_SERIES = new Set(['ETS2024', 'ETS2026', '<NEW_SERIES>'])`.
   - Nếu bộ đề có nhiều hơn 10 test, cập nhật giới hạn trong `normalizeSafeTestNum()`.
2. `pages/api/toeic/tests/[series]/[testNum].js`:
   - Cập nhật danh sách series hợp lệ tại dòng kiểm tra `if (!['ETS2024', 'ETS2026', ...].includes(s))`.
3. `pages/api/toeic/dictation/[series]/[testNum].js` *(nếu có Dictation)*:
   - Cập nhật danh sách series hợp lệ tương tự.
4. `lib/toeic/subscription/server-gate.js`:
   - Khai báo quy tắc Free vs VIP và tên hiển thị (`labelSeries`) cho series mới.
5. `pages/toeic/tests/index.jsx` & `pages/toeic/tests/[series]/[testNum].jsx`:
   - Thêm tab chọn bộ đề mới và nhãn hiển thị UI.
6. `pages/toeic/remediation/[planId].jsx`:
   - Bổ sung mapping tên hiển thị trong hàm `formatSeries()`.

---

## 7. QUY TRÌNH IMPORT & KIỂM ĐỊNH ĐẦU–CUỐI (CHẠY THEO ĐÚNG THỨ TỰ)

Sau khi Agent chuẩn hóa đặt các file `reading.json`, `listening.json` vào `ETS_Corpus_Normalized_Enriched_Database/<SERIES>/Test_XX/` và nối các câu Part 5/6 mới vào `part5_part6_grammar_bank` của `ets_toeic_ai_grammar_master.json`, chạy lần lượt 5 bước:

```bash
# Bước 1: Kiểm thử Dry-Run Rubric v2.1 (kiểm tra phân bố & 0 lỗi A1-A2 lọt Khó)
node scripts/toeic/recalibrate-difficulty.mjs --dry-run

# Bước 2: Ghi đè chuẩn hóa Rubric v2.1 đồng bộ vào cả 2 bản sao Master JSON
node scripts/toeic/recalibrate-difficulty.mjs --apply

# Bước 3: Chạy 9-Stage Corpus Ingestion Pipeline kiểm tra schema, trùng ID, evidence Part 7
node scripts/ingest-and-validate-corpus.mjs --dry-run
# Nếu Quarantine = 0 và Duplicate = 0, chạy sync lên Supabase corpus_item_stats:
node scripts/ingest-and-validate-corpus.mjs --sync

# Bước 4: Đồng bộ lại target_band & prior_irt_b chuẩn Rubric v2.1 lên Supabase
node scripts/toeic/sync-recalibrated-priors.mjs

# Bước 5: Chạy Automated Test & Production Build
node --test tests/toeic-difficulty-rubric.test.mjs
npm run build
```

---

## 8. CHECKLIST NGHIỆM THU TRƯỚC KHI BÀN GIAO (VALIDATION GATE)

Agent chuẩn hóa dữ liệu phải xác nhận **100% tiêu chí** sau đều PASS trước khi commit:

- [ ] **Zero Duplicate IDs:** Không có 2 câu hỏi trùng `id` trên toàn bộ các bộ đề.
- [ ] **Strict Answer Keys:** 100% `correct_answer` thuộc `{"A", "B", "C", "D"}` (Part 2 chỉ `A/B/C`).
- [ ] **Strict Taxonomy & Error Codes:** 100% `primary_grammar_topic_id` nằm trong 24 mã chuẩn; 100% `error_pattern_code` nằm trong 15 mã chuẩn.
- [ ] **Blank Format:** 100% câu Part 5 & đoạn Part 6 dùng đúng `-------` (7 dấu gạch ngang), không dính lỗi OCR (`____`, `—–`, ký tự lạ).
- [ ] **Part 7 Evidence Match:** 100% `ai_analysis.evidence_sentence_en` là chuỗi con chính xác tồn tại trong `passages[].text` tương ứng (`evidenceMismatch === 0`).
- [ ] **Rubric v2.1 Clean:** `0` câu đáp án A1–A2/đại từ cơ bản lọt `difficulty_level = 3`; `0` mâu thuẫn `difficulty_level ↔ target_score_band`.
- [ ] **Dual-Copy Identical:** `ETS_Corpus_Normalized_Enriched_Database/ets_toeic_ai_grammar_master.json` và `data/toeic/ets_toeic_ai_grammar_master.json` giống nhau 100% từng byte.
- [ ] **Vietnamese Translations:** 100% câu Part 5 & Part 6 mới đã có bản dịch trong `sentence_translations_vi.json` (ở cả 2 thư mục).
- [ ] **Build & Sync Pass:** `ingest-and-validate-corpus.mjs --sync`, `sync-recalibrated-priors.mjs`, `tests/toeic-difficulty-rubric.test.mjs` và `npm run build` đều PASS.
