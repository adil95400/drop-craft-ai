-- API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  key_prefix TEXT,
  is_active BOOLEAN DEFAULT true,
  scopes TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own api keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- Add ip_address to api_logs
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- Add status to advanced_reports
ALTER TABLE public.advanced_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';

-- Generate API key function
CREATE OR REPLACE FUNCTION public.generate_api_key(key_name TEXT, key_scopes TEXT[] DEFAULT '{}')
RETURNS TEXT AS $$
DECLARE
  new_key TEXT;
  key_prefix TEXT;
BEGIN
  key_prefix := 'sk_' || substr(md5(random()::text), 1, 8);
  new_key := key_prefix || '_' || encode(gen_random_bytes(24), 'hex');
  
  INSERT INTO public.api_keys (user_id, name, key, key_prefix, scopes)
  VALUES (auth.uid(), key_name, new_key, key_prefix, key_scopes);
  
  RETURN new_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Automation Rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own automation rules" ON public.automation_rules FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scheduled Tasks table
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  schedule TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scheduled tasks" ON public.scheduled_tasks FOR ALL USING (auth.uid() = user_id);

-- Fulfilment Rules table
CREATE TABLE IF NOT EXISTS public.fulfilment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fulfilment_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own fulfilment rules" ON public.fulfilment_rules FOR ALL USING (auth.uid() = user_id);