
-- =============================================
-- P2-1: Prévisions de demande
-- =============================================
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_demand INTEGER NOT NULL DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  scenario TEXT DEFAULT 'realistic' CHECK (scenario IN ('optimistic', 'realistic', 'pessimistic')),
  seasonality_factor DECIMAL(5,2) DEFAULT 1.0,
  trend_direction TEXT DEFAULT 'stable' CHECK (trend_direction IN ('up', 'down', 'stable')),
  model_version TEXT DEFAULT 'v1',
  input_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own forecasts" ON public.demand_forecasts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_demand_forecasts_product ON public.demand_forecasts(user_id, product_id, forecast_date);

-- =============================================
-- P2-2: Scoring fournisseurs avancé
-- =============================================
CREATE TABLE IF NOT EXISTS public.supplier_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) DEFAULT 0,
  reliability_score DECIMAL(5,2) DEFAULT 0,
  delivery_score DECIMAL(5,2) DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  price_score DECIMAL(5,2) DEFAULT 0,
  communication_score DECIMAL(5,2) DEFAULT 0,
  return_rate DECIMAL(5,2) DEFAULT 0,
  avg_delivery_days DECIMAL(5,1) DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_issues INTEGER DEFAULT 0,
  recommendation TEXT DEFAULT 'neutral' CHECK (recommendation IN ('preferred', 'recommended', 'neutral', 'caution', 'avoid')),
  ai_insights JSONB DEFAULT '{}',
  last_evaluated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

ALTER TABLE public.supplier_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own supplier scores" ON public.supplier_scores FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- P2-3: Détection d'opportunités produit
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_product_id UUID,
  opportunity_type TEXT NOT NULL DEFAULT 'high_margin' CHECK (opportunity_type IN ('high_margin', 'trending', 'low_competition', 'seasonal', 'bundle', 'upsell')),
  opportunity_score DECIMAL(5,2) DEFAULT 0,
  estimated_margin DECIMAL(10,2),
  estimated_demand INTEGER,
  competition_level TEXT DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high', 'very_high')),
  reasoning TEXT,
  ai_analysis JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own opportunities" ON public.product_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_product_opportunities_user ON public.product_opportunities(user_id, status, opportunity_score DESC);

-- =============================================
-- P2-4: Alertes intelligentes unifiées
-- =============================================
CREATE TABLE IF NOT EXISTS public.smart_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_category TEXT NOT NULL CHECK (alert_category IN ('price', 'stock', 'supplier', 'performance', 'opportunity', 'anomaly', 'system')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
  title TEXT NOT NULL,
  message TEXT,
  source TEXT,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  auto_resolved BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own smart alerts" ON public.smart_alerts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_smart_alerts_user_unresolved ON public.smart_alerts(user_id, is_resolved, priority_score DESC);
CREATE INDEX idx_smart_alerts_category ON public.smart_alerts(user_id, alert_category, created_at DESC);

-- Trigger pour updated_at sur supplier_scores
CREATE TRIGGER update_supplier_scores_updated_at
  BEFORE UPDATE ON public.supplier_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
