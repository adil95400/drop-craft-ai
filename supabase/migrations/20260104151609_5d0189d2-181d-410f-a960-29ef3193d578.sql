-- SECURITY & GDPR AUDIT - Remaining fixes
-- (First part already applied, continuing from webhook_events)

-- 6. FIX: webhook_events - drop existing and recreate
DROP POLICY IF EXISTS "Users can view own webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.webhook_events;

CREATE POLICY "Service role can manage webhook events"
ON public.webhook_events FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own webhook events readonly"
ON public.webhook_events FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 7. GDPR: Add data retention and anonymization function
CREATE OR REPLACE FUNCTION public.anonymize_customer_data(customer_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = customer_id_param 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Customer not found or unauthorized';
  END IF;

  -- Anonymize customer data (GDPR right to erasure)
  UPDATE public.customers
  SET 
    first_name = 'ANONYMIZED',
    last_name = 'USER',
    email = 'anonymized_' || id || '@deleted.local',
    phone = NULL,
    address = NULL,
    address_line1 = NULL,
    address_line2 = NULL,
    city = NULL,
    state = NULL,
    postal_code = NULL,
    country = NULL,
    notes = NULL
  WHERE id = customer_id_param;

  -- Log the anonymization action
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, description, source)
  VALUES (auth.uid(), 'customer_data_anonymized', 'customer', customer_id_param::text, 'Customer data anonymized per GDPR request', 'system');

  RETURN TRUE;
END;
$$;

-- 8. GDPR: Add data export function for portability
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = auth.uid()),
    'customers_count', (SELECT COUNT(*) FROM public.customers WHERE user_id = auth.uid()),
    'products_count', (SELECT COUNT(*) FROM public.products WHERE user_id = auth.uid()),
    'orders_count', (SELECT COUNT(*) FROM public.orders WHERE user_id = auth.uid()),
    'exported_at', now(),
    'user_id', auth.uid()
  ) INTO result;
  
  -- Log the export
  INSERT INTO public.activity_logs (user_id, action, entity_type, description, source)
  VALUES (auth.uid(), 'user_data_exported', 'user', 'User data exported per GDPR request', 'system');
  
  RETURN result;
END;
$$;

-- 9. GDPR: Add consent tracking table
CREATE TABLE IF NOT EXISTS public.gdpr_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, consent_type)
);

ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
ON public.gdpr_consents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own consents"
ON public.gdpr_consents FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user_id ON public.gdpr_consents(user_id);

CREATE TRIGGER update_gdpr_consents_updated_at
BEFORE UPDATE ON public.gdpr_consents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. SECURITY: Add rate limiting tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate limiting"
ON public.rate_limit_tracking FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user ON public.rate_limit_tracking(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON public.rate_limit_tracking(ip_address, endpoint, window_start);

-- 11. SECURITY: Add security audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
ON public.security_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert security logs"
ON public.security_audit_log FOR INSERT
TO service_role
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON public.security_audit_log(created_at DESC);