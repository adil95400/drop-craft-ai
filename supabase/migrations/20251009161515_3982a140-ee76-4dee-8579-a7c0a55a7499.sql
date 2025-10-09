-- Create supplier networks table for pre-integrated suppliers
CREATE TABLE IF NOT EXISTS public.supplier_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  network_id TEXT NOT NULL, -- 'aliexpress', 'amazon', 'walmart', 'spocket', etc.
  network_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  connection_status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  api_credentials JSONB DEFAULT '{}'::jsonb,
  sync_config JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  total_products INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, network_id)
);

-- Create supplier catalog table for pre-integrated products
CREATE TABLE IF NOT EXISTS public.supplier_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stock_quantity INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock',
  images JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  supplier_info JSONB DEFAULT '{}'::jsonb,
  shipping_info JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(network_id, external_product_id)
);

-- Create quick import history table
CREATE TABLE IF NOT EXISTS public.quick_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  catalog_product_id UUID REFERENCES public.supplier_catalog(id),
  imported_product_id UUID,
  import_status TEXT DEFAULT 'success',
  import_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order fulfillment rules table
CREATE TABLE IF NOT EXISTS public.order_fulfillment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  fulfillment_actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  supplier_network_id UUID REFERENCES public.supplier_networks(id),
  auto_place_order BOOLEAN DEFAULT false,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create order fulfillment logs table
CREATE TABLE IF NOT EXISTS public.order_fulfillment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID,
  rule_id UUID REFERENCES public.order_fulfillment_rules(id),
  status TEXT NOT NULL DEFAULT 'pending',
  supplier_order_id TEXT,
  fulfillment_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  tracking_number TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create price stock monitoring table
CREATE TABLE IF NOT EXISTS public.price_stock_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID,
  catalog_product_id UUID REFERENCES public.supplier_catalog(id),
  monitoring_enabled BOOLEAN DEFAULT true,
  check_frequency_minutes INTEGER DEFAULT 60,
  price_change_threshold NUMERIC DEFAULT 5.0,
  stock_alert_threshold INTEGER DEFAULT 10,
  current_supplier_price NUMERIC,
  current_supplier_stock INTEGER,
  last_supplier_price NUMERIC,
  last_supplier_stock INTEGER,
  last_checked_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT false,
  auto_adjust_price BOOLEAN DEFAULT false,
  price_adjustment_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create price stock alerts table
CREATE TABLE IF NOT EXISTS public.price_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  monitoring_id UUID REFERENCES public.price_stock_monitoring(id),
  alert_type TEXT NOT NULL, -- 'price_change', 'stock_low', 'out_of_stock'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  alert_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fulfillment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fulfillment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_stock_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplier_networks
CREATE POLICY "Users manage own supplier networks"
  ON public.supplier_networks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for supplier_catalog (publicly readable, admin writable)
CREATE POLICY "Anyone can view supplier catalog"
  ON public.supplier_catalog
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage catalog"
  ON public.supplier_catalog
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for quick_import_history
CREATE POLICY "Users manage own import history"
  ON public.quick_import_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_fulfillment_rules
CREATE POLICY "Users manage own fulfillment rules"
  ON public.order_fulfillment_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_fulfillment_logs
CREATE POLICY "Users view own fulfillment logs"
  ON public.order_fulfillment_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for price_stock_monitoring
CREATE POLICY "Users manage own monitoring"
  ON public.price_stock_monitoring
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for price_stock_alerts
CREATE POLICY "Users manage own alerts"
  ON public.price_stock_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_supplier_networks_user ON public.supplier_networks(user_id);
CREATE INDEX idx_supplier_catalog_network ON public.supplier_catalog(network_id);
CREATE INDEX idx_supplier_catalog_category ON public.supplier_catalog(category);
CREATE INDEX idx_quick_import_user ON public.quick_import_history(user_id);
CREATE INDEX idx_fulfillment_rules_user ON public.order_fulfillment_rules(user_id);
CREATE INDEX idx_fulfillment_logs_user ON public.order_fulfillment_logs(user_id);
CREATE INDEX idx_price_monitoring_user ON public.price_stock_monitoring(user_id);
CREATE INDEX idx_price_alerts_user ON public.price_stock_alerts(user_id);

-- Seed some sample supplier networks
INSERT INTO public.supplier_catalog (network_id, external_product_id, title, description, price, cost_price, currency, stock_quantity, images, category, rating, reviews_count, is_trending)
VALUES 
  ('aliexpress', 'AE-001', 'Premium Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 89.99, 45.00, 'USD', 500, '["https://example.com/headphones.jpg"]'::jsonb, 'Electronics', 4.5, 1250, true),
  ('aliexpress', 'AE-002', 'Smart Watch Pro', 'Advanced fitness tracking smartwatch', 129.99, 65.00, 'USD', 300, '["https://example.com/watch.jpg"]'::jsonb, 'Electronics', 4.7, 890, true),
  ('amazon', 'AMZ-001', 'Yoga Mat Premium', 'Eco-friendly yoga mat with carrying strap', 39.99, 18.00, 'USD', 1000, '["https://example.com/yogamat.jpg"]'::jsonb, 'Sports', 4.3, 2100, false),
  ('spocket', 'SPK-001', 'Leather Wallet', 'Genuine leather minimalist wallet', 49.99, 22.00, 'USD', 150, '["https://example.com/wallet.jpg"]'::jsonb, 'Fashion', 4.6, 450, true),
  ('spocket', 'SPK-002', 'Stainless Steel Water Bottle', 'Insulated water bottle 24oz', 29.99, 12.00, 'USD', 800, '["https://example.com/bottle.jpg"]'::jsonb, 'Home', 4.8, 3200, true);