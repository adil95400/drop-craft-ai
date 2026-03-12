
-- Abandoned carts table for real cart recovery
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovery_status TEXT NOT NULL DEFAULT 'pending',
  recovery_attempts INTEGER NOT NULL DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  order_id UUID,
  source_platform TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own abandoned carts" ON public.abandoned_carts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_abandoned_carts_user ON public.abandoned_carts(user_id);
CREATE INDEX idx_abandoned_carts_status ON public.abandoned_carts(recovery_status);
CREATE INDEX idx_abandoned_carts_date ON public.abandoned_carts(abandoned_at DESC);

CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Upsell/Cross-sell rules
CREATE TABLE public.upsell_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'upsell',
  trigger_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  trigger_category TEXT,
  recommended_product_ids UUID[] DEFAULT '{}',
  discount_percent NUMERIC(5,2) DEFAULT 0,
  min_cart_value NUMERIC(10,2),
  display_location TEXT NOT NULL DEFAULT 'product_page',
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  impressions INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_generated NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own upsell rules" ON public.upsell_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_upsell_rules_user ON public.upsell_rules(user_id);
CREATE INDEX idx_upsell_rules_active ON public.upsell_rules(is_active) WHERE is_active = true;

CREATE TRIGGER update_upsell_rules_updated_at
  BEFORE UPDATE ON public.upsell_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
