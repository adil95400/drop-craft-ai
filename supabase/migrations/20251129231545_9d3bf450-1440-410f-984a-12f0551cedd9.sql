-- ============================================================
-- PHASE 2: MARKETPLACE ADVANCED FEATURES - DATABASE TABLES
-- ============================================================
-- Repricing dynamique, Fulfillment automatisé, Promotions, Analytique prédictive
-- ============================================================

-- ============================================================
-- 1. REPRICING DYNAMIQUE
-- ============================================================

-- Table des règles de repricing
CREATE TABLE IF NOT EXISTS public.repricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  marketplace TEXT NOT NULL, -- 'amazon', 'ebay', 'walmart', etc.
  strategy TEXT NOT NULL CHECK (strategy IN ('buybox', 'margin_based', 'competitive', 'dynamic')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Pricing parameters
  min_margin_percent NUMERIC(5,2) NOT NULL DEFAULT 15.0,
  max_margin_percent NUMERIC(5,2),
  target_position INTEGER, -- Position cible dans les résultats (1 = buybox)
  competitor_offset NUMERIC(10,2), -- Écart prix vs concurrent (ex: -0.01 pour être 1 centime en dessous)
  
  -- Price boundaries
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  
  -- Rounding rules
  rounding_method TEXT CHECK (rounding_method IN ('none', 'psychological', 'nearest_9', 'nearest_5', 'round_up', 'round_down')),
  
  -- Filters
  applies_to_products TEXT[], -- Array of product IDs
  applies_to_categories TEXT[], -- Array of categories
  
  -- Scheduling
  schedule_type TEXT CHECK (schedule_type IN ('continuous', 'hourly', 'daily', 'manual')),
  check_interval_minutes INTEGER DEFAULT 60,
  
  -- Stats
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_repricing_rules_user ON public.repricing_rules(user_id);
CREATE INDEX idx_repricing_rules_active ON public.repricing_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_repricing_rules_marketplace ON public.repricing_rules(marketplace);

-- Enable RLS
ALTER TABLE public.repricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own repricing rules"
  ON public.repricing_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repricing rules"
  ON public.repricing_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repricing rules"
  ON public.repricing_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repricing rules"
  ON public.repricing_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_repricing_rules_updated_at
  BEFORE UPDATE ON public.repricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Table des exécutions de repricing
CREATE TABLE IF NOT EXISTS public.repricing_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.repricing_rules(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  marketplace TEXT NOT NULL,
  
  -- Price change details
  old_price NUMERIC(10,2) NOT NULL,
  new_price NUMERIC(10,2) NOT NULL,
  price_change NUMERIC(10,2) NOT NULL,
  price_change_percent NUMERIC(5,2) NOT NULL,
  
  -- Context
  competitor_count INTEGER,
  min_competitor_price NUMERIC(10,2),
  avg_competitor_price NUMERIC(10,2),
  margin_percent NUMERIC(5,2),
  
  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  reason TEXT,
  error_message TEXT,
  
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_repricing_executions_user ON public.repricing_executions(user_id);
CREATE INDEX idx_repricing_executions_rule ON public.repricing_executions(rule_id);
CREATE INDEX idx_repricing_executions_product ON public.repricing_executions(product_id);
CREATE INDEX idx_repricing_executions_date ON public.repricing_executions(executed_at DESC);

-- Enable RLS
ALTER TABLE public.repricing_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own repricing executions"
  ON public.repricing_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create repricing executions"
  ON public.repricing_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table des données de prix marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_price_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  marketplace TEXT NOT NULL,
  
  current_price NUMERIC(10,2) NOT NULL,
  competitor_count INTEGER NOT NULL DEFAULT 0,
  min_competitor_price NUMERIC(10,2),
  avg_competitor_price NUMERIC(10,2),
  buybox_price NUMERIC(10,2),
  buybox_seller TEXT,
  
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_marketplace_price_data_user ON public.marketplace_price_data(user_id);
CREATE INDEX idx_marketplace_price_data_product ON public.marketplace_price_data(product_id);
CREATE INDEX idx_marketplace_price_data_marketplace ON public.marketplace_price_data(marketplace);

-- Enable RLS
ALTER TABLE public.marketplace_price_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own price data"
  ON public.marketplace_price_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their price data"
  ON public.marketplace_price_data FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. FULFILLMENT AUTOMATISÉ
-- ============================================================

-- Table des transporteurs
CREATE TABLE IF NOT EXISTS public.fulfillment_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carrier_code TEXT NOT NULL, -- 'ups', 'fedex', 'usps', 'dhl', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- API credentials (encrypted)
  api_credentials JSONB,
  
  -- Shipping settings
  default_service_level TEXT,
  supports_tracking BOOLEAN NOT NULL DEFAULT true,
  supports_insurance BOOLEAN NOT NULL DEFAULT false,
  
  -- Cost structure
  base_cost NUMERIC(10,2),
  cost_per_kg NUMERIC(10,2),
  
  -- Stats
  total_shipments INTEGER NOT NULL DEFAULT 0,
  avg_delivery_days NUMERIC(4,1),
  success_rate NUMERIC(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_fulfillment_carriers_user ON public.fulfillment_carriers(user_id);
CREATE INDEX idx_fulfillment_carriers_active ON public.fulfillment_carriers(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.fulfillment_carriers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own carriers"
  ON public.fulfillment_carriers FOR ALL
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_fulfillment_carriers_updated_at
  BEFORE UPDATE ON public.fulfillment_carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Table des expéditions
CREATE TABLE IF NOT EXISTS public.fulfillment_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  carrier_id UUID REFERENCES public.fulfillment_carriers(id) ON DELETE SET NULL,
  
  -- Shipping details
  tracking_number TEXT,
  label_url TEXT,
  carrier_name TEXT NOT NULL,
  service_level TEXT,
  
  -- Addresses
  shipping_address JSONB NOT NULL,
  return_address JSONB,
  
  -- Package details
  weight_kg NUMERIC(10,2),
  dimensions JSONB, -- {length, width, height, unit}
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'label_created', 'shipped', 'in_transit', 'delivered', 'failed', 'returned')),
  
  -- Costs
  shipping_cost NUMERIC(10,2),
  insurance_cost NUMERIC(10,2),
  
  -- Tracking updates
  last_tracking_update TIMESTAMPTZ,
  tracking_events JSONB, -- Array of tracking events
  
  -- Timestamps
  shipped_at TIMESTAMPTZ,
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fulfillment_shipments_user ON public.fulfillment_shipments(user_id);
CREATE INDEX idx_fulfillment_shipments_order ON public.fulfillment_shipments(order_id);
CREATE INDEX idx_fulfillment_shipments_tracking ON public.fulfillment_shipments(tracking_number);
CREATE INDEX idx_fulfillment_shipments_status ON public.fulfillment_shipments(status);

-- Enable RLS
ALTER TABLE public.fulfillment_shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own shipments"
  ON public.fulfillment_shipments FOR ALL
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_fulfillment_shipments_updated_at
  BEFORE UPDATE ON public.fulfillment_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Table des règles d'automatisation fulfillment
CREATE TABLE IF NOT EXISTS public.fulfillment_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Trigger conditions
  trigger_on TEXT NOT NULL CHECK (trigger_on IN ('order_paid', 'order_confirmed', 'stock_available')),
  
  -- Filters
  applies_to_products TEXT[],
  applies_to_categories TEXT[],
  min_order_value NUMERIC(10,2),
  max_order_value NUMERIC(10,2),
  destination_countries TEXT[],
  
  -- Actions
  auto_select_carrier BOOLEAN NOT NULL DEFAULT true,
  preferred_carrier_id UUID REFERENCES public.fulfillment_carriers(id) ON DELETE SET NULL,
  auto_generate_label BOOLEAN NOT NULL DEFAULT true,
  auto_send_tracking BOOLEAN NOT NULL DEFAULT true,
  
  -- Stats
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_fulfillment_automation_rules_user ON public.fulfillment_automation_rules(user_id);
CREATE INDEX idx_fulfillment_automation_rules_active ON public.fulfillment_automation_rules(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.fulfillment_automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own automation rules"
  ON public.fulfillment_automation_rules FOR ALL
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_fulfillment_automation_rules_updated_at
  BEFORE UPDATE ON public.fulfillment_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. PROMOTIONS ET CAMPAGNES
-- ============================================================

-- Table des campagnes promotionnelles
CREATE TABLE IF NOT EXISTS public.promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('discount', 'flash_sale', 'coupon', 'bundle', 'free_shipping')),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Scheduling
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- Discount configuration
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
  discount_value NUMERIC(10,2),
  max_discount_amount NUMERIC(10,2),
  
  -- Application rules
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all_products', 'specific_products', 'categories', 'collections')),
  product_ids TEXT[],
  category_ids TEXT[],
  
  -- Conditions
  min_purchase_amount NUMERIC(10,2),
  min_quantity INTEGER,
  max_uses_total INTEGER,
  max_uses_per_customer INTEGER,
  
  -- Targeting
  target_marketplaces TEXT[],
  target_customer_segments TEXT[],
  
  -- Stats
  total_uses INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_discount_given NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_promotion_campaigns_user ON public.promotion_campaigns(user_id);
CREATE INDEX idx_promotion_campaigns_status ON public.promotion_campaigns(status);
CREATE INDEX idx_promotion_campaigns_dates ON public.promotion_campaigns(starts_at, ends_at);

-- Enable RLS
ALTER TABLE public.promotion_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own promotions"
  ON public.promotion_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_promotion_campaigns_updated_at
  BEFORE UPDATE ON public.promotion_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Table des exécutions de promotions
CREATE TABLE IF NOT EXISTS public.promotion_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.promotion_campaigns(id) ON DELETE CASCADE,
  order_id UUID,
  customer_id UUID,
  
  -- Discount applied
  discount_amount NUMERIC(10,2) NOT NULL,
  order_total NUMERIC(10,2) NOT NULL,
  
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_promotion_executions_user ON public.promotion_executions(user_id);
CREATE INDEX idx_promotion_executions_campaign ON public.promotion_executions(campaign_id);
CREATE INDEX idx_promotion_executions_date ON public.promotion_executions(executed_at DESC);

-- Enable RLS
ALTER TABLE public.promotion_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own promotion executions"
  ON public.promotion_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create promotion executions"
  ON public.promotion_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. ANALYTIQUE PRÉDICTIVE
-- ============================================================

-- Table des prévisions de ventes
CREATE TABLE IF NOT EXISTS public.sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('daily', 'weekly', 'monthly', 'seasonal')),
  
  -- Forecast period
  forecast_date DATE NOT NULL,
  forecast_period TEXT NOT NULL,
  
  -- Predictions
  predicted_units INTEGER NOT NULL,
  predicted_revenue NUMERIC(12,2) NOT NULL,
  confidence_level NUMERIC(3,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  
  -- Factors
  trend_factor NUMERIC(5,2),
  seasonality_factor NUMERIC(5,2),
  promotion_factor NUMERIC(5,2),
  
  -- Model info
  model_version TEXT,
  training_data_points INTEGER,
  
  -- Actual vs predicted (updated after period)
  actual_units INTEGER,
  actual_revenue NUMERIC(12,2),
  forecast_accuracy NUMERIC(5,2),
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sales_forecasts_user ON public.sales_forecasts(user_id);
CREATE INDEX idx_sales_forecasts_product ON public.sales_forecasts(product_id);
CREATE INDEX idx_sales_forecasts_date ON public.sales_forecasts(forecast_date);

-- Enable RLS
ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own forecasts"
  ON public.sales_forecasts FOR ALL
  USING (auth.uid() = user_id);

-- Table des recommandations de réapprovisionnement
CREATE TABLE IF NOT EXISTS public.restock_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  
  -- Current state
  current_stock INTEGER NOT NULL,
  avg_daily_sales NUMERIC(10,2) NOT NULL,
  days_until_stockout INTEGER,
  
  -- Recommendations
  recommended_reorder_quantity INTEGER NOT NULL,
  recommended_reorder_date DATE NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  
  -- Cost analysis
  estimated_cost NUMERIC(12,2),
  potential_lost_sales NUMERIC(12,2),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'acknowledged', 'ordered', 'dismissed')),
  acknowledged_at TIMESTAMPTZ,
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_restock_recommendations_user ON public.restock_recommendations(user_id);
CREATE INDEX idx_restock_recommendations_product ON public.restock_recommendations(product_id);
CREATE INDEX idx_restock_recommendations_urgency ON public.restock_recommendations(urgency);
CREATE INDEX idx_restock_recommendations_status ON public.restock_recommendations(status);

-- Enable RLS
ALTER TABLE public.restock_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own restock recommendations"
  ON public.restock_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Table des recommandations de pricing
CREATE TABLE IF NOT EXISTS public.pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  marketplace TEXT NOT NULL,
  
  -- Current state
  current_price NUMERIC(10,2) NOT NULL,
  current_margin_percent NUMERIC(5,2),
  current_sales_velocity NUMERIC(10,2),
  
  -- Recommendations
  recommended_price NUMERIC(10,2) NOT NULL,
  expected_margin_percent NUMERIC(5,2) NOT NULL,
  expected_sales_increase_percent NUMERIC(5,2),
  
  -- Reasoning
  recommendation_reason TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Impact analysis
  estimated_revenue_impact NUMERIC(12,2),
  estimated_profit_impact NUMERIC(12,2),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
  applied_at TIMESTAMPTZ,
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pricing_recommendations_user ON public.pricing_recommendations(user_id);
CREATE INDEX idx_pricing_recommendations_product ON public.pricing_recommendations(product_id);
CREATE INDEX idx_pricing_recommendations_marketplace ON public.pricing_recommendations(marketplace);
CREATE INDEX idx_pricing_recommendations_status ON public.pricing_recommendations(status);

-- Enable RLS
ALTER TABLE public.pricing_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own pricing recommendations"
  ON public.pricing_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- VUES ET FONCTIONS UTILITAIRES
-- ============================================================

-- Vue pour dashboard repricing
CREATE OR REPLACE VIEW public.repricing_dashboard AS
SELECT 
  r.user_id,
  COUNT(DISTINCT r.id) as active_rules_count,
  COUNT(DISTINCT CASE WHEN r.last_executed_at > now() - interval '24 hours' THEN r.id END) as rules_executed_today,
  COUNT(e.id) as total_executions_24h,
  SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END) as successful_executions_24h,
  AVG(e.price_change_percent) as avg_price_change_percent,
  SUM(ABS(e.price_change)) as total_price_adjustments
FROM public.repricing_rules r
LEFT JOIN public.repricing_executions e ON e.rule_id = r.id AND e.executed_at > now() - interval '24 hours'
WHERE r.is_active = true
GROUP BY r.user_id;

-- Vue pour dashboard fulfillment
CREATE OR REPLACE VIEW public.fulfillment_dashboard AS
SELECT 
  user_id,
  COUNT(*) as total_shipments,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_shipments,
  COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_shipments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_shipments,
  AVG(CASE WHEN delivered_at IS NOT NULL AND shipped_at IS NOT NULL 
    THEN EXTRACT(epoch FROM (delivered_at - shipped_at))/86400 END) as avg_delivery_days,
  SUM(shipping_cost) as total_shipping_cost
FROM public.fulfillment_shipments
WHERE created_at > now() - interval '30 days'
GROUP BY user_id;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.repricing_rules IS 'Règles de repricing dynamique pour ajustement automatique des prix';
COMMENT ON TABLE public.fulfillment_shipments IS 'Expéditions et tracking des commandes avec transporteurs';
COMMENT ON TABLE public.promotion_campaigns IS 'Campagnes promotionnelles automatisées multi-marketplaces';
COMMENT ON TABLE public.sales_forecasts IS 'Prévisions de ventes basées sur historique et tendances';
COMMENT ON TABLE public.restock_recommendations IS 'Recommandations de réapprovisionnement intelligentes';
COMMENT ON TABLE public.pricing_recommendations IS 'Recommandations de pricing basées sur analyse marché';