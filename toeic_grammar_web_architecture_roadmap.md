# Đặc Tả Kỹ Thuật Toàn Diện (AI-Agent Executable Spec): Kiến Trúc Hệ Thống, Database V3.0, Thuật Toán AI Adaptive, UI/UX & Lộ Trình Milestone Cho Web Học Ngữ Pháp TOEIC

> **Mục đích tài liệu:** Đây là tài liệu đặc tả kỹ thuật cấp độ thực thi (**Agent-Ready Implementation Specification**). Mọi tên bảng, tên trường JSON, kiểu dữ liệu TypeScript, câu truy vấn SQL, công thức toán học (IRT 3PL, Focus Priority Index, SM-2 SRS), cấu trúc API Request/Response, State Machine của từng Component UI/UX và Checklist nghiệm thu qua từng Milestone đều khớp **100% nguyên văn (verbatim)** với gói cơ sở dữ liệu `ETS_Corpus_Normalized_Enriched_Database.zip` (Phiên bản `3.0-ULTRA-DEEP-AI-READY`). Coding Agent có thể đọc trực tiếp tài liệu này để sinh code Backend, Database và Frontend mà không cần suy đoán bất kỳ thông số nào.

---

## PHẦN 1: CẤU TRÚC VẬT LÝ CỦA GÓI DATABASE V3.0 & KIỂM TOÁN ZERO-DEFECT

### 1.1. Sơ đồ cây thư mục của gói `ETS_Corpus_Normalized_Enriched_Database.zip`

Khi giải nén `ETS_Corpus_Normalized_Enriched_Database.zip` vào thư mục `/data` của dự án Web, Coding Agent sẽ có cấu trúc tệp chuẩn hóa như sau:

```
data/
├── ets_toeic_normalized.sqlite          # SQLite DB hoàn chỉnh (7 bảng Content, 4.000 câu hỏi, đã đánh Index)
├── ets_toeic_ai_grammar_master.json     # Master JSON chứa toàn bộ 920 câu Part 5 & Part 6 + Taxonomy + Error Catalog
├── grammar_taxonomy.json                # 24 chủ điểm Ngữ pháp/Từ vựng/Đọc/Nghe (Theory, Traps, Weight, Band, Time)
├── error_pattern_catalog.json           # 15 mã lỗi tư duy nhận thức (ERR_*) kèm chẩn đoán AI & hướng khắc phục
├── milestone_templates.json             # 7 mẫu Learning Milestones từ Band 0 -> 900+ kèm Boss Gate Criteria
├── database_audit_report.json           # Báo cáo kiểm toán số lượng bản ghi trên toàn bộ 20 đề
├── ETS2024/
│   ├── answer_keys.json                 # 2.000 đáp án chuẩn ETS 2024 (Test 01 -> Test 10)
│   └── Test_01/ .. Test_10/
│       ├── listening.json               # 100 câu LC/đề (đã nhúng id, correct_answer, set_id, ai_analysis)
│       └── reading.json                 # 100 câu RC/đề + passages[] (đã tách doc_order, context_sentence, ai_analysis)
└── ETS2026/
    ├── answer_keys.json                 # 2.000 đáp án chuẩn ETS 2026 (Test 01 -> Test 10)
    ├── vocabulary_lc.json               # 762 từ vựng Nghe (đã làm sạch OCR & gắn example_sentence thực tế từ đề)
    ├── vocabulary_rc.json               # 637 từ vựng Đọc (đã làm sạch OCR & gắn example_sentence thực tế từ đề)
    └── Test_01/ .. Test_10/
        ├── listening.json               # 100 câu LC/đề (đã đồng bộ listening_script_sync với dictation & audio)
        ├── reading.json                 # 100 câu RC/đề + passages[] (đã có evidence_sentence_en & similar_question_ids)
        ├── dictation.json               # 54 tracks/đề (540 tracks tổng, 100% có full_text sạch & blank_answers[])
        └── transcript.json              # Lời thoại, bản dịch & giải thích đã chuẩn hóa part và ngôn ngữ
```

### 1.2. Bảng Tổng Hợp 24 Mã Chủ Điểm (`grammar_topics`) & Trọng Số Hệ Thống

Coding Agent **bắt buộc** sử dụng đúng 24 hằng số `id` dưới đây khi truy vấn, lọc bài tập, vẽ biểu đồ Radar và tính điểm thông thạo:

| Mã Chủ Điểm (`id`) | Mã Trục Radar (`group_code`) | Loại Kỹ Năng (`category`) | Band Điểm (`target_score_band`) | Trọng Số Đề Thi (`weight_in_toeic`) | Thời Gian Chuẩn (`recommended_time_sec`) | Số Câu Trong DB |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GRM_POS_NOUN` | `G1_POS` | `GRAMMAR` | 450 | 6.5 | 10s | 31 |
| `GRM_POS_ADJ` | `G1_POS` | `GRAMMAR` | 450 | 5.5 | 10s | 29 |
| `GRM_POS_ADV` | `G1_POS` | `GRAMMAR` | 450 | 5.0 | 10s | 37 |
| `GRM_POS_VERB` | `G1_POS` | `GRAMMAR` | 450 | 2.5 | 12s | 70 |
| `GRM_VERB_SVA` | `G2_VERB` | `GRAMMAR` | 500 | 1.5 | 12s | 43 |
| `GRM_VERB_TENSE` | `G2_VERB` | `GRAMMAR` | 550 | 2.0 | 14s | 32 |
| `GRM_VERB_PASSIVE` | `G2_VERB` | `GRAMMAR` | 550 | 1.8 | 14s | 10 |
| `GRM_VERB_INFINITIVE_GERUND` | `G2_VERB` | `GRAMMAR` | 600 | 1.8 | 14s | 11 |
| `GRM_VERB_PARTICIPLE` | `G2_VERB` | `GRAMMAR` | 650 | 2.0 | 15s | 53 |
| `GRM_PRON_CASE` | `G3_PRON` | `GRAMMAR` | 450 | 3.0 | 10s | 33 |
| `GRM_PRON_RELATIVE` | `G3_PRON` | `GRAMMAR` | 600 | 1.8 | 15s | 16 |
| `GRM_CONN_PREP_VS_CONJ` | `G4_CONN` | `GRAMMAR` | 550 | 3.5 | 14s | 39 |
| `GRM_CONN_PREP_MEANING` | `G4_CONN` | `GRAMMAR` | 500 | 2.0 | 12s | 30 |
| `GRM_CONN_CORRELATIVE_COORD` | `G4_CONN` | `GRAMMAR` | 550 | 1.2 | 10s | 1 |
| `GRM_CONN_TRANSITION` | `G4_CONN` | `COHERENCE` | 600 | 2.0 | 18s | 30 |
| `GRM_COMP_QUANTIFIER` | `G5_MOD` | `GRAMMAR` | 650 | 1.5 | 14s | 12 |
| `GRM_COND_INVERSION` | `G5_MOD` | `GRAMMAR` | 750 | 1.0 | 15s | 5 |
| `VOC_COLLOCATION` | `G6_VOC_COH` | `VOCABULARY` | 650 | 45.0 | 20s | 340 |
| `VOC_PHRASAL_PREP` | `G6_VOC_COH` | `VOCABULARY` | 700 | 6.5 | 18s | 19 |
| `COH_P6_SENTENCE_INSERT` | `G6_VOC_COH` | `COHERENCE` | 700 | 8.4 | 35s | 79 |
| `RC_P7_DETAIL_MAIN` | `G7_READING` | `READING_COMPREHENSION` | 550 | 25.0 | 45s | 296 |
| `RC_P7_INFERENCE_CROSS` | `G7_READING` | `READING_COMPREHENSION` | 750 | 15.0 | 60s | 784 |
| `LC_P1_P2_DIRECT_INDIRECT` | `G8_LISTENING` | `LISTENING_COMPREHENSION` | 500 | 15.0 | 8s | 620 |
| `LC_P3_P4_CONVERSATION_TALK` | `G8_LISTENING` | `LISTENING_COMPREHENSION` | 650 | 20.0 | 12s | 1380 |

### 1.3. Bảng 15 Mã Lỗi Tư Duy Nhận Thức (`error_patterns`)

Khi học viên chọn một phương án sai `optKey` (`"A" | "B" | "C" | "D"`), hệ thống truy xuất `question.ai_analysis.option_deep_analysis[optKey].error_pattern_code` thuộc 1 trong 15 mã chuẩn sau:

| Mã Lỗi (`code`) | Tên Lỗi Tư Duy (`name_vi`) | Chủ Điểm Liên Quan Chính | Hành Động Khắc Phục Tự Động Trên Web |
| :--- | :--- | :--- | :--- |
| `ERR_POS_NOUN_FOR_ADJ` | Nhầm Danh từ vào vị trí của Tính từ bổ nghĩa | `GRM_POS_ADJ`, `GRM_POS_NOUN` | Hiển thị công thức `[Det] + [Adj] + [Noun]` và giao 5 câu Twin-Questions `GRM_POS_ADJ`. |
| `ERR_POS_ADJ_FOR_ADV` | Nhầm Tính từ vào vị trí của Trạng từ (đuôi `-ly`) | `GRM_POS_ADV` | Bật cảnh báo cấu trúc `Verb / Participle + [Adv -ly]` và giao 5 câu `GRM_POS_ADV`. |
| `ERR_POS_ADV_FOR_ADJ` | Nhầm Trạng từ vào vị trí của Tính từ (trước Noun / sau Linking Verb) | `GRM_POS_ADJ` | Mở thẻ ghi nhớ danh sách Linking Verbs (`be, become, remain, stay, seem, find/keep + O + Adj`). |
| `ERR_POS_NONFINITE_FOR_MAIN_VERB` | Chọn `V-ing` / `To-V` hoặc Danh từ vào vị trí Động từ chính | `GRM_POS_VERB` | Yêu cầu học viên xác định Động từ chia thì của mệnh đề trước khi chọn đáp án. |
| `ERR_POS_MAIN_VERB_IN_NP` | Chọn Động từ chia thì vào Cụm danh từ khi câu đã đủ Động từ chính | `GRM_POS_NOUN`, `GRM_VERB_PARTICIPLE` | Nhắc quy tắc: 1 mệnh đề chỉ có 1 động từ chia thì duy nhất. |
| `ERR_PRON_CASE_MISMATCH` | Sai chức năng ngữ pháp của Đại từ (Chủ ngữ / Tân ngữ / Sở hữu / Phản thân) | `GRM_PRON_CASE` | Kiểm tra từ ngay sau chỗ trống: nếu là Danh từ $\rightarrow$ bắt buộc chọn Tính từ sở hữu. |
| `ERR_REL_PRONOUN_MISMATCH` | Chọn sai Đại từ quan hệ (`who / whom / whose / which / what`) | `GRM_PRON_RELATIVE` | Đối chiếu danh từ tiền ngữ (người/vật) và danh từ theo sau (`whose + Noun`). |
| `ERR_PREP_VS_CONJ_STRUCTURE` | Nhầm lẫn cấu trúc Giới từ (`+ Cụm danh từ/V-ing`) và Liên từ (`+ Mệnh đề S+V`) | `GRM_CONN_PREP_VS_CONJ` | Bật bước phụ trên UI: hỏi học viên *"Sau chỗ trống có động từ chia thì không?"*. |
| `ERR_VERB_SVA_TRAP` | Mắc bẫy Hòa hợp Chủ ngữ - Động từ do cụm giới từ chen giữa | `GRM_VERB_SVA` | Gạch mờ cụm giới từ (`of/in/for + Noun`) đứng giữa Chủ ngữ chính và Động từ. |
| `ERR_VERB_VOICE_DIRECTION` | Nhầm lẫn giữa Thể Chủ động (`Active`) và Thể Bị động (`Passive`) | `GRM_VERB_PASSIVE` | Kiểm tra xem sau ngoại động từ có Tân ngữ danh từ hay không (Không có tân ngữ $\rightarrow$ Bị động). |
| `ERR_VERB_TENSE_MARKER` | Chọn sai Thì của động từ so với mốc thời gian trong câu | `GRM_VERB_TENSE`, `GRM_COND_INVERSION` | Tô sáng trạng từ thời gian (`since, for, over the past, by next month`) trong câu. |
| `ERR_VERB_PARTICIPLE_DIRECTION` | Nhầm lẫn giữa Phân từ hiện tại (`V-ing`) và Phân từ quá khứ (`V-ed/V3`) | `GRM_VERB_PARTICIPLE`, `GRM_VERB_INFINITIVE_GERUND` | Mở bảng đối chiếu tính chất Chủ động (`V-ing`) vs. Bị tác động (`V-ed`). |
| `ERR_VOCAB_COLLOCATION_MISMATCH` | Chọn từ vựng không khớp ngữ cảnh hoặc sai cụm Collocation thương mại | `VOC_COLLOCATION`, `VOC_PHRASAL_PREP` | Đẩy các từ trong `linked_vocabulary` và `collocation_highlights` vào bộ Flashcard SRS. |
| `ERR_COHERENCE_DISCOURSE_FLOW` | Đứt gãy mạch liên kết câu / đoạn văn (Part 6 Discourse Coherence) | `COH_P6_SENTENCE_INSERT`, `GRM_CONN_TRANSITION` | Highlight câu đứng trước và sau chỗ trống trong `context_sentence`. |
| `ERR_COMPREHENSION_TRAP` | Mắc bẫy lặp từ nguyên văn hoặc suy diễn sai chi tiết (Part 3, 4, 7) | `RC_P7_*`, `LC_P3_P4_*` | Tự động cuộn tới và tô sáng `evidence_sentence_en` hoặc `full_audio_script_en`. |

---

## PHẦN 2: ĐẶC TẢ KIỂU DỮ LIỆU TYPESCRIPT & DATABASE SCHEMA (`src/types/toeic.ts` & `schema.sql`)

### 2.1. Định nghĩa TypeScript Interfaces chuẩn xác 100% (`src/types/toeic.ts`)

Coding Agent tạo file `src/types/toeic.ts` với nội dung nguyên văn như sau để đảm bảo Type-Safety trên toàn bộ dự án:

```typescript
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export type SkillCategory =
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'COHERENCE'
  | 'READING_COMPREHENSION'
  | 'LISTENING_COMPREHENSION';

export type RadarGroupCode =
  | 'G1_POS'
  | 'G2_VERB'
  | 'G3_PRON'
  | 'G4_CONN'
  | 'G5_MOD'
  | 'G6_VOC_COH'
  | 'G7_READING'
  | 'G8_LISTENING';

export interface IRT3PLParams {
  discrimination_a: number; // Hệ số phân biệt (1.15 -> 1.40)
  difficulty_b: number;     // Độ khó trên thang chuẩn (-2.5 -> +2.5)
  guessing_c: number;       // Xác suất đoán mò (0.25 cho 4 lựa chọn, 0.33 cho Part 2)
}

export interface SentenceXRay {
  left_context: string;
  blank_slot: string;
  right_context: string;
  left_anchor_words: string;
  right_anchor_words: string;
  required_grammatical_role: string;
  xray_pattern_display: string;
}

export interface OptionDeepAnalysisItem {
  text: string;
  is_correct: boolean;
  pos_or_role: string;
  error_pattern_code: string | null;
  error_pattern_name_vi?: string;
  ai_feedback_vi: string;
}

export interface WordFamilyItem {
  option: OptionKey;
  word: string;
  grammatical_role: string;
  is_correct: boolean;
}

export interface LinkedVocabItem {
  word: string;
  pos: string;
  meaning_vi: string;
}

export interface ListeningScriptSync {
  dictation_track_id: string | null;
  audio_ref: string | null;
  full_audio_script_en: string | null;
}

export interface QuestionAIAnalysis {
  primary_topic_id: string;
  primary_topic_name_vi: string;
  micro_rule_formula_vi: string;
  common_trap_warning_vi: string;
  irt_3pl: IRT3PLParams;
  skill_weight_vector: Partial<Record<RadarGroupCode, number>>;
  sentence_xray: SentenceXRay | null;
  option_deep_analysis: Record<OptionKey, OptionDeepAnalysisItem>;
  solving_steps_vi: string[];
  word_family_matrix?: WordFamilyItem[];
  collocation_highlights?: string[];
  similar_question_ids: string[];
  evidence_sentence_en: string | null;
  listening_script_sync?: ListeningScriptSync | null;
  linked_vocabulary: LinkedVocabItem[];
  ai_tutor_rag_context: string;
}

export interface TOEICQuestion {
  id: string;                        // VD: "ETS2024_T01_Q105"
  number: number;                    // 1..200
  part: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  set_id?: string | null;            // VD: "L32-34" (Listening)
  test_set_id?: string | null;       // VD: "ETS2024_T01_L32-34"
  passage_id?: string | null;        // VD: "P131-134" (Reading)
  passage_group_id?: string | null;  // VD: "P186-190"
  passage_doc_ids?: string[];        // VD: ["ETS2024_T01_P186-190_D1", "ETS2024_T01_P186-190_D2"]
  stem: string | null;
  context_sentence: string | null;
  options: Record<OptionKey, string> | null;
  correct_answer: OptionKey;
  primary_grammar_topic_id: string;
  secondary_topic_ids: string[];
  skill_category: SkillCategory;
  difficulty_level: 1 | 2 | 3 | 4;
  target_score_band: 450 | 500 | 550 | 600 | 650 | 700 | 750 | 850;
  recommended_time_sec: number;
  key_clue: string;
  explanation_vi: string;
  distractor_analysis: Partial<Record<OptionKey, string>>;
  image_description: string | null;
  source_page: number | null;
  ai_analysis: QuestionAIAnalysis;
}
```

### 2.2. Thiết kế Bảng Trạng Thái Người Dùng (User State & Telemetry SQL Schema)

Trong file `ets_toeic_normalized.sqlite` đã có sẵn **7 bảng Content** (`grammar_topics`, `error_patterns`, `milestone_templates`, `passages`, `questions`, `dictation_tracks`, `vocabulary_items`). Coding Agent chạy thêm đoạn DDL dưới đây để khởi tạo **6 bảng User State & Analytics**:

```sql
-- 1. HỒ SƠ HỌC VIÊN (USERS)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT,
    current_theta REAL DEFAULT -0.5,          -- Năng lực IRT hiện tại (-2.5 -> +2.5)
    predicted_toeic_score INTEGER DEFAULT 400,-- Điểm quy đổi (10 -> 990)
    target_toeic_score INTEGER DEFAULT 650,
    daily_goal_questions INTEGER DEFAULT 30,
    streak_days INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. LỊCH SỬ TRẢ LỜI TỪNG CÂU HỎI (USER QUESTION RESPONSES)
CREATE TABLE IF NOT EXISTS user_question_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    session_id TEXT NOT NULL,                 -- ID của phiên Diagnostic, Milestone Drill hoặc Mock Test
    session_type TEXT NOT NULL,               -- 'DIAGNOSTIC' | 'MILESTONE_DRILL' | 'BOSS_GATE' | 'TWIN_REMEDIATION' | 'FULL_TEST'
    question_id TEXT NOT NULL REFERENCES questions(id),
    selected_option TEXT,                     -- 'A' | 'B' | 'C' | 'D' | NULL
    is_correct INTEGER NOT NULL,              -- 1 = Đúng, 0 = Sai
    time_spent_sec REAL NOT NULL,             -- Thời gian suy nghĩ thực tế (giây)
    used_xray_hint INTEGER DEFAULT 0,         -- 1 = Có bấm xem gợi ý X-Ray
    triggered_error_code TEXT REFERENCES error_patterns(code),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. MA TRẬN THÔNG THẠO 24 CHỦ ĐIỂM CỦA HỌC VIÊN (USER SKILL MASTERY)
CREATE TABLE IF NOT EXISTS user_skill_mastery (
    user_id TEXT NOT NULL REFERENCES users(id),
    grammar_topic_id TEXT NOT NULL REFERENCES grammar_topics(id),
    mastery_score REAL DEFAULT 0.0,           -- 0.0 -> 100.0 (%)
    accuracy_pct REAL DEFAULT 0.0,
    avg_time_sec REAL DEFAULT 0.0,
    speed_status TEXT DEFAULT 'UNRATED',      -- 'FAST_ACCURATE' | 'SLOW_ACCURATE' | 'FAST_GUESSING' | 'WEAK'
    focus_priority_index REAL DEFAULT 0.0,    -- Chỉ số FPI để xếp hạng ưu tiên trên Dashboard
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    recent_error_streak INTEGER DEFAULT 0,
    last_practiced_at TEXT,
    PRIMARY KEY (user_id, grammar_topic_id)
);

-- 4. THỐNG KÊ MẪU LỖI NHẬN THỨC CỦA HỌC VIÊN (USER ERROR PATTERN LOGS)
CREATE TABLE IF NOT EXISTS user_error_pattern_logs (
    user_id TEXT NOT NULL REFERENCES users(id),
    error_pattern_code TEXT NOT NULL REFERENCES error_patterns(code),
    occurrence_count INTEGER DEFAULT 0,
    resolved_count INTEGER DEFAULT 0,         -- Số lần đã sửa sai thành công qua Twin-Questions
    last_question_id TEXT REFERENCES questions(id),
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, error_pattern_code)
);

-- 5. LỘ TRÌNH MILESTONE CÁ NHÂN HÓA (USER MILESTONES)
CREATE TABLE IF NOT EXISTS user_milestones (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    milestone_id TEXT NOT NULL REFERENCES milestone_templates(milestone_id),
    milestone_order INTEGER NOT NULL,
    status TEXT DEFAULT 'LOCKED',             -- 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
    injected_weak_topic_ids_json TEXT DEFAULT '[]', -- Các chủ điểm yếu của riêng cá nhân được chèn thêm
    completed_drill_questions INTEGER DEFAULT 0,
    required_drill_questions INTEGER DEFAULT 48,
    best_boss_gate_accuracy REAL DEFAULT 0.0,
    boss_gate_passed INTEGER DEFAULT 0,
    unlocked_at TEXT,
    completed_at TEXT,
    UNIQUE (user_id, milestone_id)
);

-- 6. SỔ TAY CÂU SAI & TỪ VỰNG ÔN TẬP NGẮT QUÃNG (USER SRS CARDS)
CREATE TABLE IF NOT EXISTS user_srs_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    card_type TEXT NOT NULL,                  -- 'MISTAKE_QUESTION' | 'VOCABULARY'
    target_ref_id TEXT NOT NULL,              -- question.id hoặc vocabulary_items.id
    error_pattern_code TEXT,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_at TEXT NOT NULL,
    UNIQUE (user_id, card_type, target_ref_id)
);

CREATE INDEX IF NOT EXISTS idx_resp_user_q ON user_question_responses(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_mastery_fpi ON user_skill_mastery(user_id, focus_priority_index DESC);
CREATE INDEX IF NOT EXISTS idx_srs_due ON user_srs_cards(user_id, next_review_at);
```

---

## PHẦN 3: MÃ NGUỒN THUẬT TOÁN LÕI CHO CODING AGENT (`src/lib/ai-engine/`)

Coding Agent có thể copy-paste trực tiếp 3 module thuật toán dưới đây vào `src/lib/ai-engine/` để vận hành toàn bộ trí tuệ nhân tạo của hệ thống:

### 3.1. Module 1: Thuật toán Chấm điểm IRT 3PL, Tính FPI & Cập nhật Mastery (`src/lib/ai-engine/scoring-engine.ts`)

```typescript
import { TOEICQuestion, OptionKey, RadarGroupCode } from '@/types/toeic';

export interface QuestionAttemptInput {
  question: TOEICQuestion;
  selectedOption: OptionKey | null;
  timeSpentSec: number;
  usedHint: boolean;
}

export interface TopicMasteryState {
  topicId: string;
  weightInToeic: number;
  targetScoreBand: number;
  recommendedTimeSec: number;
  questionsAttempted: number;
  questionsCorrect: number;
  weightedCorrectSum: number;
  weightedTotalSum: number;
  totalTimeSec: number;
  recentErrorStreak: number;
}

/**
 * 1. Ước lượng năng lực Theta (-2.5 -> +2.5) theo mô hình IRT 3PL (Newton-Raphson / EAP)
 * và quy đổi ra Điểm TOEIC Dự Đoán (10 -> 990, làm tròn bội số của 5).
 */
export function estimateIRTAbilityAndScore(
  attempts: QuestionAttemptInput[],
  priorTheta: number = -0.2
): { theta: number; predictedScore: number } {
  if (attempts.length === 0) {
    return { theta: priorTheta, predictedScore: thetaToToeicScore(priorTheta) };
  }

  // Duyệt lưới EAP (Expected A Posteriori) trên 101 điểm từ -2.5 đến +2.5 (cực kỳ ổn định, không bao giờ phân kỳ)
  let numerator = 0;
  let denominator = 0;

  for (let idx = 0; idx <= 100; idx++) {
    const thetaGrid = -2.5 + idx * 0.05;
    // Prior chuẩn N(priorTheta, 1.0^2)
    let logLikelihood = -0.5 * Math.pow((thetaGrid - priorTheta) / 1.0, 2);

    for (const att of attempts) {
      const { discrimination_a: a, difficulty_b: b, guessing_c: c } = att.question.ai_analysis.irt_3pl;
      const isCorrect = att.selectedOption === att.question.correct_answer && !att.usedHint;
      const expTerm = Math.exp(-a * (thetaGrid - b));
      const pCorrect = c + (1 - c) / (1 + expTerm);
      const pClamped = Math.max(1e-6, Math.min(1 - 1e-6, pCorrect));

      logLikelihood += isCorrect ? Math.log(pClamped) : Math.log(1 - pClamped);
    }

    const weight = Math.exp(logLikelihood);
    numerator += thetaGrid * weight;
    denominator += weight;
  }

  const finalTheta = denominator > 0 ? Number((numerator / denominator).toFixed(3)) : priorTheta;
  return {
    theta: finalTheta,
    predictedScore: thetaToToeicScore(finalTheta),
  };
}

export function thetaToToeicScore(theta: number): number {
  const raw = 495 + theta * 195;
  const clamped = Math.max(10, Math.min(990, raw));
  return Math.round(clamped / 5) * 5;
}

/**
 * 2. Tính Điểm Thông Thạo (Mastery Score 0..100), Trạng thái tốc độ (Speed Status)
 * và Chỉ số Ưu tiên Tập trung (Focus Priority Index - FPI) cho một Chủ điểm Ngữ pháp.
 */
export function computeTopicMetrics(
  state: TopicMasteryState,
  userPredictedScore: number
): {
  masteryScore: number;
  accuracyPct: number;
  avgTimeSec: number;
  speedStatus: 'FAST_ACCURATE' | 'SLOW_ACCURATE' | 'FAST_GUESSING' | 'WEAK';
  focusPriorityIndex: number;
} {
  if (state.questionsAttempted === 0) {
    // Nếu chưa làm câu nào ở chủ điểm này, ưu tiên cao nếu chủ điểm nằm gần band điểm hiện tại của user
    const bandDiff = Math.abs(state.targetScoreBand - userPredictedScore);
    const bandFit = bandDiff <= 150 ? 1.5 : 0.7;
    const baseFpi = 65 * Math.log(1 + state.weightInToeic) * bandFit;
    return {
      masteryScore: 0,
      accuracyPct: 0,
      avgTimeSec: 0,
      speedStatus: 'WEAK',
      focusPriorityIndex: Number(baseFpi.toFixed(2)),
    };
  }

  const accuracyPct = (state.questionsCorrect / state.questionsAttempted) * 100;
  const weightedAccuracy = (state.weightedCorrectSum / Math.max(1, state.weightedTotalSum)) * 100;
  const avgTimeSec = state.totalTimeSec / state.questionsAttempted;
  const timeRatio = avgTimeSec / Math.max(5, state.recommendedTimeSec);

  let speedStatus: 'FAST_ACCURATE' | 'SLOW_ACCURATE' | 'FAST_GUESSING' | 'WEAK' = 'WEAK';
  let speedMultiplier = 1.0;

  if (accuracyPct >= 75 && timeRatio <= 1.25) {
    speedStatus = 'FAST_ACCURATE';
    speedMultiplier = 1.0;
  } else if (accuracyPct >= 75 && timeRatio > 1.25) {
    speedStatus = 'SLOW_ACCURATE'; // Làm đúng nhưng dịch câu quá chậm -> cần luyện phản xạ X-Ray
    speedMultiplier = 0.85;
  } else if (accuracyPct < 55 && timeRatio < 0.5) {
    speedStatus = 'FAST_GUESSING'; // Đánh lụi quá nhanh
    speedMultiplier = 0.75;
  } else {
    speedStatus = 'WEAK';
    speedMultiplier = 0.9;
  }

  // Hệ số tin cậy theo số lượng câu đã làm (tránh làm đúng 1/1 câu đã được 100% Mastery)
  const confidenceFactor = Math.min(1.0, state.questionsAttempted / 6);
  const masteryScore = Number((weightedAccuracy * speedMultiplier * confidenceFactor).toFixed(1));

  // Công thức Focus Priority Index (FPI)
  const bandDiff = Math.abs(state.targetScoreBand - userPredictedScore);
  const bandFit = bandDiff <= 150 ? 1.5 : bandDiff <= 250 ? 1.0 : 0.6;
  const errorStreakBoost = 1 + 0.2 * Math.min(5, state.recentErrorStreak);
  const fpi = (100 - masteryScore) * Math.log(1 + state.weightInToeic) * bandFit * errorStreakBoost;

  return {
    masteryScore,
    accuracyPct: Number(accuracyPct.toFixed(1)),
    avgTimeSec: Number(avgTimeSec.toFixed(1)),
    speedStatus,
    focusPriorityIndex: Number(fpi.toFixed(2)),
  };
}
```

### 3.2. Module 2: Thuật toán Chọn Câu Hỏi Thích Ứng 3 Chặng (`src/lib/ai-engine/diagnostic-selector.ts`)

Bài kiểm tra đầu vào gồm **30 câu chia làm 3 chặng (10 câu/chặng)** để chẩn đoán chính xác năng lực mà chỉ tốn 12–15 phút của người dùng:

* **Chặng 1 (Câu 1 – 10 | Baseline Probe):**
  * Chọn 10 câu ở `difficulty_level = 2` từ `ets_toeic_ai_grammar_master.json`, mỗi câu đại diện cho 1 chủ điểm cốt lõi:
    1. `GRM_POS_NOUN` (1 câu)
    2. `GRM_POS_ADJ` (1 câu)
    3. `GRM_POS_ADV` (1 câu)
    4. `GRM_POS_VERB` (1 câu)
    5. `GRM_PRON_CASE` (1 câu)
    6. `GRM_VERB_SVA` (1 câu)
    7. `GRM_VERB_TENSE` (1 câu)
    8. `GRM_CONN_PREP_VS_CONJ` (1 câu)
    9. `GRM_VERB_PARTICIPLE` (1 câu)
    10. `VOC_COLLOCATION` (1 câu)
* **Chặng 2 (Câu 11 – 20 | Adaptive Difficulty Branching):**
  * Tính số câu đúng ở Chặng 1 (`stage1Correct`):
    * **Nhánh A (`stage1Correct >= 7` – Trình độ Khá/Giỏi):** Rút 10 câu ở mức `difficulty_level IN (3, 4)` thuộc các chủ điểm phân hóa cao: `GRM_VERB_PARTICIPLE` (2), `GRM_PRON_RELATIVE` (1), `GRM_CONN_TRANSITION` (2), `GRM_COMP_QUANTIFIER` (1), `GRM_COND_INVERSION` (1), `VOC_PHRASAL_PREP` (1), `COH_P6_SENTENCE_INSERT` (2).
    * **Nhánh B (`4 <= stage1Correct <= 6` – Trình độ Trung cấp):** Rút 10 câu ở mức `difficulty_level IN (2, 3)` thuộc: `GRM_VERB_PASSIVE` (2), `GRM_VERB_INFINITIVE_GERUND` (2), `GRM_CONN_PREP_MEANING` (2), `GRM_CONN_PREP_VS_CONJ` (2), `COH_P6_SENTENCE_INSERT` (2).
    * **Nhánh C (`stage1Correct <= 3` – Trình độ Nền tảng / Mất gốc):** Rút 10 câu ở mức `difficulty_level IN (1, 2)` tập trung xoáy sâu vào `GRM_POS_NOUN` (2), `GRM_POS_ADJ` (2), `GRM_POS_ADV` (2), `GRM_POS_VERB` (2), `GRM_PRON_CASE` (2).
* **Chặng 3 (Câu 21 – 30 | Targeted Weakness Verification & Reading Speed Check):**
  * Lấy danh sách các câu học viên vừa làm sai ở Chặng 1 & Chặng 2.
  * Với 3 câu sai đầu tiên, đọc trực tiếp mảng `question.ai_analysis.similar_question_ids` để lấy ra **6 câu hỏi tương đương ("Twin Questions")** kiểm tra lại xem học viên thực sự hổng kiến thức đó hay chỉ sơ suất.
  * Lấy thêm **1 đoạn văn đơn Part 7 (4 câu hỏi)** từ bảng `passages` & `questions` (`part = 7`, `passage_group_id` có 4 câu như `P164-167`) để đo tốc độ đọc hiểu thực tế.

### 3.3. Module 3: Thuật toán Khởi tạo & Điều phối Lộ Trình 7 Milestones (`src/lib/ai-engine/roadmap-generator.ts`)

Khi học viên hoàn thành bài Diagnostic Test (hoặc bất kỳ bài Full Test nào), hàm `generateOrUpdateUserRoadmap` thực hiện 4 quy tắc:
1. **Quy tắc Fast-Track (Miễn học trạm đã vững):**
   * Duyệt qua 7 mẫu trong `milestone_templates.json` (`order = 1..7`). Nếu `milestone.target_band_score <= user.predicted_toeic_score - 30` VÀ trung bình `mastery_score` của các `focus_topic_ids` trong Milestone đó $\ge 80\%$, đánh dấu Milestone đó là **`COMPLETED`**.
2. **Quy tắc Mở khóa Trạm Hiện Tại (`IN_PROGRESS`):**
   * Trạm đầu tiên chưa đạt `COMPLETED` được gán trạng thái **`IN_PROGRESS`**. Các trạm phía sau giữ trạng thái **`LOCKED`**.
3. **Quy tắc Tiêm Chủ Điểm Yếu Cá Nhân (`Personal Weakness Injection`):**
   * Lấy 2 chủ điểm có chỉ số `focus_priority_index` cao nhất của học viên (từ bảng `user_skill_mastery`) mà chưa nằm trong `focus_topic_ids` mặc định của Milestone hiện tại, lưu vào cột `injected_weak_topic_ids_json` để tạo bộ bài tập **Guided Drill cá nhân hóa 100%**.
4. **Quy tắc Vượt Trạm (`Boss Gate Evaluation`):**
   * Khi học viên làm bài kiểm tra Boss Gate của Milestone hiện tại (dựa theo `boss_gate_criteria`: số câu `question_count`, thời gian tối đa `max_time_sec`, độ chính xác tối thiểu `min_accuracy_pct`):
     * Nếu **ĐẠT (`accuracy >= min_accuracy_pct` VÀ `totalTime <= max_time_sec`)**: Chuyển trạng thái Milestone hiện tại sang `COMPLETED`, cộng điểm thưởng kỳ vọng vào dự báo tiến độ, và mở khóa Milestone kế tiếp sang `IN_PROGRESS`.
     * Nếu **CHƯA ĐẠT**: Giữ trạng thái `IN_PROGRESS`, trích xuất các mã `error_pattern_code` vừa sai trong bài Boss Gate và tạo ngay gói **"Ôn tập Khắc phục (Remediation Drill - 10 câu Twin Questions)"** để học viên ôn lại trước khi thi lại Boss Gate.

---

## PHẦN 4: ĐẶC TẢ HỢP ĐỒNG API BACKEND (REST API CONTRACTS CHO AGENT)

Coding Agent xây dựng 8 API Endpoints chuẩn dưới đây (tương thích Next.js App Router `src/app/api/...` hoặc FastAPI/Express):

| STT | Method & Endpoint | Request Payload / Query Params | Logic Xử Lý Trên Database V3.0 | Response JSON Schema |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `POST /api/diagnostic/start` | `{ "userId": "u_123", "targetScore": 700 }` | Tạo phiên `sessionId`, rút 10 câu Chặng 1 từ `questions` theo danh sách 10 chủ điểm cốt lõi. | `{ "sessionId": "diag_01", "stage": 1, "questions": TOEICQuestion[] }` |
| **2** | `POST /api/diagnostic/stage` | `{ "sessionId": "diag_01", "stage": 1, "responses": [{ "questionId": "...", "selectedOption": "B", "timeSpentSec": 11.2 }] }` | Lưu câu trả lời vào `user_question_responses`; nếu hết Stage 1 $\rightarrow$ phân nhánh chọn 10 câu Stage 2; nếu hết Stage 2 $\rightarrow$ lấy `similar_question_ids` của các câu sai để tạo 10 câu Stage 3. | `{ "stage": 2, "questions": TOEICQuestion[] }` |
| **3** | `POST /api/diagnostic/submit` | `{ "sessionId": "diag_01", "userId": "u_123", "responses": [...] }` | Chạy `estimateIRTAbilityAndScore`, cập nhật `user_skill_mastery` (24 chủ điểm), ghi `user_error_pattern_logs`, sinh lộ trình 7 Milestones trong `user_milestones`. | `{ "predictedScore": 515, "theta": 0.1, "radarAxes": {...}, "topFocusTopics": [...], "detectedErrorPatterns": [...], "milestones": [...] }` |
| **4** | `GET /api/roadmap/:userId` | `userId` (Path param) | Join `user_milestones` với `milestone_templates` và `user_skill_mastery`, kèm số lượng thẻ SRS đến hạn ôn tập hôm nay. | `{ "userSummary": {...}, "milestones": [...], "topFocusTopics": [...], "srsDueCount": 12 }` |
| **5** | `GET /api/practice/drill` | `?userId=u_123&topicId=GRM_CONN_PREP_VS_CONJ&limit=15` | Lấy 15 câu thuộc `topicId` (ưu tiên câu học viên chưa làm hoặc từng làm sai trong `user_question_responses`), trả về kèm đầy đủ `ai_analysis`. | `{ "topicInfo": GrammarTopic, "questions": TOEICQuestion[] }` |
| **6** | `POST /api/practice/check-answer` | `{ "userId": "u_123", "questionId": "ETS2024_T01_Q105", "selectedOption": "B", "timeSpentSec": 16.5, "usedHint": false }` | Kiểm tra đúng/sai, cập nhật `user_skill_mastery`; nếu sai hoặc `timeSpentSec > 1.5 * recommended_time_sec` $\rightarrow$ thêm vào `user_srs_cards` và trả về 3 câu Twin Questions từ `similar_question_ids`. | `{ "isCorrect": false, "correctAnswer": "D", "optionFeedback": OptionDeepAnalysisItem, "xray": SentenceXRay, "solvingSteps": string[], "twinQuestions": TOEICQuestion[] }` |
| **7** | `GET /api/tests/:series/:testNum` | `series` (`ETS2024`\|`ETS2026`), `testNum` (`1..10`), `?mode=full\|part5\|part6\|part7` | Lấy danh sách `passages` (đã gom nhóm theo `passage_group_id` và sắp xếp theo `doc_order`) và `questions` của đề thi đó. | `{ "series": "ETS2026", "testNumber": 1, "passageGroups": Record<string, Passage[]>, "questions": TOEICQuestion[] }` |
| **8** | `POST /api/ai-tutor/ask` | `{ "questionId": "ETS2024_T01_Q105", "selectedOption": "B", "userMessage": "Tại sao không dùng updating được?" }` | Lấy `ai_analysis.ai_tutor_rag_context`, `sentence_xray` và `option_deep_analysis` ghép vào System Prompt gọi LLM trả lời ngắn gọn, chuẩn sư phạm TOEIC. | `{ "replyMarkdown": "...", "suggestedRule": "..." }` |

---

## PHẦN 5: ĐẶC TẢ CHI TIẾT COMPONENT UI/UX & STATE MACHINE CHO FRONTEND AGENT

Để giao diện trực quan, dễ dùng và khai thác hết sức mạnh của Database V3.0, Coding Agent cần xây dựng **5 Core Components** theo đúng State Machine và Props dưới đây:

### 5.1. Component 1: `<SentenceXRayCard />` (Trái tim của Web Học Ngữ Pháp)

* **Vị trí file:** `src/components/grammar/SentenceXRayCard.tsx`
* **State Machine (4 trạng thái rõ ràng):**
  1. **`STATE_SOLVING` (Đang suy nghĩ chọn đáp án):**
     * Hiển thị câu hỏi `question.stem` (hoặc `context_sentence` nếu luyện lẻ câu Part 6) với chỗ trống `-------` được render thành pill nổi bật `[   ?   ]`.
     * Góc phải trên hiển thị thanh đếm thời gian `PacingTimer` chạy từ `0s` đến `question.recommended_time_sec` (Xanh lá khi $\le 70\%$ thời gian, Vàng khi $70\%..100\%$, Cam khi vượt quá thời gian chuẩn).
     * Hiển thị 4 nút chọn `(A)`, `(B)`, `(C)`, `(D)` hỗ trợ phím tắt bàn phím `1, 2, 3, 4` hoặc `A, B, C, D`.
  2. **`STATE_HINT_ACTIVE` (Khi học viên bấm nút `[💡 Gợi ý X-Ray]` hoặc phím `H`):**
     * Không tiết lộ đáp án đúng, nhưng dựa vào `question.ai_analysis.sentence_xray`:
       * Tô sáng nền xanh dương cho cụm từ đứng ngay trước chỗ trống (`left_anchor_words`) và cụm từ đứng ngay sau chỗ trống (`right_anchor_words`).
       * Hiển thị nhãn gợi ý ngay trên ô trống: *"Vị trí này cần: `required_grammatical_role`"*.
       * Hiển thị hộp công thức nhỏ: `question.ai_analysis.micro_rule_formula_vi`.
  3. **`STATE_SUBMITTED_XRAY` (Ngay sau khi học viên chọn 1 phương án):**
     * Điền từ đúng vào ô trống và hiển thị thanh sơ đồ cấu trúc: `sentence_xray.xray_pattern_display` (`company is using ➔ [V-ed/V3: updated] ➔ software.`).
     * Dưới mỗi phương án A, B, C, D, hiển thị nhãn `option_deep_analysis[k].pos_or_role`.
     * Ngay dưới phương án học viên đã chọn, hiển thị hộp phản hồi `option_deep_analysis[selected].ai_feedback_vi` (Nếu chọn sai, gắn badge cảnh báo màu đỏ cam tên lỗi tư duy `error_pattern_name_vi`).
     * Hiển thị danh sách 3 bước giải nhanh `solving_steps_vi[]`.
     * Hiển thị bảng 2 cột dưới chân thẻ:
       * Cột trái: **Bảng Họ Từ Loại (`word_family_matrix`)** + **Cụm Collocation (`collocation_highlights`)**.
       * Cột phải: **Từ vựng TOEIC trong câu (`linked_vocabulary`)** kèm nút `[+ Lưu vào Sổ tay SRS]`.
  4. **`STATE_TWIN_REMEDIATION` (Khi học viên chọn sai và bấm `[🔁 Luyện ngay câu tương tự]`):**
     * Mở trượt (slide-down) một khay bài tập phụ ngay bên dưới chứa câu hỏi đầu tiên trong mảng `question.ai_analysis.similar_question_ids` để học viên áp dụng công thức vừa đọc và gỡ điểm ngay lập tức.

### 5.2. Component 2: `<SplitPassageReader />` (Giao diện Đọc Hiểu Part 6 & Part 7)

* **Vị trí file:** `src/components/reading/SplitPassageReader.tsx`
* **Quy tắc hiển thị đa văn bản & Đồng bộ Dẫn chứng:**
  * Nhận mảng `passages` thuộc cùng `passage_group_id` (đã sắp xếp theo `doc_order = 1, 2, 3`).
  * Nếu `passages.length > 1` (Bài đọc đôi/ba ở câu 176–200): Render cả chế độ **Tabs chuyển nhanh** lẫn chế độ **Stacked Cards (Xếp chồng)**, và nếu `passage.tables` có dữ liệu thì render thành bảng HTML có đường viền chuẩn ETS.
  * **Tính năng Auto-Highlight Evidence:** Khi ở trạng thái xem giải thích (`isReviewMode = true`) và học viên click vào câu hỏi `q`, Component tìm chuỗi `q.ai_analysis.evidence_sentence_en` bên trong `passage.text`, bọc trong thẻ `<mark class="bg-amber-200 border-b-2 border-amber-500 px-1 rounded">` và gọi `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`.

### 5.3. Component 3: `<DiagnosticRadarDashboard />` (Bản đồ Năng lực & Mục tiêu Focus)

* **Vị trí file:** `src/components/dashboard/DiagnosticRadarDashboard.tsx`
* **Bố cục hiển thị:**
  * **Score Hero Banner:** Hiển thị `predicted_toeic_score`, thanh tiến trình hướng tới `target_toeic_score`, và tốc độ phản xạ trung bình câu Part 5 (`avgPart5TimeSec` so với mục tiêu `< 15s/câu`).
  * **6-Axis Radar Chart:** Biểu diễn điểm thông thạo `mastery_score` của 6 trục Ngữ pháp & Đọc hiểu (`G1_POS`, `G2_VERB`, `G3_PRON`, `G4_CONN`, `G5_MOD`, `G6_VOC_COH`).
  * **Top 3 Focus Cards (Sắp xếp theo `focus_priority_index` giảm dần):** Mỗi thẻ chỉ rõ:
    * Tên chủ điểm (`name_vi`) & Band điểm mục tiêu.
    * Chẩn đoán trạng thái tốc độ & độ chính xác (`WEAK`: Sai nhiều cần học lại công thức; `SLOW_ACCURATE`: Hiểu bài nhưng làm chậm quá 20s/câu cần luyện Speed Drill).
    * Mẫu lỗi tư duy hay gặp nhất ở chủ điểm này (`error_pattern_name_vi`).
    * Nút CTA trực tiếp: **`[⚡ Vào Luyện Ngay 15 Câu Trọng Tâm]`**.

### 5.4. Component 4: `<MilestoneSkillTree />` (Cây Lộ Trình 7 Milestones Cá Nhân Hóa)

* **Vị trí file:** `src/components/roadmap/MilestoneSkillTree.tsx`
* Render 7 trạm từ `MS_01_FOUNDATION_POS` đến `MS_07_MASTERY_SPEED_DRILL`.
* Mỗi trạm hiển thị:
  * Trạng thái: `COMPLETED` (Xanh lá – Đã vượt qua), `IN_PROGRESS` (Xanh dương phát sáng – Trạm hiện tại), `LOCKED` (Xám – Mở khóa sau khi qua Boss Gate trạm trước).
  * Danh sách các chủ điểm cốt lõi của trạm + các chủ điểm yếu cá nhân được AI chèn thêm (`injected_weak_topic_ids_json`).
  * Tiến độ hoàn thành bài tập rèn luyện (`completed_drill_questions / required_drill_questions`) và nút **`[🏆 Thi Vượt Trạm Boss Gate]`**.

### 5.5. Component 5: `<DictationStudio />` (Phòng Luyện Nghe Chép Chính Tả ETS 2026)

* **Vị trí file:** `src/components/listening/DictationStudio.tsx`
* Sử dụng dữ liệu từ bảng `dictation_tracks` (`540 tracks`):
  * Tách chuỗi `cloze_text` theo token `_____` để tạo thành các ô `<input>` nối tiếp nhau ngay trong dòng văn bản, mỗi ô tương ứng với phần tử `blank_answers[index]`.
  * Hỗ trợ kiểm tra từng từ ngay khi gõ phím `Space` hoặc `Enter`: nếu gõ đúng (so sánh `input.trim().toLowerCase() === blank_answers[i].toLowerCase()`) thì khóa ô đó lại và chuyển màu xanh lá, tự động focus sang ô trống tiếp theo.

---

## PHẦN 6: KẾ HOẠCH THỰC THI TỪNG BƯỚC CHO CODING AGENT (6 ENGINEERING MILESTONES)

Coding Agent thực hiện tuần tự 6 Milestones dưới đây để hoàn thiện toàn bộ ứng dụng từ con số 0 đến Production:

### MILESTONE E1: Khởi tạo Dự án, Gắn Database V3.0 & Kiểm thử Tầng Data (Step 1)
* **Files cần tạo:**
  * `data/ets_toeic_normalized.sqlite` (giải nén từ `ETS_Corpus_Normalized_Enriched_Database.zip`).
  * `src/types/toeic.ts` (theo Đặc tả Phần 2.1).
  * `src/lib/db/sqlite-client.ts` (khởi tạo kết nối `better-sqlite3` hoặc `Prisma/Drizzle` và chạy DDL tạo 6 bảng User State ở Phần 2.2).
  * `src/lib/db/repositories/question-repo.ts` (hàm lấy câu hỏi theo `id`, theo `primary_grammar_topic_id`, lấy Twin Questions từ `similar_question_ids`, và lấy đề thi theo `series` + `test_number`).
* **Lệnh kiểm tra nghiệm thu (Agent Self-Test):**
  * Chạy script kiểm tra truy vấn `SELECT COUNT(*) FROM questions WHERE ai_analysis_json IS NOT NULL;` $\rightarrow$ Phải trả về đúng **`4000`**.
  * Truy vấn `SELECT COUNT(*) FROM dictation_tracks WHERE blank_count > 0;` $\rightarrow$ Phải trả về đúng **`540`**.

### MILESTONE E2: Triển khai AI Engine (IRT 3PL, FPI, Adaptive Diagnostic & Roadmap Generator) (Step 2)
* **Files cần tạo:**
  * `src/lib/ai-engine/scoring-engine.ts` (theo Đặc tả Phần 3.1).
  * `src/lib/ai-engine/diagnostic-selector.ts` (theo Đặc tả Phần 3.2).
  * `src/lib/ai-engine/roadmap-generator.ts` (theo Đặc tả Phần 3.3).
  * Các API Routes: `/api/diagnostic/start`, `/api/diagnostic/stage`, `/api/diagnostic/submit`, `/api/roadmap/[userId]`.
* **Lệnh kiểm tra nghiệm thu:**
  * Viết Unit Test giả lập 1 học viên trả lời đúng 8/10 câu ở Stage 1 $\rightarrow$ Kiểm tra Stage 2 phải trả về các câu có `difficulty_level >= 3`.
  * Giả lập học viên chọn sai 4 câu có `error_pattern_code = "ERR_PREP_VS_CONJ_STRUCTURE"` $\rightarrow$ Kiểm tra sau khi nộp bài, chủ điểm `GRM_CONN_PREP_VS_CONJ` phải nằm trong `topFocusTopics` và `ERR_PREP_VS_CONJ_STRUCTURE` xuất hiện trong `detectedErrorPatterns`.

### MILESTONE E3: Xây dựng Giao diện Diagnostic Test & Dashboard Bản Đồ Năng Lực (Step 3)
* **Files cần tạo:**
  * `src/app/diagnostic/page.tsx` (Giao diện làm bài kiểm tra đầu vào 30 câu theo 3 chặng có thanh tiến trình Chặng 1 $\rightarrow$ Chặng 2 $\rightarrow$ Chặng 3).
  * `src/components/dashboard/DiagnosticRadarDashboard.tsx` (Biểu đồ Radar 6 trục + Danh sách Top 3 Mục Cần Focus Ngay + Chẩn đoán 15 Mã Lỗi Nhận Thức).
  * `src/components/roadmap/MilestoneSkillTree.tsx` (Hiển thị lộ trình 7 Milestones cá nhân hóa).
* **Tiêu chí nghiệm thu UI:** Sau khi hoàn thành bài test, người dùng nhìn thấy ngay Điểm TOEIC dự đoán, biểu đồ Radar 6 trục, 3 mục cần ưu tiên học trước kèm nút bấm vào luyện tập ngay.

### MILESTONE E4: Xây dựng Giao diện `<SentenceXRayCard />` & Vòng lặp Twin-Questions (Step 4)
* **Files cần tạo:**
  * `src/components/grammar/SentenceXRayCard.tsx` (theo đúng 4 trạng thái State Machine ở Phần 5.1).
  * `src/app/practice/[topicId]/page.tsx` (Trang luyện tập chuyên sâu từng chủ điểm ngữ pháp và luyện tập trong từng Milestone).
  * API Route: `/api/practice/check-answer` và `/api/practice/drill`.
* **Tiêu chí nghiệm thu UI:**
  * Bấm nút `[💡 Gợi ý X-Ray]` phải tô sáng đúng `left_anchor_words` và `right_anchor_words`.
  * Chọn đáp án bất kỳ phải hiển thị ngay sơ đồ `xray_pattern_display`, phân tích `option_deep_analysis` cho cả 4 phương án A/B/C/D, 3 bước giải `solving_steps_vi`, bảng họ từ loại `word_family_matrix`, từ vựng `linked_vocabulary` và nút mở 3 câu tương tự (`similar_question_ids`).

### MILESTONE E5: Xây dựng `<SplitPassageReader />` (Part 6 & 7) & Boss Gate Checkpoint (Step 5)
* **Files cần tạo:**
  * `src/components/reading/SplitPassageReader.tsx` (Giao diện chia đôi màn hình, hỗ trợ hiển thị đa văn bản `doc_order = 1, 2, 3`, bảng biểu `tables_json`, và tự động cuộn + tô sáng `evidence_sentence_en`).
  * `src/app/milestones/[milestoneId]/boss-gate/page.tsx` (Giao diện thi vượt trạm có đồng hồ đếm ngược tổng thời gian và chấm điểm mở khóa Milestone tiếp theo).
* **Tiêu chí nghiệm thu UI:** Khi xem lời giải câu hỏi Part 6 hoặc Part 7, bấm vào câu hỏi bên cột phải sẽ tự động cuộn khung văn bản bên cột trái tới câu `evidence_sentence_en` và tô sáng màu vàng.

### MILESTONE E6: Hoàn thiện `<DictationStudio />`, Flashcard SRS & AI Tutor Chat (Step 6)
* **Files cần tạo:**
  * `src/components/listening/DictationStudio.tsx` (Giao diện nghe chép chính tả 540 tracks của ETS 2026).
  * `src/app/vocabulary/page.tsx` & `src/app/mistakes-srs/page.tsx` (Sổ tay ôn tập câu sai và từ vựng ngắt quãng theo lịch 1 – 3 – 7 – 14 ngày).
  * `src/components/ai-tutor/AITutorDrawer.tsx` & `/api/ai-tutor/ask` (Khung chat hỏi đáp AI Gia sư sử dụng `ai_tutor_rag_context` của từng câu hỏi).
* **Tiêu chí nghiệm thu cuối cùng:** Toàn bộ luồng từ **Kiểm tra chẩn đoán $\rightarrow$ Biết điểm yếu & Mục cần Focus $\rightarrow$ Học theo Lộ trình 7 Milestones với giao diện X-Ray $\rightarrow$ Sửa sai tức thì bằng Twin-Questions $\rightarrow$ Vượt trạm Boss Gate $\rightarrow$ Ôn tập SRS & Dictation** vận hành khép kín trên nền bộ dữ liệu 4.000 câu hỏi chuẩn hóa.