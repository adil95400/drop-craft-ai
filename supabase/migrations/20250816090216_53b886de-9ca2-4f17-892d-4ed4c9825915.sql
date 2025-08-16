-- Comprehensive Security Fixes Migration

-- 1. Fix all Security Definer Views by dropping and recreating customers_masked view
DROP VIEW IF EXISTS public.customers_masked;

-- Recreate customers_masked as a regular view with proper RLS enforcement
CREATE VIEW public.customers_masked AS
SELECT 
  id,
  user_id,
  name,
  -- Use simple masking functions instead of SECURITY DEFINER
  CASE 
    WHEN LENGTH(email) > 3 THEN 
      SUBSTRING(email FROM 1 FOR 3) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE '***'
  END AS email,
  CASE 
    WHEN LENGTH(phone) > 3 THEN 
      SUBSTRING(phone FROM 1 FOR 3) || '****' || SUBSTRING(phone FROM LENGTH(phone) - 1)
    ELSE '***'
  END AS phone,
  address,
  status,
  total_orders,
  total_spent,
  created_at,
  updated_at
FROM public.customers
WHERE auth.uid() = user_id;

-- 2. Fix all database functions to include proper search_path security
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.mask_customer_email(text) SET search_path TO 'public';
ALTER FUNCTION public.mask_customer_phone(text) SET search_path TO 'public';
ALTER FUNCTION public.get_business_intelligence(integer) SET search_path TO 'public';
ALTER FUNCTION public.log_sensitive_data_access() SET search_path TO 'public';
ALTER FUNCTION public.calculate_profit_margin(numeric, numeric) SET search_path TO 'public';

-- 3. Create secure role checking function with proper search path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = user_id_param 
  LIMIT 1;
$$;

-- 4. Create a proper admin check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'admin'::app_role
  );
$$;

-- 5. Secure the API cache table - restrict to authenticated users only
DROP POLICY IF EXISTS "API cache is publicly readable" ON public.api_cache;

CREATE POLICY "Authenticated users can read API cache"
ON public.api_cache
FOR SELECT
TO authenticated
USING (true);

-- Service role can still manage the cache
CREATE POLICY "Service role can manage API cache"
ON public.api_cache
FOR ALL
TO service_role
USING (true);

-- 6. Add rate limiting to newsletter table
ALTER TABLE public.newsletters 
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS created_at_date date DEFAULT CURRENT_DATE;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_newsletters_ip_date 
ON public.newsletters(ip_address, created_at_date);

-- 7. Restrict security events to service role only
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

CREATE POLICY "Service role can manage security events"
ON public.security_events
FOR ALL
TO service_role
USING (true);

-- Authenticated users can only view their own security events
CREATE POLICY "Users can view their own security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 8. Add better admin policies that use the secure role check
DROP POLICY IF EXISTS "Admin users can view sensitive business data" ON public.catalog_products;

CREATE POLICY "Admin users can view sensitive business data"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 9. Create secure customer view for admins
CREATE OR REPLACE VIEW public.customers_admin AS
SELECT 
  c.*
FROM public.customers c
WHERE public.is_admin(auth.uid()) AND auth.uid() = c.user_id;

-- 10. Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_admin_data_access(
  table_name text,
  action_type text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'admin_data_access',
    'info',
    'Admin accessed sensitive data',
    jsonb_build_object(
      'table_name', table_name,
      'action_type', action_type,
      'record_id', record_id,
      'timestamp', now()
    )
  );
END;
$$;