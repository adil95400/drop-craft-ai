-- Phase 3: Advanced Marketing & Sales Intelligence Tables

-- Table pour l'intelligence des ventes et prédictions
CREATE TABLE public.sales_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID,
  analysis_type TEXT NOT NULL, -- 'forecast', 'trend_analysis', 'price_optimization', 'market_gap'
  time_period TEXT NOT NULL, -- 'week', 'month', 'quarter', 'year'
  predictions JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  market_insights JSONB NOT NULL DEFAULT '{}',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour l'analyse comportementale des clients
CREATE TABLE public.customer_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID,
  behavior_type TEXT NOT NULL, -- 'purchase_pattern', 'browsing_behavior', 'engagement', 'churn_risk'
  analysis_data JSONB NOT NULL DEFAULT '{}',
  behavioral_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  lifetime_value NUMERIC(12,2),
  churn_probability NUMERIC(5,2) DEFAULT 0,
  recommendations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour l'intelligence marketing avancée
CREATE TABLE public.marketing_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID,
  channel TEXT NOT NULL, -- 'social', 'email', 'search', 'display', 'influencer'
  attribution_model TEXT NOT NULL DEFAULT 'last_click', -- 'first_click', 'linear', 'time_decay', 'position_based'
  conversion_data JSONB NOT NULL DEFAULT '{}',
  roi_analysis JSONB NOT NULL DEFAULT '{}',
  audience_insights JSONB NOT NULL DEFAULT '{}',
  optimization_suggestions JSONB NOT NULL DEFAULT '[]',
  performance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour l'intelligence compétitive
CREATE TABLE public.competitive_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  product_id UUID,
  competitive_data JSONB NOT NULL DEFAULT '{}',
  price_analysis JSONB NOT NULL DEFAULT '{}',
  market_position JSONB NOT NULL DEFAULT '{}',
  gap_opportunities JSONB NOT NULL DEFAULT '[]',
  threat_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own sales intelligence" ON public.sales_intelligence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own customer behavior analytics" ON public.customer_behavior_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own marketing intelligence" ON public.marketing_intelligence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own competitive intelligence" ON public.competitive_intelligence
  FOR ALL USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_sales_intelligence_updated_at
  BEFORE UPDATE ON public.sales_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_behavior_analytics_updated_at
  BEFORE UPDATE ON public.customer_behavior_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_intelligence_updated_at
  BEFORE UPDATE ON public.marketing_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitive_intelligence_updated_at
  BEFORE UPDATE ON public.competitive_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();