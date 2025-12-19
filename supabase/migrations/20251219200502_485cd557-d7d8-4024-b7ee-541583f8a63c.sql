-- Create missing tables for automation and webhooks

-- 1. Webhook subscriptions table
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  secret TEXT,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhook subscriptions"
ON public.webhook_subscriptions FOR ALL
USING (auth.uid() = user_id);

-- 2. Webhook delivery logs table
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook logs"
ON public.webhook_delivery_logs FOR SELECT
USING (auth.uid() = user_id);

-- 3. Price/stock monitoring table
CREATE TABLE IF NOT EXISTS public.price_stock_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_url TEXT,
  current_price NUMERIC,
  previous_price NUMERIC,
  price_change_percent NUMERIC,
  current_stock INTEGER,
  previous_stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  alert_threshold NUMERIC DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.price_stock_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own monitoring"
ON public.price_stock_monitoring FOR ALL
USING (auth.uid() = user_id);

-- 4. Automation workflows table
CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflows"
ON public.automation_workflows FOR ALL
USING (auth.uid() = user_id);

-- 5. Automation triggers table
CREATE TABLE IF NOT EXISTS public.automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own triggers"
ON public.automation_triggers FOR ALL
USING (auth.uid() = user_id);

-- 6. Automation actions table
CREATE TABLE IF NOT EXISTS public.automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES public.automation_triggers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  execution_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own actions"
ON public.automation_actions FOR ALL
USING (auth.uid() = user_id);

-- 7. Automation execution logs table
CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES public.automation_triggers(id) ON DELETE SET NULL,
  action_id UUID REFERENCES public.automation_actions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own execution logs"
ON public.automation_execution_logs FOR SELECT
USING (auth.uid() = user_id);

-- Add missing columns to api_keys
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS rate_limit_window TEXT DEFAULT '1h';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS allowed_ips TEXT[];
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- Create RPC functions for admin checks
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_token_revoked(token_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT false
$$;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_webhook_subscriptions_updated_at
BEFORE UPDATE ON public.webhook_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_stock_monitoring_updated_at
BEFORE UPDATE ON public.price_stock_monitoring
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
BEFORE UPDATE ON public.automation_workflows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_triggers_updated_at
BEFORE UPDATE ON public.automation_triggers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_actions_updated_at
BEFORE UPDATE ON public.automation_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();