-- Tables pour les intégrations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform_type TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  platform_url TEXT,
  shop_domain TEXT,
  seller_id TEXT,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  encrypted_credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected',
  sync_frequency TEXT DEFAULT 'manual',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  store_config JSONB DEFAULT '{}',
  sync_settings JSONB DEFAULT '{}',
  last_error TEXT,
  last_credential_access TIMESTAMP WITH TIME ZONE,
  require_additional_auth BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tables pour les fournisseurs
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  country TEXT,
  supplier_type TEXT DEFAULT 'marketplace',
  sector TEXT,
  status TEXT DEFAULT 'inactive',
  connection_status TEXT DEFAULT 'disconnected',
  api_key TEXT,
  api_secret TEXT,
  encrypted_credentials JSONB DEFAULT '{}',
  api_endpoint TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  product_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  success_rate NUMERIC DEFAULT 100,
  error_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_access_at TIMESTAMP WITH TIME ZONE,
  credentials_updated_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tables pour les produits fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  category TEXT,
  brand TEXT,
  sku TEXT,
  stock_quantity INTEGER DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  attributes JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id, external_id)
);

-- Tables pour les jobs d'import avancés
CREATE TABLE IF NOT EXISTS public.import_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method_type TEXT NOT NULL,
  method_name TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_methods ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can manage their integrations" 
ON public.integrations FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their suppliers" 
ON public.suppliers FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their supplier products" 
ON public.supplier_products FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their import methods" 
ON public.import_methods FOR ALL 
USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_import_methods_updated_at BEFORE UPDATE ON public.import_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();