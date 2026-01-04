-- Create a shared catalog table for supplier products (no user_id required)
CREATE TABLE IF NOT EXISTS public.supplier_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.premium_suppliers(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  sku TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  compare_at_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  stock_quantity INTEGER DEFAULT 0,
  category TEXT,
  brand TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  attributes JSONB DEFAULT '{}'::jsonb,
  weight NUMERIC(10,3),
  weight_unit TEXT DEFAULT 'kg',
  barcode TEXT,
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_name, external_product_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_supplier ON public.supplier_catalog(supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_category ON public.supplier_catalog(category);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_active ON public.supplier_catalog(is_active);

-- Enable RLS
ALTER TABLE public.supplier_catalog ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the catalog
CREATE POLICY "Authenticated users can read supplier catalog"
  ON public.supplier_catalog
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can modify the catalog (via edge functions with service role)
CREATE POLICY "Service role can manage supplier catalog"
  ON public.supplier_catalog
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_supplier_catalog_updated_at
  BEFORE UPDATE ON public.supplier_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();