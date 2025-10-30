-- Table pour les synchronisations automatiques
CREATE TABLE IF NOT EXISTS public.platform_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('inventory', 'prices', 'orders', 'all')),
  sync_frequency TEXT NOT NULL CHECK (sync_frequency IN ('realtime', '5min', '15min', '30min', '1hour', '6hour', '24hour')),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les logs de synchronisation
CREATE TABLE IF NOT EXISTS public.platform_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'running')),
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_details JSONB DEFAULT '{}'::jsonb,
  sync_details JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les métriques de performance par plateforme
CREATE TABLE IF NOT EXISTS public.platform_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL,
  total_sales NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_fees NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  avg_order_value NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  additional_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform, metric_date)
);

-- Table pour l'optimisation IA du contenu
CREATE TABLE IF NOT EXISTS public.content_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  platform TEXT NOT NULL,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('title', 'description', 'keywords', 'full')),
  original_content JSONB NOT NULL,
  optimized_content JSONB NOT NULL,
  optimization_score NUMERIC,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  performance_before JSONB DEFAULT '{}'::jsonb,
  performance_after JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les ordres récupérés des marketplaces
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  external_order_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  fees NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL,
  payment_status TEXT,
  fulfillment_status TEXT,
  tracking_number TEXT,
  carrier TEXT,
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform, external_order_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_platform_sync_configs_user_platform ON public.platform_sync_configs(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_user_platform ON public.platform_sync_logs(user_id, platform, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_performance_user_platform_date ON public.platform_performance_metrics(user_id, platform, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_content_optimizations_user_product ON public.content_optimizations(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user_platform ON public.marketplace_orders(user_id, platform, order_date DESC);

-- Enable RLS
ALTER TABLE public.platform_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own sync configs" ON public.platform_sync_configs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own sync logs" ON public.platform_sync_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own performance metrics" ON public.platform_performance_metrics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own content optimizations" ON public.content_optimizations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own marketplace orders" ON public.marketplace_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_platform_sync_configs_updated_at
  BEFORE UPDATE ON public.platform_sync_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_optimizations_updated_at
  BEFORE UPDATE ON public.content_optimizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();