-- Phase 7: Global Intelligence & Enterprise Compliance

-- Compliance tracking table
CREATE TABLE IF NOT EXISTS public.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL, -- 'gdpr', 'ccpa', 'pci_dss', 'iso27001'
  status TEXT NOT NULL DEFAULT 'pending', -- 'compliant', 'non_compliant', 'pending', 'under_review'
  last_audit_date TIMESTAMPTZ,
  next_audit_date TIMESTAMPTZ,
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  compliance_score NUMERIC(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail table for enterprise logging
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  region TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regional performance metrics
CREATE TABLE IF NOT EXISTS public.regional_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT NOT NULL, -- 'us-east', 'eu-west', 'ap-south', etc.
  metric_type TEXT NOT NULL, -- 'sales', 'traffic', 'conversion', 'latency'
  metric_value NUMERIC(12,2) NOT NULL,
  metric_unit TEXT, -- 'usd', 'count', 'ms', 'percent'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Data residency tracking
CREATE TABLE IF NOT EXISTS public.data_residency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  primary_region TEXT NOT NULL,
  backup_regions TEXT[],
  encryption_status TEXT DEFAULT 'encrypted',
  last_access TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  compliance_tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Global insights aggregations
CREATE TABLE IF NOT EXISTS public.global_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'market_trend', 'demand_shift', 'competitor_activity'
  title TEXT NOT NULL,
  description TEXT,
  confidence_score NUMERIC(5,2), -- 0-100
  impact_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  regions TEXT[],
  data_sources TEXT[],
  recommendations JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_compliance_records_user_id ON public.compliance_records(user_id);
CREATE INDEX idx_compliance_records_type ON public.compliance_records(compliance_type);
CREATE INDEX idx_compliance_records_status ON public.compliance_records(status);
CREATE INDEX idx_audit_trail_user_id ON public.audit_trail(user_id);
CREATE INDEX idx_audit_trail_action ON public.audit_trail(action);
CREATE INDEX idx_audit_trail_created_at ON public.audit_trail(created_at DESC);
CREATE INDEX idx_regional_metrics_user_id ON public.regional_metrics(user_id);
CREATE INDEX idx_regional_metrics_region ON public.regional_metrics(region);
CREATE INDEX idx_data_residency_user_id ON public.data_residency(user_id);
CREATE INDEX idx_global_insights_user_id ON public.global_insights(user_id);
CREATE INDEX idx_global_insights_type ON public.global_insights(insight_type);

-- Enable RLS
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_residency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_records
CREATE POLICY "Users can view their own compliance records"
  ON public.compliance_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance records"
  ON public.compliance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance records"
  ON public.compliance_records FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for audit_trail (read-only for users)
CREATE POLICY "Users can view their own audit trail"
  ON public.audit_trail FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for regional_metrics
CREATE POLICY "Users can manage their own regional metrics"
  ON public.regional_metrics FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for data_residency
CREATE POLICY "Users can manage their own data residency"
  ON public.data_residency FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for global_insights
CREATE POLICY "Users can view their own global insights"
  ON public.global_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own global insights"
  ON public.global_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_compliance_records_updated_at
  BEFORE UPDATE ON public.compliance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_residency_updated_at
  BEFORE UPDATE ON public.data_residency
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_insights_updated_at
  BEFORE UPDATE ON public.global_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_before_data JSONB DEFAULT NULL,
  p_after_data JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_trail (
    user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    severity,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_before_data,
    p_after_data,
    p_severity,
    jsonb_build_object('timestamp', now())
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial compliance frameworks
INSERT INTO public.compliance_records (user_id, compliance_type, status, compliance_score, metadata)
SELECT 
  id as user_id,
  unnest(ARRAY['gdpr', 'ccpa', 'pci_dss']) as compliance_type,
  'pending' as status,
  75.0 as compliance_score,
  jsonb_build_object(
    'auto_created', true,
    'framework_version', '2024.1'
  ) as metadata
FROM auth.users
ON CONFLICT DO NOTHING;