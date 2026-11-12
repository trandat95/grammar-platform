-- Migration 013: Fix jsonb active_dates_30d & date last_qualified_date types in award_user_gamification_xp
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
  v_today_date date := (now() + make_interval(mins => COALESCE(p_tz_offset, 420)))::date;
  v_today_key text := to_char(v_today_date, 'YYYY-MM-DD');
  v_cur_dates jsonb := '[]'::jsonb;
  v_cur_streak integer := 1;
  v_dates_len integer := 0;
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

  UPDATE public.user_learning_trackers
  SET xp = GREATEST(xp, v_next_xp::integer), updated_at = now()
  WHERE user_id = p_user_id AND xp < v_next_xp;

  SELECT
    CASE
      WHEN jsonb_typeof(s.active_dates_30d) = 'array' THEN s.active_dates_30d
      ELSE '[]'::jsonb
    END,
    COALESCE(s.current_streak, 0)
  INTO v_cur_dates, v_cur_streak
  FROM public.user_streaks s
  WHERE s.user_id = p_user_id;

  v_cur_dates := COALESCE(v_cur_dates, '[]'::jsonb);

  IF NOT (v_cur_dates @> jsonb_build_array(v_today_key)) THEN
    v_cur_dates := v_cur_dates || jsonb_build_array(v_today_key);
    v_dates_len := jsonb_array_length(v_cur_dates);
    IF v_dates_len > 30 THEN
      SELECT jsonb_agg(elem ORDER BY ord ASC)
      INTO v_cur_dates
      FROM (
        SELECT elem, ord
        FROM jsonb_array_elements(v_cur_dates) WITH ORDINALITY AS t(elem, ord)
        WHERE ord > v_dates_len - 30
      ) sub;
    END IF;
  END IF;

  v_cur_streak := GREATEST(COALESCE(v_cur_streak, 1), COALESCE(p_streak, 1), 1);

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_qualified_date, active_dates_30d, updated_at)
  VALUES (p_user_id, v_cur_streak, v_cur_streak, v_today_date, v_cur_dates, now())
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
