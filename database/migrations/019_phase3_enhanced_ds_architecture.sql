-- ============================================================================
-- Migration 019: Phase 3 Enhanced Data Science & Zero-Trust Atomic Architecture
-- Implements DS-001 through DS-012 from Architecture Review
-- Target Project: bhlhmhvzqcwqenlhioxr (PostgreSQL 17)
-- ============================================================================

-- 1. Upgrade corpus_item_stats (DS-005, DS-008, DS-009)
ALTER TABLE public.corpus_item_stats
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS correct_option text,
  ADD COLUMN IF NOT EXISTS shown_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS answered_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skipped_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timed_attempt_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_attempt_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_correct_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exam_attempt_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exam_correct_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irt_sample_size integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irt_standard_error numeric(8,5),
  ADD COLUMN IF NOT EXISTS calibration_status text NOT NULL DEFAULT 'prior_only',
  ADD COLUMN IF NOT EXISTS last_calibrated_at timestamptz;

ALTER TABLE public.corpus_item_stats
  ALTER COLUMN prior_irt_a TYPE numeric(6,3),
  ALTER COLUMN prior_irt_b TYPE numeric(6,3),
  ALTER COLUMN calibrated_irt_a TYPE numeric(6,3),
  ALTER COLUMN calibrated_irt_b TYPE numeric(6,3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'corpus_item_stats_calibration_status_check'
  ) THEN
    ALTER TABLE public.corpus_item_stats
      ADD CONSTRAINT corpus_item_stats_calibration_status_check
      CHECK (calibration_status IN ('prior_only', 'monitoring', 'experimental', 'calibrated'));
  END IF;
END $$;

-- 2. Upgrade exam_attempts with Idempotency & Status (DS-003)
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS client_attempt_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_attempts_user_client_attempt'
  ) THEN
    ALTER TABLE public.exam_attempts
      ADD CONSTRAINT uq_exam_attempts_user_client_attempt
      UNIQUE (user_id, client_attempt_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_attempts_status_check'
  ) THEN
    ALTER TABLE public.exam_attempts
      ADD CONSTRAINT exam_attempts_status_check
      CHECK (status IN ('in_progress', 'submitted', 'abandoned', 'expired'));
  END IF;
END $$;

-- 3. Create Table #5: exam_attempt_items (DS-001 Relational Question Telemetry)
CREATE TABLE IF NOT EXISTS public.exam_attempt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  part integer NOT NULL,
  topic_id text,
  selected_option text,
  correct_option text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  is_skipped boolean NOT NULL DEFAULT false,
  time_spent_sec integer NOT NULL DEFAULT 0,
  question_position integer NOT NULL DEFAULT 1,
  error_pattern_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_exam_attempt_item UNIQUE (exam_attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempt_items_user_topic
  ON public.exam_attempt_items (user_id, topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_attempt_items_question
  ON public.exam_attempt_items (question_id);

ALTER TABLE public.exam_attempt_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_attempt_items_select_own_or_admin" ON public.exam_attempt_items;
CREATE POLICY "exam_attempt_items_select_own_or_admin"
  ON public.exam_attempt_items FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR public.is_admin());

-- 4. Create Table #6: user_topic_mastery (DS-002 Cumulative Cross-Test Mastery)
CREATE TABLE IF NOT EXISTS public.user_topic_mastery (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  topic_name text,
  part integer,
  total_attempts integer NOT NULL DEFAULT 0,
  answered_attempts integer NOT NULL DEFAULT 0,
  correct_attempts integer NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0.00,
  total_time_sec bigint NOT NULL DEFAULT 0,
  avg_time_sec numeric(8,2) NOT NULL DEFAULT 0.00,
  speed_ratio numeric(5,2) NOT NULL DEFAULT 1.00,
  mastery_score numeric(5,2) NOT NULL DEFAULT 0.00,
  confidence_score numeric(5,2) NOT NULL DEFAULT 0.00,
  confidence_level text NOT NULL DEFAULT 'LOW' CHECK (confidence_level IN ('LOW', 'MEDIUM', 'HIGH')),
  quadrant_state text NOT NULL DEFAULT 'CRITICAL_GAP' CHECK (quadrant_state IN ('CRITICAL_GAP', 'TRAP_PRONE', 'SLOW_FLUENCY', 'MASTERED')),
  previous_quadrant_state text,
  state_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_mastery_user_quadrant
  ON public.user_topic_mastery (user_id, quadrant_state, mastery_score ASC);

ALTER TABLE public.user_topic_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_topic_mastery_select_own_or_admin" ON public.user_topic_mastery;
CREATE POLICY "user_topic_mastery_select_own_or_admin"
  ON public.user_topic_mastery FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR public.is_admin());

-- 5. Upgrade remediation_plans (Section 2.4)
ALTER TABLE public.remediation_plans
  ADD COLUMN IF NOT EXISTS baseline_mastery_score numeric(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS current_mastery_score numeric(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_prescribed_questions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_questions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '14 days');

ALTER TABLE public.remediation_plans DROP CONSTRAINT IF EXISTS remediation_plans_status_check;
ALTER TABLE public.remediation_plans
  ADD CONSTRAINT remediation_plans_status_check
  CHECK (status IN ('draft', 'active', 'completed', 'verified', 'expired', 'cancelled'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'remediation_plans_verification_status_check'
  ) THEN
    ALTER TABLE public.remediation_plans
      ADD CONSTRAINT remediation_plans_verification_status_check
      CHECK (verification_status IN ('pending', 'improved', 'stagnant', 'regressed'));
  END IF;
END $$;

-- 6. Zero-Trust RLS Hardening (DS-007): Remove direct client INSERT/UPDATE on DS tables
-- All writes must go through Server API (service_role) or verified SECURITY DEFINER RPC
DROP POLICY IF EXISTS "exam_attempts_insert_own" ON public.exam_attempts;
DROP POLICY IF EXISTS "error_dna_insert_own" ON public.user_error_dna_snapshots;
DROP POLICY IF EXISTS "remediation_plans_insert_own" ON public.remediation_plans;
DROP POLICY IF EXISTS "remediation_plans_update_own" ON public.remediation_plans;

-- Public safe view for corpus_item_stats (hides correct_option from raw table queries)
CREATE OR REPLACE VIEW public.v_public_corpus_item_stats AS
SELECT
  question_id,
  series,
  test_number,
  part,
  primary_topic_id,
  target_band,
  recommended_time_sec,
  answered_count,
  exam_attempt_count,
  exam_correct_count,
  avg_time_sec,
  CASE WHEN answered_count >= 20 THEN option_selection_counts ELSE NULL END AS option_selection_counts,
  CASE
    WHEN answered_count < 20 THEN 'insufficient'
    WHEN answered_count < 50 THEN 'preliminary'
    WHEN answered_count < 100 THEN 'verified'
    ELSE 'high_confidence'
  END AS crowd_sample_tier,
  calibration_status
FROM public.corpus_item_stats;

GRANT SELECT ON public.v_public_corpus_item_stats TO anon, authenticated;

-- 7. Atomic Submission Transaction RPC (DS-004)
CREATE OR REPLACE FUNCTION public.submit_toeic_exam_atomic(
  p_user_id uuid,
  p_client_attempt_id uuid,
  p_series text,
  p_test_number integer,
  p_session_mode text,
  p_status text,
  p_total_questions integer,
  p_answered_count integer,
  p_correct_count integer,
  p_wrong_count integer,
  p_skipped_count integer,
  p_est_reading_score integer,
  p_theta_estimate numeric,
  p_elapsed_sec integer,
  p_fatigue_drop_rate numeric,
  p_part_breakdown jsonb,
  p_user_answers jsonb,
  p_question_timings jsonb,
  p_attempt_items jsonb,
  p_weak_topics_ranked jsonb,
  p_error_trap_dna jsonb,
  p_skill_quadrant_matrix jsonb,
  p_potential_score_gain integer,
  p_topic_mastery_updates jsonb,
  p_remediation_plan jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_attempt public.exam_attempts%ROWTYPE;
  v_attempt_id uuid;
  v_plan_id uuid := NULL;
  v_pending_plan record;
  v_verified_delta integer := NULL;
  v_ver_status text := 'pending';
  v_item jsonb;
  v_tm jsonb;
  v_prev_quadrant text;
  v_prev_history jsonb;
  v_prior_Attempt_cnt bigint;
BEGIN
  -- Strict authorization check: only service_role or matching authenticated user
  IF auth.role() <> 'service_role' AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized exam submission';
  END IF;

  -- 1. Idempotency check (DS-003)
  SELECT * INTO v_existing_attempt
  FROM public.exam_attempts
  WHERE user_id = p_user_id AND client_attempt_id = p_client_attempt_id
  LIMIT 1;

  IF v_existing_attempt.id IS NOT NULL THEN
    SELECT id INTO v_plan_id
    FROM public.remediation_plans
    WHERE source_exam_attempt_id = v_existing_attempt.id
    LIMIT 1;

    RETURN jsonb_build_object(
      'ok', true,
      'deduped', true,
      'exam_attempt_id', v_existing_attempt.id,
      'remediation_plan_id', v_plan_id,
      'verified_delta', NULL
    );
  END IF;

  -- 2. Insert exam_attempts
  INSERT INTO public.exam_attempts (
    user_id, client_attempt_id, series, test_number, session_mode, status,
    total_questions, answered_count, correct_count, wrong_count, skipped_count,
    est_reading_score, theta_estimate, elapsed_sec, fatigue_drop_rate,
    part_breakdown, user_answers, question_timings
  )
  VALUES (
    p_user_id, p_client_attempt_id, p_series, p_test_number,
    CASE WHEN p_session_mode = 'practice' THEN 'practice' ELSE 'exam' END,
    COALESCE(p_status, 'submitted'),
    p_total_questions, p_answered_count, p_correct_count, p_wrong_count, p_skipped_count,
    p_est_reading_score, p_theta_estimate, p_elapsed_sec, p_fatigue_drop_rate,
    COALESCE(p_part_breakdown, '{}'::jsonb),
    COALESCE(p_user_answers, '{}'::jsonb),
    COALESCE(p_question_timings, '{}'::jsonb)
  )
  RETURNING id INTO v_attempt_id;

  -- 3. Insert exam_attempt_items & update corpus_item_stats (with anti-manipulation check)
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_attempt_items, '[]'::jsonb))
  LOOP
    -- Check if this user already answered this question before (anti-gaming crowd stats)
    SELECT COUNT(*) INTO v_prior_Attempt_cnt
    FROM public.exam_attempt_items
    WHERE user_id = p_user_id
      AND question_id = (v_item->>'question_id')
      AND is_skipped = false;

    INSERT INTO public.exam_attempt_items (
      exam_attempt_id, user_id, question_id, part, topic_id,
      selected_option, correct_option, is_correct, is_skipped,
      time_spent_sec, question_position, error_pattern_code
    )
    VALUES (
      v_attempt_id,
      p_user_id,
      v_item->>'question_id',
      COALESCE((v_item->>'part')::int, 5),
      v_item->>'topic_id',
      v_item->>'selected_option',
      COALESCE(v_item->>'correct_option', 'A'),
      COALESCE((v_item->>'is_correct')::boolean, false),
      COALESCE((v_item->>'is_skipped')::boolean, false),
      COALESCE((v_item->>'time_spent_sec')::int, 0),
      COALESCE((v_item->>'question_position')::int, 1),
      v_item->>'error_pattern_code'
    )
    ON CONFLICT (exam_attempt_id, question_id) DO NOTHING;

    -- Only count first 2 attempts per user toward global crowd stats to prevent farming/skew
    IF v_prior_Attempt_cnt < 2 THEN
      UPDATE public.corpus_item_stats
      SET
        shown_count = shown_count + 1,
        answered_count = answered_count + (CASE WHEN (v_item->>'is_skipped')::boolean THEN 0 ELSE 1 END),
        skipped_count = skipped_count + (CASE WHEN (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END),
        attempt_count = attempt_count + (CASE WHEN (v_item->>'is_skipped')::boolean THEN 0 ELSE 1 END),
        correct_count = correct_count + (CASE WHEN (v_item->>'is_correct')::boolean THEN 1 ELSE 0 END),
        practice_attempt_count = practice_attempt_count + (CASE WHEN p_session_mode = 'practice' AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END),
        practice_correct_count = practice_correct_count + (CASE WHEN p_session_mode = 'practice' AND (v_item->>'is_correct')::boolean THEN 1 ELSE 0 END),
        exam_attempt_count = exam_attempt_count + (CASE WHEN p_session_mode = 'exam' AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END),
        exam_correct_count = exam_correct_count + (CASE WHEN p_session_mode = 'exam' AND (v_item->>'is_correct')::boolean THEN 1 ELSE 0 END),
        timed_attempt_count = timed_attempt_count + (CASE WHEN COALESCE((v_item->>'time_spent_sec')::int, 0) > 0 AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END),
        total_time_sec = total_time_sec + (CASE WHEN NOT (v_item->>'is_skipped')::boolean THEN GREATEST(0, COALESCE((v_item->>'time_spent_sec')::int, 0)) ELSE 0 END),
        avg_time_sec = CASE
          WHEN (timed_attempt_count + (CASE WHEN COALESCE((v_item->>'time_spent_sec')::int, 0) > 0 AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END)) > 0
          THEN ROUND(
            (total_time_sec + (CASE WHEN NOT (v_item->>'is_skipped')::boolean THEN GREATEST(0, COALESCE((v_item->>'time_spent_sec')::int, 0)) ELSE 0 END))::numeric
            / (timed_attempt_count + (CASE WHEN COALESCE((v_item->>'time_spent_sec')::int, 0) > 0 AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END)),
            2
          )
          ELSE avg_time_sec
        END,
        option_selection_counts = CASE
          WHEN NOT (v_item->>'is_skipped')::boolean AND (v_item->>'selected_option') IN ('A', 'B', 'C', 'D')
          THEN jsonb_set(
            option_selection_counts,
            ARRAY[v_item->>'selected_option'],
            to_jsonb(COALESCE((option_selection_counts->>(v_item->>'selected_option'))::bigint, 0) + 1)
          )
          ELSE option_selection_counts
        END,
        irt_sample_size = (exam_attempt_count + (CASE WHEN p_session_mode = 'exam' AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END))::int,
        calibration_status = CASE
          WHEN (exam_attempt_count + (CASE WHEN p_session_mode = 'exam' AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END)) >= 300 THEN 'calibrated'
          WHEN (exam_attempt_count + (CASE WHEN p_session_mode = 'exam' AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END)) >= 100 THEN 'experimental'
          WHEN (exam_attempt_count + (CASE WHEN p_session_mode = 'exam' AND NOT (v_item->>'is_skipped')::boolean THEN 1 ELSE 0 END)) >= 50 THEN 'monitoring'
          ELSE 'prior_only'
        END,
        updated_at = now()
      WHERE question_id = (v_item->>'question_id');
    END IF;
  END LOOP;

  -- 4. Insert user_error_dna_snapshots
  INSERT INTO public.user_error_dna_snapshots (
    user_id, exam_attempt_id, weak_topics_ranked, error_trap_dna, skill_quadrant_matrix, potential_score_gain
  )
  VALUES (
    p_user_id,
    v_attempt_id,
    COALESCE(p_weak_topics_ranked, '[]'::jsonb),
    COALESCE(p_error_trap_dna, '[]'::jsonb),
    COALESCE(p_skill_quadrant_matrix, '{}'::jsonb),
    COALESCE(p_potential_score_gain, 0)
  );

  -- 5. Upsert user_topic_mastery (DS-002 with quadrant transition history)
  FOR v_tm IN SELECT * FROM jsonb_array_elements(COALESCE(p_topic_mastery_updates, '[]'::jsonb))
  LOOP
    SELECT quadrant_state, state_history
    INTO v_prev_quadrant, v_prev_history
    FROM public.user_topic_mastery
    WHERE user_id = p_user_id AND topic_id = (v_tm->>'topic_id');

    IF v_prev_quadrant IS NOT NULL AND v_prev_quadrant <> (v_tm->>'quadrant_state') THEN
      v_prev_history := COALESCE(v_prev_history, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'from', v_prev_quadrant,
          'to', v_tm->>'quadrant_state',
          'at', now()
        )
      );
    ELSE
      v_prev_history := COALESCE(v_prev_history, '[]'::jsonb);
    END IF;

    INSERT INTO public.user_topic_mastery (
      user_id, topic_id, topic_name, part,
      total_attempts, answered_attempts, correct_attempts,
      accuracy, total_time_sec, avg_time_sec, speed_ratio,
      mastery_score, confidence_score, confidence_level,
      quadrant_state, previous_quadrant_state, state_history,
      last_attempt_at, updated_at
    )
    VALUES (
      p_user_id,
      v_tm->>'topic_id',
      v_tm->>'topic_name',
      COALESCE((v_tm->>'part')::int, 5),
      COALESCE((v_tm->>'total_attempts')::int, 0),
      COALESCE((v_tm->>'answered_attempts')::int, 0),
      COALESCE((v_tm->>'correct_attempts')::int, 0),
      COALESCE((v_tm->>'accuracy')::numeric, 0),
      COALESCE((v_tm->>'total_time_sec')::bigint, 0),
      COALESCE((v_tm->>'avg_time_sec')::numeric, 0),
      COALESCE((v_tm->>'speed_ratio')::numeric, 1),
      COALESCE((v_tm->>'mastery_score')::numeric, 0),
      COALESCE((v_tm->>'confidence_score')::numeric, 0),
      COALESCE(v_tm->>'confidence_level', 'LOW'),
      COALESCE(v_tm->>'quadrant_state', 'CRITICAL_GAP'),
      v_prev_quadrant,
      v_prev_history,
      now(),
      now()
    )
    ON CONFLICT (user_id, topic_id) DO UPDATE SET
      topic_name = EXCLUDED.topic_name,
      total_attempts = public.user_topic_mastery.total_attempts + EXCLUDED.total_attempts,
      answered_attempts = public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts,
      correct_attempts = public.user_topic_mastery.correct_attempts + EXCLUDED.correct_attempts,
      accuracy = CASE
        WHEN (public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts) > 0
        THEN ROUND(((public.user_topic_mastery.correct_attempts + EXCLUDED.correct_attempts)::numeric * 100.0) / (public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts), 2)
        ELSE 0
      END,
      total_time_sec = public.user_topic_mastery.total_time_sec + EXCLUDED.total_time_sec,
      avg_time_sec = CASE
        WHEN (public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts) > 0
        THEN ROUND((public.user_topic_mastery.total_time_sec + EXCLUDED.total_time_sec)::numeric / (public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts), 2)
        ELSE 0
      END,
      speed_ratio = ROUND((public.user_topic_mastery.speed_ratio * 0.4 + EXCLUDED.speed_ratio * 0.6)::numeric, 2),
      mastery_score = ROUND((public.user_topic_mastery.mastery_score * 0.4 + EXCLUDED.mastery_score * 0.6)::numeric, 2),
      confidence_score = LEAST(100, ROUND(((public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts)::numeric / 20.0) * 100.0, 2)),
      confidence_level = CASE
        WHEN (public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts) >= 15 THEN 'HIGH'
        WHEN (public.user_topic_mastery.answered_attempts + EXCLUDED.answered_attempts) >= 5 THEN 'MEDIUM'
        ELSE 'LOW'
      END,
      previous_quadrant_state = public.user_topic_mastery.quadrant_state,
      quadrant_state = EXCLUDED.quadrant_state,
      state_history = v_prev_history,
      last_attempt_at = now(),
      updated_at = now();
  END LOOP;

  -- 6. Verify any prior remediation plan targeting this test_number (Practice Completion != Learning Mastery)
  SELECT id, baseline_reading_score
  INTO v_pending_plan
  FROM public.remediation_plans
  WHERE user_id = p_user_id
    AND series = p_series
    AND target_next_test_number = p_test_number
    AND status IN ('active', 'completed')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_pending_plan.id IS NOT NULL THEN
    v_verified_delta := p_est_reading_score - COALESCE(v_pending_plan.baseline_reading_score, 5);
    v_ver_status := CASE
      WHEN v_verified_delta >= 15 THEN 'improved'
      WHEN v_verified_delta < 0 THEN 'regressed'
      ELSE 'stagnant'
    END;

    UPDATE public.remediation_plans
    SET
      verification_exam_attempt_id = v_attempt_id,
      verified_score_delta = v_verified_delta,
      verification_status = v_ver_status,
      status = 'verified',
      updated_at = now()
    WHERE id = v_pending_plan.id;
  END IF;

  -- 7. Create new remediation_plan if prescribed
  IF p_remediation_plan IS NOT NULL AND jsonb_typeof(p_remediation_plan) = 'object' THEN
    INSERT INTO public.remediation_plans (
      user_id, source_exam_attempt_id, series, source_test_number, target_next_test_number,
      target_topics, prescribed_drill_question_ids, prescribed_twin_question_ids,
      completed_question_ids, total_prescribed_questions, completed_questions_count,
      progress_percent, baseline_reading_score, target_reading_score,
      baseline_mastery_score, current_mastery_score, status
    )
    VALUES (
      p_user_id,
      v_attempt_id,
      p_series,
      p_test_number,
      COALESCE((p_remediation_plan->>'target_next_test_number')::int, CASE WHEN p_test_number < 10 THEN p_test_number + 1 ELSE 1 END),
      COALESCE(p_remediation_plan->'target_topics', '[]'::jsonb),
      COALESCE(p_remediation_plan->'prescribed_drill_question_ids', '[]'::jsonb),
      COALESCE(p_remediation_plan->'prescribed_twin_question_ids', '[]'::jsonb),
      '[]'::jsonb,
      COALESCE((p_remediation_plan->>'total_prescribed_questions')::int, 0),
      0,
      0,
      p_est_reading_score,
      COALESCE((p_remediation_plan->>'target_reading_score')::int, LEAST(495, p_est_reading_score + COALESCE(p_potential_score_gain, 30))),
      COALESCE((p_remediation_plan->>'baseline_mastery_score')::numeric, 0),
      COALESCE((p_remediation_plan->>'baseline_mastery_score')::numeric, 0),
      'active'
    )
    RETURNING id INTO v_plan_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'deduped', false,
    'exam_attempt_id', v_attempt_id,
    'remediation_plan_id', v_plan_id,
    'verified_delta', v_verified_delta,
    'verification_status', v_ver_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_toeic_exam_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_toeic_exam_atomic TO authenticated, service_role;
