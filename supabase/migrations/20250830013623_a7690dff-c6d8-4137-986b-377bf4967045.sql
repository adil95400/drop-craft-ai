-- Enhanced supplier management architecture for 1000+ suppliers

-- Update suppliers table with comprehensive structure
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  supplier_type TEXT DEFAULT 'manual' CHECK (supplier_type IN ('api', 'xml', 'csv', 'manual', 'ftp', 'json'));

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  sector TEXT;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  logo_url TEXT;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  description TEXT;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'pending'));

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  last_sync_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual'));

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  product_count INTEGER DEFAULT 0;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS
  tags TEXT[];

-- Create supplier_feeds table for CSV/XML/API configurations
CREATE TABLE IF NOT EXISTS public.supplier_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feed_type TEXT NOT NULL CHECK (feed_type IN ('csv', 'xml', 'json', 'api')),
  feed_url TEXT,
  feed_config JSONB DEFAULT '{}',
  field_mapping JSONB DEFAULT '{}',
  authentication JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_import_at TIMESTAMP WITH TIME ZONE,
  last_import_status TEXT DEFAULT 'pending' CHECK (last_import_status IN ('success', 'error', 'pending', 'processing')),
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for supplier_feeds
ALTER TABLE public.supplier_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier feeds" ON public.supplier_feeds
FOR ALL USING (auth.uid() = user_id);

-- Create supplier_products table for denormalized product data
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  external_sku TEXT NOT NULL,
  global_sku TEXT GENERATED ALWAYS AS (supplier_id::TEXT || '-' || external_sku) STORED,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  stock_quantity INTEGER DEFAULT 0,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  ean TEXT,
  upc TEXT,
  image_urls TEXT[],
  attributes JSONB DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  import_batch_id UUID,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id, external_sku)
);

-- Enable RLS for supplier_products
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier products" ON public.supplier_products
FOR ALL USING (auth.uid() = user_id);

-- Create import_batches table for tracking bulk imports
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  batch_type TEXT NOT NULL CHECK (batch_type IN ('csv', 'xml', 'json', 'api')),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  total_products INTEGER DEFAULT 0,
  processed_products INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for import_batches
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import batches" ON public.import_batches
FOR ALL USING (auth.uid() = user_id);

-- Create supplier_marketplace table for marketplace display
CREATE TABLE IF NOT EXISTS public.supplier_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  marketing_copy TEXT,
  integration_complexity TEXT DEFAULT 'medium' CHECK (integration_complexity IN ('easy', 'medium', 'hard')),
  setup_time_minutes INTEGER DEFAULT 60,
  supported_countries TEXT[],
  min_order_value NUMERIC(10,2),
  commission_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for supplier_marketplace
ALTER TABLE public.supplier_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketplace suppliers" ON public.supplier_marketplace
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own marketplace entries" ON public.supplier_marketplace
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance with 1000+ suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON public.suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_sector ON public.suppliers(sector);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON public.suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(connection_status);
CREATE INDEX IF NOT EXISTS idx_supplier_products_global_sku ON public.supplier_products(global_sku);
CREATE INDEX IF NOT EXISTS idx_supplier_products_ean ON public.supplier_products(ean);
CREATE INDEX IF NOT EXISTS idx_supplier_products_category ON public.supplier_products(category);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.import_batches(status);

-- Create function to update supplier product count
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update product count
DROP TRIGGER IF EXISTS trigger_update_supplier_product_count ON public.supplier_products;
CREATE TRIGGER trigger_update_supplier_product_count
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_product_count();

-- Create function for supplier search with filters
CREATE OR REPLACE FUNCTION public.search_suppliers(
  search_term TEXT DEFAULT NULL,
  country_filter TEXT DEFAULT NULL,
  sector_filter TEXT DEFAULT NULL,
  supplier_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  supplier_type TEXT,
  country TEXT,
  sector TEXT,
  logo_url TEXT,
  description TEXT,
  connection_status TEXT,
  product_count INTEGER,
  tags TEXT[],
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.supplier_type,
    s.country,
    s.sector,
    s.logo_url,
    s.description,
    s.connection_status,
    s.product_count,
    s.tags,
    s.rating,
    s.created_at
  FROM public.suppliers s
  WHERE 
    s.user_id = auth.uid()
    AND (search_term IS NULL OR s.name ILIKE '%' || search_term || '%' OR s.description ILIKE '%' || search_term || '%')
    AND (country_filter IS NULL OR s.country = country_filter)
    AND (sector_filter IS NULL OR s.sector = sector_filter)
    AND (supplier_type_filter IS NULL OR s.supplier_type = supplier_type_filter)
  ORDER BY s.product_count DESC, s.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;