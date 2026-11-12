-- =============================================================================
-- Migration 012: Public Leaderboard Snapshot RPC & Authoritative XP Sync RPC
-- Target: Supabase PostgreSQL 17 (Project: wtvlbbcyvtqqygtojxay)
-- Fixes:
--   1. Per-user SELECT-only RLS blocked Leaderboard API from aggregating XP across users.
--   2. Missing INSERT/UPDATE policies blocked lesson/question XP sync to user_xp & xp_transactions.
--   3. Backfills existing user_learning_trackers.xp into user_xp & xp_transactions.
-- =============================================================================

-- 1. SECURITY DEFINER RPC: Non-sensitive Leaderboard Snapshot across all active users
CREATE OR REPLACE FUNCTION public.get_leaderboard_snapshot(p_tz_offset integer DEFAULT 420)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  leaderboard_visibility text,
  total_xp bigint,
  weekly_xp bigint,
  monthly_xp bigint,
  current_streak integer,
  active_days_7d integer,
  accuracy numeric,
  avg_mastery numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_cutoff_7d timestamptz := v_now - interval '7 days';
  v_cutoff_30d timestamptz := v_now - interval '30 days';
  v_cutoff_date_7d text := to_char((v_now + make_interval(mins => p_tz_offset))::date - 7, 'YYYY-MM-DD');
BEGIN
  RETURN QUERY
  WITH tx_agg AS (
    SELECT
      tx.user_id,
      COALESCE(SUM(tx.xp_amount), 0)::bigint AS all_tx_xp,
      COALESCE(SUM(tx.xp_amount) FILTER (WHERE tx.created_at >= v_cutoff_7d), 0)::bigint AS tx_7d_xp,
      COALESCE(SUM(tx.xp_amount) FILTER (WHERE tx.created_at >= v_cutoff_30d), 0)::bigint AS tx_30d_xp
    FROM public.xp_transactions tx
    GROUP BY tx.user_id
  ),
  prog_agg AS (
    SELECT
      cp.user_id,
      COALESCE(SUM(cp.attempts), 0)::numeric AS sum_attempts,
      COALESCE(SUM(cp.correct_attempts), 0)::numeric AS sum_correct,
      COALESCE(AVG(cp.mastery_score) FILTER (WHERE cp.attempts > 0), 0)::numeric AS avg_m
    FROM public.user_concept_progress cp
    GROUP BY cp.user_id
  )
  SELECT
    p.id AS user_id,
    CASE
      WHEN COALESCE(x.leaderboard_visibility, 'public') = 'anonymous'
        THEN 'Học viên Ẩn danh #' || upper(left(p.id::text, 4))
      ELSE left(COALESCE(NULLIF(trim(p.full_name), ''), split_part(p.email, '@', 1), 'Học viên Grammar'), 32)
    END AS display_name,
    COALESCE(x.leaderboard_visibility, 'public') AS leaderboard_visibility,
    GREATEST(COALESCE(x.total_xp, 0), COALESCE(t.xp, 0), COALESCE(ta.all_tx_xp, 0))::bigint AS total_xp,
    GREATEST(
      COALESCE(ta.tx_7d_xp, 0),
      GREATEST(COALESCE(x.total_xp, 0), COALESCE(t.xp, 0), COALESCE(ta.all_tx_xp, 0))
        - GREATEST(0, COALESCE(ta.all_tx_xp, 0) - COALESCE(ta.tx_7d_xp, 0))
    )::bigint AS weekly_xp,
    GREATEST(
      COALESCE(ta.tx_30d_xp, 0),
      GREATEST(COALESCE(x.total_xp, 0), COALESCE(t.xp, 0), COALESCE(ta.all_tx_xp, 0))
        - GREATEST(0, COALESCE(ta.all_tx_xp, 0) - COALESCE(ta.tx_30d_xp, 0))
    )::bigint AS monthly_xp,
    GREATEST(COALESCE(s.current_streak, 0), COALESCE(t.streak, 0))::integer AS current_streak,
    COALESCE((
      SELECT count(*)::integer
      FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(to_jsonb(s.active_dates_30d)) = 'array' THEN to_jsonb(s.active_dates_30d) ELSE '[]'::jsonb END
      ) AS d(val)
      WHERE d.val >= v_cutoff_date_7d
    ), 0)::integer AS active_days_7d,
    CASE
      WHEN COALESCE(pa.sum_attempts, 0) > 0
        THEN round((pa.sum_correct / pa.sum_attempts) * 100, 2)
      ELSE 0::numeric
    END AS accuracy,
    round(COALESCE(pa.avg_m, 0), 2) AS avg_mastery
  FROM public.profiles p
  LEFT JOIN public.user_xp x ON x.user_id = p.id
  LEFT JOIN public.user_learning_trackers t ON t.user_id = p.id
  LEFT JOIN public.user_streaks s ON s.user_id = p.id
  LEFT JOIN tx_agg ta ON ta.user_id = p.id
  LEFT JOIN prog_agg pa ON pa.user_id = p.id
  WHERE COALESCE(p.status, 'ACTIVE') = 'ACTIVE'
    AND COALESCE(x.leaderboard_visibility, 'public') <> 'hidden';
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard_snapshot(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_snapshot(integer) TO authenticated, anon;

-- 2. SECURITY DEFINER RPC: Safely records authenticated user's earned XP (lessons, exercises, sync reconciliation)
CREATE OR REPLACE FUNCTION public.award_user_gamification_xp(
  p_user_id uuid,
  p_idempotency_key text,
  p_source_type text,
  p_xp_amount integer,
  p_min_xp_floor integer DEFAULT 0,
  p_streak integer DEFAULT NULL,
  p_tz_offset integer DEFAULT 420,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_safe_xp integer := GREATEST(0, LEAST(COALESCE(p_xp_amount, 0), 100));
  v_safe_floor integer := GREATEST(0, LEAST(COALESCE(p_min_xp_floor, 0), 50000));
  v_inserted integer := 0;
  v_existing_xp bigint := 0;
  v_tracker_xp bigint := 0;
  v_next_xp bigint := 0;
  v_today_key text := to_char((now() + make_interval(mins => COALESCE(p_tz_offset, 420)))::date, 'YYYY-MM-DD');
  v_cur_dates text[] := ARRAY[]::text[];
  v_cur_streak integer := 1;
BEGIN
  IF v_caller IS NULL OR v_caller <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller must match p_user_id';
  END IF;

  IF v_safe_xp > 0 AND COALESCE(trim(p_idempotency_key), '') <> '' THEN
    INSERT INTO public.xp_transactions (user_id, idempotency_key, source_type, xp_amount, reference_id, metadata)
    VALUES (
      p_user_id,
      p_idempotency_key,
      COALESCE(NULLIF(trim(p_source_type), ''), 'learning_activity'),
      v_safe_xp,
      p_idempotency_key,
      COALESCE(p_metadata, '{}'::jsonb)
    )
    ON CONFLICT (user_id, idempotency_key) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
  END IF;

  SELECT COALESCE(total_xp, 0) INTO v_existing_xp FROM public.user_xp WHERE user_id = p_user_id;
  SELECT COALESCE(xp, 0) INTO v_tracker_xp FROM public.user_learning_trackers WHERE user_id = p_user_id;

  v_next_xp := GREATEST(
    COALESCE(v_existing_xp, 0) + (CASE WHEN v_inserted > 0 THEN v_safe_xp ELSE 0 END),
    COALESCE(v_tracker_xp, 0),
    v_safe_floor
  );

  INSERT INTO public.user_xp (user_id, total_xp, updated_at)
  VALUES (p_user_id, v_next_xp, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = GREATEST(public.user_xp.total_xp, EXCLUDED.total_xp),
    updated_at = now();

  -- Keep user_learning_trackers.xp in sync if row exists
  UPDATE public.user_learning_trackers
  SET xp = GREATEST(xp, v_next_xp::integer), updated_at = now()
  WHERE user_id = p_user_id AND xp < v_next_xp;

  -- Upsert active date into user_streaks if activity happened
  SELECT COALESCE(active_dates_30d, ARRAY[]::text[]), COALESCE(current_streak, 0)
  INTO v_cur_dates, v_cur_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  IF NOT (v_today_key = ANY(COALESCE(v_cur_dates, ARRAY[]::text[]))) THEN
    v_cur_dates := array_append(COALESCE(v_cur_dates, ARRAY[]::text[]), v_today_key);
    IF array_length(v_cur_dates, 1) > 30 THEN
      v_cur_dates := v_cur_dates[(array_length(v_cur_dates, 1) - 29):array_length(v_cur_dates, 1)];
    END IF;
  END IF;

  v_cur_streak := GREATEST(COALESCE(v_cur_streak, 1), COALESCE(p_streak, 1), 1);

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_qualified_date, active_dates_30d, updated_at)
  VALUES (p_user_id, v_cur_streak, v_cur_streak, v_today_key, v_cur_dates, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = GREATEST(public.user_streaks.current_streak, EXCLUDED.current_streak),
    longest_streak = GREATEST(public.user_streaks.longest_streak, EXCLUDED.current_streak),
    last_qualified_date = EXCLUDED.last_qualified_date,
    active_dates_30d = EXCLUDED.active_dates_30d,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'total_xp', v_next_xp,
    'xp_added', CASE WHEN v_inserted > 0 THEN v_safe_xp ELSE 0 END,
    'deduped', v_inserted = 0 AND v_safe_xp > 0,
    'current_streak', v_cur_streak
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_user_gamification_xp(uuid, text, text, integer, integer, integer, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_user_gamification_xp(uuid, text, text, integer, integer, integer, integer, jsonb) TO authenticated;

-- 3. Backfill existing tracker XP into user_xp & xp_transactions so current users appear immediately on Leaderboard
INSERT INTO public.user_xp (user_id, total_xp, updated_at)
SELECT t.user_id, GREATEST(COALESCE(t.xp, 0), 0), now()
FROM public.user_learning_trackers t
JOIN public.profiles p ON p.id = t.user_id
WHERE COALESCE(t.xp, 0) > 0
ON CONFLICT (user_id) DO UPDATE SET
  total_xp = GREATEST(public.user_xp.total_xp, EXCLUDED.total_xp),
  updated_at = now();

INSERT INTO public.xp_transactions (user_id, idempotency_key, source_type, xp_amount, reference_id, metadata)
SELECT
  t.user_id,
  'initial_tracker_backfill_' || t.user_id::text,
  'initial_sync',
  t.xp,
  t.user_id::text,
  jsonb_build_object('backfilled', true)
FROM public.user_learning_trackers t
JOIN public.profiles p ON p.id = t.user_id
WHERE COALESCE(t.xp, 0) > 0
ON CONFLICT (user_id, idempotency_key) DO NOTHING;
