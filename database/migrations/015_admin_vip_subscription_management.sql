-- ============================================================================
-- Milestone 2.12 + Admin Governance: Admin VIP Plan Assignment & Expiry Sync
-- Allows verified ADMINs to grant specific VIP plans (VIP_MONTHLY, VIP_QUARTERLY,
-- VIP_YEARLY, VIP_LIFETIME) or downgrade back to FREE while keeping
-- user_subscriptions and profiles.role 100% consistent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_grant_user_vip_subscription(
  p_target_user_id uuid,
  p_plan_code text DEFAULT 'VIP_YEARLY',
  p_action text DEFAULT 'grant_vip'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_now timestamptz := now();
  v_plan public.subscription_plans%ROWTYPE;
  v_period_end timestamptz;
  v_new_sub_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 403, 'error', 'Forbidden: Yêu cầu quyền Quản trị viên (ADMIN).');
  END IF;

  IF p_target_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 400, 'error', 'Thiếu userId mục tiêu.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 404, 'error', 'Không tìm thấy hồ sơ học viên.');
  END IF;

  IF p_action = 'revoke_vip' THEN
    UPDATE public.user_subscriptions
    SET
      status = 'canceled',
      cancel_at_period_end = true,
      canceled_at = v_now,
      cancellation_reason = 'ADMIN_DOWNGRADE_FREE',
      updated_at = v_now
    WHERE user_id = p_target_user_id
      AND status IN ('trialing', 'active', 'grace_period');

    UPDATE public.profiles
    SET role = 'FREE', updated_at = v_now
    WHERE id = p_target_user_id AND role <> 'ADMIN';

    RETURN jsonb_build_object(
      'ok', true,
      'http_status', 200,
      'role', 'FREE',
      'subscription', NULL
    );
  END IF;

  -- grant_vip flow
  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE code = COALESCE(NULLIF(trim(p_plan_code), ''), 'VIP_YEARLY')
  LIMIT 1;

  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 404, 'error', 'Không tìm thấy gói VIP yêu cầu.');
  END IF;

  IF v_plan.billing_cycle = 'monthly' THEN
    v_period_end := v_now + interval '1 month';
  ELSIF v_plan.billing_cycle = 'quarterly' THEN
    v_period_end := v_now + interval '3 months';
  ELSIF v_plan.billing_cycle = 'lifetime' THEN
    v_period_end := v_now + interval '50 years';
  ELSE
    v_period_end := v_now + interval '1 year';
  END IF;

  -- Close any prior active/trialing subscription cleanly
  UPDATE public.user_subscriptions
  SET
    status = 'canceled',
    canceled_at = v_now,
    cancellation_reason = 'ADMIN_PLAN_SWITCH',
    updated_at = v_now
  WHERE user_id = p_target_user_id
    AND status IN ('trialing', 'active', 'grace_period');

  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    provider,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    metadata
  )
  VALUES (
    p_target_user_id,
    v_plan.id,
    'active',
    'admin_grant',
    v_now,
    v_period_end,
    false,
    jsonb_build_object(
      'granted_by', v_admin_id,
      'plan_code', v_plan.code,
      'billing_cycle', v_plan.billing_cycle
    )
  )
  RETURNING id INTO v_new_sub_id;

  UPDATE public.profiles
  SET role = 'VIP', updated_at = v_now
  WHERE id = p_target_user_id AND role <> 'ADMIN';

  RETURN jsonb_build_object(
    'ok', true,
    'http_status', 200,
    'role', 'VIP',
    'subscription', jsonb_build_object(
      'id', v_new_sub_id,
      'plan_id', v_plan.id,
      'plan_code', v_plan.code,
      'plan_name', v_plan.name_vi,
      'billing_cycle', v_plan.billing_cycle,
      'status', 'active',
      'provider', 'admin_grant',
      'current_period_start', v_now,
      'current_period_end', v_period_end
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_user_vip_subscription(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_user_vip_subscription(uuid, text, text) TO authenticated, service_role;
