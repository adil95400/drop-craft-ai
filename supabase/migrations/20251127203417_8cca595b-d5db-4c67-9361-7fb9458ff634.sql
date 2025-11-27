-- MODULE 1: STOCK LIVE & REPRICING DYNAMIQUE

DROP TABLE IF EXISTS public.repricing_queue CASCADE;
DROP TABLE IF EXISTS public.stock_alerts CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.pricing_rules CASCADE;
DROP TABLE IF EXISTS public.stock_history CASCADE;
DROP TABLE IF EXISTS public.stock_sync_configs CASCADE;

CREATE TABLE public.stock_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  low_stock_threshold INTEGER DEFAULT 10,
  out_of_stock_action TEXT DEFAULT 'disable',
  total_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_reason TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  sync_config_id UUID REFERENCES public.stock_sync_configs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  applies_to TEXT DEFAULT 'all',
  category_filter TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_ids UUID[],
  strategy TEXT NOT NULL,
  fixed_margin_percent DECIMAL(5,2),
  target_margin_percent DECIMAL(5,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  competitor_price_offset DECIMAL(10,2),
  competitor_price_offset_percent DECIMAL(5,2),
  round_to DECIMAL(4,2) DEFAULT 0.99,
  min_margin_percent DECIMAL(5,2) DEFAULT 15.00,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  products_affected INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  total_applications INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL,
  previous_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  price_change_percent DECIMAL(5,2),
  change_reason TEXT NOT NULL,
  pricing_rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE SET NULL,
  previous_cost DECIMAL(10,2),
  new_cost DECIMAL(10,2),
  previous_margin_percent DECIMAL(5,2),
  new_margin_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL,
  product_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  message TEXT NOT NULL,
  alert_status TEXT DEFAULT 'active',
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  current_stock INTEGER,
  threshold INTEGER,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.repricing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  job_status TEXT DEFAULT 'pending',
  pricing_rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE CASCADE,
  product_ids UUID[],
  apply_to_all BOOLEAN DEFAULT false,
  total_products INTEGER DEFAULT 0,
  processed_products INTEGER DEFAULT 0,
  successful_updates INTEGER DEFAULT 0,
  failed_updates INTEGER DEFAULT 0,
  results JSONB,
  errors TEXT[],
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_sync_user ON public.stock_sync_configs(user_id, supplier_id);
CREATE INDEX idx_stock_history_prod ON public.stock_history(product_id);
CREATE INDEX idx_pricing_rules_user ON public.pricing_rules(user_id);
CREATE INDEX idx_price_history_prod ON public.price_history(product_id);
CREATE INDEX idx_stock_alerts_user ON public.stock_alerts(user_id);
CREATE INDEX idx_repricing_queue_user ON public.repricing_queue(user_id);

ALTER TABLE public.stock_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repricing_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_sync_policy" ON public.stock_sync_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "stock_history_policy" ON public.stock_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pricing_rules_policy" ON public.pricing_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "price_history_policy" ON public.price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stock_alerts_policy" ON public.stock_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "repricing_queue_policy" ON public.repricing_queue FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_sync_ts BEFORE UPDATE ON public.stock_sync_configs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_rules_ts BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_alerts_ts BEFORE UPDATE ON public.stock_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_queue_ts BEFORE UPDATE ON public.repricing_queue FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();