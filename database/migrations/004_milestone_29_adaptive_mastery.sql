-- =============================================================================
-- Migration 004: Milestone 2.9 - Continuous Adaptive Learning & Mastery Tracking
-- Target: Supabase PostgreSQL 17 (Project: wtvlbbcyvtqqygtojxay)
-- Unifies spaced_repetition_queue, user_concept_progress & 8D.1 Event Bus
-- =============================================================================

ALTER TABLE public.spaced_repetition_queue
  ADD COLUMN IF NOT EXISTS memory_state text NOT NULL DEFAULT 'Learning'
    CHECK (memory_state IN ('New', 'Learning', 'Review', 'Relearning', 'Mastered')),
  ADD COLUMN IF NOT EXISTS response_time_ms integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS difficulty_rating numeric(4,2) NOT NULL DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS stability_score numeric(6,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS retrievability_score numeric(5,4) NOT NULL DEFAULT 1.0000;

ALTER TABLE public.user_concept_progress
  ADD COLUMN IF NOT EXISTS mastery_tier text NOT NULL DEFAULT 'Beginner'
    CHECK (mastery_tier IN ('Beginner', 'Basic', 'Intermediate', 'Advanced', 'Proficient', 'Master')),
  ADD COLUMN IF NOT EXISTS consistency_score numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS retention_score numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS difficulty_weight numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS recency_score numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS topic_coverage_score numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS unique_questions_seen integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.learning_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  event_type text NOT NULL,
  question_id text,
  concept_id text,
  is_correct boolean,
  response_time_ms integer DEFAULT 0,
  device_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_learning_event_idempotency UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.learning_event_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'learning_event_logs' AND policyname = 'learning_events_select_own'
  ) THEN
    CREATE POLICY learning_events_select_own ON public.learning_event_logs
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'learning_event_logs' AND policyname = 'learning_events_insert_own'
  ) THEN
    CREATE POLICY learning_events_insert_own ON public.learning_event_logs
      FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_learning_events_user_time
  ON public.learning_event_logs (user_id, created_at DESC);
