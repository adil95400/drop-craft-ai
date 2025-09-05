-- Tables pour le Hub Fournisseurs & Import multi-formats

-- Table des fournisseurs avec toutes les données nécessaires
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  supplier_type TEXT NOT NULL DEFAULT 'api', -- api, ftp, csv, xml, email
  country TEXT,
  sector TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  
  -- Connexion et authentification
  connection_status TEXT NOT NULL DEFAULT 'disconnected', -- connected, disconnected, error
  api_endpoint TEXT,
  api_key TEXT,
  encrypted_credentials JSONB DEFAULT '{}',
  
  -- Informations de contact (sensibles)
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Métriques et statistiques
  product_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100.0,
  error_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Suivi des accès (sécurité)
  access_count INTEGER DEFAULT 0,
  last_access_at TIMESTAMP WITH TIME ZONE,
  credentials_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des flux de données des fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL, -- csv, xml, api, ftp
  feed_url TEXT,
  
  -- Configuration du flux
  feed_config JSONB DEFAULT '{}',
  mapping_config JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{}',
  
  -- Statut et métriques
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, error
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'daily', -- manual, hourly, daily, weekly
  
  -- Statistiques
  total_imports INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits importés des fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  feed_id UUID REFERENCES public.supplier_feeds(id) ON DELETE SET NULL,
  
  -- Identifiants produit
  external_id TEXT NOT NULL, -- ID chez le fournisseur
  sku TEXT,
  ean TEXT,
  
  -- Informations produit
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  
  -- Prix et stock
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  stock_quantity INTEGER DEFAULT 0,
  
  -- Images et médias
  images JSONB DEFAULT '[]',
  main_image_url TEXT,
  
  -- Attributs et métadonnées
  attributes JSONB DEFAULT '{}',
  supplier_data JSONB DEFAULT '{}',
  
  -- Statut et qualité
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, out_of_stock
  quality_score NUMERIC DEFAULT 0,
  import_quality_score NUMERIC DEFAULT 0,
  
  -- Suivi des modifications
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(supplier_id, external_id)
);

-- Table des jobs d'ingestion de données
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES public.supplier_feeds(id) ON DELETE CASCADE,
  
  job_type TEXT NOT NULL, -- csv_import, xml_import, api_sync, ftp_sync, manual_upload
  job_name TEXT NOT NULL,
  
  -- Configuration du job
  input_config JSONB DEFAULT '{}',
  mapping_config JSONB DEFAULT '{}',
  
  -- Statut et progression
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- Résultats
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- Données et erreurs
  result_data JSONB DEFAULT '{}',
  error_details JSONB DEFAULT '[]',
  
  -- Timestamps
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Amélioration de la table profiles pour les rôles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'admin_mode') THEN
    ALTER TABLE public.profiles ADD COLUMN admin_mode TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'standard';
  END IF;
END $$;

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les fournisseurs
CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own supplier feeds" ON public.supplier_feeds
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own supplier products" ON public.supplier_products
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ingestion jobs" ON public.ingestion_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Trigger pour mettre à jour le nombre de produits des fournisseurs
CREATE OR REPLACE FUNCTION public.update_supplier_product_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.suppliers 
  SET product_count = (
    SELECT COUNT(*) 
    FROM public.supplier_products 
    WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
  )
  WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS update_supplier_count ON public.supplier_products;
CREATE TRIGGER update_supplier_count
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_product_count();

-- Trigger pour les timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Appliquer les triggers updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_feeds_updated_at BEFORE UPDATE ON public.supplier_feeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ingestion_jobs_updated_at BEFORE UPDATE ON public.ingestion_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();