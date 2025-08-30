-- Fixed Enhanced RLS policies and security audit system

-- Create comprehensive audit log table (security_events already exists, just ensure proper structure)

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

-- Create function to cleanup old security events
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;