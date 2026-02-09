
-- Table dédiée aux résultats d'enrichissement IA produits
CREATE TABLE public.product_ai_enrichments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.background_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  
  -- Input snapshot
  original_title TEXT,
  original_description TEXT,
  original_category TEXT,
  
  -- AI output
  enriched_title TEXT,
  enriched_description TEXT,
  enriched_category TEXT,
  enriched_seo_title TEXT,
  enriched_seo_description TEXT,
  enriched_tags TEXT[],
  
  -- Metadata
  model TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
  prompt_version TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  tone TEXT NOT NULL DEFAULT 'professionnel',
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'applied', 'rejected', 'failed')),
  error_message TEXT,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_product_ai_enrichments_product ON public.product_ai_enrichments(product_id);
CREATE INDEX idx_product_ai_enrichments_user ON public.product_ai_enrichments(user_id);
CREATE INDEX idx_product_ai_enrichments_job ON public.product_ai_enrichments(job_id);
CREATE INDEX idx_product_ai_enrichments_status ON public.product_ai_enrichments(status);

-- RLS
ALTER TABLE public.product_ai_enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrichments"
  ON public.product_ai_enrichments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrichments"
  ON public.product_ai_enrichments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrichments"
  ON public.product_ai_enrichments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrichments"
  ON public.product_ai_enrichments FOR DELETE
  USING (auth.uid() = user_id);

-- Service role needs insert access from edge functions
CREATE POLICY "Service role full access"
  ON public.product_ai_enrichments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_product_ai_enrichments_updated_at
  BEFORE UPDATE ON public.product_ai_enrichments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
