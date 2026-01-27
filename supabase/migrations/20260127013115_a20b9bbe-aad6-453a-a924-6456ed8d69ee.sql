-- Create product_channel_mappings table for price sync functionality
CREATE TABLE public.product_channel_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL DEFAULT 'shopify',
  channel_id TEXT,
  external_product_id TEXT,
  external_variant_id TEXT,
  current_price NUMERIC(10,2),
  target_price NUMERIC(10,2),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_channel_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mappings"
ON public.product_channel_mappings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mappings"
ON public.product_channel_mappings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings"
ON public.product_channel_mappings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings"
ON public.product_channel_mappings FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_product_channel_mappings_user_id ON public.product_channel_mappings(user_id);
CREATE INDEX idx_product_channel_mappings_product_id ON public.product_channel_mappings(product_id);
CREATE INDEX idx_product_channel_mappings_channel ON public.product_channel_mappings(channel_type, channel_id);

-- Trigger for updated_at
CREATE TRIGGER update_product_channel_mappings_updated_at
BEFORE UPDATE ON public.product_channel_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();