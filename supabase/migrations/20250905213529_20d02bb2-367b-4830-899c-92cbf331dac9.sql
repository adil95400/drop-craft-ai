-- === REFONTE COMPLÈTE - FONDATIONS ===

-- 1. Étendre la table profiles avec le système de rôles et settings avancés
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'standard' CHECK (subscription_plan IN ('standard', 'pro', 'ultra')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
  "ai_import": false,
  "bulk_import": true,
  "advanced_analytics": false,
  "marketing_automation": false,
  "premium_integrations": false,
  "enterprise_features": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

-- 2. Créer les tables pour le Hub Fournisseurs
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country TEXT,
  sector TEXT,
  supplier_type TEXT DEFAULT 'marketplace' CHECK (supplier_type IN ('marketplace', 'dropshipping', 'api', 'wholesale')),
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'pending')),
  api_endpoint TEXT,
  api_key TEXT, -- Chiffré côté application
  encrypted_credentials JSONB DEFAULT '{}',
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  product_count INTEGER DEFAULT 0,
  tags TEXT[],
  rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  error_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 100.0,
  contact_email TEXT,
  contact_phone TEXT,
  access_count INTEGER DEFAULT 0,
  last_access_at TIMESTAMP WITH TIME ZONE,
  credentials_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Table pour les flux/feeds des fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL CHECK (feed_type IN ('xml', 'json', 'csv', 'api', 'ftp', 'email')),
  feed_url TEXT,
  feed_credentials JSONB DEFAULT '{}',
  mapping_config JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{"frequency": "daily", "time": "06:00"}',
  is_active BOOLEAN DEFAULT true,
  last_fetch_at TIMESTAMP WITH TIME ZONE,
  next_fetch_at TIMESTAMP WITH TIME ZONE,
  fetch_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Table pour les produits des fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT NOT NULL, -- ID chez le fournisseur
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  stock_quantity INTEGER DEFAULT 0,
  min_order_quantity INTEGER DEFAULT 1,
  images TEXT[],
  attributes JSONB DEFAULT '{}',
  variants JSONB DEFAULT '[]',
  shipping_info JSONB DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id, external_id)
);

-- 5. Table pour les tâches d'import/synchronisation
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('import', 'sync', 'update_prices', 'update_stock')),
  source_type TEXT CHECK (source_type IN ('csv', 'xml', 'json', 'api', 'ftp', 'url', 'email')),
  source_config JSONB DEFAULT '{}',
  mapping_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  results JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Table pour les intégrations e-commerce
CREATE TABLE IF NOT EXISTS public.store_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'prestashop', 'amazon', 'ebay', 'cdiscount', 'tiktok')),
  store_name TEXT NOT NULL,
  store_url TEXT,
  credentials JSONB NOT NULL DEFAULT '{}', -- API keys, tokens
  sync_settings JSONB DEFAULT '{
    "auto_sync": true,
    "sync_prices": true,
    "sync_stock": true,
    "sync_orders": true
  }',
  webhook_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('hourly', 'daily', 'manual')),
  product_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Table pour le routage des commandes
CREATE TABLE IF NOT EXISTS public.order_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_integration_id UUID REFERENCES public.store_integrations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  external_order_id TEXT, -- ID de commande chez le store
  supplier_order_id TEXT, -- ID de commande chez le fournisseur
  order_data JSONB NOT NULL,
  products JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent_to_supplier', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed')),
  tracking_number TEXT,
  tracking_url TEXT,
  total_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  shipping_address JSONB,
  customer_info JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Table pour l'historique des synchronisations
CREATE TABLE IF NOT EXISTS public.sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('supplier', 'store', 'products', 'orders', 'stock', 'prices')),
  entity_id UUID,
  sync_type TEXT CHECK (sync_type IN ('manual', 'scheduled', 'webhook', 'api')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  items_processed INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- === POLITIQUES RLS ===

-- Suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
  FOR ALL USING (auth.uid() = user_id);

-- Supplier feeds
ALTER TABLE public.supplier_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own supplier feeds" ON public.supplier_feeds
  FOR ALL USING (auth.uid() = user_id);

-- Supplier products
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own supplier products" ON public.supplier_products
  FOR ALL USING (auth.uid() = user_id);

-- Ingestion jobs
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own ingestion jobs" ON public.ingestion_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Store integrations
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own store integrations" ON public.store_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Order routing
ALTER TABLE public.order_routing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own order routing" ON public.order_routing
  FOR ALL USING (auth.uid() = user_id);

-- Sync history
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sync history" ON public.sync_history
  FOR ALL USING (auth.uid() = user_id);

-- === TRIGGERS POUR MISE À JOUR AUTOMATIQUE ===

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_feeds_updated_at BEFORE UPDATE ON public.supplier_feeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_products_updated_at BEFORE UPDATE ON public.supplier_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingestion_jobs_updated_at BEFORE UPDATE ON public.ingestion_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_integrations_updated_at BEFORE UPDATE ON public.store_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_routing_updated_at BEFORE UPDATE ON public.order_routing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour compter les produits par fournisseur
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_product_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_product_count();

-- === INDEXES POUR PERFORMANCE ===

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_connection_status ON public.suppliers(connection_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_type ON public.suppliers(supplier_type);

-- Supplier products
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_user_id ON public.supplier_products(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_external_id ON public.supplier_products(external_id);

-- Ingestion jobs
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user_id ON public.ingestion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created_at ON public.ingestion_jobs(created_at);

-- Store integrations
CREATE INDEX IF NOT EXISTS idx_store_integrations_user_id ON public.store_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_store_integrations_platform ON public.store_integrations(platform);

-- Order routing
CREATE INDEX IF NOT EXISTS idx_order_routing_user_id ON public.order_routing(user_id);
CREATE INDEX IF NOT EXISTS idx_order_routing_status ON public.order_routing(status);
CREATE INDEX IF NOT EXISTS idx_order_routing_created_at ON public.order_routing(created_at);