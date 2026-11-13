-- Migration 017: Fix Admin VIP Grant RPC & Support admin_grant Provider
-- Description:
-- 1. Updates public.is_admin() to allow service_role and postgres superuser bypass.
-- 2. Adds metadata jsonb column to user_subscriptions if not exists.
-- 3. Updates user_subscriptions_provider_check to permit 'admin_grant' and 'trial'.

-- 1. Update is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
END;
$function$;

-- 2. Add metadata column
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Update provider check constraint
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_provider_check;
ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_provider_check 
  CHECK (provider = ANY (ARRAY['sepay'::text, 'vnpay'::text, 'momo'::text, 'stripe'::text, 'manual'::text, 'admin_grant'::text, 'trial'::text]));
