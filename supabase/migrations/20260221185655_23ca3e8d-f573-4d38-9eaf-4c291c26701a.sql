
-- P1-2: Supplier Fallback Rules
CREATE TABLE IF NOT EXISTS public.supplier_fallback_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  primary_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  fallback_suppliers JSONB NOT NULL DEFAULT '[]'::jsonb, -- ordered array of {supplier_id, priority, max_price}
  trigger_condition TEXT NOT NULL DEFAULT 'out_of_stock', -- out_of_stock | low_stock | price_increase
  low_stock_threshold INTEGER DEFAULT 5,
  price_increase_threshold NUMERIC(5,2) DEFAULT 10.00, -- percentage
  auto_switch BOOLEAN DEFAULT false,
  notify_on_switch BOOLEAN DEFAULT true,
  last_switch_at TIMESTAMPTZ,
  switch_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supplier_fallback_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fallback rules" ON public.supplier_fallback_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_supplier_fallback_rules_updated_at
  BEFORE UPDATE ON public.supplier_fallback_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- P1-1: Price change history for monitoring
CREATE TABLE IF NOT EXISTS public.price_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_product_id UUID REFERENCES public.supplier_products(id) ON DELETE SET NULL,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  change_percent NUMERIC(6,2),
  change_type TEXT NOT NULL DEFAULT 'manual', -- manual | supplier_sync | repricing_rule | fallback
  source TEXT, -- which system triggered the change
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.price_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own price history" ON public.price_change_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add missing columns to pricing_rules for P1-3
ALTER TABLE public.pricing_rules
  ADD COLUMN IF NOT EXISTS rounding_strategy TEXT DEFAULT 'nearest_99', -- nearest_99 | nearest_50 | round_up | none
  ADD COLUMN IF NOT EXISTS margin_protection NUMERIC(5,2) DEFAULT 15.00, -- minimum margin %
  ADD COLUMN IF NOT EXISTS competitor_strategy TEXT, -- beat_lowest | match_average | premium
  ADD COLUMN IF NOT EXISTS competitor_offset NUMERIC(5,2); -- offset % from competitor strategy

-- Add fallback_supplier_id to products for quick reference
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fallback_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
