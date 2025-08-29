-- Fix the previous migration error - ensure sync_enabled column exists
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;

-- Now create the index that was failing
CREATE INDEX IF NOT EXISTS idx_suppliers_next_sync 
ON public.suppliers(next_sync_at) 
WHERE sync_enabled = true;