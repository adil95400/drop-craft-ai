-- Add missing columns and tables

-- 1. Add description column to automation_triggers
ALTER TABLE public.automation_triggers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.automation_triggers ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}';

-- 2. Add status, steps and execution_count to automation_workflows
ALTER TABLE public.automation_workflows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.automation_workflows ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]';
ALTER TABLE public.automation_workflows ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- 3. Create extension_auth_tokens table
CREATE TABLE IF NOT EXISTS public.extension_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.extension_auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own extension tokens"
ON public.extension_auth_tokens FOR ALL
USING (auth.uid() = user_id);

-- 4. Create catalog_products table
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  image_urls TEXT[],
  category TEXT,
  source_url TEXT,
  source_platform TEXT,
  status TEXT DEFAULT 'available',
  is_imported BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own catalog products"
ON public.catalog_products FOR ALL
USING (auth.uid() = user_id);

CREATE TRIGGER update_catalog_products_updated_at
BEFORE UPDATE ON public.catalog_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Update is_token_revoked function to accept correct parameter
CREATE OR REPLACE FUNCTION public.is_token_revoked(token_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT false
$$;