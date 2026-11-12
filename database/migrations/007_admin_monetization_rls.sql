-- ==============================================================================
-- Milestone 2.12 Admin Monetization Write RLS Policies
-- Grants INSERT, UPDATE, and DELETE on subscription_plans, discount_coupons,
-- and paywall_configs strictly to authenticated ADMIN profiles (public.is_admin()).
-- Explicit write policies avoid duplicate permissive SELECT policy overhead.
-- ==============================================================================

-- 1. public.subscription_plans
DROP POLICY IF EXISTS plans_admin_insert ON public.subscription_plans;
CREATE POLICY plans_admin_insert
  ON public.subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS plans_admin_update ON public.subscription_plans;
CREATE POLICY plans_admin_update
  ON public.subscription_plans
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS plans_admin_delete ON public.subscription_plans;
CREATE POLICY plans_admin_delete
  ON public.subscription_plans
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- 2. public.discount_coupons
DROP POLICY IF EXISTS coupons_admin_insert ON public.discount_coupons;
CREATE POLICY coupons_admin_insert
  ON public.discount_coupons
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS coupons_admin_update ON public.discount_coupons;
CREATE POLICY coupons_admin_update
  ON public.discount_coupons
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS coupons_admin_delete ON public.discount_coupons;
CREATE POLICY coupons_admin_delete
  ON public.discount_coupons
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- 3. public.paywall_configs
DROP POLICY IF EXISTS paywall_configs_admin_insert ON public.paywall_configs;
CREATE POLICY paywall_configs_admin_insert
  ON public.paywall_configs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS paywall_configs_admin_update ON public.paywall_configs;
CREATE POLICY paywall_configs_admin_update
  ON public.paywall_configs
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS paywall_configs_admin_delete ON public.paywall_configs;
CREATE POLICY paywall_configs_admin_delete
  ON public.paywall_configs
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));
