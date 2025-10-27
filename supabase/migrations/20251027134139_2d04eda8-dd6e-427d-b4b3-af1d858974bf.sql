-- Phase 3D: AI-Powered Intelligence System
-- Tables pour pricing dynamique, prédictions et recommandations

-- Table des règles de pricing dynamique
CREATE TABLE IF NOT EXISTS public.dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rule Configuration
  rule_name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  
  -- Pricing Strategy
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('competitive', 'margin_based', 'demand_based', 'time_based', 'ai_optimized')),
  
  -- Target Configuration
  target_products JSONB DEFAULT '[]', -- product_ids or categories
  target_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing Rules
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  min_margin_percent NUMERIC(5,2) DEFAULT 20.00,
  target_margin_percent NUMERIC(5,2) DEFAULT 30.00,
  
  -- Competitive Rules
  competitor_matching BOOLEAN DEFAULT false,
  undercut_percent NUMERIC(5,2) DEFAULT 5.00,
  
  -- Demand-based Rules
  adjust_on_demand BOOLEAN DEFAULT true,
  high_demand_multiplier NUMERIC(3,2) DEFAULT 1.2,
  low_demand_multiplier NUMERIC(3,2) DEFAULT 0.9,
  
  -- Time-based Rules
  schedule_config JSONB DEFAULT '{}', -- hourly/daily/seasonal pricing
  
  -- AI Configuration
  ai_enabled BOOLEAN DEFAULT true,
  learning_rate NUMERIC(3,2) DEFAULT 0.1,
  
  -- Performance Tracking
  total_adjustments INTEGER DEFAULT 0,
  revenue_impact NUMERIC(12,2) DEFAULT 0,
  conversion_impact NUMERIC(5,2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des ajustements de prix
CREATE TABLE IF NOT EXISTS public.price_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  rule_id UUID REFERENCES public.dynamic_pricing_rules(id) ON DELETE SET NULL,
  
  -- Pricing Data
  old_price NUMERIC(10,2) NOT NULL,
  new_price NUMERIC(10,2) NOT NULL,
  price_change_percent NUMERIC(5,2),
  
  -- Reasoning
  adjustment_reason TEXT NOT NULL,
  ai_confidence NUMERIC(3,2) DEFAULT 0,
  market_data JSONB DEFAULT '{}',
  
  -- Impact Tracking
  expected_impact JSONB DEFAULT '{}',
  actual_impact JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des prédictions de tendances
CREATE TABLE IF NOT EXISTS public.trend_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Prediction Target
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'category', 'market', 'customer_segment')),
  entity_id TEXT,
  entity_name TEXT NOT NULL,
  
  -- Prediction Data
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('sales_forecast', 'demand_trend', 'price_trend', 'popularity', 'seasonality')),
  prediction_period TEXT NOT NULL, -- '7d', '30d', '90d', 'seasonal'
  
  -- Forecast Results
  current_value NUMERIC(12,2),
  predicted_value NUMERIC(12,2) NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL,
  prediction_range JSONB DEFAULT '{}', -- min/max bounds
  
  -- Trend Analysis
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable', 'volatile')),
  trend_strength NUMERIC(3,2) DEFAULT 0,
  seasonality_detected BOOLEAN DEFAULT false,
  
  -- Supporting Data
  historical_data JSONB DEFAULT '[]',
  market_factors JSONB DEFAULT '{}',
  external_signals JSONB DEFAULT '{}',
  
  -- AI Model Info
  model_version TEXT DEFAULT 'v1.0',
  training_accuracy NUMERIC(5,2),
  
  -- Status
  prediction_date TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  actual_outcome NUMERIC(12,2),
  accuracy_score NUMERIC(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des produits gagnants recommandés
CREATE TABLE IF NOT EXISTS public.winning_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product Reference
  catalog_product_id UUID,
  external_id TEXT,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Winning Score
  winning_score NUMERIC(5,2) NOT NULL, -- 0-100
  ranking INTEGER,
  
  -- Score Breakdown
  demand_score NUMERIC(5,2) DEFAULT 0,
  competition_score NUMERIC(5,2) DEFAULT 0,
  profitability_score NUMERIC(5,2) DEFAULT 0,
  trend_score NUMERIC(5,2) DEFAULT 0,
  saturation_score NUMERIC(5,2) DEFAULT 0,
  
  -- Market Analysis
  estimated_monthly_sales INTEGER,
  estimated_monthly_revenue NUMERIC(12,2),
  estimated_profit_margin NUMERIC(5,2),
  
  -- Competition Data
  competitor_count INTEGER DEFAULT 0,
  average_competitor_price NUMERIC(10,2),
  market_saturation TEXT CHECK (market_saturation IN ('low', 'medium', 'high')),
  
  -- Trend Data
  search_volume_trend TEXT,
  social_media_mentions INTEGER DEFAULT 0,
  growth_rate NUMERIC(5,2),
  
  -- Recommendations
  recommended_price NUMERIC(10,2),
  recommended_markup NUMERIC(5,2),
  marketing_tips JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  
  -- Timing
  best_time_to_launch TEXT,
  seasonal_factors JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'imported', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des insights IA
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Insight Configuration
  insight_type TEXT NOT NULL CHECK (insight_type IN ('opportunity', 'risk', 'optimization', 'alert', 'recommendation')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Priority & Impact
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  estimated_revenue_impact NUMERIC(12,2),
  estimated_time_to_implement TEXT,
  
  -- AI Analysis
  confidence_score NUMERIC(3,2) NOT NULL,
  ai_reasoning JSONB DEFAULT '{}',
  supporting_data JSONB DEFAULT '{}',
  
  -- Actionable Steps
  recommended_actions JSONB DEFAULT '[]',
  quick_actions JSONB DEFAULT '[]',
  
  -- Related Entities
  related_products UUID[],
  related_categories TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acted_upon', 'dismissed', 'expired')),
  acted_upon_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Outcome
  action_taken JSONB DEFAULT '{}',
  actual_impact JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des analyses de marché
CREATE TABLE IF NOT EXISTS public.market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Analysis Scope
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('category', 'competitor', 'trend', 'opportunity', 'full_market')),
  target_market TEXT NOT NULL,
  
  -- Market Overview
  market_size NUMERIC(15,2),
  market_growth_rate NUMERIC(5,2),
  market_maturity TEXT CHECK (market_maturity IN ('emerging', 'growing', 'mature', 'declining')),
  
  -- Competition Analysis
  total_competitors INTEGER,
  top_competitors JSONB DEFAULT '[]',
  average_pricing JSONB DEFAULT '{}',
  competition_intensity TEXT,
  
  -- Demand Analysis
  search_volume INTEGER,
  search_trend TEXT,
  seasonal_patterns JSONB DEFAULT '{}',
  customer_segments JSONB DEFAULT '[]',
  
  -- Opportunity Analysis
  market_gaps JSONB DEFAULT '[]',
  underserved_segments JSONB DEFAULT '[]',
  emerging_trends JSONB DEFAULT '[]',
  
  -- Recommendations
  recommended_strategy TEXT,
  entry_barriers JSONB DEFAULT '[]',
  success_factors JSONB DEFAULT '[]',
  
  -- AI Scoring
  opportunity_score NUMERIC(5,2),
  risk_score NUMERIC(5,2),
  confidence_score NUMERIC(3,2),
  
  -- Data Sources
  data_sources JSONB DEFAULT '[]',
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_user ON public.dynamic_pricing_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_active ON public.dynamic_pricing_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_price_adjustments_product ON public.price_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_price_adjustments_status ON public.price_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_trend_predictions_user ON public.trend_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_predictions_type ON public.trend_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_winning_products_user ON public.winning_products(user_id);
CREATE INDEX IF NOT EXISTS idx_winning_products_score ON public.winning_products(winning_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON public.ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_market_analysis_user ON public.market_analysis(user_id);

-- RLS Policies
ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;

-- Users can manage their own pricing rules
CREATE POLICY "Users can manage their own pricing rules"
ON public.dynamic_pricing_rules FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can view their own price adjustments
CREATE POLICY "Users can view their own price adjustments"
ON public.price_adjustments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create price adjustments
CREATE POLICY "Users can create price adjustments"
ON public.price_adjustments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can manage their own predictions
CREATE POLICY "Users can manage their own predictions"
ON public.trend_predictions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can manage their own winning products
CREATE POLICY "Users can manage their own winning products"
ON public.winning_products FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can manage their own insights
CREATE POLICY "Users can manage their own insights"
ON public.ai_insights FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can view their own market analysis
CREATE POLICY "Users can view their own market analysis"
ON public.market_analysis FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_dynamic_pricing_rules_updated_at
  BEFORE UPDATE ON public.dynamic_pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_winning_products_updated_at
  BEFORE UPDATE ON public.winning_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour calculer le winning score
CREATE OR REPLACE FUNCTION public.calculate_winning_score(
  p_demand_score NUMERIC,
  p_competition_score NUMERIC,
  p_profitability_score NUMERIC,
  p_trend_score NUMERIC,
  p_saturation_score NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(
    (p_demand_score * 0.25 + 
     p_competition_score * 0.20 + 
     p_profitability_score * 0.25 + 
     p_trend_score * 0.20 + 
     p_saturation_score * 0.10)::numeric, 
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Seed data: Default pricing rule
INSERT INTO public.dynamic_pricing_rules (user_id, rule_name, description, strategy_type, min_margin_percent, target_margin_percent, is_active)
SELECT 
  u.id,
  'Règle de base',
  'Maintenir une marge minimale de 20% avec cible à 30%',
  'margin_based',
  20.00,
  30.00,
  true
FROM (SELECT id FROM auth.users LIMIT 1) u
ON CONFLICT DO NOTHING;