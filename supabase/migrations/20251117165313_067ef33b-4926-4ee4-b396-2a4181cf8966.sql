-- Phase 6: Advanced Multi-Store Analytics and Insights

-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS analytics_insights CASCADE;
DROP TABLE IF EXISTS custom_analytics_reports CASCADE;
DROP TABLE IF EXISTS predictive_analytics CASCADE;
DROP TABLE IF EXISTS store_comparative_analytics CASCADE;
DROP TABLE IF EXISTS store_performance_analytics CASCADE;

-- Table for store performance analytics
CREATE TABLE store_performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_identifier TEXT,
  store_name TEXT,
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  customer_acquisition_cost DECIMAL(10,2) DEFAULT 0,
  customer_lifetime_value DECIMAL(10,2) DEFAULT 0,
  inventory_turnover_rate DECIMAL(8,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  top_products JSONB DEFAULT '[]'::jsonb,
  top_categories JSONB DEFAULT '[]'::jsonb,
  customer_segments JSONB DEFAULT '{}'::jsonb,
  sales_trends JSONB DEFAULT '{}'::jsonb,
  performance_score DECIMAL(5,2) DEFAULT 0,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for comparative analytics across stores
CREATE TABLE store_comparative_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  comparison_name TEXT NOT NULL,
  store_identifiers TEXT[] NOT NULL,
  comparison_period_start TIMESTAMPTZ NOT NULL,
  comparison_period_end TIMESTAMPTZ NOT NULL,
  comparison_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  best_performers JSONB DEFAULT '[]'::jsonb,
  underperformers JSONB DEFAULT '[]'::jsonb,
  optimization_opportunities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for predictive analytics
CREATE TABLE predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_identifier TEXT,
  store_name TEXT,
  prediction_type TEXT NOT NULL,
  prediction_period_start TIMESTAMPTZ NOT NULL,
  prediction_period_end TIMESTAMPTZ NOT NULL,
  predictions JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  factors_analyzed JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  actual_results JSONB DEFAULT '{}'::jsonb,
  accuracy_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for custom analytics reports
CREATE TABLE custom_analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  store_identifiers TEXT[],
  filters JSONB DEFAULT '{}'::jsonb,
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_data JSONB DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT '{}'::jsonb,
  last_generated_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for analytics insights
CREATE TABLE analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_identifier TEXT,
  store_name TEXT,
  insight_type TEXT NOT NULL,
  insight_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  impact_score DECIMAL(5,2) DEFAULT 0,
  confidence_level DECIMAL(5,2) DEFAULT 0,
  data_points JSONB DEFAULT '{}'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_store_performance_analytics_user ON store_performance_analytics(user_id);
CREATE INDEX idx_store_performance_analytics_store ON store_performance_analytics(store_identifier);
CREATE INDEX idx_store_performance_analytics_period ON store_performance_analytics(analysis_period_start, analysis_period_end);

CREATE INDEX idx_store_comparative_analytics_user ON store_comparative_analytics(user_id);
CREATE INDEX idx_store_comparative_analytics_period ON store_comparative_analytics(comparison_period_start, comparison_period_end);

CREATE INDEX idx_predictive_analytics_user ON predictive_analytics(user_id);
CREATE INDEX idx_predictive_analytics_store ON predictive_analytics(store_identifier);
CREATE INDEX idx_predictive_analytics_type ON predictive_analytics(prediction_type);

CREATE INDEX idx_custom_analytics_reports_user ON custom_analytics_reports(user_id);
CREATE INDEX idx_custom_analytics_reports_type ON custom_analytics_reports(report_type);

CREATE INDEX idx_analytics_insights_user ON analytics_insights(user_id);
CREATE INDEX idx_analytics_insights_store ON analytics_insights(store_identifier);
CREATE INDEX idx_analytics_insights_acknowledged ON analytics_insights(is_acknowledged);

-- Enable RLS
ALTER TABLE store_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_comparative_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_performance_analytics
CREATE POLICY "Users can manage their own store performance analytics"
  ON store_performance_analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for store_comparative_analytics
CREATE POLICY "Users can manage their own comparative analytics"
  ON store_comparative_analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for predictive_analytics
CREATE POLICY "Users can manage their own predictive analytics"
  ON predictive_analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for custom_analytics_reports
CREATE POLICY "Users can manage their own custom reports"
  ON custom_analytics_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for analytics_insights
CREATE POLICY "Users can manage their own analytics insights"
  ON analytics_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_store_performance_analytics_updated_at
  BEFORE UPDATE ON store_performance_analytics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_store_comparative_analytics_updated_at
  BEFORE UPDATE ON store_comparative_analytics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_predictive_analytics_updated_at
  BEFORE UPDATE ON predictive_analytics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_custom_analytics_reports_updated_at
  BEFORE UPDATE ON custom_analytics_reports
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_analytics_insights_updated_at
  BEFORE UPDATE ON analytics_insights
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();