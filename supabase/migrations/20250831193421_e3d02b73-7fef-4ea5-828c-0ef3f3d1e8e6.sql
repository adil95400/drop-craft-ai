-- Phase 4: Advanced Automation & AI Business Optimization Tables

-- Table pour les règles d'automatisation intelligentes
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'pricing', 'inventory', 'marketing', 'order_processing'
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  ai_conditions JSONB NOT NULL DEFAULT '{}', -- IA-powered conditions
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 5,
  execution_count INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC NOT NULL DEFAULT 100.0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'optimisation dynamique des prix
CREATE TABLE IF NOT EXISTS public.dynamic_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID,
  current_price NUMERIC NOT NULL,
  suggested_price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  price_change_reason TEXT NOT NULL,
  ai_confidence NUMERIC NOT NULL DEFAULT 0,
  market_factors JSONB NOT NULL DEFAULT '{}',
  competitor_analysis JSONB NOT NULL DEFAULT '{}',
  demand_forecast JSONB NOT NULL DEFAULT '{}',
  profit_impact NUMERIC NOT NULL DEFAULT 0,
  expected_sales_impact NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'applied', 'rejected'
  applied_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  performance_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour la gestion intelligente des stocks
CREATE TABLE IF NOT EXISTS public.smart_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  optimal_stock INTEGER NOT NULL DEFAULT 0,
  minimum_threshold INTEGER NOT NULL DEFAULT 0,
  maximum_threshold INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  reorder_quantity INTEGER NOT NULL DEFAULT 0,
  demand_forecast JSONB NOT NULL DEFAULT '{}',
  seasonality_data JSONB NOT NULL DEFAULT '{}',
  supplier_performance JSONB NOT NULL DEFAULT '{}',
  cost_optimization JSONB NOT NULL DEFAULT '{}',
  stock_risk_level TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  auto_reorder_enabled BOOLEAN NOT NULL DEFAULT false,
  last_reorder_at TIMESTAMP WITH TIME ZONE,
  next_reorder_prediction TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les campagnes marketing automatisées
CREATE TABLE IF NOT EXISTS public.automated_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'email', 'retargeting', 'cross_sell', 'upsell', 'winback'
  trigger_type TEXT NOT NULL, -- 'behavior', 'time', 'event', 'ai_prediction'
  target_criteria JSONB NOT NULL DEFAULT '{}',
  ai_segmentation JSONB NOT NULL DEFAULT '{}',
  content_templates JSONB NOT NULL DEFAULT '{}',
  automation_flow JSONB NOT NULL DEFAULT '[]',
  performance_goals JSONB NOT NULL DEFAULT '{}',
  current_metrics JSONB NOT NULL DEFAULT '{}',
  ai_optimization_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  execution_schedule JSONB NOT NULL DEFAULT '{}',
  last_executed_at TIMESTAMP WITH TIME ZONE,
  next_execution_at TIMESTAMP WITH TIME ZONE,
  success_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'intelligence d'affaires automatisée
CREATE TABLE IF NOT EXISTS public.business_intelligence_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'trend', 'anomaly', 'opportunity', 'risk', 'prediction'
  category TEXT NOT NULL, -- 'sales', 'inventory', 'marketing', 'customer', 'financial'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical', 'opportunity'
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  impact_score NUMERIC NOT NULL DEFAULT 0,
  actionable_recommendations JSONB NOT NULL DEFAULT '[]',
  supporting_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'acknowledged', 'acted_upon', 'dismissed'
  priority INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acted_upon_at TIMESTAMP WITH TIME ZONE,
  outcome_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les décisions automatisées
CREATE TABLE IF NOT EXISTS public.automated_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  decision_type TEXT NOT NULL, -- 'pricing', 'inventory', 'marketing', 'customer_action'
  entity_type TEXT NOT NULL, -- 'product', 'customer', 'campaign', 'order'
  entity_id UUID,
  decision_title TEXT NOT NULL,
  ai_reasoning JSONB NOT NULL DEFAULT '{}',
  input_data JSONB NOT NULL DEFAULT '{}',
  decision_parameters JSONB NOT NULL DEFAULT '{}',
  recommended_action JSONB NOT NULL DEFAULT '{}',
  confidence_level NUMERIC NOT NULL DEFAULT 0,
  risk_assessment JSONB NOT NULL DEFAULT '{}',
  expected_outcome JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'rejected'
  execution_mode TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'semi_auto', 'fully_auto'
  executed_at TIMESTAMP WITH TIME ZONE,
  actual_outcome JSONB NOT NULL DEFAULT '{}',
  performance_score NUMERIC,
  learning_feedback JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all Phase 4 tables
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_intelligence_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Users can manage their own automation rules" 
ON public.automation_rules FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for dynamic_pricing
CREATE POLICY "Users can manage their own dynamic pricing" 
ON public.dynamic_pricing FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for smart_inventory
CREATE POLICY "Users can manage their own smart inventory" 
ON public.smart_inventory FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for automated_campaigns
CREATE POLICY "Users can manage their own automated campaigns" 
ON public.automated_campaigns FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for business_intelligence_insights
CREATE POLICY "Users can manage their own BI insights" 
ON public.business_intelligence_insights FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for automated_decisions
CREATE POLICY "Users can manage their own automated decisions" 
ON public.automated_decisions FOR ALL 
USING (auth.uid() = user_id);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at
BEFORE UPDATE ON public.dynamic_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_inventory_updated_at
BEFORE UPDATE ON public.smart_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_campaigns_updated_at
BEFORE UPDATE ON public.automated_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_intelligence_insights_updated_at
BEFORE UPDATE ON public.business_intelligence_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_decisions_updated_at
BEFORE UPDATE ON public.automated_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();