-- Create webhooks table for Stripe events
CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create quotas tracking table
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_key TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, quota_key)
);

-- Create plans limits table
CREATE TABLE IF NOT EXISTS public.plans_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan plan_type NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL, -- -1 for unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plan, limit_key)
);

-- Insert default limits for each plan
INSERT INTO public.plans_limits (plan, limit_key, limit_value) VALUES
-- Standard plan limits
('standard', 'monthly_imports', 100),
('standard', 'products_catalog', 1000),
('standard', 'integrations', 2),
('standard', 'api_calls_daily', 1000),
('standard', 'storage_mb', 500),
-- Pro plan limits  
('pro', 'monthly_imports', 1000),
('pro', 'products_catalog', 10000),
('pro', 'integrations', 10),
('pro', 'api_calls_daily', 10000),
('pro', 'storage_mb', 5000),
('pro', 'ai_operations_monthly', 1000),
-- Ultra Pro plan limits
('ultra_pro', 'monthly_imports', -1),
('ultra_pro', 'products_catalog', -1),
('ultra_pro', 'integrations', -1),
('ultra_pro', 'api_calls_daily', -1),
('ultra_pro', 'storage_mb', -1),
('ultra_pro', 'ai_operations_monthly', -1),
('ultra_pro', 'bulk_operations_monthly', -1)
ON CONFLICT (plan, limit_key) DO NOTHING;

-- Create platform integrations table for all channels
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_type TEXT NOT NULL, -- 'marketplace', 'ecommerce', 'social', 'supplier'
  platform_name TEXT NOT NULL,
  platform_config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}', -- encrypted
  is_active BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'disconnected',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform_name)
);

-- Add RLS policies
ALTER TABLE public.stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

-- Webhook policies (service role only)
CREATE POLICY "Service role can manage webhooks" ON public.stripe_webhooks
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Quota policies
CREATE POLICY "Users can view their quotas" ON public.user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage quotas" ON public.user_quotas
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Platform integration policies
CREATE POLICY "Users can manage their integrations" ON public.platform_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON public.stripe_webhooks(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON public.stripe_webhooks(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_key ON public.user_quotas(user_id, quota_key);
CREATE INDEX IF NOT EXISTS idx_user_quotas_reset_date ON public.user_quotas(reset_date);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_user ON public.platform_integrations(user_id, platform_name);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_active ON public.platform_integrations(is_active, last_sync_at);