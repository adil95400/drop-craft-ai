-- Phase 1: Audit Core Tables

-- Table pour stocker les résultats d'audit des produits
CREATE TABLE IF NOT EXISTS public.product_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL CHECK (product_source IN ('products', 'imported_products', 'supplier_products')),
  audit_type TEXT NOT NULL CHECK (audit_type IN ('full', 'quick', 'seo_only')),
  overall_score DECIMAL(3,1) CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Scores détaillés
  title_score DECIMAL(3,1) CHECK (title_score >= 0 AND title_score <= 100),
  description_score DECIMAL(3,1) CHECK (description_score >= 0 AND description_score <= 100),
  image_score DECIMAL(3,1) CHECK (image_score >= 0 AND image_score <= 100),
  seo_score DECIMAL(3,1) CHECK (seo_score >= 0 AND seo_score <= 100),
  pricing_score DECIMAL(3,1) CHECK (pricing_score >= 0 AND pricing_score <= 100),
  variants_score DECIMAL(3,1) CHECK (variants_score >= 0 AND variants_score <= 100),
  
  -- Erreurs et recommandations
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Contenu suggéré par IA
  suggested_title TEXT,
  suggested_description TEXT,
  suggested_tags TEXT[],
  
  -- Métadonnées
  audit_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les attributs IA générés
CREATE TABLE IF NOT EXISTS public.product_ai_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL CHECK (product_source IN ('products', 'imported_products', 'supplier_products')),
  
  -- Attributs générés
  material TEXT,
  color TEXT[],
  style TEXT[],
  target_audience TEXT[],
  season TEXT[],
  
  -- Catégorisation IA
  ai_category TEXT,
  ai_subcategory TEXT,
  category_confidence DECIMAL(3,2) CHECK (category_confidence >= 0 AND category_confidence <= 1),
  
  -- SEO
  seo_keywords TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  
  -- Analyse shopping
  google_shopping_ready BOOLEAN DEFAULT false,
  chatgpt_shopping_ready BOOLEAN DEFAULT false,
  shopping_readiness_issues JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les règles d'audit personnalisées
CREATE TABLE IF NOT EXISTS public.audit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('title', 'description', 'image', 'seo', 'pricing', 'variants')),
  
  -- Configuration de la règle
  condition JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  message TEXT NOT NULL,
  recommendation TEXT,
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour l'historique des rewrites
CREATE TABLE IF NOT EXISTS public.product_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL CHECK (product_source IN ('products', 'imported_products', 'supplier_products')),
  
  rewrite_type TEXT NOT NULL CHECK (rewrite_type IN ('title', 'description', 'both')),
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'luxury', 'technical', 'creative')),
  
  -- Contenu original et réécrit
  original_title TEXT,
  original_description TEXT,
  rewritten_title TEXT,
  rewritten_description TEXT,
  
  -- Métadonnées
  was_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  ai_model TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les analytics d'audit
CREATE TABLE IF NOT EXISTS public.audit_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  
  -- Métriques
  total_audits INTEGER DEFAULT 0,
  avg_overall_score DECIMAL(5,2),
  products_with_errors INTEGER DEFAULT 0,
  products_optimized INTEGER DEFAULT 0,
  
  -- Scores moyens par catégorie
  avg_title_score DECIMAL(5,2),
  avg_description_score DECIMAL(5,2),
  avg_seo_score DECIMAL(5,2),
  avg_image_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_audits_user_id ON public.product_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_product_audits_product_id ON public.product_audits(product_id, product_source);
CREATE INDEX IF NOT EXISTS idx_product_audits_created_at ON public.product_audits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_ai_attributes_user_id ON public.product_ai_attributes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ai_attributes_product_id ON public.product_ai_attributes(product_id, product_source);

CREATE INDEX IF NOT EXISTS idx_audit_rules_user_id ON public.audit_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_rules_active ON public.audit_rules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_rewrites_user_id ON public.product_rewrites(user_id);
CREATE INDEX IF NOT EXISTS idx_product_rewrites_product_id ON public.product_rewrites(product_id, product_source);

CREATE INDEX IF NOT EXISTS idx_audit_analytics_user_date ON public.audit_analytics(user_id, date DESC);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION public.update_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_product_audits_updated_at
  BEFORE UPDATE ON public.product_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_updated_at();

CREATE TRIGGER update_product_ai_attributes_updated_at
  BEFORE UPDATE ON public.product_ai_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_updated_at();

CREATE TRIGGER update_audit_rules_updated_at
  BEFORE UPDATE ON public.audit_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_updated_at();

CREATE TRIGGER update_audit_analytics_updated_at
  BEFORE UPDATE ON public.audit_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_updated_at();

-- RLS Policies
ALTER TABLE public.product_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ai_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rewrites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour product_audits
CREATE POLICY "Users can view their own product audits"
  ON public.product_audits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product audits"
  ON public.product_audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product audits"
  ON public.product_audits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product audits"
  ON public.product_audits FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour product_ai_attributes
CREATE POLICY "Users can view their own product attributes"
  ON public.product_ai_attributes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product attributes"
  ON public.product_ai_attributes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product attributes"
  ON public.product_ai_attributes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product attributes"
  ON public.product_ai_attributes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour audit_rules
CREATE POLICY "Users can view their own audit rules"
  ON public.audit_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audit rules"
  ON public.audit_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit rules"
  ON public.audit_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit rules"
  ON public.audit_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour product_rewrites
CREATE POLICY "Users can view their own product rewrites"
  ON public.product_rewrites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product rewrites"
  ON public.product_rewrites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour audit_analytics
CREATE POLICY "Users can view their own audit analytics"
  ON public.audit_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own audit analytics"
  ON public.audit_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit analytics"
  ON public.audit_analytics FOR UPDATE
  USING (auth.uid() = user_id);