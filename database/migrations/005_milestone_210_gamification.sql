-- =============================================================================
-- Migration 005: Milestone 2.10 - Achievement, Level Progression & Intelligent Gamification
-- Target: Supabase PostgreSQL 17 (Project: wtvlbbcyvtqqygtojxay)
-- Adds 7 dedicated tables & upgrades user_achievements (37 Total Public Tables, 100% RLS)
-- Strict Server-Side Authoritative Writes + Composite Indexes
-- =============================================================================

-- 1. Upgrade existing Live public.user_achievements
ALTER TABLE public.user_achievements
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'Bronze'
    CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Diamond')),
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Learning Milestones',
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp_bonus integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_achievements_user_code'
  ) THEN
    ALTER TABLE public.user_achievements
      ADD CONSTRAINT uq_user_achievements_user_code UNIQUE (user_id, achievement_code);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_achievements' AND policyname = 'achievements_server_only_insert'
  ) THEN
    CREATE POLICY achievements_server_only_insert ON public.user_achievements
      AS RESTRICTIVE FOR INSERT TO authenticated, anon
      WITH CHECK (false);
  END IF;
END
$$;

-- 2. public.user_xp (Authoritative XP, Level, Title & Privacy/Motion Preferences)
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp bigint NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  title text NOT NULL DEFAULT 'Beginner',
  xp_into_level integer NOT NULL DEFAULT 0 CHECK (xp_into_level >= 0),
  xp_for_next_level integer NOT NULL DEFAULT 100 CHECK (xp_for_next_level > 0),
  leaderboard_visibility text NOT NULL DEFAULT 'public'
    CHECK (leaderboard_visibility IN ('public', 'anonymous', 'hidden')),
  reduced_motion boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_xp' AND policyname = 'user_xp_select_own'
  ) THEN
    CREATE POLICY user_xp_select_own ON public.user_xp
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

-- 3. public.xp_transactions (Idempotent Audit Ledger preventing DevTools tampering/duplicate XP)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  source_type text NOT NULL,
  xp_amount integer NOT NULL CHECK (xp_amount >= 0),
  question_id text,
  reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_xp_transactions_idempotency UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'xp_transactions' AND policyname = 'xp_transactions_select_own'
  ) THEN
    CREATE POLICY xp_transactions_select_own ON public.xp_transactions
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_created
  ON public.xp_transactions (user_id, created_at DESC);

-- 4. public.achievements (Catalog of Bronze/Silver/Gold/Diamond & Hidden Badges)
CREATE TABLE IF NOT EXISTS public.achievements (
  code text PRIMARY KEY,
  title_vi text NOT NULL,
  title_en text NOT NULL,
  description_vi text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  tier text NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Diamond')),
  category text NOT NULL CHECK (
    category IN ('Learning Consistency', 'Grammar Mastery', 'Accuracy & Performance', 'Learning Milestones')
  ),
  is_hidden boolean NOT NULL DEFAULT false,
  xp_bonus integer NOT NULL DEFAULT 25 CHECK (xp_bonus >= 0),
  rule_key text NOT NULL,
  threshold integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 100
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'achievements_catalog_read'
  ) THEN
    CREATE POLICY achievements_catalog_read ON public.achievements
      FOR SELECT TO authenticated, anon
      USING (true);
  END IF;
END
$$;

INSERT INTO public.achievements (code, title_vi, title_en, description_vi, icon, tier, category, is_hidden, xp_bonus, rule_key, threshold, sort_order) VALUES
  ('first_step', 'Bước Chân Đầu Tiên', 'First Step', 'Hoàn thành câu hỏi ngữ pháp đầu tiên được ghi nhận hợp lệ.', '🌱', 'Bronze', 'Learning Consistency', false, 15, 'total_answered', 1, 10),
  ('daily_learner_3', 'Người Học Bền Bỉ 3 Ngày', 'Daily Learner', 'Duy trì chuỗi học tập hợp lệ 3 ngày liên tiếp.', '🔥', 'Bronze', 'Learning Consistency', false, 25, 'streak_days', 3, 20),
  ('streak_7_days', 'Chiến Binh 7 Ngày', '7-Day Streak', 'Học tập đều đặn không ngắt quãng suốt 7 ngày.', '⚡', 'Silver', 'Learning Consistency', false, 50, 'streak_days', 7, 30),
  ('warrior_30_days', 'Huyền Thoại 30 Ngày', '30-Day Warrior', 'Duy trì chuỗi học tập kỷ luật suốt 30 ngày liên tiếp.', '🛡️', 'Gold', 'Learning Consistency', false, 150, 'streak_days', 30, 40),
  ('consistency_master_100', 'Bậc Thầy Kỷ Luật 100 Ngày', 'Consistency Master', 'Đạt chuỗi 100 ngày luyện tập ngữ pháp liên tục.', '👑', 'Diamond', 'Learning Consistency', false, 400, 'streak_days', 100, 50),
  ('night_owl_hidden', 'Cú Đêm Cần Mẫn', 'Night Owl', 'Hoàn thành phiên ôn tập lúc khuya muộn (23:00 - 04:00).', '🦉', 'Silver', 'Learning Consistency', true, 60, 'night_study', 1, 55),

  ('tense_explorer', 'Khám Phá Các Thì', 'Tense Explorer', 'Đạt tối thiểu 60% Mastery ở Chương 1: Các thì.', '⏳', 'Bronze', 'Grammar Mastery', false, 40, 'chapter_1_mastery', 60, 60),
  ('master_13_tenses', 'Bậc Thầy 13 Thì Động Từ', 'Master of 13 Tenses', 'Đạt cấp Master (>= 90%) tại Chương 1: Các thì.', '🧭', 'Gold', 'Grammar Mastery', false, 120, 'chapter_1_mastery', 90, 70),
  ('conditional_expert', 'Chuyên Gia Mệnh Đề & Điều Kiện', 'Conditional Expert', 'Đạt >= 75% Mastery ở Chương 3: Mệnh đề & Cụm từ.', '🔀', 'Silver', 'Grammar Mastery', false, 75, 'chapter_3_mastery', 75, 80),
  ('passive_voice_master', 'Bậc Thầy Câu Bị Động', 'Passive Voice Master', 'Đạt cấp Master (>= 90%) ở Chương 10: Câu Chủ động - Bị động.', '🎭', 'Gold', 'Grammar Mastery', false, 120, 'chapter_10_mastery', 90, 90),
  ('grammar_legend_12', 'Huyền Thoại 12 Chuyên Đề', 'Grammar Legend', 'Đạt >= 75% Mastery đồng thời trên cả 12 chuyên đề ngữ pháp.', '💎', 'Diamond', 'Grammar Mastery', false, 500, 'all_12_chapters_75', 12, 100),

  ('perfect_score', 'Điểm Tuyệt Đối 100%', 'Perfect Score', 'Đạt điểm tuyệt đối 100% trong một bài Quiz từ 10 câu trở lên.', '🎯', 'Silver', 'Accuracy & Performance', false, 60, 'perfect_quiz', 1, 110),
  ('sharp_shooter', 'Xạ Thủ Chính Xác', 'Sharp Shooter', 'Đạt độ chính xác >= 90% ở 5 bài Quiz.', '🏹', 'Gold', 'Accuracy & Performance', false, 150, 'high_accuracy_quizzes', 5, 120),
  ('error_hunter', 'Thợ Săn Lỗi Sai', 'Error Hunter', 'Xử lý thành công 100 câu từng làm sai hoặc câu tái ôn tập.', '🔍', 'Gold', 'Accuracy & Performance', false, 150, 'errors_resolved', 100, 130),
  ('comeback_king', 'Vua Lội Ngược Dòng', 'Comeback King', 'Cải thiện ít nhất 1 chuyên đề từ dưới 50% lên >= 75% Mastery.', '🦅', 'Silver', 'Accuracy & Performance', true, 80, 'comeback_topic', 1, 135),
  ('lightning_master_hidden', 'Tia Chớp Chuẩn Xác', 'Lightning Precision', 'Trả lời đúng liên tiếp 10 câu ở tốc độ phản xạ nhanh (< 5 giây).', '⚡', 'Gold', 'Accuracy & Performance', true, 100, 'fast_streak', 10, 138),

  ('quiz_starter', 'Người Chinh Phục Quiz', 'Quiz Starter', 'Hoàn thành 10 bài kiểm tra Quiz tổng hợp.', '📝', 'Bronze', 'Learning Milestones', false, 35, 'quizzes_completed', 10, 140),
  ('century_club', 'Câu Lạc Bộ 100 Đề', 'Century Club', 'Hoàn thành 100 bài kiểm tra Quiz trên nền tảng.', '💯', 'Gold', 'Learning Milestones', false, 200, 'quizzes_completed', 100, 150),
  ('knowledge_collector', 'Kho Tàng Tri Thức 1,000 Câu', 'Knowledge Collector', 'Trả lời đúng 1,000 câu hỏi ngữ pháp khác nhau.', '📚', 'Diamond', 'Learning Milestones', false, 350, 'unique_questions_correct', 1000, 160),
  ('review_master', 'Bậc Thầy Ôn Tập Ngắt Quãng', 'Review Master', 'Đạt trạng thái Mastered cho 100 thẻ Spaced Repetition.', '🧠', 'Gold', 'Learning Milestones', false, 180, 'sr_mastered_count', 100, 170)
ON CONFLICT (code) DO UPDATE SET
  title_vi = EXCLUDED.title_vi,
  title_en = EXCLUDED.title_en,
  description_vi = EXCLUDED.description_vi,
  icon = EXCLUDED.icon,
  tier = EXCLUDED.tier,
  category = EXCLUDED.category,
  is_hidden = EXCLUDED.is_hidden,
  xp_bonus = EXCLUDED.xp_bonus,
  rule_key = EXCLUDED.rule_key,
  threshold = EXCLUDED.threshold,
  sort_order = EXCLUDED.sort_order;

-- 5. public.daily_challenges (Daily & Weekly Challenge Templates)
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly')),
  title_vi text NOT NULL,
  description_vi text NOT NULL,
  challenge_type text NOT NULL,
  target_value integer NOT NULL CHECK (target_value > 0),
  accuracy_min integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 50 CHECK (xp_reward >= 0),
  difficulty_band text NOT NULL DEFAULT 'ALL',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_challenges' AND policyname = 'daily_challenges_catalog_read'
  ) THEN
    CREATE POLICY daily_challenges_catalog_read ON public.daily_challenges
      FOR SELECT TO authenticated, anon
      USING (true);
  END IF;
END
$$;

INSERT INTO public.daily_challenges (code, period_type, title_vi, description_vi, challenge_type, target_value, accuracy_min, xp_reward, difficulty_band) VALUES
  ('daily_solve_15', 'daily', 'Khởi động 15 câu hợp lệ', 'Hoàn thành 15 câu hỏi ngữ pháp trong ngày hôm nay.', 'questions_count', 15, 0, 50, 'ALL'),
  ('daily_acc_85', 'daily', 'Chuẩn xác 85% trong ngày', 'Trả lời đúng >= 85% trên tối thiểu 10 câu hỏi hôm nay.', 'accuracy_threshold', 10, 85, 50, 'Intermediate'),
  ('daily_review_5', 'daily', 'Ôn tập 5 câu đến hạn SR', 'Giải quyết 5 câu ôn tập ngắt quãng hoặc câu từng làm sai.', 'sr_reviews', 5, 0, 50, 'ALL'),
  ('daily_sprint_25', 'daily', 'Bứt phá 25 câu luyện tập', 'Chinh phục 25 câu hỏi mới hoặc đề thích ứng hôm nay.', 'questions_count', 25, 0, 50, 'Advanced'),
  ('weekly_solve_100', 'weekly', 'Chinh phục 100 câu tuần này', 'Hoàn thành 100 câu hỏi hợp lệ trong tuần.', 'questions_count', 100, 0, 150, 'ALL'),
  ('weekly_days_5', 'weekly', '5 ngày học đều đặn', 'Học tập hợp lệ tối thiểu 5 ngày khác nhau trong tuần.', 'active_days', 5, 0, 150, 'ALL'),
  ('weekly_quiz_3', 'weekly', 'Hoàn thành 3 đề Quiz/Tuần', 'Hoàn thành trọn vẹn 3 phiên Quiz hoặc Đề thích ứng 50/30/20.', 'quizzes_count', 3, 0, 150, 'ALL')
ON CONFLICT (code) DO UPDATE SET
  period_type = EXCLUDED.period_type,
  title_vi = EXCLUDED.title_vi,
  description_vi = EXCLUDED.description_vi,
  challenge_type = EXCLUDED.challenge_type,
  target_value = EXCLUDED.target_value,
  accuracy_min = EXCLUDED.accuracy_min,
  xp_reward = EXCLUDED.xp_reward,
  difficulty_band = EXCLUDED.difficulty_band;

-- 6. public.user_challenges (Timezone-aware Progress + Anti-Double-Claim)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  current_progress integer NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
  correct_in_period integer NOT NULL DEFAULT 0 CHECK (correct_in_period >= 0),
  attempts_in_period integer NOT NULL DEFAULT 0 CHECK (attempts_in_period >= 0),
  target_value integer NOT NULL CHECK (target_value > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed', 'swapped')),
  claimed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_challenge_period UNIQUE (user_id, challenge_id, period_key)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_challenges' AND policyname = 'user_challenges_select_own'
  ) THEN
    CREATE POLICY user_challenges_select_own ON public.user_challenges
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_period
  ON public.user_challenges (user_id, period_key, status);

-- 7. public.user_streaks (Timezone-aware Streak + Recovery Protection)
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_qualified_date date,
  timezone_offset_minutes integer NOT NULL DEFAULT 420,
  freeze_tokens integer NOT NULL DEFAULT 1 CHECK (freeze_tokens >= 0),
  recovery_used_count integer NOT NULL DEFAULT 0 CHECK (recovery_used_count >= 0),
  active_dates_30d jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_streaks' AND policyname = 'user_streaks_select_own'
  ) THEN
    CREATE POLICY user_streaks_select_own ON public.user_streaks
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

-- 8. public.leaderboard_snapshots (Cached 5-Board Rankings < 50ms Read)
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_type text NOT NULL CHECK (
    board_type IN ('weekly_xp', 'monthly_xp', 'all_time_xp', 'weekly_consistency', 'grammar_mastery')
  ),
  period_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  score numeric(10,2) NOT NULL DEFAULT 0,
  tie_breaker_accuracy numeric(5,2) NOT NULL DEFAULT 0,
  rank_position integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT 'Beginner',
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_leaderboard_board_period_user UNIQUE (board_type, period_key, user_id)
);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard_snapshots' AND policyname = 'leaderboard_snapshots_public_read'
  ) THEN
    CREATE POLICY leaderboard_snapshots_public_read ON public.leaderboard_snapshots
      FOR SELECT TO authenticated, anon
      USING (true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_leaderboard_board_period_rank
  ON public.leaderboard_snapshots (board_type, period_key, score DESC, tie_breaker_accuracy DESC);
