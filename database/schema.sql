-- =============================================================================
-- PROJECT: English Grammar Learning Platform
-- Phase 1: Production PostgreSQL / Supabase Schema (schema.sql)
-- Source Textbook: Ngữ pháp tiếng Anh - Mai Lan Hương & Hà Thanh Uyên
-- =============================================================================

-- Enable required PostgreSQL extensions (standard on Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- -----------------------------------------------------------------------------
-- 1. ENUMERATED TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE book_section_type AS ENUM (
        'CHAPTER_INTRO',
        'LESSON_UNIT',
        'THEORY_BLOCK',
        'EXERCISE_BLOCK',
        'ANSWER_KEY_BLOCK',
        'PRACTICE_TEST_BLOCK'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lesson_section_type AS ENUM (
        'OVERVIEW',
        'FORMULA_AND_FORM',
        'USAGE',
        'GRAMMAR_FORM',
        'SIGNAL_WORDS',
        'NOTE',
        'CLASSIFICATION',
        'FUNCTION',
        'THEORY'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE grammar_rule_type AS ENUM (
        'FORMULA',
        'USAGE_RULE',
        'CONSTRAINT_NOTE',
        'THEORY_SUMMARY'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM (
        'MULTIPLE_CHOICE',
        'FILL_IN_THE_BLANKS',
        'COMPLETE_SENTENCES',
        'SENTENCE_TRANSFORMATION',
        'REWRITE_SENTENCES',
        'ERROR_CORRECTION',
        'WORD_FORMATION',
        'SENTENCE_ARRANGEMENT',
        'TRANSLATION',
        'TRUE_FALSE',
        'SHORT_ANSWER',
        'MATCHING'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE answer_verification_status AS ENUM (
        'VERIFIED',
        'NEEDS_REVIEW',
        'UNVERIFIED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE explanation_source_type AS ENUM (
        'BOOK_ANSWER_KEY',
        'EDITORIAL_MANUAL',
        'AI_GENERATED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE learning_progress_status AS ENUM (
        'NOT_STARTED',
        'IN_PROGRESS',
        'COMPLETED',
        'MASTERED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 2. UTILITY TRIGGER FOR updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DOMAIN A: BOOK MANAGEMENT (Source Traceability Layer)
-- =============================================================================

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    authors JSONB NOT NULL DEFAULT '[]'::jsonb,
    edition_note TEXT,
    source_file TEXT NOT NULL UNIQUE,
    total_lines INTEGER NOT NULL CHECK (total_lines > 0),
    checksum TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS book_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
    code TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    original_heading TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    source_file TEXT NOT NULL,
    start_line INTEGER NOT NULL CHECK (start_line > 0),
    end_line INTEGER NOT NULL CHECK (end_line >= start_line),
    checksum TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (book_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS book_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
    section_number TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    section_type book_section_type NOT NULL DEFAULT 'LESSON_UNIT',
    display_order INTEGER NOT NULL,
    source_file TEXT NOT NULL,
    start_line INTEGER NOT NULL CHECK (start_line > 0),
    end_line INTEGER NOT NULL CHECK (end_line >= start_line),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (chapter_id, section_number)
);

-- =============================================================================
-- DOMAIN B: GRAMMAR KNOWLEDGE (Hierarchical Curriculum & Theory Layer)
-- =============================================================================

CREATE TABLE IF NOT EXISTS grammar_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_vi TEXT NOT NULL,
    description_en TEXT,
    description_vi TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS grammar_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES grammar_categories(id) ON DELETE RESTRICT,
    parent_topic_id UUID REFERENCES grammar_topics(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES book_chapters(id) ON DELETE SET NULL,
    code TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    hierarchy_level INTEGER NOT NULL DEFAULT 1 CHECK (hierarchy_level >= 1),
    display_order INTEGER NOT NULL,
    start_line INTEGER,
    end_line INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES book_chapters(id) ON DELETE RESTRICT,
    book_section_id UUID NOT NULL REFERENCES book_sections(id) ON DELETE RESTRICT,
    topic_id UUID NOT NULL REFERENCES grammar_topics(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    lesson_order INTEGER NOT NULL,
    has_theory BOOLEAN NOT NULL DEFAULT TRUE,
    source_file TEXT NOT NULL,
    start_line INTEGER NOT NULL CHECK (start_line > 0),
    end_line INTEGER NOT NULL CHECK (end_line >= start_line),
    raw_markdown TEXT,
    checksum TEXT,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title_en, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(title_vi, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(raw_markdown, '')), 'B')
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lesson_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    section_type lesson_section_type NOT NULL DEFAULT 'THEORY',
    display_order INTEGER NOT NULL,
    start_line INTEGER NOT NULL CHECK (start_line > 0),
    end_line INTEGER NOT NULL CHECK (end_line >= start_line),
    raw_markdown TEXT NOT NULL,
    structured_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (lesson_id, display_order)
);

CREATE TABLE IF NOT EXISTS grammar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES lesson_sections(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    rule_type grammar_rule_type NOT NULL DEFAULT 'USAGE_RULE',
    title TEXT NOT NULL,
    explanation_vi TEXT,
    explanation_en TEXT,
    formula TEXT,
    display_order INTEGER NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(formula, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(explanation_vi, '')), 'B')
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES lesson_sections(id) ON DELETE CASCADE,
    grammar_rule_id UUID REFERENCES grammar_rules(id) ON DELETE SET NULL,
    code TEXT NOT NULL UNIQUE,
    sentence_en TEXT NOT NULL,
    sentence_vi TEXT,
    negative_example_note TEXT,
    display_order INTEGER NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    row_count INTEGER NOT NULL,
    rows_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_markdown TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DOMAIN C: EXERCISE MANAGEMENT (Multi-Format Assessment Layer)
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercise_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES book_chapters(id) ON DELETE RESTRICT,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
    topic_id UUID NOT NULL REFERENCES grammar_topics(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    source_file TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    answer_start_line INTEGER NOT NULL,
    answer_end_line INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_group_id UUID NOT NULL REFERENCES exercise_groups(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
    topic_id UUID NOT NULL REFERENCES grammar_topics(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE,
    roman_numeral TEXT NOT NULL,
    original_label TEXT NOT NULL,
    title TEXT NOT NULL,
    instruction_en TEXT NOT NULL,
    instruction_vi TEXT,
    exercise_type question_type NOT NULL,
    display_order INTEGER NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    has_numbering_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    question_number INTEGER NOT NULL CHECK (question_number > 0),
    original_number_label TEXT NOT NULL,
    sub_category TEXT,
    question_type question_type NOT NULL,
    stem TEXT NOT NULL,
    starter_prompt TEXT,
    blank_count INTEGER NOT NULL DEFAULT 1 CHECK (blank_count >= 1),
    root_word TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    has_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_note TEXT,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(stem, '') || ' ' || coalesce(root_word, ''))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (exercise_id, question_number)
);

CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    blank_index INTEGER NOT NULL DEFAULT 1 CHECK (blank_index >= 1),
    option_label TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, blank_index, option_label)
);

-- =============================================================================
-- DOMAIN D: ANSWER MANAGEMENT (Verification & Audit Layer)
-- =============================================================================

CREATE TABLE IF NOT EXISTS question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    blank_index INTEGER NOT NULL DEFAULT 1 CHECK (blank_index >= 1),
    original_answer_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    alternative_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status answer_verification_status NOT NULL DEFAULT 'VERIFIED',
    review_note TEXT,
    source_line INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, blank_index)
);

CREATE TABLE IF NOT EXISTS answer_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_answer_id UUID NOT NULL REFERENCES question_answers(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    grammar_rule_id UUID REFERENCES grammar_rules(id) ON DELETE SET NULL,
    explanation_vi TEXT NOT NULL,
    explanation_en TEXT,
    source_type explanation_source_type NOT NULL DEFAULT 'BOOK_ANSWER_KEY',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DOMAIN E: FUTURE LEARNING FEATURES (Progress, Attempts, Bookmarks, SRS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    native_language TEXT NOT NULL DEFAULT 'vi',
    target_level TEXT DEFAULT 'B2',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status learning_progress_status NOT NULL DEFAULT 'NOT_STARTED',
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress_percent BETWEEN 0 AND 100),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS user_exercise_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    score_percent NUMERIC(5,2) NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
    duration_seconds INTEGER,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_result_id UUID REFERENCES user_exercise_results(id) ON DELETE SET NULL,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    submitted_payload JSONB DEFAULT '{}'::jsonb,
    is_correct BOOLEAN NOT NULL,
    matched_answer_id UUID REFERENCES question_answers(id) ON DELETE SET NULL,
    time_taken_ms INTEGER,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    grammar_rule_id UUID REFERENCES grammar_rules(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    personal_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (lesson_id IS NOT NULL)::int +
        (grammar_rule_id IS NOT NULL)::int +
        (question_id IS NOT NULL)::int = 1
    )
);

CREATE TABLE IF NOT EXISTS review_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    easiness_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50 CHECK (easiness_factor >= 1.30),
    interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 0),
    repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    last_quality_rating SMALLINT CHECK (last_quality_rating BETWEEN 0 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, question_id)
);

-- =============================================================================
-- 3. INDEXES FOR WEB API & SEARCH PERFORMANCE (STEP 3 & STEP 7)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_book_chapters_book_order ON book_chapters(book_id, display_order);
CREATE INDEX IF NOT EXISTS idx_book_sections_chapter_order ON book_sections(chapter_id, display_order);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_category ON grammar_topics(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_parent ON grammar_topics(parent_topic_id, display_order);
CREATE INDEX IF NOT EXISTS idx_lessons_topic ON lessons(topic_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons(chapter_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_lessons_search_vector ON lessons USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson ON lesson_sections(lesson_id, display_order);
CREATE INDEX IF NOT EXISTS idx_grammar_rules_lesson ON grammar_rules(lesson_id, display_order);
CREATE INDEX IF NOT EXISTS idx_grammar_rules_search_vector ON grammar_rules USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_examples_lesson ON examples(lesson_id, display_order);
CREATE INDEX IF NOT EXISTS idx_examples_rule ON examples(grammar_rule_id);
CREATE INDEX IF NOT EXISTS idx_exercise_groups_lesson ON exercise_groups(lesson_id, display_order);
CREATE INDEX IF NOT EXISTS idx_exercises_group ON exercises(exercise_group_id, display_order);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson_type ON exercises(lesson_id, exercise_type);
CREATE INDEX IF NOT EXISTS idx_questions_exercise_num ON questions(exercise_id, question_number);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_anomaly ON questions(has_anomaly) WHERE has_anomaly = TRUE;
CREATE INDEX IF NOT EXISTS idx_questions_search_vector ON questions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id, blank_index, display_order);
CREATE INDEX IF NOT EXISTS idx_question_answers_question ON question_answers(question_id, blank_index);
CREATE INDEX IF NOT EXISTS idx_question_answers_verification ON question_answers(verification_status, is_verified);
CREATE INDEX IF NOT EXISTS idx_answer_explanations_answer ON answer_explanations(question_answer_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_exercise_results_user ON user_exercise_results(user_id, exercise_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_user ON user_question_attempts(user_id, question_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_schedule_due ON review_schedule(user_id, next_review_at);
