-- Tables pour métriques business et analytics produits
CREATE TABLE IF NOT EXISTS product_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table IN ('products', 'imported_products', 'supplier_products')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, source_table, date)
);

CREATE INDEX idx_product_performance_user ON product_performance(user_id);
CREATE INDEX idx_product_performance_product ON product_performance(product_id);
CREATE INDEX idx_product_performance_date ON product_performance(date DESC);

-- Table pour historique optimisations IA avec versioning
CREATE TABLE IF NOT EXISTS product_optimization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table IN ('products', 'imported_products', 'supplier_products')),
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('title', 'description', 'seo', 'attributes', 'pricing', 'images', 'full')),
  before_data JSONB NOT NULL,
  after_data JSONB NOT NULL,
  ai_model TEXT,
  ai_confidence DECIMAL(3,2),
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  reverted BOOLEAN DEFAULT false,
  reverted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_optimization_history_user ON product_optimization_history(user_id);
CREATE INDEX idx_optimization_history_product ON product_optimization_history(product_id);
CREATE INDEX idx_optimization_history_type ON product_optimization_history(optimization_type);
CREATE INDEX idx_optimization_history_created ON product_optimization_history(created_at DESC);

-- Table pour champs multi-channel (Google Shopping, Meta, Amazon, TikTok)
CREATE TABLE IF NOT EXISTS product_channel_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table IN ('products', 'imported_products', 'supplier_products')),
  channel TEXT NOT NULL CHECK (channel IN ('google_shopping', 'meta', 'amazon', 'tiktok', 'chatgpt')),
  -- Google Shopping fields
  google_product_category TEXT,
  age_group TEXT CHECK (age_group IN ('newborn', 'infant', 'toddler', 'kids', 'adult')),
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  gtin TEXT,
  mpn TEXT,
  condition TEXT CHECK (condition IN ('new', 'refurbished', 'used')),
  availability TEXT CHECK (availability IN ('in_stock', 'out_of_stock', 'preorder', 'backorder')),
  -- Meta fields
  fb_product_category TEXT,
  custom_label_0 TEXT,
  custom_label_1 TEXT,
  custom_label_2 TEXT,
  custom_label_3 TEXT,
  custom_label_4 TEXT,
  -- Amazon fields
  bullet_point_1 TEXT,
  bullet_point_2 TEXT,
  bullet_point_3 TEXT,
  bullet_point_4 TEXT,
  bullet_point_5 TEXT,
  search_terms TEXT[],
  -- TikTok fields
  tiktok_category TEXT,
  video_url TEXT,
  -- AI Shopping readiness
  readiness_score JSONB, -- {google: 85, meta: 70, amazon: 90, tiktok: 60, chatgpt: 95}
  missing_fields JSONB, -- {google: ['gtin', 'age_group'], meta: ['custom_labels']}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, source_table, channel)
);

CREATE INDEX idx_channel_data_user ON product_channel_data(user_id);
CREATE INDEX idx_channel_data_product ON product_channel_data(product_id);
CREATE INDEX idx_channel_data_channel ON product_channel_data(channel);

-- Table pour détection de doublons et qualité catalogue
CREATE TABLE IF NOT EXISTS catalog_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('duplicate_title', 'duplicate_description', 'low_quality', 'missing_critical_data', 'pricing_issue', 'image_issue', 'seo_issue')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  affected_products UUID[] NOT NULL,
  issue_details JSONB NOT NULL,
  auto_fixable BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quality_issues_user ON catalog_quality_issues(user_id);
CREATE INDEX idx_quality_issues_type ON catalog_quality_issues(issue_type);
CREATE INDEX idx_quality_issues_severity ON catalog_quality_issues(severity);
CREATE INDEX idx_quality_issues_resolved ON catalog_quality_issues(resolved);

-- Table pour simulations d'optimisation
CREATE TABLE IF NOT EXISTS optimization_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  simulation_name TEXT NOT NULL,
  product_ids UUID[] NOT NULL,
  optimization_types TEXT[] NOT NULL,
  predicted_impact JSONB NOT NULL, -- {seo_improvement: 25, conversion_increase: 15, revenue_increase: 1200}
  confidence_level DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ,
  actual_results JSONB
);

CREATE INDEX idx_simulations_user ON optimization_simulations(user_id);
CREATE INDEX idx_simulations_executed ON optimization_simulations(executed);

-- RLS Policies
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_channel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product performance"
  ON product_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product performance"
  ON product_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product performance"
  ON product_performance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own optimization history"
  ON product_optimization_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimization history"
  ON product_optimization_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimization history"
  ON product_optimization_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own channel data"
  ON product_channel_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channel data"
  ON product_channel_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel data"
  ON product_channel_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quality issues"
  ON catalog_quality_issues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quality issues"
  ON catalog_quality_issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quality issues"
  ON catalog_quality_issues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own simulations"
  ON optimization_simulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulations"
  ON optimization_simulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations"
  ON optimization_simulations FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_product_performance_updated_at
  BEFORE UPDATE ON product_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_channel_data_updated_at
  BEFORE UPDATE ON product_channel_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_quality_issues_updated_at
  BEFORE UPDATE ON catalog_quality_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();