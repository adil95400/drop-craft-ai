-- Create the complete supplier hub tables properly
-- First create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE feed_status AS ENUM ('active', 'inactive', 'error', 'processing');  
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country TEXT,
  
  -- API configuration  
  api_endpoint TEXT,
  api_key TEXT,
  api_secret TEXT,
  encrypted_credentials JSONB DEFAULT '{}'::jsonb,
  
  -- Contact info
  contact_email TEXT,
  contact_phone TEXT,
  business_address JSONB DEFAULT '{}'::jsonb,
  
  -- Status & metrics
  status supplier_status DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  
  -- Sync settings
  sync_frequency TEXT DEFAULT 'daily',
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, name)
);

-- Enable RLS and create policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
CREATE POLICY "Users can manage their own suppliers"
  ON public.suppliers FOR ALL
  USING (auth.uid() = user_id);

-- Create supplier feeds table
CREATE TABLE IF NOT EXISTS public.supplier_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feed configuration
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  feed_url TEXT,
  field_mapping JSONB DEFAULT '{}'::jsonb,
  
  -- Sync settings  
  sync_frequency TEXT DEFAULT 'daily',
  auto_sync BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Status
  status feed_status DEFAULT 'active',
  total_records INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, name)
);

-- Enable RLS and create policies  
ALTER TABLE public.supplier_feeds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own supplier feeds" ON public.supplier_feeds;
CREATE POLICY "Users can manage their own supplier feeds"
  ON public.supplier_feeds FOR ALL
  USING (auth.uid() = user_id);

-- Create supplier products table
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES public.supplier_feeds(id) ON DELETE SET NULL,
  
  -- Product info
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  category TEXT,
  
  -- Pricing & inventory
  cost_price DECIMAL(12,2),
  suggested_price DECIMAL(12,2),
  currency TEXT DEFAULT 'EUR',
  stock_quantity INTEGER DEFAULT 0,
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Identifiers
  sku TEXT,
  ean TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, external_id)
);

-- Enable RLS and create policies
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view supplier products from their suppliers" ON public.supplier_products;
CREATE POLICY "Users can view supplier products from their suppliers"
  ON public.supplier_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s 
    WHERE s.id = supplier_products.supplier_id 
    AND s.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_next_sync ON public.suppliers(next_sync_at) WHERE sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_supplier_feeds_supplier_id ON public.supplier_feeds(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_feeds_user_id ON public.supplier_feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_feeds_next_sync ON public.supplier_feeds(next_sync_at) WHERE auto_sync = true;

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_external_id ON public.supplier_products(supplier_id, external_id);