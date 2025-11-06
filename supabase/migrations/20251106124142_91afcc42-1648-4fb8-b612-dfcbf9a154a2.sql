-- Create published_products table for tracking marketplace publications
CREATE TABLE IF NOT EXISTS public.published_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  marketplace_id TEXT NOT NULL,
  external_listing_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sync_status TEXT DEFAULT 'manual',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unpublished_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  listing_data JSONB DEFAULT '{}'::jsonb,
  price_override NUMERIC,
  stock_override INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.published_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their published products"
  ON public.published_products
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_published_products_user_id ON public.published_products(user_id);
CREATE INDEX idx_published_products_product_id ON public.published_products(product_id);
CREATE INDEX idx_published_products_marketplace_id ON public.published_products(marketplace_id);
CREATE INDEX idx_published_products_status ON public.published_products(status);
CREATE INDEX idx_published_products_external_listing_id ON public.published_products(external_listing_id);

-- Create unique constraint to prevent duplicate publications
CREATE UNIQUE INDEX idx_unique_product_marketplace ON public.published_products(product_id, marketplace_id) 
WHERE status = 'active';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_published_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_published_products_updated_at
  BEFORE UPDATE ON public.published_products
  FOR EACH ROW
  EXECUTE FUNCTION update_published_products_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.published_products IS 'Tracks products published to various marketplaces';
COMMENT ON COLUMN public.published_products.marketplace_id IS 'Marketplace identifier (shopify, amazon, ebay, etc.)';
COMMENT ON COLUMN public.published_products.external_listing_id IS 'The listing/product ID on the external marketplace';
COMMENT ON COLUMN public.published_products.status IS 'Publication status: active, inactive, error, pending';
COMMENT ON COLUMN public.published_products.sync_status IS 'Sync mode: synced, manual, error';
COMMENT ON COLUMN public.published_products.listing_data IS 'Marketplace-specific listing data and metadata';
