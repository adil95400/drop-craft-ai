
-- Table pour tracker les événements de recommandation (clics, conversions)
CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'add_to_cart', 'purchase')),
  recommendation_id UUID REFERENCES public.ai_recommendations(id),
  product_id UUID REFERENCES public.products(id),
  recommended_product_id UUID REFERENCES public.products(id),
  strategy TEXT NOT NULL DEFAULT 'similar',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendation events"
  ON public.recommendation_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendation events"
  ON public.recommendation_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_recommendation_events_user ON public.recommendation_events(user_id);
CREATE INDEX idx_recommendation_events_type ON public.recommendation_events(event_type);
CREATE INDEX idx_recommendation_events_created ON public.recommendation_events(created_at);

-- Table pour les paires de produits fréquemment achetés ensemble
CREATE TABLE IF NOT EXISTS public.product_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  associated_product_id UUID NOT NULL REFERENCES public.products(id),
  association_type TEXT NOT NULL DEFAULT 'frequently_bought_together',
  score DECIMAL(5,4) NOT NULL DEFAULT 0,
  co_purchase_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, associated_product_id, association_type)
);

ALTER TABLE public.product_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own product associations"
  ON public.product_associations FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_product_associations_product ON public.product_associations(product_id);
CREATE INDEX idx_product_associations_score ON public.product_associations(score DESC);
