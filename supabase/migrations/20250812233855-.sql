-- Création des tables pour le système d'import optimisé

-- Table pour les imports avec tracking avancé
CREATE TABLE IF NOT EXISTS public.product_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('csv', 'url', 'api', 'xml', 'image', 'extension', 'bulk')),
  source_name VARCHAR(255),
  source_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Métriques de performance
  products_imported INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  
  -- Configuration et données
  import_config JSONB DEFAULT '{}',
  import_data JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- IA et optimisation
  ai_processing_enabled BOOLEAN DEFAULT false,
  ai_optimization_results JSONB DEFAULT '{}',
  quality_score DECIMAL(3,2),
  
  -- Audit et timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les produits importés avec données enrichies
CREATE TABLE IF NOT EXISTS public.imported_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES public.product_imports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Données produit de base
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  sku VARCHAR(100),
  category VARCHAR(200),
  
  -- Données fournisseur
  supplier_name VARCHAR(200),
  supplier_url TEXT,
  supplier_product_id VARCHAR(200),
  
  -- Médias
  image_urls TEXT[],
  video_urls TEXT[],
  
  -- SEO et marketing
  tags TEXT[],
  keywords TEXT[],
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Statut et workflow
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived')),
  review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_changes')),
  
  -- IA et optimisation
  ai_optimized BOOLEAN DEFAULT false,
  ai_optimization_data JSONB DEFAULT '{}',
  ai_score DECIMAL(3,2),
  ai_recommendations JSONB DEFAULT '{}',
  
  -- Analytics et performance
  import_quality_score DECIMAL(3,2),
  data_completeness_score DECIMAL(3,2),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les sessions d'import (batch processing)
CREATE TABLE IF NOT EXISTS public.import_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  session_name VARCHAR(200),
  description TEXT,
  
  -- Configuration
  import_config JSONB DEFAULT '{}',
  ai_settings JSONB DEFAULT '{}',
  
  -- Métriques de session
  total_imports INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  
  -- Statut
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour le cache des données fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  product_url TEXT NOT NULL,
  
  -- Données mises en cache
  cached_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Gestion du cache
  cache_key VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_product_imports_user_status ON public.product_imports(user_id, status);
CREATE INDEX IF NOT EXISTS idx_product_imports_created_at ON public.product_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imported_products_import_id ON public.imported_products(import_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_user_status ON public.imported_products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_imported_products_ai_score ON public.imported_products(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_cache_key ON public.supplier_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_supplier_cache_expires ON public.supplier_cache(expires_at);

-- RLS Policies
ALTER TABLE public.product_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_cache ENABLE ROW LEVEL SECURITY;

-- Policies pour product_imports
CREATE POLICY "Users can view their own imports" ON public.product_imports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imports" ON public.product_imports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imports" ON public.product_imports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imports" ON public.product_imports
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour imported_products
CREATE POLICY "Users can view their own imported products" ON public.imported_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported products" ON public.imported_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported products" ON public.imported_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported products" ON public.imported_products
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour import_sessions
CREATE POLICY "Users can view their own import sessions" ON public.import_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import sessions" ON public.import_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import sessions" ON public.import_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour supplier_cache
CREATE POLICY "Users can view their own supplier cache" ON public.supplier_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplier cache" ON public.supplier_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier cache" ON public.supplier_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplier cache" ON public.supplier_cache
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour nettoyer le cache expiré
CREATE OR REPLACE FUNCTION clean_expired_supplier_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.supplier_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_imports_updated_at 
  BEFORE UPDATE ON public.product_imports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imported_products_updated_at 
  BEFORE UPDATE ON public.imported_products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_sessions_updated_at 
  BEFORE UPDATE ON public.import_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_cache_updated_at 
  BEFORE UPDATE ON public.supplier_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();