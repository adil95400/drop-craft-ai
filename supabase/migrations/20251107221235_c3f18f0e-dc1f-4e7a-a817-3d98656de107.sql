-- Create product_history table for tracking all product changes
CREATE TABLE IF NOT EXISTS public.product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'restored')),
  changed_fields JSONB NOT NULL DEFAULT '{}',
  previous_values JSONB,
  new_values JSONB,
  snapshot JSONB NOT NULL,
  changed_by_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view their own product history"
ON public.product_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert their own product history"
ON public.product_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_product_history_user_id ON public.product_history(user_id);
CREATE INDEX idx_product_history_product_id ON public.product_history(product_id);
CREATE INDEX idx_product_history_created_at ON public.product_history(created_at DESC);
CREATE INDEX idx_product_history_change_type ON public.product_history(change_type);

-- Function to automatically clean old history (keep last 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_product_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.product_history
  WHERE created_at < now() - interval '6 months';
END;
$$;

COMMENT ON TABLE public.product_history IS 'Tracks all changes made to products for audit and restore purposes';