-- Create tables for AI analytics and insights

-- Business intelligence insights table
CREATE TABLE IF NOT EXISTS public.business_intelligence_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  actionable_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'::text,
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acted_upon_at TIMESTAMP WITH TIME ZONE,
  outcome_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  impact_score NUMERIC NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'info'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictive analytics table
CREATE TABLE IF NOT EXISTS public.predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  predicted_value NUMERIC NOT NULL,
  prediction_timeframe TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  trend_direction TEXT NOT NULL,
  influencing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_version TEXT,
  prediction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actual_value NUMERIC,
  accuracy_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance optimization recommendations table
CREATE TABLE IF NOT EXISTS public.performance_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  optimization_type TEXT NOT NULL,
  current_performance NUMERIC NOT NULL,
  potential_performance NUMERIC NOT NULL,
  improvement_percentage NUMERIC NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium'::text,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_impact TEXT,
  implementation_effort TEXT,
  roi_estimate NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  implemented_at TIMESTAMP WITH TIME ZONE,
  results_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_intelligence_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_optimizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "secure_user_access_business_intelligence_insights" ON public.business_intelligence_insights
  FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_user_access_predictive_analytics" ON public.predictive_analytics
  FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_user_access_performance_optimizations" ON public.performance_optimizations
  FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_business_intelligence_insights_updated_at
  BEFORE UPDATE ON public.business_intelligence_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_analytics_updated_at
  BEFORE UPDATE ON public.predictive_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_optimizations_updated_at
  BEFORE UPDATE ON public.performance_optimizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();