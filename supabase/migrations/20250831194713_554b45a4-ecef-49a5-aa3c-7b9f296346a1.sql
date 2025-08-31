-- Phase 5: Advanced Analytics & Enterprise Scaling

-- Advanced Analytics Tables
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  dimensions JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.advanced_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  report_config JSONB NOT NULL DEFAULT '{}',
  report_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'generating',
  file_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.enterprise_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  access_level TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_category, setting_key)
);

CREATE TABLE public.system_health_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  component_type TEXT NOT NULL,
  component_name TEXT NOT NULL,
  health_status TEXT NOT NULL DEFAULT 'healthy',
  performance_score NUMERIC NOT NULL DEFAULT 100,
  error_rate NUMERIC NOT NULL DEFAULT 0,
  response_time_ms INTEGER,
  uptime_percentage NUMERIC NOT NULL DEFAULT 100,
  alerts_triggered JSONB NOT NULL DEFAULT '[]',
  metrics_data JSONB NOT NULL DEFAULT '{}',
  last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.predictive_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prediction_type TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  prediction_period TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  prediction_results JSONB NOT NULL DEFAULT '{}',
  confidence_level NUMERIC NOT NULL DEFAULT 0,
  accuracy_score NUMERIC,
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.ab_test_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  experiment_name TEXT NOT NULL,
  experiment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  hypothesis TEXT,
  control_variant JSONB NOT NULL DEFAULT '{}',
  test_variants JSONB NOT NULL DEFAULT '[]',
  traffic_allocation JSONB NOT NULL DEFAULT '{}',
  success_metrics JSONB NOT NULL DEFAULT '[]',
  current_results JSONB NOT NULL DEFAULT '{}',
  statistical_significance NUMERIC,
  confidence_interval JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.enterprise_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  authentication_data JSONB NOT NULL DEFAULT '{}',
  sync_status TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT NOT NULL DEFAULT 'daily',
  error_logs JSONB NOT NULL DEFAULT '[]',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own performance metrics"
  ON public.performance_metrics
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own advanced reports"
  ON public.advanced_reports
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own enterprise settings"
  ON public.enterprise_settings
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own system health monitoring"
  ON public.system_health_monitoring
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own predictive analytics"
  ON public.predictive_analytics
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own A/B test experiments"
  ON public.ab_test_experiments
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own enterprise integrations"
  ON public.enterprise_integrations
  FOR ALL
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_advanced_reports_updated_at
  BEFORE UPDATE ON public.advanced_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_settings_updated_at
  BEFORE UPDATE ON public.enterprise_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_health_monitoring_updated_at
  BEFORE UPDATE ON public.system_health_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_analytics_updated_at
  BEFORE UPDATE ON public.predictive_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_test_experiments_updated_at
  BEFORE UPDATE ON public.ab_test_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_integrations_updated_at
  BEFORE UPDATE ON public.enterprise_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();