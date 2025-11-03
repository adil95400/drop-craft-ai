-- Add publication tracking columns to imported_products
ALTER TABLE imported_products 
ADD COLUMN IF NOT EXISTS published_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'outdated'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_imported_products_published_id ON imported_products(published_product_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_sync_status ON imported_products(sync_status);

-- Add comment for documentation
COMMENT ON COLUMN imported_products.published_product_id IS 'Reference to the published product in products table';
COMMENT ON COLUMN imported_products.last_synced_at IS 'Last time the product was synced to products table';
COMMENT ON COLUMN imported_products.sync_status IS 'Status of synchronization: pending, synced, error, outdated';