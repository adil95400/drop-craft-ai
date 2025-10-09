-- Table pour les règles de tarification personnalisables
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('markup', 'competitor', 'volume', 'time_based', 'custom')),
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_rules_user ON public.pricing_rules(user_id);
CREATE INDEX idx_pricing_rules_active ON public.pricing_rules(is_active, priority);

-- Table pour le suivi des coûts fournisseurs avec historique
CREATE TABLE IF NOT EXISTS public.supplier_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID,
  product_id UUID,
  cost_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  shipping_cost NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (cost_price + COALESCE(shipping_cost, 0) + COALESCE(tax_amount, 0)) STORED,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_costs_user ON public.supplier_costs(user_id);
CREATE INDEX idx_supplier_costs_product ON public.supplier_costs(product_id);
CREATE INDEX idx_supplier_costs_supplier ON public.supplier_costs(supplier_id);
CREATE INDEX idx_supplier_costs_valid ON public.supplier_costs(valid_from, valid_until);

-- Table pour les calculs automatiques de bénéfices
CREATE TABLE IF NOT EXISTS public.profit_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  selling_price NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL,
  gross_profit NUMERIC GENERATED ALWAYS AS (selling_price - cost_price) STORED,
  gross_margin_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN selling_price > 0 
    THEN ((selling_price - cost_price) / selling_price * 100) 
    ELSE 0 END
  ) STORED,
  additional_costs JSONB DEFAULT '{}',
  net_profit NUMERIC,
  net_margin_percent NUMERIC,
  break_even_units INTEGER,
  roi_percent NUMERIC,
  calculation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profit_calculations_user ON public.profit_calculations(user_id);
CREATE INDEX idx_profit_calculations_product ON public.profit_calculations(product_id);
CREATE INDEX idx_profit_calculations_date ON public.profit_calculations(calculation_date);

-- Table pour le suivi des prix concurrents
CREATE TABLE IF NOT EXISTS public.competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  competitor_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  availability_status TEXT DEFAULT 'in_stock',
  shipping_cost NUMERIC DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (competitor_price + COALESCE(shipping_cost, 0)) STORED,
  price_difference NUMERIC,
  price_difference_percent NUMERIC,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitor_prices_user ON public.competitor_prices(user_id);
CREATE INDEX idx_competitor_prices_product ON public.competitor_prices(product_id);
CREATE INDEX idx_competitor_prices_checked ON public.competitor_prices(last_checked_at);

-- Enable RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage their pricing rules"
  ON public.pricing_rules
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage their supplier costs"
  ON public.supplier_costs
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users view their profit calculations"
  ON public.profit_calculations
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users manage competitor prices"
  ON public.competitor_prices
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Vues pour analytics rapides
CREATE OR REPLACE VIEW public.pricing_analytics AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT pr.id) as total_rules,
  COUNT(DISTINCT pc.product_id) as products_tracked,
  COUNT(DISTINCT cp.competitor_name) as competitors_tracked,
  AVG(pc.gross_margin_percent) as avg_margin,
  SUM(pc.net_profit) as total_profit
FROM auth.users u
LEFT JOIN public.pricing_rules pr ON pr.user_id = u.id
LEFT JOIN public.profit_calculations pc ON pc.user_id = u.id
LEFT JOIN public.competitor_prices cp ON cp.user_id = u.id
GROUP BY u.id;