-- === CRÉATION DES TABLES FONDAMENTALES ===

-- 1. Étendre la table profiles
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

-- 2. Créer table supplier_feeds si elle n'existe pas
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

-- 3. Créer table ingestion_jobs si elle n'existe pas
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

-- 4. Créer table store_integrations si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.store_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'prestashop', 'amazon', 'ebay', 'cdiscount', 'tiktok')),
  store_name TEXT NOT NULL,
  store_url TEXT,
  credentials JSONB NOT NULL DEFAULT '{}',
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

-- 5. Créer table order_routing si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.order_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_integration_id UUID REFERENCES public.store_integrations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  external_order_id TEXT,
  supplier_order_id TEXT,
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

-- 6. Créer table sync_history si elle n'existe pas
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

-- 7. Créer les fonctions utilitaires
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'user') FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role = 'admin', false) FROM public.profiles WHERE id = auth.uid();
$$;