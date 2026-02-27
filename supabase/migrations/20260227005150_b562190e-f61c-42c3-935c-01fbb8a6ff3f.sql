
-- Table pour stocker les recommandations IA générées
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('trending', 'cross_sell', 'upsell', 'restock', 'pricing', 'bundle')),
  source_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  target_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  impact_estimate TEXT,
  impact_value NUMERIC(12,2),
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'applied', 'expired')),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour tracker les interactions client (pour collaborative filtering)
CREATE TABLE public.product_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'cart_add', 'purchase', 'wishlist', 'review', 'return')),
  quantity INTEGER DEFAULT 1,
  revenue NUMERIC(12,2),
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les paires fréquemment achetées ensemble
CREATE TABLE public.product_affinities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_a_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_b_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  co_occurrence_count INTEGER NOT NULL DEFAULT 1,
  affinity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_a_id, product_b_id)
);

-- Table pour les métriques de performance des recommandations
CREATE TABLE public.recommendation_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_generated INTEGER NOT NULL DEFAULT 0,
  total_accepted INTEGER NOT NULL DEFAULT 0,
  total_dismissed INTEGER NOT NULL DEFAULT 0,
  total_applied INTEGER NOT NULL DEFAULT 0,
  estimated_revenue_impact NUMERIC(12,2) DEFAULT 0,
  actual_revenue_impact NUMERIC(12,2),
  avg_confidence NUMERIC(5,2),
  top_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affinities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own recommendations" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own interactions" ON public.product_interactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own affinities" ON public.product_affinities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own metrics" ON public.recommendation_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_ai_recommendations_user_type ON public.ai_recommendations(user_id, recommendation_type, status);
CREATE INDEX idx_ai_recommendations_expires ON public.ai_recommendations(expires_at) WHERE status = 'pending';
CREATE INDEX idx_product_interactions_user ON public.product_interactions(user_id, product_id, interaction_type);
CREATE INDEX idx_product_interactions_created ON public.product_interactions(created_at DESC);
CREATE INDEX idx_product_affinities_lookup ON public.product_affinities(user_id, product_a_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
