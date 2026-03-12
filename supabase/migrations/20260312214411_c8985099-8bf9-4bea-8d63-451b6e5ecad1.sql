
-- Shipping Zones
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own zones" ON public.shipping_zones FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shipping Rates (per zone + carrier)
CREATE TABLE public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES public.fulfillment_carriers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_type TEXT NOT NULL DEFAULT 'flat',
  base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  per_kg_rate DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  min_weight DECIMAL(10,2) DEFAULT 0,
  max_weight DECIMAL(10,2),
  estimated_days_min INTEGER DEFAULT 1,
  estimated_days_max INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rates" ON public.shipping_rates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shipping Rules (conditions for auto-routing)
CREATE TABLE public.shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL DEFAULT 'assign_carrier',
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rules" ON public.shipping_rules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_shipping_zones_user ON public.shipping_zones(user_id);
CREATE INDEX idx_shipping_rates_zone ON public.shipping_rates(zone_id);
CREATE INDEX idx_shipping_rates_user ON public.shipping_rates(user_id);
CREATE INDEX idx_shipping_rules_user ON public.shipping_rules(user_id);
CREATE INDEX idx_shipping_rules_priority ON public.shipping_rules(user_id, priority);
