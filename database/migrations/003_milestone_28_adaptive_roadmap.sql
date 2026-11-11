-- =============================================================================
-- Migration 003: Milestone 2.8 Enhanced - Adaptive Roadmap Versioning & AI Advisor
-- Target: Supabase PostgreSQL 17 (Project: wtvlbbcyvtqqygtojxay)
-- Note: Reuses concepts, concept_dependencies, spaced_repetition_queue, and
--       user_concept_progress already deployed in Migration 002.
-- =============================================================================

ALTER TABLE public.user_learning_roadmaps
  ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_adjusted_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.roadmap_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES public.user_learning_roadmaps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  trigger_reason text NOT NULL DEFAULT 'adaptive_adjustment',
  adjustment_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  weeks_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roadmap_versions' AND policyname = 'roadmap_versions_select_own'
  ) THEN
    CREATE POLICY roadmap_versions_select_own ON public.roadmap_versions
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roadmap_versions' AND policyname = 'roadmap_versions_insert_own'
  ) THEN
    CREATE POLICY roadmap_versions_insert_own ON public.roadmap_versions
      FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_roadmap_versions_user_ver
  ON public.roadmap_versions (user_id, roadmap_id, version_number DESC);

CREATE TABLE IF NOT EXISTS public.ai_advisor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.diagnostic_attempts(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  advisor_response text NOT NULL,
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_advisor_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_advisor_logs' AND policyname = 'ai_advisor_select_own'
  ) THEN
    CREATE POLICY ai_advisor_select_own ON public.ai_advisor_logs
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_advisor_logs' AND policyname = 'ai_advisor_insert_own'
  ) THEN
    CREATE POLICY ai_advisor_insert_own ON public.ai_advisor_logs
      FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_ai_advisor_user_time
  ON public.ai_advisor_logs (user_id, created_at DESC);
