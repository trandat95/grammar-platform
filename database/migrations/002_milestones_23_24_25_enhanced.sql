-- =============================================================================
-- Migration 002: Milestones 2.3, 2.4 & 2.5 Enhanced Enterprise Capabilities
-- Target: Supabase PostgreSQL 17 (Project: wtvlbbcyvtqqygtojxay)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MILESTONE 2.3: Resilient Offline-First & Multi-Device Sync
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_idempotency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  device_id text,
  event_type text NOT NULL,
  client_timestamp bigint,
  processed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_sync_user_idempotency UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.sync_idempotency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sync_idempotency_select_own ON public.sync_idempotency_logs;
CREATE POLICY sync_idempotency_select_own ON public.sync_idempotency_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS sync_idempotency_insert_own ON public.sync_idempotency_logs;
CREATE POLICY sync_idempotency_insert_own ON public.sync_idempotency_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_sync_idempotency_user_time
  ON public.sync_idempotency_logs (user_id, processed_at DESC);

ALTER TABLE public.user_mistakes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_mistakes_user_qid_updated
  ON public.user_mistakes (user_id, question_id, updated_at DESC);

ALTER TABLE public.user_vocabularies
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_vocab_user_updated
  ON public.user_vocabularies (user_id, updated_at DESC);

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS incorrect_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------------------------
-- 2. MILESTONE 2.4: Enterprise Governance, Policy Versioning & Immutable Audit
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'EXCEPTION: Audit logs are immutable and cannot be deleted or modified';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

DROP POLICY IF EXISTS audit_insert ON public.audit_logs;
CREATE POLICY audit_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can read all activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Admins or owner read activity logs" ON public.user_activity_logs;
CREATE POLICY "Admins or owner read activity logs" ON public.user_activity_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

ALTER TABLE public.system_policies
  ADD COLUMN IF NOT EXISTS policy_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS diagnostic_cooldown_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS offline_sync_max_batch integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

CREATE TABLE IF NOT EXISTS public.system_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL DEFAULT 'default',
  policy_version integer NOT NULL,
  free_exercise_limit integer NOT NULL,
  free_daily_quiz_limit integer NOT NULL,
  diagnostic_cooldown_days integer NOT NULL DEFAULT 7,
  offline_sync_max_batch integer NOT NULL DEFAULT 50,
  changed_by uuid,
  change_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_policy_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_versions_select_all ON public.system_policy_versions;
CREATE POLICY policy_versions_select_all ON public.system_policy_versions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS policy_versions_admin_insert ON public.system_policy_versions;
CREATE POLICY policy_versions_admin_insert ON public.system_policy_versions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_policy_versions_key_ver
  ON public.system_policy_versions (policy_key, policy_version DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_role_status_created
  ON public.profiles (role, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_action
  ON public.audit_logs (created_at DESC, action_type);

-- -----------------------------------------------------------------------------
-- 3. MILESTONE 2.5: 9-Table Pedagogical Intelligence & Knowledge Graph Schema
--    (Adds 4 tables alongside existing 5: explanations, explanation_feedback,
--     question_concepts, remedial_recommendations, user_concept_progress)
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_concept_progress
  ADD COLUMN IF NOT EXISTS mastery_score numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_expl_feedback_qid_type
  ON public.explanation_feedback (question_id, feedback_type, created_at DESC);

-- Table 6/9: concepts
CREATE TABLE IF NOT EXISTS public.concepts (
  id text PRIMARY KEY,
  chapter_number integer NOT NULL,
  chapter_code text NOT NULL,
  lesson_id text,
  lesson_code text NOT NULL,
  title_vi text NOT NULL,
  title_en text,
  description text,
  section_count integer NOT NULL DEFAULT 0,
  difficulty_level text NOT NULL DEFAULT 'Intermediate'
    CHECK (difficulty_level IN ('Beginner', 'Elementary', 'Intermediate', 'Advanced')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concepts_public_read ON public.concepts;
CREATE POLICY concepts_public_read ON public.concepts
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS concepts_admin_write ON public.concepts;
CREATE POLICY concepts_admin_write ON public.concepts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_concepts_chapter
  ON public.concepts (chapter_number, lesson_code);

-- Table 7/9: concept_dependencies (DAG)
CREATE TABLE IF NOT EXISTS public.concept_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id text NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  prerequisite_concept_id text NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'prerequisite'
    CHECK (relationship_type IN ('prerequisite', 'recommended', 'contrast')),
  weight numeric(3,2) NOT NULL DEFAULT 1.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_no_self_dependency CHECK (concept_id <> prerequisite_concept_id),
  CONSTRAINT uq_concept_dependency UNIQUE (concept_id, prerequisite_concept_id)
);

ALTER TABLE public.concept_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concept_deps_public_read ON public.concept_dependencies;
CREATE POLICY concept_deps_public_read ON public.concept_dependencies
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS concept_deps_admin_write ON public.concept_dependencies;
CREATE POLICY concept_deps_admin_write ON public.concept_dependencies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_concept_deps_cid
  ON public.concept_dependencies (concept_id);

CREATE INDEX IF NOT EXISTS idx_concept_deps_prereq
  ON public.concept_dependencies (prerequisite_concept_id);

-- Table 8/9: spaced_repetition_queue (SM-2 Variant: 1->3->7->14->30d)
CREATE TABLE IF NOT EXISTS public.spaced_repetition_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  concept_id text REFERENCES public.concepts(id) ON DELETE SET NULL,
  topic_id text,
  ease_factor numeric(4,2) NOT NULL DEFAULT 2.50,
  interval_days integer NOT NULL DEFAULT 1,
  repetitions integer NOT NULL DEFAULT 0,
  consecutive_correct integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz NOT NULL DEFAULT now(),
  next_review_at timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  status text NOT NULL DEFAULT 'due'
    CHECK (status IN ('new', 'learning', 'due', 'mastered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_sr_user_question UNIQUE (user_id, question_id)
);

ALTER TABLE public.spaced_repetition_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sr_queue_select_own ON public.spaced_repetition_queue;
CREATE POLICY sr_queue_select_own ON public.spaced_repetition_queue
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS sr_queue_insert_own ON public.spaced_repetition_queue;
CREATE POLICY sr_queue_insert_own ON public.spaced_repetition_queue
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS sr_queue_update_own ON public.spaced_repetition_queue;
CREATE POLICY sr_queue_update_own ON public.spaced_repetition_queue
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS sr_queue_delete_own ON public.spaced_repetition_queue;
CREATE POLICY sr_queue_delete_own ON public.spaced_repetition_queue
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_sr_queue_due
  ON public.spaced_repetition_queue (user_id, next_review_at ASC, status);

-- Table 9/9: error_taxonomy_registry
CREATE TABLE IF NOT EXISTS public.error_taxonomy_registry (
  code text PRIMARY KEY,
  label_vi text NOT NULL,
  description text NOT NULL,
  remedial_chapter integer NOT NULL,
  remedial_lesson_code text NOT NULL,
  remedial_tip text NOT NULL,
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_taxonomy_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS error_tax_public_read ON public.error_taxonomy_registry;
CREATE POLICY error_tax_public_read ON public.error_taxonomy_registry
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS error_tax_admin_write ON public.error_taxonomy_registry;
CREATE POLICY error_tax_admin_write ON public.error_taxonomy_registry
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
