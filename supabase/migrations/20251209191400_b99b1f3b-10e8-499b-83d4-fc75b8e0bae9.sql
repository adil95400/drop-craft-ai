-- Create returns_rma table for managing product returns
CREATE TABLE public.returns_rma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  shipment_id UUID REFERENCES public.fulfillment_shipments(id),
  rma_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'received', 'inspected', 'refunded', 'completed', 'cancelled')),
  reason_category TEXT NOT NULL CHECK (reason_category IN ('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_in_transit', 'missing_parts', 'quality_issue', 'other')),
  reason TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refund_method TEXT CHECK (refund_method IN ('original_payment', 'store_credit', 'exchange', 'bank_transfer')),
  refund_status TEXT DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  return_label_url TEXT,
  return_tracking_number TEXT,
  return_carrier TEXT,
  received_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  images TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.returns_rma ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own returns"
  ON public.returns_rma FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own returns"
  ON public.returns_rma FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own returns"
  ON public.returns_rma FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own returns"
  ON public.returns_rma FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_returns_rma_user_id ON public.returns_rma(user_id);
CREATE INDEX idx_returns_rma_status ON public.returns_rma(status);
CREATE INDEX idx_returns_rma_rma_number ON public.returns_rma(rma_number);
CREATE INDEX idx_returns_rma_order_id ON public.returns_rma(order_id);
CREATE INDEX idx_returns_rma_requested_at ON public.returns_rma(requested_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_returns_rma_updated_at
  BEFORE UPDATE ON public.returns_rma
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate RMA number function
CREATE OR REPLACE FUNCTION public.generate_rma_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rma_number IS NULL OR NEW.rma_number = '' THEN
    NEW.rma_number := 'RMA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating RMA numbers
CREATE TRIGGER generate_rma_number_trigger
  BEFORE INSERT ON public.returns_rma
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_rma_number();