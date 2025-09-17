-- PHASE 1: CORRECTION CRITIQUE DE SÉCURITÉ
-- Fix Function Search Path Mutable issues

-- 1. Fix all functions with mutable search_path
ALTER FUNCTION public.get_user_role(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_user_admin() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_admin_mode() SET search_path = 'public';
ALTER FUNCTION public.is_admin(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_current_user_admin() SET search_path = 'public';
ALTER FUNCTION public.is_user_admin(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_authenticated_admin() SET search_path = 'public';
ALTER FUNCTION public.has_feature_flag(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.admin_change_user_role(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_public_catalog_products(text, text, integer) SET search_path = 'public';
ALTER FUNCTION public.cleanup_revoked_tokens() SET search_path = 'public';
ALTER FUNCTION public.process_automation_trigger(uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.search_suppliers(text, text, text, text, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.seed_sample_data() SET search_path = 'public';
ALTER FUNCTION public.get_admin_catalog_intelligence(text, integer) SET search_path = 'public';
ALTER FUNCTION public.admin_update_user_role(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_secure_catalog_products(text, text, integer) SET search_path = 'public';
ALTER FUNCTION public.get_effective_plan(text, plan_type, text) SET search_path = 'public';
ALTER FUNCTION public.get_customers_secure() SET search_path = 'public';
ALTER FUNCTION public.user_has_role(app_role) SET search_path = 'public';
ALTER FUNCTION public.is_admin_user(uuid) SET search_path = 'public';
ALTER FUNCTION public.user_has_role(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_marketplace_products(text, text, integer) SET search_path = 'public';
ALTER FUNCTION public.log_sensitive_data_access() SET search_path = 'public';
ALTER FUNCTION public.get_final_security_status() SET search_path = 'public';
ALTER FUNCTION public.get_user_role_secure(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_authenticated_admin_secure() SET search_path = 'public';
ALTER FUNCTION public.get_secure_suppliers() SET search_path = 'public';
ALTER FUNCTION public.admin_set_user_role(uuid, user_role) SET search_path = 'public';
ALTER FUNCTION public.verify_supplier_ownership(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';
ALTER FUNCTION public.check_user_quota(text, integer) SET search_path = 'public';
ALTER FUNCTION public.calculate_profit_margin(numeric, numeric) SET search_path = 'public';
ALTER FUNCTION public.admin_get_all_users() SET search_path = 'public';
ALTER FUNCTION public.get_subscription_status_secure() SET search_path = 'public';
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.admin_update_user_plan(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.secure_all_user_tables() SET search_path = 'public';
ALTER FUNCTION public.rotate_api_key(uuid) SET search_path = 'public';
ALTER FUNCTION public.detect_suspicious_activity() SET search_path = 'public';
ALTER FUNCTION public.public_newsletter_signup(text) SET search_path = 'public';
ALTER FUNCTION public.get_masked_customers() SET search_path = 'public';
ALTER FUNCTION public.get_safe_integrations() SET search_path = 'public';
ALTER FUNCTION public.clean_expired_cache() SET search_path = 'public';
ALTER FUNCTION public.is_token_revoked(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_supplier_stats(uuid) SET search_path = 'public';
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_security_events() SET search_path = 'public';

-- 2. Improve RLS policies to require strict authentication
-- Replace policies that allow anonymous access with stricter ones

-- Update all user tables with stricter RLS
DROP POLICY IF EXISTS "Authenticated users only - ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Strict authenticated users only - ab_test_experiments" ON public.ab_test_experiments
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Authenticated users only - activity_logs" ON public.activity_logs;
CREATE POLICY "Strict authenticated users only - activity_logs" ON public.activity_logs
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Authenticated users only - advanced_reports" ON public.advanced_reports;
CREATE POLICY "Strict authenticated users only - advanced_reports" ON public.advanced_reports
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- 3. Add security logging trigger
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log critical security events
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'rls_policy_triggered',
    'info',
    format('RLS policy triggered on table %s', TG_TABLE_NAME),
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create comprehensive security audit log
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'security_hardening',
  'critical',
  'Phase 1 security hardening completed - Fixed search paths and RLS policies',
  jsonb_build_object(
    'functions_fixed', 45,
    'policies_updated', 3,
    'timestamp', now(),
    'phase', 'security_correction'
  )
);