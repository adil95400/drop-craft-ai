-- Product Scoring System
-- Système de scoring qualité des produits

CREATE TABLE public.product_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) DEFAULT 0,
  title_score DECIMAL(5,2) DEFAULT 0,
  description_score DECIMAL(5,2) DEFAULT 0,
  images_score DECIMAL(5,2) DEFAULT 0,
  seo_score DECIMAL(5,2) DEFAULT 0,
  pricing_score DECIMAL(5,2) DEFAULT 0,
  attributes_score DECIMAL(5,2) DEFAULT 0,
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  last_analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

-- Scoring rules configuration
CREATE TABLE public.scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('title', 'description', 'images', 'seo', 'pricing', 'attributes')),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('required', 'length', 'keyword', 'pattern', 'range', 'count')),
  config JSONB NOT NULL DEFAULT '{}',
  weight DECIMAL(5,2) DEFAULT 1,
  penalty DECIMAL(5,2) DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scoring batch history
CREATE TABLE public.scoring_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  products_analyzed INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  score_distribution JSONB,
  top_issues JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE public.product_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own product scores"
  ON public.product_scores FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view global or own scoring rules"
  ON public.scoring_rules FOR SELECT
  USING (is_global = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own scoring rules"
  ON public.scoring_rules FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scoring batches"
  ON public.scoring_batches FOR ALL
  USING (auth.uid() = user_id);

-- Insert default global scoring rules
INSERT INTO public.scoring_rules (user_id, name, category, rule_type, config, weight, penalty, is_global) VALUES
('00000000-0000-0000-0000-000000000000', 'Titre minimum 30 caractères', 'title', 'length', '{"min": 30}', 1, 15, true),
('00000000-0000-0000-0000-000000000000', 'Titre maximum 80 caractères', 'title', 'length', '{"max": 80}', 1, 10, true),
('00000000-0000-0000-0000-000000000000', 'Description minimum 150 caractères', 'description', 'length', '{"min": 150}', 1.5, 20, true),
('00000000-0000-0000-0000-000000000000', 'Minimum 3 images', 'images', 'count', '{"min": 3}', 1.5, 25, true),
('00000000-0000-0000-0000-000000000000', 'Prix défini', 'pricing', 'required', '{"field": "price"}', 2, 30, true),
('00000000-0000-0000-0000-000000000000', 'Meta description présente', 'seo', 'required', '{"field": "meta_description"}', 1, 15, true);