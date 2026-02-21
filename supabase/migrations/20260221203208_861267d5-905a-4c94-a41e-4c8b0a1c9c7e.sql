-- Add supplier tracking columns to auto_order_queue
ALTER TABLE public.auto_order_queue 
  ADD COLUMN IF NOT EXISTS supplier_order_id TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Add Shopify fulfillment tracking to fulfillment_shipments
ALTER TABLE public.fulfillment_shipments
  ADD COLUMN IF NOT EXISTS supplier_order_id TEXT,
  ADD COLUMN IF NOT EXISTS supplier_order_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shopify_fulfillment_id TEXT,
  ADD COLUMN IF NOT EXISTS shopify_synced_at TIMESTAMPTZ;

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_auto_order_queue_status_retry 
  ON public.auto_order_queue(status, next_retry_at) 
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_tracking_sync
  ON public.fulfillment_shipments(status, shopify_fulfillment_id)
  WHERE shopify_fulfillment_id IS NULL AND tracking_number IS NOT NULL;