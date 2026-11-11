-- =============================================================================
-- Migration 006: Milestone 2.12 - Intelligent Monetization, Behavioral Psychology & Conversion
-- Target: Supabase PostgreSQL 17 (Project: wtvlbbcyvtqqygtojxay)
-- Creates 18 Monetization Tables (55 Total Public Tables, 100% RLS enabled)
-- Strict Server-Side Authoritative Entitlements, Idempotent Webhooks & Covering Indexes
-- =============================================================================

-- 1. public.subscription_plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_vi text NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
  price_vnd integer NOT NULL CHECK (price_vnd >= 0),
  compare_at_vnd integer NOT NULL DEFAULT 0 CHECK (compare_at_vnd >= 0),
  trial_days integer NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  badge_text text,
  is_recommended boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_plans' AND policyname = 'plans_public_read'
  ) THEN
    CREATE POLICY plans_public_read ON public.subscription_plans FOR SELECT TO authenticated, anon USING (true);
  END IF;
END
$$;

INSERT INTO public.subscription_plans (code, name_vi, billing_cycle, price_vnd, compare_at_vnd, trial_days, badge_text, is_recommended, is_active, sort_order) VALUES
  ('VIP_MONTHLY', 'VIP Tháng Linh Hoạt', 'monthly', 99000, 129000, 7, 'Dùng thử 7 ngày', false, true, 10),
  ('VIP_QUARTERLY', 'VIP 3 Tháng Bứt Phá', 'quarterly', 249000, 297000, 7, 'Tiết kiệm 16%', false, true, 20),
  ('VIP_YEARLY', 'VIP Năm Chuyên Sâu', 'yearly', 699000, 1188000, 7, 'Best Value • Tiết kiệm 41%', true, true, 30),
  ('VIP_LIFETIME', 'VIP Trọn Đời Mai Lan Hương', 'lifetime', 1990000, 2990000, 0, 'Sở hữu vĩnh viễn', false, true, 40)
ON CONFLICT (code) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  billing_cycle = EXCLUDED.billing_cycle,
  price_vnd = EXCLUDED.price_vnd,
  compare_at_vnd = EXCLUDED.compare_at_vnd,
  trial_days = EXCLUDED.trial_days,
  badge_text = EXCLUDED.badge_text,
  is_recommended = EXCLUDED.is_recommended;

-- 2. public.feature_entitlements
CREATE TABLE IF NOT EXISTS public.feature_entitlements (
  feature_key text PRIMARY KEY,
  title_vi text NOT NULL,
  description_vi text NOT NULL,
  free_quota integer NOT NULL DEFAULT 0,
  vip_quota integer NOT NULL DEFAULT -1, -- -1 = unlimited
  sort_order integer NOT NULL DEFAULT 10
);

ALTER TABLE public.feature_entitlements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feature_entitlements' AND policyname = 'feature_entitlements_public_read'
  ) THEN
    CREATE POLICY feature_entitlements_public_read ON public.feature_entitlements FOR SELECT TO authenticated, anon USING (true);
  END IF;
END
$$;

INSERT INTO public.feature_entitlements (feature_key, title_vi, description_vi, free_quota, vip_quota, sort_order) VALUES
  ('unlimited_exercises', 'Toàn bộ 2,939 Bài tập Ngữ pháp', 'Mở khóa 100% bài tập thực hành xuyên suốt 12 chuyên đề & 53 bài học.', 10, -1, 10),
  ('unlimited_quizzes', 'Quiz & Đề thi thử không giới hạn', 'Làm đề 50 câu & Đề Thích Ứng 50/30/20 không giới hạn lượt mỗi ngày.', 2, -1, 20),
  ('diagnostic_root_cause', 'Phân tích Root Cause & Lộ trình Cá nhân hóa', 'Đánh giá chẩn đoán chuyên sâu kèm lộ trình điều chỉnh động theo tuần.', 1, -1, 30),
  ('ai_advisor_full', 'AI Grammar Coach Hỏi Đáp Không Giới Hạn', 'Giải đáp thắc mắc ngữ pháp đối soát Knowledge Graph DAG mọi lúc.', 3, -1, 40),
  ('advanced_mastery_radar', 'Báo cáo Radar 12 Chuyên đề & Forgetting Curve', 'Phân tích chuyên sâu suy giảm trí nhớ 1-3-7-14-30 ngày.', 1, -1, 50),
  ('fsrs_unlimited_sr', 'Spaced Repetition FSRS Không Giới Hạn', 'Ôn tập thông minh tối ưu thời gian nhớ dài hạn cho mọi câu hỏi.', 20, -1, 60),
  ('pdf_exam_export', 'Xuất Báo cáo Tiến độ & Đề Ôn tập', 'Tải báo cáo năng lực ngữ pháp & bộ câu hỏi cá nhân hóa.', 0, -1, 70)
ON CONFLICT (feature_key) DO UPDATE SET
  title_vi = EXCLUDED.title_vi,
  description_vi = EXCLUDED.description_vi,
  free_quota = EXCLUDED.free_quota,
  vip_quota = EXCLUDED.vip_quota;

-- 3. public.plan_entitlements
CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.feature_entitlements(feature_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  quota_override integer,
  CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_key)
);

ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_entitlements' AND policyname = 'plan_entitlements_public_read'
  ) THEN
    CREATE POLICY plan_entitlements_public_read ON public.plan_entitlements FOR SELECT TO authenticated, anon USING (true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_plan_entitlements_plan ON public.plan_entitlements (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_entitlements_feature ON public.plan_entitlements (feature_key);

INSERT INTO public.plan_entitlements (plan_id, feature_key, is_enabled)
SELECT p.id, f.feature_key, true
FROM public.subscription_plans p
CROSS JOIN public.feature_entitlements f
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 4. public.user_subscriptions (Server-Authoritative Writes Only)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL CHECK (status IN ('trialing', 'active', 'grace_period', 'canceled', 'expired')),
  provider text NOT NULL DEFAULT 'vnpay' CHECK (provider IN ('vnpay', 'momo', 'stripe', 'manual')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  trial_ends_at timestamptz,
  grace_period_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  cancellation_reason text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_subscriptions' AND policyname = 'user_subs_select_own'
  ) THEN
    CREATE POLICY user_subs_select_own ON public.user_subscriptions
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_user_subs_user_status ON public.user_subscriptions (user_id, status, current_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_user_subs_plan ON public.user_subscriptions (plan_id);

-- 5. public.subscription_events
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_events' AND policyname = 'sub_events_select_own'
  ) THEN
    CREATE POLICY sub_events_select_own ON public.subscription_events
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON public.subscription_events (subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_user_created ON public.subscription_events (user_id, created_at DESC);

-- 6. public.payment_transactions (Idempotency Protected)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  provider text NOT NULL CHECK (provider IN ('vnpay', 'momo', 'stripe', 'trial')),
  idempotency_key text NOT NULL,
  amount_vnd integer NOT NULL CHECK (amount_vnd >= 0),
  discount_vnd integer NOT NULL DEFAULT 0 CHECK (discount_vnd >= 0),
  final_amount_vnd integer NOT NULL CHECK (final_amount_vnd >= 0),
  coupon_code text,
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  provider_tx_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payment_tx_idempotency UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_transactions' AND policyname = 'payment_tx_select_own'
  ) THEN
    CREATE POLICY payment_tx_select_own ON public.payment_transactions
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_payment_tx_user_created ON public.payment_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_sub ON public.payment_transactions (subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_plan ON public.payment_transactions (plan_id);

-- 7. public.payment_webhook_events (Admin/Server-Only Audit)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_event_id text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  payload_hash text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL CHECK (processing_status IN ('received', 'processed', 'duplicate', 'rejected', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_webhook_provider_event UNIQUE (provider, external_event_id)
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_webhook_events' AND policyname = 'webhook_admin_read'
  ) THEN
    CREATE POLICY webhook_admin_read ON public.payment_webhook_events
      FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

-- 8. public.pricing_campaigns (Anti-Dark-Patterns Ethical Campaigns)
CREATE TABLE IF NOT EXISTS public.pricing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title_vi text NOT NULL,
  description_vi text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  max_redemptions integer,
  current_redemptions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_ethical_verified boolean NOT NULL DEFAULT true
);

ALTER TABLE public.pricing_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pricing_campaigns' AND policyname = 'campaigns_public_read'
  ) THEN
    CREATE POLICY campaigns_public_read ON public.pricing_campaigns FOR SELECT TO authenticated, anon USING (true);
  END IF;
END
$$;

INSERT INTO public.pricing_campaigns (code, title_vi, description_vi, discount_percent, ends_at, max_redemptions, is_active, is_ethical_verified) VALUES
  ('ANNUAL_SCHOLAR', 'Ưu đãi Học kỳ Vàng (-41% Gói Năm)', 'Tiết kiệm thực tế khi đăng ký lộ trình VIP Năm kèm bảo lưu toàn bộ lịch sử học.', 0, now() + interval '45 days', 500, true, true),
  ('FIRST_DIAGNOSTIC_BONUS', 'Ưu đãi sau Đánh giá Trình độ', 'Tặng 7 ngày Dùng thử Toàn quyền kèm mã WELCOME15 minh bạch điều khoản hủy.', 15, now() + interval '60 days', 1000, true, true)
ON CONFLICT (code) DO NOTHING;

-- 9. public.discount_coupons
CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed_vnd')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  min_amount_vnd integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  max_uses integer NOT NULL DEFAULT 1000,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discount_coupons' AND policyname = 'coupons_auth_read'
  ) THEN
    CREATE POLICY coupons_auth_read ON public.discount_coupons FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discount_coupons' AND policyname = 'coupons_anon_active_read'
  ) THEN
    CREATE POLICY coupons_anon_active_read ON public.discount_coupons FOR SELECT TO anon USING (is_active = true);
  END IF;
END
$$;

INSERT INTO public.discount_coupons (code, discount_type, discount_value, min_amount_vnd, expires_at, max_uses, is_active) VALUES
  ('WELCOME15', 'percent', 15, 50000, now() + interval '180 days', 5000, true),
  ('STUDENT20', 'percent', 20, 150000, now() + interval '180 days', 2000, true)
ON CONFLICT (code) DO NOTHING;

-- 10. public.user_coupons
CREATE TABLE IF NOT EXISTS public.user_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  payment_tx_id uuid REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_coupon UNIQUE (user_id, coupon_id)
);

ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_coupons' AND policyname = 'user_coupons_select_own'
  ) THEN
    CREATE POLICY user_coupons_select_own ON public.user_coupons
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon ON public.user_coupons (coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_tx ON public.user_coupons (payment_tx_id);

-- 11. public.behavior_events (23 Tracked Events)
CREATE TABLE IF NOT EXISTS public.behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  event_category text NOT NULL CHECK (event_category IN ('learning', 'engagement', 'monetization')),
  event_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.behavior_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'behavior_events' AND policyname = 'behavior_events_select_own'
  ) THEN
    CREATE POLICY behavior_events_select_own ON public.behavior_events
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_behavior_events_user_time ON public.behavior_events (user_id, created_at DESC);

-- 12. public.user_segments (9 Behavioral Segments + Intent Score)
CREATE TABLE IF NOT EXISTS public.user_segments (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  segment text NOT NULL DEFAULT 'New Explorer' CHECK (
    segment IN (
      'New Explorer', 'Active Learner', 'High Performer', 'Struggling Learner',
      'Exam-Oriented', 'Power User', 'Dormant User', 'Purchase Intent', 'Churn Risk'
    )
  ),
  intent_score integer NOT NULL DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  intent_band text NOT NULL DEFAULT 'Low' CHECK (intent_band IN ('Low', 'Warm', 'Medium', 'High', 'Very High')),
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_segments' AND policyname = 'user_segments_select_own'
  ) THEN
    CREATE POLICY user_segments_select_own ON public.user_segments
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

-- 13. public.paywall_configs (6 Contextual Triggers & Frequency Caps)
CREATE TABLE IF NOT EXISTS public.paywall_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key text NOT NULL UNIQUE,
  title_vi text NOT NULL,
  subtitle_vi text NOT NULL,
  cta_label text NOT NULL DEFAULT 'Khám phá Lộ trình VIP',
  daily_cap integer NOT NULL DEFAULT 2 CHECK (daily_cap >= 0),
  cooldown_minutes integer NOT NULL DEFAULT 180 CHECK (cooldown_minutes >= 0),
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paywall_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'paywall_configs' AND policyname = 'paywall_configs_public_read'
  ) THEN
    CREATE POLICY paywall_configs_public_read ON public.paywall_configs FOR SELECT TO authenticated, anon USING (true);
  END IF;
END
$$;

INSERT INTO public.paywall_configs (trigger_key, title_vi, subtitle_vi, cta_label, daily_cap, cooldown_minutes, is_active) VALUES
  ('post_placement', 'Chuyển hóa Kết quả Chẩn đoán thành Lộ trình Chuyên sâu', 'Hệ thống đã xác định các chuyên đề bạn cần bứt phá. Nâng cấp VIP để mở khóa toàn bộ 2,939 câu luyện tập theo lộ trình.', 'Mở khóa Lộ trình VIP ➔', 2, 120, true),
  ('vip_feature_click', 'Trải nghiệm Toàn quyền Hệ sinh thái Ngữ pháp VIP', 'Tài khoản Miễn phí giúp bạn khởi đầu vững chắc; gói VIP mở khóa toàn bộ bài tập nâng cao, AI Coach & Xuất báo cáo.', 'Xem gói VIP & Dùng thử 7 ngày', 3, 60, true),
  ('milestone_100_q', 'Tuyệt vời! Bạn đã Chinh phục Mốc 100 Câu Hỏi', 'Đà tiến bộ của bạn rất ổn định. Nâng cấp VIP để tiếp tục chuỗi chinh phục không giới hạn mỗi ngày.', 'Nhân rộng tốc độ với VIP', 1, 240, true),
  ('mastery_90', 'Đỉnh cao! Bạn vừa Đạt Ngưỡng >= 90% Mastery', 'Sẵn sàng thử sức bộ đề tổng hợp cấp độ Master và xuất chứng nhận tiến độ chuyên sâu cùng VIP.', 'Mở khóa Thử thách Master', 1, 240, true),
  ('mistake_overload', 'Khắc phục Nhanh Các Lỗ Hổng Đang Lặp Lại', 'Sổ tay của bạn đang ghi nhận nhiều điểm cần ôn tập. VIP mở khóa Spaced Repetition FSRS không giới hạn giúp rút ngắn 50% thời gian ôn.', 'Ôn tập Chuyên sâu với VIP', 2, 180, true),
  ('post_daily_challenge', 'Hoàn thành Xuất sắc Thử thách Ngày!', 'Bạn đã giữ vững kỷ luật hôm nay. Nâng cấp VIP để mở thêm nhiều bài tập thích ứng & thi thử không giới hạn.', 'Nâng cấp VIP linh hoạt', 1, 360, true)
ON CONFLICT (trigger_key) DO NOTHING;

-- 14. public.paywall_impressions
CREATE TABLE IF NOT EXISTS public.paywall_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_key text NOT NULL,
  variant_key text NOT NULL DEFAULT 'control',
  action_taken text NOT NULL DEFAULT 'shown' CHECK (action_taken IN ('shown', 'dismissed', 'clicked_cta')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paywall_impressions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'paywall_impressions' AND policyname = 'paywall_impr_select_own'
  ) THEN
    CREATE POLICY paywall_impr_select_own ON public.paywall_impressions
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_paywall_impr_user_time ON public.paywall_impressions (user_id, trigger_key, created_at DESC);

-- 15. public.conversion_events (14-Stage Funnel)
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  funnel_stage text NOT NULL CHECK (
    funnel_stage IN (
      'VISITOR', 'REGISTRATION', 'FIRST_LEARNING', 'PLACEMENT_TEST', 'VIP_DISCOVERY',
      'PAYWALL', 'CHECKOUT', 'PAYMENT', 'TRIAL_STARTED', 'SUBSCRIPTION_ACTIVE',
      'FEATURE_ADOPTION', 'RENEWAL', 'UPGRADE', 'RETENTION'
    )
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversion_events' AND policyname = 'conv_events_select_own'
  ) THEN
    CREATE POLICY conv_events_select_own ON public.conversion_events
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_conv_events_stage_time ON public.conversion_events (funnel_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_events_user_stage ON public.conversion_events (user_id, funnel_stage);

-- 16. public.ab_experiments
CREATE TABLE IF NOT EXISTS public.ab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key text NOT NULL UNIQUE,
  name_vi text NOT NULL,
  variants jsonb NOT NULL DEFAULT '["control", "progress_anchored"]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_experiments' AND policyname = 'ab_exp_public_read'
  ) THEN
    CREATE POLICY ab_exp_public_read ON public.ab_experiments FOR SELECT TO authenticated, anon USING (true);
  END IF;
END
$$;

INSERT INTO public.ab_experiments (experiment_key, name_vi, variants, is_active) VALUES
  ('paywall_copy_value_v1', 'Kiểm thử A/B Thông điệp Paywall theo Giá trị Tiến bộ', '["control", "progress_anchored"]'::jsonb, true)
ON CONFLICT (experiment_key) DO NOTHING;

-- 17. public.ab_assignments
CREATE TABLE IF NOT EXISTS public.ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key text NOT NULL REFERENCES public.ab_experiments(experiment_key) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_key text NOT NULL,
  converted boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_ab_user_exp UNIQUE (experiment_key, user_id)
);

ALTER TABLE public.ab_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_assignments' AND policyname = 'ab_assign_select_own'
  ) THEN
    CREATE POLICY ab_assign_select_own ON public.ab_assignments
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_ab_assign_user ON public.ab_assignments (user_id);

-- 18. public.notification_campaigns
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_key text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'push')),
  title_vi text NOT NULL,
  body_vi text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'dismissed', 'unsubscribed')),
  marketing_opt_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_campaigns' AND policyname = 'notif_select_own'
  ) THEN
    CREATE POLICY notif_select_own ON public.notification_campaigns
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR public.is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_notif_user_time ON public.notification_campaigns (user_id, created_at DESC);
