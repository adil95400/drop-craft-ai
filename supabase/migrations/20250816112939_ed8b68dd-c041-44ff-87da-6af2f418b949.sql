-- Fix security definer view issues by recreating views with proper security context

-- 1. Drop and recreate user_subscription_status view without security definer issues
DROP VIEW IF EXISTS public.user_subscription_status;

-- Instead of a view, we'll rely on direct table access with proper RLS policies
-- The view was redundant since the subscribers table already has proper RLS

-- 2. Drop and recreate customers_masked view to avoid security definer issues  
DROP VIEW IF EXISTS public.customers_masked;

-- Create a function instead of a view for masked customer data
CREATE OR REPLACE FUNCTION public.get_masked_customers()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  status text,
  total_spent numeric,
  total_orders integer,
  address jsonb,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Use INVOKER instead of DEFINER for proper RLS enforcement
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    simple_mask_email(c.email) AS email,
    simple_mask_phone(c.phone) AS phone,
    c.status,
    c.total_spent,
    c.total_orders,
    c.address,
    c.user_id,
    c.created_at,
    c.updated_at
  FROM customers c
  WHERE auth.uid() = c.user_id;
$$;

-- 3. Drop and recreate integrations_safe view
DROP VIEW IF EXISTS public.integrations_safe;

-- Create a function instead of a view for safe integration data
CREATE OR REPLACE FUNCTION public.get_safe_integrations()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  platform_type text,
  platform_name text,
  platform_url text,
  shop_domain text,
  seller_id text,
  is_active boolean,
  connection_status text,
  sync_frequency text,
  last_sync_at timestamptz,
  store_config jsonb,
  sync_settings jsonb,
  last_error text,
  created_at timestamptz,
  updated_at timestamptz,
  has_api_key boolean,
  has_api_secret boolean,
  has_access_token boolean,
  has_refresh_token boolean,
  has_encrypted_credentials boolean,
  last_credential_access timestamptz,
  require_additional_auth boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Use INVOKER instead of DEFINER for proper RLS enforcement
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.user_id,
    i.platform_type,
    i.platform_name,
    i.platform_url,
    i.shop_domain,
    i.seller_id,
    i.is_active,
    i.connection_status,
    i.sync_frequency,
    i.last_sync_at,
    i.store_config,
    i.sync_settings,
    i.last_error,
    i.created_at,
    i.updated_at,
    (i.api_key IS NOT NULL) AS has_api_key,
    (i.api_secret IS NOT NULL) AS has_api_secret,
    (i.access_token IS NOT NULL) AS has_access_token,
    (i.refresh_token IS NOT NULL) AS has_refresh_token,
    (i.encrypted_credentials IS NOT NULL) AS has_encrypted_credentials,
    i.last_credential_access,
    i.require_additional_auth
  FROM integrations i
  WHERE auth.uid() = i.user_id;
$$;

-- Grant access to authenticated users for the functions
GRANT EXECUTE ON FUNCTION public.get_masked_customers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_integrations() TO authenticated;

-- 4. Add proper search path to existing functions to fix warnings
-- Update existing functions with proper search path
ALTER FUNCTION public.clean_expired_cache() SET search_path = public;
ALTER FUNCTION public.calculate_profit_margin(numeric, numeric) SET search_path = public;
ALTER FUNCTION public.mask_customer_email(text) SET search_path = public;
ALTER FUNCTION public.mask_customer_phone(text) SET search_path = public;
ALTER FUNCTION public.simple_mask_email(text) SET search_path = public;
ALTER FUNCTION public.simple_mask_phone(text) SET search_path = public;
ALTER FUNCTION public.log_sensitive_data_access() SET search_path = public;
ALTER FUNCTION public.log_credential_access(uuid, text, uuid, text) SET search_path = public;
ALTER FUNCTION public.check_quota(uuid, text) SET search_path = public;
ALTER FUNCTION public.increment_quota(uuid, text, integer) SET search_path = public;

-- 5. Add security documentation
COMMENT ON FUNCTION public.get_masked_customers() IS 'Returns masked customer data for the authenticated user. Uses SECURITY INVOKER to enforce proper RLS policies.';
COMMENT ON FUNCTION public.get_safe_integrations() IS 'Returns safe integration data (without sensitive credentials) for the authenticated user. Uses SECURITY INVOKER to enforce proper RLS policies.';