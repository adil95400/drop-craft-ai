-- Migration: Secure role system - remove privilege escalation vulnerability
-- Part 1: Update all RLS policies to use has_role function

-- 1. Update orders policies
DROP POLICY IF EXISTS admin_bypass_select_orders ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 2. Update products policies  
DROP POLICY IF EXISTS admin_bypass_select_products ON public.products;
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 3. Update user_sessions policies
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.user_sessions;
CREATE POLICY "Admins can manage all sessions"
  ON public.user_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Update security_audit_log policies
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.security_audit_log;
CREATE POLICY "Admins can view all security logs"
  ON public.security_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update plan_limits policies
DROP POLICY IF EXISTS "Only admins can view plan limits" ON public.plan_limits;
CREATE POLICY "Only admins can view plan limits"
  ON public.plan_limits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Update catalog_products policies  
DROP POLICY IF EXISTS "Admins can view full catalog data" ON public.catalog_products;
CREATE POLICY "Admins can view full catalog data"
  ON public.catalog_products FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Part 2: Drop the insecure columns with CASCADE
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_updated_at CASCADE;

-- Part 3: Create helper function with correct column names
CREATE OR REPLACE FUNCTION public.get_profile_with_role(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  company text,
  avatar_url text,
  email_notifications boolean,
  plan plan_type,
  admin_mode text,
  subscription_plan text,
  subscription_status text,
  subscription_expires_at timestamp with time zone,
  feature_flags jsonb,
  business_name text,
  website text,
  company_name text,
  company_website text,
  timezone text,
  preferences jsonb,
  notification_settings jsonb,
  settings jsonb,
  business_type text,
  experience_level text,
  business_goals text[],
  monthly_volume text,
  interests text[],
  onboarding_completed boolean,
  last_login_at timestamp with time zone,
  login_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.company,
    p.avatar_url,
    p.email_notifications,
    p.plan,
    p.admin_mode,
    p.subscription_plan,
    p.subscription_status,
    p.subscription_expires_at,
    p.feature_flags,
    p.business_name,
    p.website,
    p.company_name,
    p.company_website,
    p.timezone,
    p.preferences,
    p.notification_settings,
    p.settings,
    p.business_type,
    p.experience_level,
    p.business_goals,
    p.monthly_volume,
    p.interests,
    p.onboarding_completed,
    p.last_login_at,
    p.login_count,
    p.created_at,
    p.updated_at,
    public.has_role(p.id, 'admin') as is_admin
  FROM public.profiles p
  WHERE p.id = profile_user_id;
$$;

-- Part 4: Log security upgrade
INSERT INTO public.security_events (
  user_id,
  event_type,
  severity,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'security_upgrade',
  'critical',
  'COMPLETED: Removed privilege escalation vulnerability from profiles table',
  jsonb_build_object(
    'policies_updated', 6,
    'columns_removed', ARRAY['is_admin', 'role', 'role_updated_at'],
    'security_function_created', 'get_profile_with_role',
    'vulnerability', 'Users could escalate privileges by modifying their profile',
    'fix', 'All role checks now use secure user_roles table via has_role() function',
    'timestamp', now()
  )
);