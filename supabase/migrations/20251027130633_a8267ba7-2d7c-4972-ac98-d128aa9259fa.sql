-- Phase 3A: Nouvelles Marketplaces Integration Tables

-- Extension pour les connexions marketplace
CREATE TYPE marketplace_platform AS ENUM (
  'shopify',
  'woocommerce',
  'etsy',
  'cdiscount',
  'allegro',
  'manomano',
  'amazon',
  'ebay'
);

CREATE TYPE sync_direction AS ENUM ('push', 'pull', 'bidirectional');
CREATE TYPE sync_status AS ENUM ('idle', 'syncing', 'completed', 'failed', 'paused');

-- Table des connexions marketplace étendues
CREATE TABLE IF NOT EXISTS public.marketplace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform marketplace_platform NOT NULL,
  
  -- Credentials (encrypted)
  api_key TEXT,
  api_secret TEXT,
  shop_url TEXT,
  shop_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  sync_direction sync_direction DEFAULT 'bidirectional',
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  
  -- Status
  status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Statistics
  total_products_synced INTEGER DEFAULT 0,
  total_orders_synced INTEGER DEFAULT 0,
  total_sync_count INTEGER DEFAULT 0,
  failed_sync_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_platform UNIQUE(user_id, platform, shop_id)
);

-- Index pour performances
CREATE INDEX idx_marketplace_integrations_user ON public.marketplace_integrations(user_id);
CREATE INDEX idx_marketplace_integrations_platform ON public.marketplace_integrations(platform);
CREATE INDEX idx_marketplace_integrations_status ON public.marketplace_integrations(status);
CREATE INDEX idx_marketplace_integrations_next_sync ON public.marketplace_integrations(next_sync_at) WHERE auto_sync_enabled = true;

-- Table des jobs de synchronisation
CREATE TABLE IF NOT EXISTS public.marketplace_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.marketplace_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job details
  sync_type TEXT NOT NULL, -- 'products', 'orders', 'inventory', 'full'
  sync_direction sync_direction NOT NULL,
  status sync_status DEFAULT 'idle',
  
  -- Progress
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Results
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour jobs
CREATE INDEX idx_sync_jobs_integration ON public.marketplace_sync_jobs(integration_id);
CREATE INDEX idx_sync_jobs_user ON public.marketplace_sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON public.marketplace_sync_jobs(status);
CREATE INDEX idx_sync_jobs_created ON public.marketplace_sync_jobs(created_at DESC);

-- Table de mapping des produits
CREATE TABLE IF NOT EXISTS public.marketplace_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.marketplace_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product IDs
  local_product_id UUID, -- Reference to products table
  external_product_id TEXT NOT NULL,
  external_variant_id TEXT,
  
  -- Sync info
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active',
  
  -- Metadata
  external_data JSONB DEFAULT '{}'::jsonb,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_external_product UNIQUE(integration_id, external_product_id)
);

-- Index pour mappings
CREATE INDEX idx_product_mappings_integration ON public.marketplace_product_mappings(integration_id);
CREATE INDEX idx_product_mappings_local ON public.marketplace_product_mappings(local_product_id);
CREATE INDEX idx_product_mappings_external ON public.marketplace_product_mappings(external_product_id);

-- Table des webhooks marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.marketplace_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Webhook details
  webhook_id TEXT,
  event_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  -- Stats
  total_calls INTEGER DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour webhooks
CREATE INDEX idx_webhooks_integration ON public.marketplace_webhooks(integration_id);
CREATE INDEX idx_webhooks_active ON public.marketplace_webhooks(is_active);

-- Table des logs d'événements marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.marketplace_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL, -- 'webhook', 'sync', 'manual', 'api'
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  
  -- Data
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour event logs
CREATE INDEX idx_event_logs_integration ON public.marketplace_event_logs(integration_id);
CREATE INDEX idx_event_logs_user ON public.marketplace_event_logs(user_id);
CREATE INDEX idx_event_logs_severity ON public.marketplace_event_logs(severity);
CREATE INDEX idx_event_logs_created ON public.marketplace_event_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.marketplace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_event_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour marketplace_integrations
CREATE POLICY "Users can view their own integrations"
  ON public.marketplace_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON public.marketplace_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.marketplace_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.marketplace_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour marketplace_sync_jobs
CREATE POLICY "Users can view their own sync jobs"
  ON public.marketplace_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync jobs"
  ON public.marketplace_sync_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync jobs"
  ON public.marketplace_sync_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies pour marketplace_product_mappings
CREATE POLICY "Users can view their own product mappings"
  ON public.marketplace_product_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own product mappings"
  ON public.marketplace_product_mappings FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies pour marketplace_webhooks
CREATE POLICY "Users can view their own webhooks"
  ON public.marketplace_webhooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own webhooks"
  ON public.marketplace_webhooks FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies pour marketplace_event_logs
CREATE POLICY "Users can view their own event logs"
  ON public.marketplace_event_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event logs"
  ON public.marketplace_event_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers pour updated_at
CREATE TRIGGER update_marketplace_integrations_updated_at
  BEFORE UPDATE ON public.marketplace_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE TRIGGER update_marketplace_sync_jobs_updated_at
  BEFORE UPDATE ON public.marketplace_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE TRIGGER update_marketplace_product_mappings_updated_at
  BEFORE UPDATE ON public.marketplace_product_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE TRIGGER update_marketplace_webhooks_updated_at
  BEFORE UPDATE ON public.marketplace_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

-- Function pour calculer le prochain sync
CREATE OR REPLACE FUNCTION public.calculate_next_sync(integration_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  frequency_minutes INTEGER;
  result TIMESTAMPTZ;
BEGIN
  SELECT sync_frequency_minutes INTO frequency_minutes
  FROM public.marketplace_integrations
  WHERE id = integration_id;
  
  result := now() + (frequency_minutes || ' minutes')::INTERVAL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function pour logger les événements
CREATE OR REPLACE FUNCTION public.log_marketplace_event(
  p_integration_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.marketplace_event_logs (
    integration_id,
    user_id,
    event_type,
    event_source,
    severity,
    title,
    message,
    data
  ) VALUES (
    p_integration_id,
    p_user_id,
    p_event_type,
    'api',
    p_severity,
    p_title,
    p_message,
    p_data
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;