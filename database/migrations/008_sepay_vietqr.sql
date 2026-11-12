-- ==============================================================================
-- Milestone 2.12.16: SePay VA & Dynamic VietQR Auto-Reconciliation Migration
-- Adds 'sepay' provider, gateway config/secrets tables (RLS isolated),
-- atomic SECURITY DEFINER checkout & webhook RPCs for Zero-Trust verification.
-- ==============================================================================

-- 1. Allow 'sepay' provider on user_subscriptions & payment_transactions
ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_provider_check;
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_provider_check
  CHECK (provider IN ('sepay', 'vnpay', 'momo', 'stripe', 'manual'));

ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_provider_check
  CHECK (provider IN ('sepay', 'vnpay', 'momo', 'stripe', 'trial'));

CREATE INDEX IF NOT EXISTS idx_payment_tx_provider_tx_id
  ON public.payment_transactions (provider_tx_id);

-- 2. Public-safe VietQR Display Config (bank_code, VA account_number, account_name)
CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
  provider text PRIMARY KEY,
  bank_code text NOT NULL DEFAULT 'MBBank',
  account_number text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  va_prefix text NOT NULL DEFAULT 'GEVIP',
  qr_template text NOT NULL DEFAULT 'compact',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_configs' AND policyname = 'pgw_configs_public_read'
  ) THEN
    CREATE POLICY pgw_configs_public_read
      ON public.payment_gateway_configs FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_configs' AND policyname = 'pgw_configs_admin_insert'
  ) THEN
    CREATE POLICY pgw_configs_admin_insert
      ON public.payment_gateway_configs FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_configs' AND policyname = 'pgw_configs_admin_update'
  ) THEN
    CREATE POLICY pgw_configs_admin_update
      ON public.payment_gateway_configs FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_configs' AND policyname = 'pgw_configs_admin_delete'
  ) THEN
    CREATE POLICY pgw_configs_admin_delete
      ON public.payment_gateway_configs FOR DELETE TO authenticated USING ((SELECT public.is_admin()));
  END IF;
END
$$;

INSERT INTO public.payment_gateway_configs (provider, bank_code, account_number, account_name, va_prefix, qr_template, is_active)
VALUES ('sepay', 'MBBank', '', '', 'GEVIP', 'compact', true)
ON CONFLICT (provider) DO NOTHING;

-- 3. Strict Admin-Only Gateway Secrets (SePay Webhook API Key - never readable by anon/free users)
CREATE TABLE IF NOT EXISTS public.payment_gateway_secrets (
  provider text PRIMARY KEY REFERENCES public.payment_gateway_configs(provider) ON DELETE CASCADE,
  webhook_api_key text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_secrets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_secrets' AND policyname = 'pgw_secrets_admin_select'
  ) THEN
    CREATE POLICY pgw_secrets_admin_select
      ON public.payment_gateway_secrets FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_secrets' AND policyname = 'pgw_secrets_admin_insert'
  ) THEN
    CREATE POLICY pgw_secrets_admin_insert
      ON public.payment_gateway_secrets FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_secrets' AND policyname = 'pgw_secrets_admin_update'
  ) THEN
    CREATE POLICY pgw_secrets_admin_update
      ON public.payment_gateway_secrets FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_gateway_secrets' AND policyname = 'pgw_secrets_admin_delete'
  ) THEN
    CREATE POLICY pgw_secrets_admin_delete
      ON public.payment_gateway_secrets FOR DELETE TO authenticated USING ((SELECT public.is_admin()));
  END IF;
END
$$;

-- 4. SECURITY DEFINER RPC: Create Pending SePay VA VietQR Order (Caller verified via auth.uid())
CREATE OR REPLACE FUNCTION public.create_sepay_checkout_order(
  p_plan_code text,
  p_coupon_code text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan public.subscription_plans%ROWTYPE;
  v_cfg public.payment_gateway_configs%ROWTYPE;
  v_coupon public.discount_coupons%ROWTYPE;
  v_existing_tx public.payment_transactions%ROWTYPE;
  v_idem_key text;
  v_base_price integer;
  v_discount_vnd integer := 0;
  v_final_vnd integer;
  v_coupon_applied text := NULL;
  v_clean_prefix text;
  v_order_code text;
  v_new_tx public.payment_transactions%ROWTYPE;
  v_qr_url text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 401, 'error', 'Vui lòng đăng nhập để tạo đơn thanh toán VietQR.');
  END IF;

  v_idem_key := COALESCE(NULLIF(trim(p_idempotency_key), ''), 'sepay_' || v_uid::text || '_' || to_char(now(), 'YYYYMMDDHH24MI'));

  SELECT * INTO v_existing_tx
  FROM public.payment_transactions
  WHERE user_id = v_uid AND idempotency_key = v_idem_key
  LIMIT 1;

  SELECT * INTO v_cfg
  FROM public.payment_gateway_configs
  WHERE provider = 'sepay'
  LIMIT 1;

  IF NOT FOUND OR v_cfg.is_active IS NOT TRUE OR length(trim(COALESCE(v_cfg.account_number, ''))) < 4 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'http_status', 400,
      'error', 'Quản trị viên chưa cấu hình Số tài khoản VA SePay trong mục Quản trị > Cổng thanh toán SePay VA.'
    );
  END IF;

  IF v_existing_tx.id IS NOT NULL THEN
    v_qr_url := 'https://qr.sepay.vn/img?acc=' || trim(v_cfg.account_number) ||
      '&bank=' || trim(v_cfg.bank_code) ||
      '&amount=' || v_existing_tx.final_amount_vnd::text ||
      '&des=' || COALESCE(v_existing_tx.provider_tx_id, '') ||
      '&template=' || COALESCE(NULLIF(v_cfg.qr_template, ''), 'compact');
    RETURN jsonb_build_object(
      'ok', true,
      'http_status', 200,
      'deduped', true,
      'order_code', v_existing_tx.provider_tx_id,
      'transaction', to_jsonb(v_existing_tx),
      'gateway', jsonb_build_object(
        'provider', 'sepay',
        'bank_code', v_cfg.bank_code,
        'account_number', v_cfg.account_number,
        'account_name', v_cfg.account_name,
        'qr_template', v_cfg.qr_template,
        'qr_url', v_qr_url
      )
    );
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE code = p_plan_code AND is_active = true
  LIMIT 1;

  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 404, 'error', 'Gói VIP không tồn tại hoặc đã ngừng cung cấp.');
  END IF;

  v_base_price := GREATEST(0, COALESCE(v_plan.price_vnd, 0));

  IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
    SELECT * INTO v_coupon
    FROM public.discount_coupons
    WHERE code = upper(trim(p_coupon_code))
    LIMIT 1;

    IF v_coupon.id IS NULL OR v_coupon.is_active IS NOT TRUE THEN
      RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Mã giảm giá không tồn tại hoặc không còn hiệu lực.');
    END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
      RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Mã giảm giá đã hết hạn.');
    END IF;
    IF COALESCE(v_coupon.used_count, 0) >= COALESCE(v_coupon.max_uses, 1000) THEN
      RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Mã giảm giá đã hết lượt sử dụng.');
    END IF;
    IF v_base_price < COALESCE(v_coupon.min_amount_vnd, 0) THEN
      RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Đơn hàng chưa đạt giá trị tối thiểu cho mã giảm giá này.');
    END IF;
    IF EXISTS (SELECT 1 FROM public.user_coupons WHERE user_id = v_uid AND coupon_id = v_coupon.id) THEN
      RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Bạn đã sử dụng mã giảm giá này trước đó.');
    END IF;

    IF v_coupon.discount_type = 'percent' THEN
      v_discount_vnd := round((v_base_price::numeric * LEAST(90, COALESCE(v_coupon.discount_value, 0))) / 100.0)::integer;
    ELSE
      v_discount_vnd := LEAST(v_base_price, COALESCE(v_coupon.discount_value, 0));
    END IF;
    v_coupon_applied := v_coupon.code;
  END IF;

  v_final_vnd := GREATEST(0, v_base_price - v_discount_vnd);
  v_clean_prefix := regexp_replace(upper(COALESCE(NULLIF(v_cfg.va_prefix, ''), 'GEVIP')), '[^A-Z0-9]', '', 'g');
  IF length(v_clean_prefix) = 0 THEN
    v_clean_prefix := 'GEVIP';
  END IF;
  v_order_code := v_clean_prefix || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.payment_transactions (
    user_id, plan_id, provider, idempotency_key, amount_vnd, discount_vnd, final_amount_vnd,
    coupon_code, status, provider_tx_id, metadata
  )
  VALUES (
    v_uid,
    v_plan.id,
    'sepay',
    v_idem_key,
    v_base_price,
    v_discount_vnd,
    v_final_vnd,
    v_coupon_applied,
    'pending',
    v_order_code,
    jsonb_build_object(
      'adapter', 'SePay VA (VietQR)',
      'plan_code', v_plan.code,
      'plan_name', v_plan.name_vi,
      'billing_cycle', v_plan.billing_cycle,
      'bank_code', v_cfg.bank_code,
      'account_number', v_cfg.account_number,
      'account_name', v_cfg.account_name,
      'order_code', v_order_code
    )
  )
  RETURNING * INTO v_new_tx;

  v_qr_url := 'https://qr.sepay.vn/img?acc=' || trim(v_cfg.account_number) ||
    '&bank=' || trim(v_cfg.bank_code) ||
    '&amount=' || v_final_vnd::text ||
    '&des=' || v_order_code ||
    '&template=' || COALESCE(NULLIF(v_cfg.qr_template, ''), 'compact');

  RETURN jsonb_build_object(
    'ok', true,
    'http_status', 200,
    'deduped', false,
    'order_code', v_order_code,
    'transaction', to_jsonb(v_new_tx),
    'gateway', jsonb_build_object(
      'provider', 'sepay',
      'bank_code', v_cfg.bank_code,
      'account_number', v_cfg.account_number,
      'account_name', v_cfg.account_name,
      'qr_template', v_cfg.qr_template,
      'qr_url', v_qr_url
    )
  );
END;
$$;

-- 5. SECURITY DEFINER RPC: Process Incoming SePay Webhook (API Key verified in SQL)
CREATE OR REPLACE FUNCTION public.process_sepay_webhook(
  p_provided_api_key text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expected_key text;
  v_external_id text;
  v_transfer_type text;
  v_transfer_amount numeric;
  v_raw_code text;
  v_raw_content text;
  v_payload_hash text;
  v_existing_ev public.payment_webhook_events%ROWTYPE;
  v_tx public.payment_transactions%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_coupon public.discount_coupons%ROWTYPE;
  v_period_end timestamptz;
  v_new_sub_id uuid;
BEGIN
  SELECT webhook_api_key INTO v_expected_key
  FROM public.payment_gateway_secrets
  WHERE provider = 'sepay'
  LIMIT 1;

  IF v_expected_key IS NULL OR length(trim(v_expected_key)) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 503, 'error', 'SePay Webhook API Key chưa được thiết lập trên hệ thống.');
  END IF;

  v_payload_hash := substr(md5(COALESCE(p_payload::text, '{}')), 1, 32);
  v_external_id := COALESCE(
    NULLIF(trim(COALESCE(p_payload->>'id', '')), ''),
    NULLIF(trim(COALESCE(p_payload->>'referenceCode', '')), ''),
    v_payload_hash
  );

  IF trim(COALESCE(p_provided_api_key, '')) <> trim(v_expected_key) THEN
    INSERT INTO public.payment_webhook_events (
      provider, external_event_id, signature_valid, payload_hash, payload, processing_status, error_message
    )
    VALUES ('sepay', v_external_id, false, v_payload_hash, COALESCE(p_payload, '{}'::jsonb), 'rejected', 'INVALID_SEPAY_API_KEY')
    ON CONFLICT (provider, external_event_id) DO NOTHING;

    RETURN jsonb_build_object('ok', false, 'http_status', 401, 'error', 'Unauthorized SePay API Key.');
  END IF;

  SELECT * INTO v_existing_ev
  FROM public.payment_webhook_events
  WHERE provider = 'sepay' AND external_event_id = v_external_id
  LIMIT 1;

  IF v_existing_ev.id IS NOT NULL AND v_existing_ev.processing_status = 'processed' THEN
    RETURN jsonb_build_object('ok', true, 'http_status', 200, 'duplicate', true, 'message', 'Webhook event already processed idempotently.');
  END IF;

  v_transfer_type := lower(COALESCE(p_payload->>'transferType', 'in'));
  IF v_transfer_type <> 'in' THEN
    INSERT INTO public.payment_webhook_events (
      provider, external_event_id, signature_valid, payload_hash, payload, processing_status, processed_at, error_message
    )
    VALUES ('sepay', v_external_id, true, v_payload_hash, COALESCE(p_payload, '{}'::jsonb), 'processed', now(), 'IGNORED_OUTGOING_TRANSFER')
    ON CONFLICT (provider, external_event_id) DO UPDATE SET processing_status = 'processed', processed_at = now();

    RETURN jsonb_build_object('ok', true, 'http_status', 200, 'ignored', true, 'reason', 'NOT_INCOMING_TRANSFER');
  END IF;

  v_raw_code := upper(trim(COALESCE(p_payload->>'code', '')));
  v_raw_content := upper(COALESCE(p_payload->>'content', '') || ' ' || COALESCE(p_payload->>'description', ''));
  v_transfer_amount := COALESCE(NULLIF(p_payload->>'transferAmount', '')::numeric, 0);

  SELECT * INTO v_tx
  FROM public.payment_transactions
  WHERE provider = 'sepay'
    AND status = 'pending'
    AND provider_tx_id IS NOT NULL
    AND (
      (length(v_raw_code) > 0 AND v_raw_code = upper(provider_tx_id))
      OR position(upper(provider_tx_id) IN v_raw_content) > 0
    )
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_tx.id IS NULL THEN
    INSERT INTO public.payment_webhook_events (
      provider, external_event_id, signature_valid, payload_hash, payload, processing_status, processed_at, error_message
    )
    VALUES ('sepay', v_external_id, true, v_payload_hash, COALESCE(p_payload, '{}'::jsonb), 'processed', now(), 'NO_MATCHING_PENDING_ORDER')
    ON CONFLICT (provider, external_event_id) DO UPDATE SET processing_status = 'processed', processed_at = now();

    RETURN jsonb_build_object('ok', true, 'http_status', 200, 'unmatched', true, 'message', 'No matching pending order found.');
  END IF;

  IF v_transfer_amount < v_tx.final_amount_vnd THEN
    INSERT INTO public.payment_webhook_events (
      provider, external_event_id, signature_valid, payload_hash, payload, processing_status, processed_at, error_message
    )
    VALUES ('sepay', v_external_id, true, v_payload_hash, COALESCE(p_payload, '{}'::jsonb), 'failed', now(), 'UNDERPAID_AMOUNT')
    ON CONFLICT (provider, external_event_id) DO UPDATE SET processing_status = 'failed', error_message = 'UNDERPAID_AMOUNT';

    RETURN jsonb_build_object(
      'ok', true,
      'http_status', 200,
      'underpaid', true,
      'expected', v_tx.final_amount_vnd,
      'received', v_transfer_amount
    );
  END IF;

  SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_tx.plan_id LIMIT 1;

  IF v_plan.billing_cycle = 'quarterly' THEN
    v_period_end := now() + interval '3 months';
  ELSIF v_plan.billing_cycle = 'yearly' THEN
    v_period_end := now() + interval '1 year';
  ELSIF v_plan.billing_cycle = 'lifetime' THEN
    v_period_end := now() + interval '50 years';
  ELSE
    v_period_end := now() + interval '1 month';
  END IF;

  UPDATE public.user_subscriptions
  SET status = 'canceled', updated_at = now()
  WHERE user_id = v_tx.user_id AND status IN ('trialing', 'active', 'grace_period');

  INSERT INTO public.user_subscriptions (
    user_id, plan_id, status, provider, current_period_start, current_period_end
  )
  VALUES (v_tx.user_id, v_tx.plan_id, 'active', 'sepay', now(), v_period_end)
  RETURNING id INTO v_new_sub_id;

  UPDATE public.payment_transactions
  SET
    status = 'succeeded',
    subscription_id = v_new_sub_id,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'sepay_event_id', v_external_id,
      'gateway', COALESCE(p_payload->>'gateway', ''),
      'subAccount', COALESCE(p_payload->>'subAccount', ''),
      'referenceCode', COALESCE(p_payload->>'referenceCode', ''),
      'transferAmount', v_transfer_amount,
      'paid_at', now()
    )
  WHERE id = v_tx.id;

  IF v_tx.coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.discount_coupons WHERE code = v_tx.coupon_code LIMIT 1;
    IF v_coupon.id IS NOT NULL THEN
      INSERT INTO public.user_coupons (user_id, coupon_id, payment_tx_id)
      VALUES (v_tx.user_id, v_coupon.id, v_tx.id)
      ON CONFLICT (user_id, coupon_id) DO NOTHING;

      UPDATE public.discount_coupons
      SET used_count = COALESCE(used_count, 0) + 1
      WHERE id = v_coupon.id;
    END IF;
  END IF;

  UPDATE public.profiles SET role = 'VIP', updated_at = now() WHERE id = v_tx.user_id;

  INSERT INTO public.subscription_events (subscription_id, user_id, event_type, metadata)
  VALUES (v_new_sub_id, v_tx.user_id, 'SUBSCRIPTION_ACTIVATED', jsonb_build_object('provider', 'sepay', 'order_code', v_tx.provider_tx_id, 'amount_vnd', v_transfer_amount));

  INSERT INTO public.conversion_events (user_id, funnel_stage, metadata)
  VALUES
    (v_tx.user_id, 'PAYMENT', jsonb_build_object('planCode', v_plan.code, 'finalPrice', v_tx.final_amount_vnd, 'provider', 'sepay')),
    (v_tx.user_id, 'SUBSCRIPTION_ACTIVE', jsonb_build_object('planCode', v_plan.code, 'provider', 'sepay'));

  INSERT INTO public.behavior_events (user_id, event_category, event_name, metadata)
  VALUES (v_tx.user_id, 'monetization', 'SUBSCRIPTION_PURCHASED', jsonb_build_object('planCode', v_plan.code, 'provider', 'sepay', 'finalPrice', v_tx.final_amount_vnd));

  UPDATE public.ab_assignments
  SET converted = true
  WHERE user_id = v_tx.user_id AND experiment_key = 'paywall_copy_value_v1';

  INSERT INTO public.payment_webhook_events (
    provider, external_event_id, signature_valid, payload_hash, payload, processing_status, processed_at
  )
  VALUES ('sepay', v_external_id, true, v_payload_hash, COALESCE(p_payload, '{}'::jsonb), 'processed', now())
  ON CONFLICT (provider, external_event_id) DO UPDATE
    SET processing_status = 'processed', signature_valid = true, processed_at = now();

  RETURN jsonb_build_object(
    'ok', true,
    'http_status', 200,
    'activated', true,
    'order_code', v_tx.provider_tx_id,
    'user_id', v_tx.user_id,
    'subscription_id', v_new_sub_id
  );
END;
$$;

-- 6. SECURITY DEFINER RPCs: Free Trial & Transparent Cancel (RLS-safe without service_role env)
CREATE OR REPLACE FUNCTION public.start_vip_trial_order(p_plan_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan public.subscription_plans%ROWTYPE;
  v_trial_end timestamptz;
  v_sub public.user_subscriptions%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 401, 'error', 'Vui lòng đăng nhập để dùng thử VIP.');
  END IF;

  SELECT * INTO v_plan FROM public.subscription_plans WHERE code = p_plan_code AND is_active = true LIMIT 1;
  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 404, 'error', 'Gói VIP không tồn tại.');
  END IF;
  IF COALESCE(v_plan.trial_days, 0) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Gói đã chọn không áp dụng dùng thử miễn phí.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Tài khoản đã từng kích hoạt dùng thử trước đó.');
  END IF;

  v_trial_end := now() + make_interval(days => GREATEST(1, v_plan.trial_days));

  INSERT INTO public.user_subscriptions (
    user_id, plan_id, status, provider, current_period_start, current_period_end, trial_ends_at
  )
  VALUES (v_uid, v_plan.id, 'trialing', 'manual', now(), v_trial_end, v_trial_end)
  RETURNING * INTO v_sub;

  UPDATE public.profiles SET role = 'VIP', updated_at = now() WHERE id = v_uid;

  INSERT INTO public.subscription_events (subscription_id, user_id, event_type, metadata)
  VALUES (v_sub.id, v_uid, 'TRIAL_STARTED', jsonb_build_object('trialDays', v_plan.trial_days, 'endsAt', v_trial_end, 'postTrialPriceVnd', v_plan.price_vnd));

  INSERT INTO public.conversion_events (user_id, funnel_stage, metadata)
  VALUES
    (v_uid, 'TRIAL_STARTED', jsonb_build_object('planCode', v_plan.code)),
    (v_uid, 'SUBSCRIPTION_ACTIVE', jsonb_build_object('planCode', v_plan.code));

  INSERT INTO public.behavior_events (user_id, event_category, event_name, metadata)
  VALUES (v_uid, 'monetization', 'TRIAL_STARTED', jsonb_build_object('planCode', v_plan.code));

  RETURN jsonb_build_object('ok', true, 'http_status', 200, 'subscription', to_jsonb(v_sub), 'plan', to_jsonb(v_plan));
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_active_vip_subscription(p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_active public.user_subscriptions%ROWTYPE;
  v_canceled public.user_subscriptions%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 401, 'error', 'Vui lòng đăng nhập để hủy gói.');
  END IF;

  SELECT * INTO v_active
  FROM public.user_subscriptions
  WHERE user_id = v_uid AND status IN ('trialing', 'active', 'grace_period')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_active.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 404, 'error', 'Không tìm thấy gói VIP đang hoạt động để hủy.');
  END IF;

  UPDATE public.user_subscriptions
  SET
    status = 'canceled',
    cancel_at_period_end = true,
    canceled_at = now(),
    cancellation_reason = COALESCE(NULLIF(trim(p_reason), ''), 'USER_SELF_SERVICE_CANCEL'),
    updated_at = now()
  WHERE id = v_active.id
  RETURNING * INTO v_canceled;

  UPDATE public.profiles SET role = 'FREE', updated_at = now() WHERE id = v_uid;

  INSERT INTO public.subscription_events (subscription_id, user_id, event_type, metadata)
  VALUES (v_active.id, v_uid, 'SUBSCRIPTION_CANCELED_TRANSPARENT', jsonb_build_object('reason', COALESCE(p_reason, 'user_requested'), 'dataPreserved', true));

  INSERT INTO public.behavior_events (user_id, event_category, event_name, metadata)
  VALUES (v_uid, 'monetization', 'SUBSCRIPTION_CANCELED', jsonb_build_object('subscriptionId', v_active.id, 'reason', p_reason));

  RETURN jsonb_build_object('ok', true, 'http_status', 200, 'subscription', to_jsonb(v_canceled));
END;
$$;
