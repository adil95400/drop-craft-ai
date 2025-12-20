
-- =====================================================
-- PHASE 1: CREATE MISSING TABLES
-- =====================================================

-- 1. Product Enrichment Table
CREATE TABLE IF NOT EXISTS public.product_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  enrichment_status TEXT DEFAULT 'pending',
  enrichment_type TEXT DEFAULT 'ai',
  original_data JSONB DEFAULT '{}',
  enriched_data JSONB DEFAULT '{}',
  ai_suggestions JSONB DEFAULT '{}',
  seo_score INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0,
  completeness_score INTEGER DEFAULT 0,
  enriched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Analytics Insights Table
CREATE TABLE IF NOT EXISTS public.analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  metric_type TEXT DEFAULT 'kpi',
  category TEXT,
  period TEXT DEFAULT 'daily',
  comparison_value NUMERIC,
  trend TEXT DEFAULT 'stable',
  trend_percentage NUMERIC DEFAULT 0,
  predictions JSONB DEFAULT '{}',
  prediction_type TEXT,
  confidence_score NUMERIC DEFAULT 0.8,
  insights JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Supplier Products Table
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  external_product_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  stock_quantity INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock',
  image_url TEXT,
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  shipping_info JSONB DEFAULT '{}',
  processing_time TEXT,
  source_url TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. AI Optimization Jobs Table
CREATE TABLE IF NOT EXISTS public.ai_optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  target_type TEXT DEFAULT 'product',
  target_id UUID,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Price History Table (for repricing)
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rule_id UUID,
  old_price NUMERIC,
  new_price NUMERIC,
  price_change NUMERIC,
  change_reason TEXT,
  competitor_price NUMERIC,
  margin NUMERIC,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Pricing Rules Table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT DEFAULT 'margin',
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  min_price NUMERIC,
  max_price NUMERIC,
  target_margin NUMERIC,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  products_affected INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- PHASE 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add webhook_data to webhook_events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'webhook_data') THEN
    ALTER TABLE public.webhook_events ADD COLUMN webhook_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add source column to activity_logs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'source') THEN
    ALTER TABLE public.activity_logs ADD COLUMN source TEXT DEFAULT 'system';
  END IF;
END $$;

-- =====================================================
-- PHASE 3: ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Product Enrichment RLS
ALTER TABLE public.product_enrichment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own product enrichment"
ON public.product_enrichment FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Analytics Insights RLS
ALTER TABLE public.analytics_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics insights"
ON public.analytics_insights FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all analytics insights"
ON public.analytics_insights FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Supplier Products RLS
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own supplier products"
ON public.supplier_products FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- AI Optimization Jobs RLS
ALTER TABLE public.ai_optimization_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ai optimization jobs"
ON public.ai_optimization_jobs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Price History RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price history"
ON public.price_history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Pricing Rules RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pricing rules"
ON public.pricing_rules FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PHASE 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_enrichment_user ON public.product_enrichment(user_id);
CREATE INDEX IF NOT EXISTS idx_product_enrichment_product ON public.product_enrichment(product_id);
CREATE INDEX IF NOT EXISTS idx_product_enrichment_status ON public.product_enrichment(enrichment_status);

CREATE INDEX IF NOT EXISTS idx_analytics_insights_user ON public.analytics_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_metric ON public.analytics_insights(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_recorded ON public.analytics_insights(recorded_at);

CREATE INDEX IF NOT EXISTS idx_supplier_products_user ON public.supplier_products(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON public.supplier_products(supplier_id);

CREATE INDEX IF NOT EXISTS idx_ai_optimization_jobs_user ON public.ai_optimization_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_optimization_jobs_status ON public.ai_optimization_jobs(status);

CREATE INDEX IF NOT EXISTS idx_price_history_user ON public.price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history(product_id);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_user ON public.pricing_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules(is_active);

-- =====================================================
-- PHASE 5: CREATE UPDATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_product_enrichment_updated_at
BEFORE UPDATE ON public.product_enrichment
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
BEFORE UPDATE ON public.supplier_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_optimization_jobs_updated_at
BEFORE UPDATE ON public.ai_optimization_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
