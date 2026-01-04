-- Table pour la gestion des retours (RMA)
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  rma_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'inspecting', 'refunded', 'rejected', 'completed')),
  reason TEXT NOT NULL,
  reason_category TEXT CHECK (reason_category IN ('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'other')),
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  refund_amount NUMERIC(10,2),
  refund_method TEXT CHECK (refund_method IN ('original_payment', 'store_credit', 'exchange')),
  tracking_number TEXT,
  carrier TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  inspected_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_returns_user_id ON public.returns(user_id);
CREATE INDEX idx_returns_order_id ON public.returns(order_id);
CREATE INDEX idx_returns_customer_id ON public.returns(customer_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_rma_number ON public.returns(rma_number);

-- RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own returns"
ON public.returns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own returns"
ON public.returns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own returns"
ON public.returns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own returns"
ON public.returns FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour générer un numéro RMA unique
CREATE OR REPLACE FUNCTION public.generate_rma_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_rma TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_rma := 'RMA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
    
    -- Check if RMA number already exists
    IF NOT EXISTS (SELECT 1 FROM public.returns WHERE rma_number = new_rma) THEN
      RETURN new_rma;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Could not generate unique RMA number';
    END IF;
  END LOOP;
END;
$$;