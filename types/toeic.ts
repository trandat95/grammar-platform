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

export interface GrammarTopic {
  id: string;
  group_code: RadarGroupCode;
  category: SkillCategory;
  name_en: string;
  name_vi: string;
  target_score_band: number;
  weight_in_toeic: number;
  recommended_time_sec: number;
  core_rule_formula_vi: string;
  common_traps_vi: string[];
}

export interface ErrorPattern {
  code: string;
  name_vi: string;
  primary_topic_ids: string[];
  description_vi: string;
  remediation_action_vi: string;
}

export interface BossGateCriteria {
  question_count: number;
  max_time_sec: number;
  min_accuracy_pct: number;
}

export interface MilestoneTemplate {
  milestone_id: string;
  order: number;
  title_vi: string;
  target_band_score: number;
  focus_topic_ids: string[];
  boss_gate_criteria: BossGateCriteria;
}

export interface Passage {
  id: string;
  part: number;
  questions: number[];
  type?: string;
  text: string;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
  source_page?: number;
  passage_group_id?: string;
  doc_order?: number;
}

export interface DictationTrack {
  part: number;
  track: number;
  question_range: string;
  cloze_text: string;
  full_text: string;
  audio_ref: string;
  blank_answers: string[];
  blank_count: number;
}

export interface ToeicVisualMedia {
  visual_scene_keywords: string;
  theme_color_hex: string;
  accent_color_hex: string;
  lucide_icon: string;
  cdn_thumbnail_url: string;
  pexels_search_endpoint: string;
  pixabay_search_endpoint: string;
  wikimedia_search_endpoint: string;
  ai_generation_prompt: string;
  offline_svg_card_data_uri?: string;
}

export interface SpacedRepetitionDefaults {
  algorithm: "FSRS-4.5 / SM-2" | string;
  initial_ease_factor: number;
  initial_interval_days: number;
  initial_stability: number;
  initial_difficulty: number;
}

export interface ToeicFlashcardModule {
  module_id: string;
  module_name_en: string;
  module_name_vi: string;
  topic_count: number;
  word_count: number;
  color_hex: string;
}

export interface ToeicFlashcardTopic {
  topic_id: number;
  module_id: string;
  module_name_vi?: string;
  topic_name_en: string;
  topic_name_vi: string;
  word_count: number;
  source_title: string;
  source_url: string;
}

export interface ToeicFlashcardItem {
  id: number;
  code: string;
  module_id: string;
  module_name_en: string;
  module_name_vi: string;
  topic_id: number;
  topic_name_en: string;
  topic_name_vi: string;
  word: string;
  part_of_speech: string;
  ipa_us: string;
  meaning_vi: string;
  definition_en: string;
  collocation: string;
  example_en: string;
  example_vi: string;
  cloze_sentence_en: string;
  cefr_level: "A2" | "B1" | "B2" | "C1";
  toeic_score_band: "300-450" | "450-600" | "600-750" | "750-990";
  synonyms: string[];
  synonyms_str: string;
  audio_tts_lang: "en-US";
  audio_google_tts_url: string;
  visual_media: ToeicVisualMedia;
  spaced_repetition_defaults: SpacedRepetitionDefaults;
  source_title: string;
  source_url: string;
}

export type FlashcardSrsState = "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";

export interface UserToeicFlashcardSrsState {
  id?: string;
  user_id?: string;
  flashcard_id: number;
  srs_state: FlashcardSrsState;
  reps: number;
  lapses: number;
  ease_factor: number;
  stability: number;
  difficulty: number;
  interval_days: number;
  last_rating?: 1 | 2 | 3 | 4 | null;
  last_response_ms?: number | null;
  source_context?: string | null;
  source_question_id?: string | null;
  custom_image_url?: string | null;
  personal_mnemonic_note?: string | null;
  due_at: string;
  last_reviewed_at?: string | null;
}
