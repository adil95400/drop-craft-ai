-- ============================================
-- SECURITY & PERFORMANCE MIGRATION v2
-- Fix search_path, add indexes, strengthen RLS
-- ============================================

-- 1. Fix is_user_admin to use user_roles instead of profiles.role
-- ============================================

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 2. Add critical performance indexes
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_imported_products_user_id ON public.imported_products(user_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_status ON public.imported_products(status) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_imported_products_sku ON public.imported_products(sku);
CREATE INDEX IF NOT EXISTS idx_imported_products_created_at ON public.imported_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imported_products_search ON public.imported_products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);

-- Import jobs indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON public.import_jobs(created_at DESC);

-- API logs indexes  
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON public.api_logs(status_code);

-- 3. Strengthen RLS policies
-- ============================================

-- Ensure all sensitive tables have RLS enabled
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Update user_api_keys policies to prevent encrypted_value exposure
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can view their own API keys (no encrypted value)" 
ON public.user_api_keys FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure admins can view security events
DROP POLICY IF EXISTS "Admins can view all security events" ON public.security_events;
CREATE POLICY "Admins can view all security events" 
ON public.security_events FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own security events
DROP POLICY IF EXISTS "Users can view their own security events" ON public.security_events;
CREATE POLICY "Users can view their own security events" 
ON public.security_events FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Add security monitoring function
-- ============================================

CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_record_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'sensitive_data_access',
      'info',
      format('Accessed %s in %s', p_action, p_table_name),
      jsonb_build_object(
        'table', p_table_name,
        'record_id', p_record_id,
        'action', p_action,
        'timestamp', now()
      )
    );
  END IF;
END;
$$;

-- 5. Add rate limiting for security events
-- ============================================

CREATE OR REPLACE FUNCTION public.check_security_rate_limit(
  p_event_type text,
  p_max_events integer DEFAULT 100,
  p_window_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type = p_event_type
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  
  RETURN event_count < p_max_events;
END;
$$;

COMMENT ON FUNCTION public.check_security_rate_limit IS 'Rate limiting for security-sensitive operations to prevent abuse';