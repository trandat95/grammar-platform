-- Migration 020: Harden user_learning_trackers & user_achievements against client-side PostgREST tampering
-- Applied to Supabase project bhlhmhvzqcwqenlhioxr on 2026-11-20

-- 1. Upgrade public.protect_tracker_xp() to guard all server-authoritative & bounded tracker columns
CREATE OR REPLACE FUNCTION public.protect_tracker_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_trusted boolean := COALESCE(
    auth.role() = 'service_role'
    OR (auth.uid() IS NULL AND session_user IN ('postgres', 'supabase_admin'))
    OR COALESCE(current_setting('app.trusted_xp_tx', true), '') = 'xp_rpc_v1'
    OR public.is_admin(),
    false
  );
  v_old_solved int := 0;
  v_new_solved int := 0;
  v_new_target int := 10;
  v_old_lessons_len int := 0;
  v_new_lessons_len int := 0;
  v_old_days_len int := 0;
  v_new_days_len int := 0;
BEGIN
  IF NOT v_is_trusted THEN
    IF TG_OP = 'INSERT' THEN
      NEW.xp := 0;
      NEW.streak := 1;
      NEW.quizzes_completed_today := 0;
      NEW.version := 1;

      IF NEW.daily_goal IS NOT NULL THEN
        IF jsonb_typeof(NEW.daily_goal) <> 'object' OR octet_length(NEW.daily_goal::text) > 512 THEN
          RAISE EXCEPTION 'Cấu trúc daily_goal không hợp lệ.';
        END IF;
        IF NEW.daily_goal ? 'targetQuestions' THEN
          IF NOT ((NEW.daily_goal->>'targetQuestions') ~ '^[0-9]+$') THEN
            RAISE EXCEPTION 'Giá trị daily_goal.targetQuestions không hợp lệ.';
          END IF;
          v_new_target := (NEW.daily_goal->>'targetQuestions')::int;
          IF v_new_target < 1 OR v_new_target > 100 THEN
            RAISE EXCEPTION 'Giá trị daily_goal.targetQuestions phải nằm trong khoảng 1-100.';
          END IF;
        END IF;
        IF NEW.daily_goal ? 'solvedToday' THEN
          IF NOT ((NEW.daily_goal->>'solvedToday') ~ '^[0-9]+$') OR (NEW.daily_goal->>'solvedToday')::int > 5 THEN
            RAISE EXCEPTION 'Giá trị daily_goal.solvedToday không hợp lệ.';
          END IF;
        END IF;
      END IF;

      IF NEW.completed_lessons IS NOT NULL AND (jsonb_typeof(NEW.completed_lessons) <> 'array' OR jsonb_array_length(NEW.completed_lessons) > 5) THEN
        RAISE EXCEPTION 'Dữ liệu completed_lessons khởi tạo không hợp lệ.';
      END IF;

      IF NEW.active_days IS NOT NULL AND (jsonb_typeof(NEW.active_days) <> 'array' OR jsonb_array_length(NEW.active_days) > 2) THEN
        RAISE EXCEPTION 'Dữ liệu active_days khởi tạo không hợp lệ.';
      END IF;
    ELSE
      IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Không được phép thay đổi định danh bản ghi học tập.';
      END IF;

      IF NEW.xp IS DISTINCT FROM OLD.xp THEN
        RAISE EXCEPTION 'Không được phép chỉnh sửa XP trực tiếp từ client.';
      END IF;

      IF NEW.streak IS DISTINCT FROM OLD.streak THEN
        RAISE EXCEPTION 'Không được phép chỉnh sửa streak trực tiếp từ client.';
      END IF;

      IF NEW.quizzes_completed_today IS DISTINCT FROM OLD.quizzes_completed_today THEN
        RAISE EXCEPTION 'Không được phép chỉnh sửa quizzes_completed_today trực tiếp từ client.';
      END IF;

      IF NEW.daily_goal IS DISTINCT FROM OLD.daily_goal AND NEW.daily_goal IS NOT NULL THEN
        IF jsonb_typeof(NEW.daily_goal) <> 'object' OR octet_length(NEW.daily_goal::text) > 512 THEN
          RAISE EXCEPTION 'Cấu trúc daily_goal không hợp lệ.';
        END IF;

        IF NEW.daily_goal ? 'targetQuestions' THEN
          IF NOT ((NEW.daily_goal->>'targetQuestions') ~ '^[0-9]+$') THEN
            RAISE EXCEPTION 'Giá trị daily_goal.targetQuestions không hợp lệ.';
          END IF;
          v_new_target := (NEW.daily_goal->>'targetQuestions')::int;
          IF v_new_target < 1 OR v_new_target > 100 THEN
            RAISE EXCEPTION 'Giá trị daily_goal.targetQuestions phải nằm trong khoảng 1-100.';
          END IF;
        END IF;

        IF NEW.daily_goal ? 'solvedToday' THEN
          IF NOT ((NEW.daily_goal->>'solvedToday') ~ '^[0-9]+$') THEN
            RAISE EXCEPTION 'Giá trị daily_goal.solvedToday không hợp lệ.';
          END IF;
          v_new_solved := (NEW.daily_goal->>'solvedToday')::int;
          IF OLD.daily_goal IS NOT NULL AND (OLD.daily_goal->>'solvedToday') ~ '^[0-9]+$' THEN
            v_old_solved := (OLD.daily_goal->>'solvedToday')::int;
          END IF;
          IF v_new_solved < 0 OR v_new_solved > 200 OR v_new_solved > v_old_solved + 5 THEN
            RAISE EXCEPTION 'Không được phép tăng đột biến daily_goal.solvedToday từ client.';
          END IF;
        END IF;
      END IF;

      IF NEW.completed_lessons IS DISTINCT FROM OLD.completed_lessons AND NEW.completed_lessons IS NOT NULL THEN
        IF jsonb_typeof(NEW.completed_lessons) <> 'array' THEN
          RAISE EXCEPTION 'Dữ liệu completed_lessons phải là mảng JSON.';
        END IF;
        v_old_lessons_len := CASE WHEN OLD.completed_lessons IS NOT NULL AND jsonb_typeof(OLD.completed_lessons) = 'array' THEN jsonb_array_length(OLD.completed_lessons) ELSE 0 END;
        v_new_lessons_len := jsonb_array_length(NEW.completed_lessons);
        IF v_new_lessons_len > 200 OR v_new_lessons_len > v_old_lessons_len + 5 THEN
          RAISE EXCEPTION 'Không được phép ghi hàng loạt completed_lessons từ client.';
        END IF;
      END IF;

      IF NEW.active_days IS DISTINCT FROM OLD.active_days AND NEW.active_days IS NOT NULL THEN
        IF jsonb_typeof(NEW.active_days) <> 'array' THEN
          RAISE EXCEPTION 'Dữ liệu active_days phải là mảng JSON.';
        END IF;
        v_old_days_len := CASE WHEN OLD.active_days IS NOT NULL AND jsonb_typeof(OLD.active_days) = 'array' THEN jsonb_array_length(OLD.active_days) ELSE 0 END;
        v_new_days_len := jsonb_array_length(NEW.active_days);
        IF v_new_days_len > 3660 OR v_new_days_len > v_old_days_len + 2 THEN
          RAISE EXCEPTION 'Không được phép ghi hàng loạt active_days từ client.';
        END IF;
      END IF;

      NEW.version := COALESCE(OLD.version, 1) + 1;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;

-- 2. Tighten RLS on public.user_learning_trackers (authenticated only + explicit WITH CHECK)
DROP POLICY IF EXISTS "Users can read own tracker" ON public.user_learning_trackers;
DROP POLICY IF EXISTS "Users can insert own tracker" ON public.user_learning_trackers;
DROP POLICY IF EXISTS "Users can update own tracker" ON public.user_learning_trackers;

CREATE POLICY "Users can read own tracker"
  ON public.user_learning_trackers
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

CREATE POLICY "Users can insert own tracker"
  ON public.user_learning_trackers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own tracker"
  ON public.user_learning_trackers
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Fix broken permissive INSERT policy on public.user_achievements (prevent client self-granting)
DROP POLICY IF EXISTS "achievements_insert" ON public.user_achievements;
DROP POLICY IF EXISTS "achievements_server_only_insert" ON public.user_achievements;

CREATE POLICY "achievements_admin_only_insert"
  ON public.user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
