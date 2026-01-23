-- Create price/stock history table for tracking changes
CREATE TABLE IF NOT EXISTS public.price_stock_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'price', 'stock', 'manual_update'
  old_value NUMERIC,
  new_value NUMERIC,
  change_percent NUMERIC,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_stock_history_user_id ON public.price_stock_history(user_id);
CREATE INDEX IF NOT EXISTS idx_price_stock_history_product_id ON public.price_stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_stock_history_detected_at ON public.price_stock_history(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_stock_history_change_type ON public.price_stock_history(change_type);

-- Enable RLS
ALTER TABLE public.price_stock_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own price history"
  ON public.price_stock_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price history"
  ON public.price_stock_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all price history"
  ON public.price_stock_history FOR ALL
  USING (auth.role() = 'service_role');

-- Add current_price and current_stock to price_stock_monitoring if missing
ALTER TABLE public.price_stock_monitoring 
  ADD COLUMN IF NOT EXISTS current_price NUMERIC,
  ADD COLUMN IF NOT EXISTS current_stock INTEGER,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Add unique constraint for upsert
ALTER TABLE public.price_stock_monitoring 
  DROP CONSTRAINT IF EXISTS price_stock_monitoring_user_product_unique;
  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'price_stock_monitoring_user_product_unique'
  ) THEN
    ALTER TABLE public.price_stock_monitoring 
      ADD CONSTRAINT price_stock_monitoring_user_product_unique UNIQUE (user_id, product_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_alerts;