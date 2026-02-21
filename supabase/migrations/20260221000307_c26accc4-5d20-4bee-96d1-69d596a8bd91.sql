
-- Phase 1.1: Add setting_key and setting_value columns to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS setting_key text,
ADD COLUMN IF NOT EXISTS setting_value jsonb;

-- Add unique constraint for upsert on (user_id, setting_key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id_setting_key 
ON public.user_settings (user_id, setting_key);

-- Phase 1.2: Create published_products table
CREATE TABLE IF NOT EXISTS public.published_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  marketplace_id uuid,
  platform text NOT NULL,
  external_product_id text,
  status text DEFAULT 'pending',
  published_at timestamptz,
  last_synced_at timestamptz,
  sync_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.published_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own published products"
ON public.published_products FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_published_products_updated_at
BEFORE UPDATE ON public.published_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 1.2b: Create marketplace_integrations table
CREATE TABLE IF NOT EXISTS public.marketplace_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  shop_name text,
  status text DEFAULT 'disconnected',
  credentials_encrypted jsonb,
  settings jsonb DEFAULT '{}',
  last_sync_at timestamptz,
  sync_status text DEFAULT 'idle',
  products_count integer DEFAULT 0,
  orders_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own marketplace integrations"
ON public.marketplace_integrations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_marketplace_integrations_updated_at
BEFORE UPDATE ON public.marketplace_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
