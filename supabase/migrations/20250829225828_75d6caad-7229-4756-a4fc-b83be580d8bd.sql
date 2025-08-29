-- Add all missing columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS next_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Add missing columns to supplier_feeds table  
ALTER TABLE public.supplier_feeds
ADD COLUMN IF NOT EXISTS next_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Now create the indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_next_sync 
ON public.suppliers(next_sync_at) 
WHERE sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_supplier_feeds_next_sync 
ON public.supplier_feeds(next_sync_at) 
WHERE auto_sync = true;