-- Add missing columns to imported_products table for quick import functionality
ALTER TABLE public.imported_products
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_product_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_imported_products_supplier ON public.imported_products(supplier_name, supplier_product_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_sync_status ON public.imported_products(sync_status);