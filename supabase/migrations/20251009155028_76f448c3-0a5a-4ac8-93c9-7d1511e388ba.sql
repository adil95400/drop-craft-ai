-- Create product bundles table
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bundle_name TEXT NOT NULL,
  description TEXT,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed, none
  discount_value NUMERIC NOT NULL DEFAULT 0,
  bundle_price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL DEFAULT 0,
  savings NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  conditions JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create upsell/cross-sell rules table
CREATE TABLE IF NOT EXISTS public.upsell_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- upsell, cross_sell, bundle
  trigger_product_ids UUID[] DEFAULT '{}',
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  suggested_product_ids UUID[] NOT NULL DEFAULT '{}',
  discount_offer JSONB DEFAULT '{}',
  display_timing TEXT NOT NULL DEFAULT 'cart', -- cart, checkout, product_page, post_purchase
  display_config JSONB NOT NULL DEFAULT '{}',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dynamic discounts table
CREATE TABLE IF NOT EXISTS public.dynamic_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discount_name TEXT NOT NULL,
  discount_type TEXT NOT NULL, -- percentage, fixed, tiered, conditional
  discount_value NUMERIC NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}',
  target_audience JSONB DEFAULT '{}',
  product_filters JSONB DEFAULT '{}',
  time_constraints JSONB DEFAULT '{}',
  usage_limits JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scarcity timers table
CREATE TABLE IF NOT EXISTS public.scarcity_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  timer_name TEXT NOT NULL,
  timer_type TEXT NOT NULL, -- countdown, stock_alert, demand_surge, limited_offer
  target_entity_type TEXT NOT NULL, -- product, category, cart, checkout
  target_entity_ids UUID[] DEFAULT '{}',
  timer_config JSONB NOT NULL DEFAULT '{}',
  display_config JSONB NOT NULL DEFAULT '{}',
  urgency_level TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create social proof widgets table
CREATE TABLE IF NOT EXISTS public.social_proof_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  widget_name TEXT NOT NULL,
  widget_type TEXT NOT NULL, -- recent_purchases, live_visitors, reviews, trust_badges, popularity
  data_source JSONB NOT NULL DEFAULT '{}',
  display_config JSONB NOT NULL DEFAULT '{}',
  target_pages TEXT[] NOT NULL DEFAULT '{}',
  refresh_interval INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position TEXT NOT NULL DEFAULT 'bottom-left',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversion events tracking table
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  conversion_value NUMERIC DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scarcity_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_proof_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own product bundles"
  ON public.product_bundles FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage own upsell rules"
  ON public.upsell_rules FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage own dynamic discounts"
  ON public.dynamic_discounts FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage own scarcity timers"
  ON public.scarcity_timers FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage own social proof widgets"
  ON public.social_proof_widgets FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage own conversion events"
  ON public.conversion_events FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_product_bundles_user ON public.product_bundles(user_id);
CREATE INDEX idx_product_bundles_active ON public.product_bundles(is_active);
CREATE INDEX idx_upsell_rules_user ON public.upsell_rules(user_id);
CREATE INDEX idx_upsell_rules_active ON public.upsell_rules(is_active);
CREATE INDEX idx_dynamic_discounts_user ON public.dynamic_discounts(user_id);
CREATE INDEX idx_dynamic_discounts_active ON public.dynamic_discounts(is_active);
CREATE INDEX idx_scarcity_timers_user ON public.scarcity_timers(user_id);
CREATE INDEX idx_social_proof_widgets_user ON public.social_proof_widgets(user_id);
CREATE INDEX idx_conversion_events_user ON public.conversion_events(user_id);
CREATE INDEX idx_conversion_events_session ON public.conversion_events(session_id);

-- Triggers
CREATE TRIGGER update_product_bundles_updated_at
  BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_upsell_rules_updated_at
  BEFORE UPDATE ON public.upsell_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dynamic_discounts_updated_at
  BEFORE UPDATE ON public.dynamic_discounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_scarcity_timers_updated_at
  BEFORE UPDATE ON public.scarcity_timers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_social_proof_widgets_updated_at
  BEFORE UPDATE ON public.social_proof_widgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();