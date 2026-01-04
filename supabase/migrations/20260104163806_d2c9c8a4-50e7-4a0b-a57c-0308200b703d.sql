-- Tables pour la synchronisation multi-marketplace avancée
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  credentials_encrypted TEXT,
  shop_domain VARCHAR(255),
  api_version VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(20) DEFAULT 'hourly',
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20),
  last_sync_error TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_product_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID,
  connection_id UUID,
  external_product_id VARCHAR(255),
  external_variant_id VARCHAR(255),
  external_sku VARCHAR(255),
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  field_mappings JSONB DEFAULT '{}',
  price_override DECIMAL(10,2),
  stock_override INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID,
  product_id UUID,
  sync_type VARCHAR(50) NOT NULL,
  sync_direction VARCHAR(20) DEFAULT 'push',
  priority INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'pending',
  payload JSONB,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID,
  product_id UUID,
  conflict_type VARCHAR(50) NOT NULL,
  local_value JSONB,
  remote_value JSONB,
  resolution VARCHAR(20),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tables pour les campagnes publicitaires dynamiques
CREATE TABLE IF NOT EXISTS public.dynamic_ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  platforms JSONB DEFAULT '[]',
  targeting_rules JSONB DEFAULT '{}',
  budget_daily DECIMAL(10,2),
  budget_total DECIMAL(10,2),
  budget_spent DECIMAL(10,2) DEFAULT 0,
  bid_strategy VARCHAR(50) DEFAULT 'auto',
  bid_amount DECIMAL(10,2),
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  product_filter JSONB DEFAULT '{}',
  creative_template JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_product_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID,
  name VARCHAR(255) NOT NULL,
  feed_type VARCHAR(50) NOT NULL,
  feed_url TEXT,
  product_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ,
  generation_status VARCHAR(20) DEFAULT 'pending',
  validation_errors JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID,
  name VARCHAR(255) NOT NULL,
  creative_type VARCHAR(50) NOT NULL,
  template_data JSONB DEFAULT '{}',
  generated_assets JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft',
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID,
  date DATE NOT NULL,
  platform VARCHAR(50) NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(10,4),
  ctr DECIMAL(10,4),
  cpc DECIMAL(10,4),
  cpm DECIMAL(10,4),
  additional_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_mkt_connections_user ON public.marketplace_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_mkt_connections_platform ON public.marketplace_connections(platform);
CREATE INDEX IF NOT EXISTS idx_mkt_mappings_product ON public.marketplace_product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_mkt_mappings_connection ON public.marketplace_product_mappings(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dyn_campaigns_user ON public.dynamic_ad_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_perf_date ON public.campaign_performance(campaign_id, date);

-- Enable RLS
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_product_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own marketplace connections"
ON public.marketplace_connections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own product mappings"
ON public.marketplace_product_mappings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sync queue"
ON public.sync_queue FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sync conflicts"
ON public.sync_conflicts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own dynamic campaigns"
ON public.dynamic_ad_campaigns FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own product feeds"
ON public.campaign_product_feeds FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own creatives"
ON public.campaign_creatives FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own campaign performance"
ON public.campaign_performance FOR ALL USING (auth.uid() = user_id);