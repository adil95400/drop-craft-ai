-- Enhanced RLS policies and security audit system

-- Create comprehensive audit log table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "security_events_admin_only" ON public.security_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create webhook events table for store synchronization
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'shopify', 'woocommerce', etc.
  event_type TEXT NOT NULL,
  webhook_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on webhook events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own webhook events
CREATE POLICY "webhook_events_user_own" ON public.webhook_events
FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all webhook events
CREATE POLICY "webhook_events_service_role" ON public.webhook_events
FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Create automation jobs table
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  job_type TEXT NOT NULL, -- 'sync_inventory', 'update_prices', 'import_catalog', etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  schedule_type TEXT DEFAULT 'manual' CHECK (schedule_type IN ('manual', 'hourly', 'daily', 'weekly')),
  schedule_config JSONB DEFAULT '{}',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on automation jobs
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can manage their own automation jobs
CREATE POLICY "automation_jobs_user_own" ON public.automation_jobs
FOR ALL USING (auth.uid() = user_id);

-- Create audit triggers for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any changes to products, orders, or integrations
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    TG_OP || '_' || TG_TABLE_NAME,
    'info',
    'Sensitive data operation performed',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.imported_products
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER audit_integrations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- Create function to cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhanced inventory sync table
CREATE TABLE IF NOT EXISTS public.inventory_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID,
  variant_id UUID,
  integration_id UUID REFERENCES public.integrations(id),
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'stock', 'price', 'product'
  old_value JSONB,
  new_value JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on inventory sync log
ALTER TABLE public.inventory_sync_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own sync logs
CREATE POLICY "inventory_sync_log_user_own" ON public.inventory_sync_log
FOR ALL USING (auth.uid() = user_id);