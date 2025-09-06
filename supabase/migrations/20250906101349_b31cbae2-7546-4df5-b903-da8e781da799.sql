-- Create suppliers management system
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  supplier_type TEXT NOT NULL DEFAULT 'api', -- 'api', 'csv', 'xml', 'ftp', 'email'
  country TEXT,
  sector TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  connection_status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'pending'
  api_endpoint TEXT,
  api_key TEXT, -- Encrypted sensitive data
  api_secret TEXT, -- Encrypted sensitive data
  ftp_host TEXT,
  ftp_username TEXT,
  ftp_password TEXT, -- Encrypted sensitive data
  email_settings JSONB DEFAULT '{}',
  sync_frequency TEXT DEFAULT 'daily', -- 'manual', 'hourly', 'daily', 'weekly'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  product_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100.0,
  error_count INTEGER DEFAULT 0,
  tags TEXT[],
  rating NUMERIC DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  pricing_model JSONB DEFAULT '{}', -- Commission, fixed, tiered pricing
  shipping_info JSONB DEFAULT '{}',
  return_policy TEXT,
  quality_score NUMERIC DEFAULT 0,
  reliability_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own suppliers" 
ON public.suppliers FOR ALL 
USING (auth.uid() = user_id);

-- Create supplier products mapping table
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  external_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  sku TEXT,
  ean TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  image_urls TEXT[],
  stock_quantity INTEGER DEFAULT 0,
  availability_status TEXT DEFAULT 'in_stock',
  shipping_cost NUMERIC DEFAULT 0,
  shipping_time TEXT,
  attributes JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, external_product_id)
);

-- Enable RLS
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their supplier products" 
ON public.supplier_products FOR ALL 
USING (auth.uid() = user_id);

-- Create supplier sync jobs table
CREATE TABLE IF NOT EXISTS public.supplier_sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'sync', -- 'sync', 'import', 'update_prices', 'update_stock'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  success_items INTEGER DEFAULT 0,
  error_items INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  sync_config JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their supplier sync jobs" 
ON public.supplier_sync_jobs FOR ALL 
USING (auth.uid() = user_id);

-- Create function to update supplier product count
CREATE OR REPLACE FUNCTION update_supplier_product_count()
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

-- Create trigger
CREATE TRIGGER update_supplier_product_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION update_supplier_product_count();

-- Create function for supplier search
CREATE OR REPLACE FUNCTION search_suppliers(
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

-- Add updated_at trigger for suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for supplier_products
CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for supplier_sync_jobs
CREATE TRIGGER update_supplier_sync_jobs_updated_at
  BEFORE UPDATE ON public.supplier_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();