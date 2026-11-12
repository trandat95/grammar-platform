-- ==============================================================================
-- Milestone 2.12.17: Fix protect_profile_role() trigger for SePay Webhook & Billing RPCs
-- Allows trusted server-side SECURITY DEFINER billing RPCs to toggle FREE <-> VIP
-- while keeping strict protection against unauthorized role changes or ADMIN escalation.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_billing_bypass boolean := (
    current_setting('app.trusted_billing_tx', true) = 'sepay_rpc_v1'
    AND NEW.role IN ('FREE', 'VIP')
    AND OLD.role IN ('FREE', 'VIP')
  );
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() AND NOT v_billing_bypass THEN
    RAISE EXCEPTION 'Chỉ quản trị viên hệ thống (Admin) mới có quyền cập nhật vai trò người dùng.';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Không được phép thay đổi User ID.';
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

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

  PERFORM set_config('app.trusted_billing_tx', 'sepay_rpc_v1', true);
  UPDATE public.profiles SET role = 'VIP', updated_at = now() WHERE id = v_tx.user_id AND role <> 'ADMIN';
  PERFORM set_config('app.trusted_billing_tx', '', true);

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

  PERFORM set_config('app.trusted_billing_tx', 'sepay_rpc_v1', true);
  UPDATE public.profiles SET role = 'VIP', updated_at = now() WHERE id = v_uid AND role <> 'ADMIN';
  PERFORM set_config('app.trusted_billing_tx', '', true);

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

  PERFORM set_config('app.trusted_billing_tx', 'sepay_rpc_v1', true);
  UPDATE public.profiles SET role = 'FREE', updated_at = now() WHERE id = v_uid AND role <> 'ADMIN';
  PERFORM set_config('app.trusted_billing_tx', '', true);

  INSERT INTO public.subscription_events (subscription_id, user_id, event_type, metadata)
  VALUES (v_active.id, v_uid, 'SUBSCRIPTION_CANCELED_TRANSPARENT', jsonb_build_object('reason', COALESCE(p_reason, 'user_requested'), 'dataPreserved', true));

  INSERT INTO public.behavior_events (user_id, event_category, event_name, metadata)
  VALUES (v_uid, 'monetization', 'SUBSCRIPTION_CANCELED', jsonb_build_object('subscriptionId', v_active.id, 'reason', p_reason));

  RETURN jsonb_build_object('ok', true, 'http_status', 200, 'subscription', to_jsonb(v_canceled));
END;
$$;
