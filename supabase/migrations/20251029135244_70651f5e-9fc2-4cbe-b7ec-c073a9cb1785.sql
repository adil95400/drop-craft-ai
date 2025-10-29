-- Amélioration du système API

-- Ajouter colonnes manquantes à api_keys
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 1000;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS rate_limit_window TEXT DEFAULT '1h';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS allowed_ips TEXT[];
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ARRAY['read:products', 'write:products', 'read:orders', 'write:orders'];
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS last_used_ip TEXT;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development'));

-- Table pour les logs API
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_body JSONB,
  response_body JSONB,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_api_key ON public.api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user ON public.api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON public.api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_logs(endpoint);

-- Table pour rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(api_key_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window ON public.api_rate_limits(api_key_id, window_start);

-- Table pour webhooks sortants
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  custom_headers JSONB,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_user ON public.webhook_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subs_active ON public.webhook_subscriptions(is_active);

-- Table pour logs des webhooks
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription ON public.webhook_delivery_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON public.webhook_delivery_logs(created_at);

-- Table pour analytics API
CREATE TABLE IF NOT EXISTS public.api_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  unique_endpoints INTEGER,
  bandwidth_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_api_analytics_user_date ON public.api_analytics(user_id, date);

-- RLS Policies
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API logs" ON public.api_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own rate limits" ON public.api_rate_limits
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.api_keys WHERE id = api_key_id)
  );

CREATE POLICY "Users can manage their webhook subscriptions" ON public.webhook_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their webhook logs" ON public.webhook_delivery_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.webhook_subscriptions WHERE id = subscription_id)
  );

CREATE POLICY "Users can view their API analytics" ON public.api_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Fonction pour nettoyer les vieux logs
CREATE OR REPLACE FUNCTION public.cleanup_old_api_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.api_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.webhook_delivery_logs WHERE created_at < now() - interval '30 days';
END;
$$;

-- Fonction pour vérifier le rate limit
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_api_key_id UUID,
  p_limit INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := date_trunc('minute', now()) - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.api_rate_limits
  WHERE api_key_id = p_api_key_id
    AND window_start >= v_window_start;
  
  RETURN v_count < p_limit;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_webhook_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER webhook_subscriptions_updated_at
  BEFORE UPDATE ON public.webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webhook_updated_at();