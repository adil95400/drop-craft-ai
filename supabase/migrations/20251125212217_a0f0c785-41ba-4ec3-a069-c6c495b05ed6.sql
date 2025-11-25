-- ============================================
-- SHOPOPTI SUPPLIER ECOSYSTEM - FULL IMPLEMENTATION
-- Professional supplier management & auto-fulfillment system
-- ============================================

-- Drop existing indexes first
DROP INDEX IF EXISTS public.idx_orders_status CASCADE;
DROP INDEX IF EXISTS public.idx_orders_user CASCADE;
DROP INDEX IF EXISTS public.idx_orders_supplier CASCADE;
DROP INDEX IF EXISTS public.idx_orders_shop_order CASCADE;
DROP INDEX IF EXISTS public.idx_orders_placed_at CASCADE;

-- Drop existing conflicting tables
DROP TABLE IF EXISTS public.supplier_orders CASCADE;
DROP TABLE IF EXISTS public.supplier_pricing_rules CASCADE;
DROP TABLE IF EXISTS public.supplier_credentials_vault CASCADE;
DROP TABLE IF EXISTS public.supplier_analytics CASCADE;
DROP TABLE IF EXISTS public.supplier_webhooks CASCADE;

-- ============================================
-- 1. SUPPLIER CREDENTIALS VAULT (Encrypted storage)
-- ============================================
CREATE TABLE public.supplier_credentials_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  -- Encrypted credentials
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  oauth_data JSONB,
  
  -- Connection metadata
  connection_type TEXT NOT NULL CHECK (connection_type IN ('api', 'oauth', 'manual', 'csv', 'xml', 'ftp')),
  connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'active', 'error', 'expired', 'revoked')),
  
  -- Validation & health
  last_validation_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Rate limiting
  rate_limit_requests_per_minute INTEGER DEFAULT 30,
  rate_limit_requests_per_hour INTEGER DEFAULT 1000,
  last_request_at TIMESTAMPTZ,
  requests_today INTEGER DEFAULT 0,
  
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, supplier_id)
);

CREATE INDEX idx_supplier_credentials_user_supplier ON public.supplier_credentials_vault(user_id, supplier_id);
CREATE INDEX idx_supplier_credentials_status ON public.supplier_credentials_vault(connection_status) WHERE connection_status = 'active';

ALTER TABLE public.supplier_credentials_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own supplier credentials"
  ON public.supplier_credentials_vault
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. SUPPLIER PRICING RULES (Dynamic pricing)
-- ============================================
CREATE TABLE public.supplier_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('fixed_markup', 'percentage_markup', 'target_margin', 'dynamic', 'tiered')),
  
  fixed_markup_amount DECIMAL(10, 2),
  percentage_markup DECIMAL(5, 2),
  
  target_margin_percent DECIMAL(5, 2),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  
  price_tiers JSONB,
  category_overrides JSONB,
  
  auto_update_enabled BOOLEAN DEFAULT true,
  update_frequency TEXT DEFAULT 'daily' CHECK (update_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  last_update_at TIMESTAMPTZ,
  
  match_competitor_prices BOOLEAN DEFAULT false,
  competitor_price_adjustment DECIMAL(5, 2),
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, supplier_id, pricing_type)
);

CREATE INDEX idx_supplier_pricing_user_supplier ON public.supplier_pricing_rules(user_id, supplier_id);
CREATE INDEX idx_supplier_pricing_active ON public.supplier_pricing_rules(is_active) WHERE is_active = true;

ALTER TABLE public.supplier_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pricing rules"
  ON public.supplier_pricing_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. SUPPLIER ORDERS (Auto-fulfillment)
-- ============================================
CREATE TABLE public.supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  
  shop_order_id TEXT NOT NULL,
  supplier_order_id TEXT,
  external_order_number TEXT,
  
  line_items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  
  customer_email TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  
  fulfillment_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  
  placed_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  cost_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2),
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (selling_price - cost_price) STORED,
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplier_orders_user ON public.supplier_orders(user_id);
CREATE INDEX idx_supplier_orders_supplier ON public.supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_shop_order ON public.supplier_orders(shop_order_id);
CREATE INDEX idx_supplier_orders_status ON public.supplier_orders(fulfillment_status);
CREATE INDEX idx_supplier_orders_placed_at ON public.supplier_orders(placed_at DESC);

ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own supplier orders"
  ON public.supplier_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System creates supplier orders"
  ON public.supplier_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own supplier orders"
  ON public.supplier_orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. SUPPLIER ANALYTICS (Real-time metrics)
-- ============================================
CREATE TABLE public.supplier_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  out_of_stock_products INTEGER DEFAULT 0,
  
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  failed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_cost DECIMAL(12, 2) DEFAULT 0,
  total_profit DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  
  success_rate DECIMAL(5, 2) DEFAULT 0,
  average_fulfillment_time_hours DECIMAL(8, 2),
  average_delivery_time_days DECIMAL(6, 2),
  
  api_calls_count INTEGER DEFAULT 0,
  api_errors_count INTEGER DEFAULT 0,
  api_success_rate DECIMAL(5, 2) DEFAULT 100,
  average_response_time_ms INTEGER,
  
  last_inventory_sync_at TIMESTAMPTZ,
  last_price_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, supplier_id, date)
);

CREATE INDEX idx_supplier_analytics_user_supplier ON public.supplier_analytics(user_id, supplier_id);
CREATE INDEX idx_supplier_analytics_date ON public.supplier_analytics(date DESC);

ALTER TABLE public.supplier_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own supplier analytics"
  ON public.supplier_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System updates supplier analytics"
  ON public.supplier_analytics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. SUPPLIER WEBHOOKS
-- ============================================
CREATE TABLE public.supplier_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  
  events TEXT[] NOT NULL DEFAULT ARRAY['order.created', 'order.updated', 'product.updated', 'inventory.updated'],
  
  is_active BOOLEAN DEFAULT true,
  
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplier_webhooks_user_supplier ON public.supplier_webhooks(user_id, supplier_id);
CREATE INDEX idx_supplier_webhooks_active ON public.supplier_webhooks(is_active) WHERE is_active = true;

ALTER TABLE public.supplier_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own supplier webhooks"
  ON public.supplier_webhooks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_supplier_ecosystem_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_supplier_credentials_timestamp
  BEFORE UPDATE ON public.supplier_credentials_vault
  FOR EACH ROW EXECUTE FUNCTION update_supplier_ecosystem_timestamp();

CREATE TRIGGER update_supplier_pricing_timestamp
  BEFORE UPDATE ON public.supplier_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_supplier_ecosystem_timestamp();

CREATE TRIGGER update_supplier_orders_timestamp
  BEFORE UPDATE ON public.supplier_orders
  FOR EACH ROW EXECUTE FUNCTION update_supplier_ecosystem_timestamp();

CREATE TRIGGER update_supplier_analytics_timestamp
  BEFORE UPDATE ON public.supplier_analytics
  FOR EACH ROW EXECUTE FUNCTION update_supplier_ecosystem_timestamp();

CREATE TRIGGER update_supplier_webhooks_timestamp
  BEFORE UPDATE ON public.supplier_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_supplier_ecosystem_timestamp();

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION get_supplier_health_score(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_success_rate DECIMAL;
  v_api_health DECIMAL;
  v_order_count INTEGER;
BEGIN
  SELECT 
    COALESCE(AVG(success_rate), 0),
    COALESCE(AVG(api_success_rate), 100),
    COALESCE(SUM(total_orders), 0)
  INTO v_success_rate, v_api_health, v_order_count
  FROM supplier_analytics
  WHERE supplier_id = p_supplier_id 
    AND user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '30 days';
  
  v_result := jsonb_build_object(
    'overall_score', (v_success_rate * 0.6 + v_api_health * 0.4)::decimal(5,2),
    'success_rate', v_success_rate,
    'api_health', v_api_health,
    'order_count_30d', v_order_count,
    'status', CASE
      WHEN v_success_rate >= 95 THEN 'excellent'
      WHEN v_success_rate >= 85 THEN 'good'
      WHEN v_success_rate >= 70 THEN 'fair'
      ELSE 'poor'
    END
  );
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_supplier_health_score TO authenticated;