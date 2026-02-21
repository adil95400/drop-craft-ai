
-- Table for auto-order rules (referenced by stock-monitor but missing)
CREATE TABLE IF NOT EXISTS public.auto_order_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_type TEXT NOT NULL DEFAULT 'cj',
  min_stock_trigger INTEGER NOT NULL DEFAULT 5,
  reorder_quantity INTEGER NOT NULL DEFAULT 10,
  max_price DECIMAL(10,2),
  preferred_shipping TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.auto_order_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own auto_order_rules"
  ON public.auto_order_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_auto_order_rules_updated_at
  BEFORE UPDATE ON public.auto_order_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add auto_order_settings column to user_settings if missing
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS auto_order_settings JSONB DEFAULT '{}'::jsonb;
