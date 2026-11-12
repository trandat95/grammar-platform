-- ============================================================================
-- Milestone 2.11.2 & 2.11.5: Free-Tier Safe Security & Performance Hardening
-- 1. Least-Privilege EXECUTE revocations on SECURITY DEFINER trigger/auth RPCs
-- 2. Drop duplicate unique constraint/index on public.user_achievements
-- 3. Add covering indexes for unindexed foreign keys + hot query paths
-- Non-destructive, idempotent, with explicit rollback instructions.
-- ============================================================================

-- 1. Revoke unnecessary public/anon execution on trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM PUBLIC, anon, authenticated;

-- 2. Revoke anon execution on auth-only SECURITY DEFINER RPCs
REVOKE ALL ON FUNCTION public.award_user_gamification_xp(uuid, text, text, integer, integer, integer, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_user_gamification_xp(uuid, text, text, integer, integer, integer, integer, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancel_active_vip_subscription(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_active_vip_subscription(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_sepay_checkout_order(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sepay_checkout_order(text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.start_vip_trial_order(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_vip_trial_order(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 3. Remove duplicate index on user_achievements (keep uq_user_achievements_user_code)
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS uq_user_achievement;

-- 4. Covering indexes for unindexed foreign keys & hot paths (2.11.5)
CREATE INDEX IF NOT EXISTS idx_ai_advisor_attempt_id ON public.ai_advisor_logs (attempt_id);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_test_id ON public.diagnostic_attempts (test_id);
CREATE INDEX IF NOT EXISTS idx_diag_skill_results_user_id ON public.diagnostic_skill_results (user_id);
CREATE INDEX IF NOT EXISTS idx_expl_feedback_expl_id ON public.explanation_feedback (explanation_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user_id ON public.leaderboard_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_user_id ON public.roadmap_items (user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_versions_roadmap_id ON public.roadmap_versions (roadmap_id);
CREATE INDEX IF NOT EXISTS idx_sr_queue_concept_id ON public.spaced_repetition_queue (concept_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created ON public.user_activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON public.user_challenges (challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_roadmaps_attempt_id ON public.user_learning_roadmaps (diagnostic_attempt_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_user_amt ON public.xp_transactions (created_at DESC, user_id, xp_amount);

-- ============================================================================
-- EXPLICIT ROLLBACK SQL (Non-destructive; run only if reverting 014):
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.protect_profile_role() TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.award_user_gamification_xp(uuid, text, text, integer, integer, integer, integer, jsonb) TO anon;
-- GRANT EXECUTE ON FUNCTION public.cancel_active_vip_subscription(text) TO anon;
-- GRANT EXECUTE ON FUNCTION public.create_sepay_checkout_order(text, text, text) TO anon;
-- GRANT EXECUTE ON FUNCTION public.start_vip_trial_order(text) TO anon;
-- GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
-- DROP INDEX IF EXISTS public.idx_ai_advisor_attempt_id;
-- DROP INDEX IF EXISTS public.idx_diag_attempts_test_id;
-- DROP INDEX IF EXISTS public.idx_diag_skill_results_user_id;
-- DROP INDEX IF EXISTS public.idx_expl_feedback_expl_id;
-- DROP INDEX IF EXISTS public.idx_leaderboard_snapshots_user_id;
-- DROP INDEX IF EXISTS public.idx_roadmap_items_user_id;
-- DROP INDEX IF EXISTS public.idx_roadmap_versions_roadmap_id;
-- DROP INDEX IF EXISTS public.idx_sr_queue_concept_id;
-- DROP INDEX IF EXISTS public.idx_user_activity_logs_user_created;
-- DROP INDEX IF EXISTS public.idx_user_challenges_challenge_id;
-- DROP INDEX IF EXISTS public.idx_user_learning_roadmaps_attempt_id;
-- DROP INDEX IF EXISTS public.idx_xp_transactions_created_user_amt;
-- ============================================================================
