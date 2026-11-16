-- ============================================================================
-- Migration 018: Phase 3 - Data Science Personalization & Corpus Intelligence
-- Target Project: bhlhmhvzqcwqenlhioxr (PostgreSQL 17)
-- ============================================================================

-- 1. Corpus Item Stats Warehouse (4,000+ TOEIC Questions & Future Series)
CREATE TABLE IF NOT EXISTS public.corpus_item_stats (
  question_id text PRIMARY KEY,
  series text NOT NULL,
  test_number integer NOT NULL,
  part integer NOT NULL,
  primary_topic_id text,
  target_band integer DEFAULT 550,
  recommended_time_sec integer DEFAULT 30,
  attempt_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  total_time_sec bigint NOT NULL DEFAULT 0,
  avg_time_sec numeric(6,2) NOT NULL DEFAULT 0,
  option_selection_counts jsonb NOT NULL DEFAULT '{"A":0,"B":0,"C":0,"D":0}'::jsonb,
  prior_irt_a numeric(4,2) NOT NULL DEFAULT 1.20,
  prior_irt_b numeric(5,2) NOT NULL DEFAULT 0.00,
  calibrated_irt_a numeric(4,2) NOT NULL DEFAULT 1.20,
  calibrated_irt_b numeric(5,2) NOT NULL DEFAULT 0.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corpus_item_stats_series_test
  ON public.corpus_item_stats (series, test_number, part);
CREATE INDEX IF NOT EXISTS idx_corpus_item_stats_topic
  ON public.corpus_item_stats (primary_topic_id);

ALTER TABLE public.corpus_item_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corpus_item_stats_public_read" ON public.corpus_item_stats;
CREATE POLICY "corpus_item_stats_public_read"
  ON public.corpus_item_stats FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Exam Attempts & Session Telemetry
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  series text NOT NULL,
  test_number integer NOT NULL,
  session_mode text NOT NULL DEFAULT 'exam' CHECK (session_mode IN ('practice', 'exam')),
  total_questions integer NOT NULL DEFAULT 100,
  answered_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  est_reading_score integer NOT NULL DEFAULT 5,
  theta_estimate numeric(5,3) NOT NULL DEFAULT 0.000,
  elapsed_sec integer NOT NULL DEFAULT 0,
  fatigue_drop_rate numeric(5,2) NOT NULL DEFAULT 0.00,
  part_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  question_timings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_created
  ON public.exam_attempts (user_id, created_at DESC);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_attempts_select_own_or_admin" ON public.exam_attempts;
CREATE POLICY "exam_attempts_select_own_or_admin"
  ON public.exam_attempts FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR public.is_admin());

DROP POLICY IF EXISTS "exam_attempts_insert_own" ON public.exam_attempts;
CREATE POLICY "exam_attempts_insert_own"
  ON public.exam_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. User Error DNA Snapshots (4-Quadrant Matrix & Cognitive Traps)
CREATE TABLE IF NOT EXISTS public.user_error_dna_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  weak_topics_ranked jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_trap_dna jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_quadrant_matrix jsonb NOT NULL DEFAULT '{}'::jsonb,
  potential_score_gain integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_dna_user_created
  ON public.user_error_dna_snapshots (user_id, created_at DESC);

ALTER TABLE public.user_error_dna_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_dna_select_own_or_admin" ON public.user_error_dna_snapshots;
CREATE POLICY "error_dna_select_own_or_admin"
  ON public.user_error_dna_snapshots FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR public.is_admin());

DROP POLICY IF EXISTS "error_dna_insert_own" ON public.user_error_dna_snapshots;
CREATE POLICY "error_dna_insert_own"
  ON public.user_error_dna_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Cross-Test Remediation Plans (Test N -> Drill/Twin -> Test N+1)
CREATE TABLE IF NOT EXISTS public.remediation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_exam_attempt_id uuid REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
  series text NOT NULL DEFAULT 'ETS2024',
  source_test_number integer NOT NULL DEFAULT 1,
  target_next_test_number integer NOT NULL DEFAULT 2,
  target_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  prescribed_drill_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  prescribed_twin_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress_percent integer NOT NULL DEFAULT 0,
  baseline_reading_score integer NOT NULL DEFAULT 5,
  target_reading_score integer NOT NULL DEFAULT 100,
  verification_exam_attempt_id uuid REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
  verified_score_delta integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'verified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remediation_plans_user_status
  ON public.remediation_plans (user_id, status, created_at DESC);

ALTER TABLE public.remediation_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "remediation_plans_select_own_or_admin" ON public.remediation_plans;
CREATE POLICY "remediation_plans_select_own_or_admin"
  ON public.remediation_plans FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR public.is_admin());

DROP POLICY IF EXISTS "remediation_plans_insert_own" ON public.remediation_plans;
CREATE POLICY "remediation_plans_insert_own"
  ON public.remediation_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "remediation_plans_update_own" ON public.remediation_plans;
CREATE POLICY "remediation_plans_update_own"
  ON public.remediation_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
