-- Create suppliers management system (corrected)
-- Only create tables and functions that don't exist

-- Create supplier products mapping table (if not exists)
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

-- Enable RLS on supplier_products if not already enabled
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'supplier_products' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for supplier_products
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'supplier_products' 
    AND policyname = 'Users can manage their supplier products'
  ) THEN
    CREATE POLICY "Users can manage their supplier products" 
    ON public.supplier_products FOR ALL 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create supplier sync jobs table (if not exists)
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

-- Enable RLS on supplier_sync_jobs if not already enabled
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'supplier_sync_jobs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.supplier_sync_jobs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for supplier_sync_jobs
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'supplier_sync_jobs' 
    AND policyname = 'Users can manage their supplier sync jobs'
  ) THEN
    CREATE POLICY "Users can manage their supplier sync jobs" 
    ON public.supplier_sync_jobs FOR ALL 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create triggers only if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_supplier_products_updated_at'
  ) THEN
    CREATE TRIGGER update_supplier_products_updated_at
      BEFORE UPDATE ON public.supplier_products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_supplier_sync_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_supplier_sync_jobs_updated_at
      BEFORE UPDATE ON public.supplier_sync_jobs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;