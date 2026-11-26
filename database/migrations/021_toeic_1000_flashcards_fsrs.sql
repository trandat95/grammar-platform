-- ============================================================================
-- Migration 021: New TOEIC 1,000 Flashcard Engine & FSRS-4.5 Spaced Repetition
-- Target Project: bhlhmhvzqcwqenlhioxr (PostgreSQL 17, 100% RLS Zero-Trust)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Static Catalog: 10 TOEIC Vocabulary Modules (M01..M10)
CREATE TABLE IF NOT EXISTS public.toeic_modules (
    module_id VARCHAR(10) PRIMARY KEY,
    module_name_en TEXT NOT NULL,
    module_name_vi TEXT NOT NULL,
    topic_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    color_hex VARCHAR(10) NOT NULL
);

-- 2. Static Catalog: 50 TOEIC Vocabulary Topics (1..50)
CREATE TABLE IF NOT EXISTS public.toeic_topics (
    topic_id INTEGER PRIMARY KEY,
    module_id VARCHAR(10) NOT NULL REFERENCES public.toeic_modules(module_id) ON DELETE CASCADE,
    topic_name_en TEXT NOT NULL,
    topic_name_vi TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    source_title TEXT NOT NULL,
    source_url TEXT NOT NULL
);

-- 3. Static Catalog: 1,000 New TOEIC Flashcards
CREATE TABLE IF NOT EXISTS public.toeic_flashcards (
    id INTEGER PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    module_id VARCHAR(10) NOT NULL REFERENCES public.toeic_modules(module_id),
    topic_id INTEGER NOT NULL REFERENCES public.toeic_topics(topic_id),
    word TEXT NOT NULL,
    part_of_speech VARCHAR(30) NOT NULL,
    ipa_us TEXT NOT NULL,
    meaning_vi TEXT NOT NULL,
    definition_en TEXT NOT NULL,
    collocation TEXT NOT NULL,
    example_en TEXT NOT NULL,
    example_vi TEXT NOT NULL,
    cloze_sentence_en TEXT NOT NULL,
    cefr_level VARCHAR(5) NOT NULL,
    toeic_score_band VARCHAR(20) NOT NULL,
    synonyms TEXT NOT NULL,
    visual_scene_keywords TEXT NOT NULL,
    cdn_thumbnail_url TEXT NOT NULL,
    pexels_search_endpoint TEXT NOT NULL,
    ai_generation_prompt TEXT NOT NULL,
    audio_google_tts_url TEXT NOT NULL,
    initial_difficulty NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    source_title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_toeic_flashcards_topic ON public.toeic_flashcards(topic_id);
CREATE INDEX IF NOT EXISTS idx_toeic_flashcards_module ON public.toeic_flashcards(module_id);
CREATE INDEX IF NOT EXISTS idx_toeic_flashcards_band ON public.toeic_flashcards(toeic_score_band);
CREATE INDEX IF NOT EXISTS idx_toeic_flashcards_word_trgm ON public.toeic_flashcards USING gin (word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_toeic_flashcards_meaning_trgm ON public.toeic_flashcards USING gin (meaning_vi gin_trgm_ops);

-- 4. User Dynamic Progress: FSRS-4.5 Spaced Repetition State
CREATE TABLE IF NOT EXISTS public.user_toeic_flashcard_srs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES public.toeic_flashcards(id) ON DELETE CASCADE,
    srs_state VARCHAR(20) NOT NULL DEFAULT 'NEW'
      CHECK (srs_state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING')),
    reps INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
    lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    stability NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
    difficulty NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    interval_days NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    last_rating SMALLINT CHECK (last_rating IS NULL OR last_rating BETWEEN 1 AND 4),
    last_response_ms INTEGER,
    source_context TEXT,
    source_question_id TEXT,
    custom_image_url TEXT,
    personal_mnemonic_note TEXT,
    due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_user_srs_due ON public.user_toeic_flashcard_srs(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_user_srs_state ON public.user_toeic_flashcard_srs(user_id, srs_state);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_toeic_flashcard_srs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_toeic_flashcard_srs_updated_at ON public.user_toeic_flashcard_srs;
CREATE TRIGGER trg_touch_toeic_flashcard_srs_updated_at
  BEFORE UPDATE ON public.user_toeic_flashcard_srs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_toeic_flashcard_srs_updated_at();

-- 5. Zero-Trust Row Level Security (100% Enabled)
ALTER TABLE public.toeic_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_toeic_flashcard_srs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Static catalog tables: Read-only for anon & authenticated (writes reserved to service_role)
  DROP POLICY IF EXISTS "Public read toeic_modules" ON public.toeic_modules;
  CREATE POLICY "Public read toeic_modules" ON public.toeic_modules
    FOR SELECT TO anon, authenticated USING (true);

  DROP POLICY IF EXISTS "Public read toeic_topics" ON public.toeic_topics;
  CREATE POLICY "Public read toeic_topics" ON public.toeic_topics
    FOR SELECT TO anon, authenticated USING (true);

  DROP POLICY IF EXISTS "Public read toeic_flashcards" ON public.toeic_flashcards;
  CREATE POLICY "Public read toeic_flashcards" ON public.toeic_flashcards
    FOR SELECT TO anon, authenticated USING (true);

  -- User personal SRS progress: strict owner isolation with cached auth.uid()
  DROP POLICY IF EXISTS "Users select own flashcard srs" ON public.user_toeic_flashcard_srs;
  CREATE POLICY "Users select own flashcard srs" ON public.user_toeic_flashcard_srs
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

  DROP POLICY IF EXISTS "Users insert own flashcard srs" ON public.user_toeic_flashcard_srs;
  CREATE POLICY "Users insert own flashcard srs" ON public.user_toeic_flashcard_srs
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

  DROP POLICY IF EXISTS "Users update own flashcard srs" ON public.user_toeic_flashcard_srs;
  CREATE POLICY "Users update own flashcard srs" ON public.user_toeic_flashcard_srs
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

  DROP POLICY IF EXISTS "Users delete own flashcard srs" ON public.user_toeic_flashcard_srs;
  CREATE POLICY "Users delete own flashcard srs" ON public.user_toeic_flashcard_srs
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);
END $$;
