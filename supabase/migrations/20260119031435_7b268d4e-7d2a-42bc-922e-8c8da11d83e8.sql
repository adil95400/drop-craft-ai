-- Table for alert configurations
CREATE TABLE IF NOT EXISTS public.alert_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  threshold_value NUMERIC,
  threshold_percent NUMERIC,
  channels TEXT[] DEFAULT ARRAY['push'],
  priority INTEGER DEFAULT 5,
  conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, alert_type)
);

-- Table for push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB,
  platform TEXT DEFAULT 'web',
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for push notification logs
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.push_subscriptions(id),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their alert configs" ON public.alert_configurations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their push logs" ON public.push_notification_logs FOR SELECT USING (auth.uid() = user_id);