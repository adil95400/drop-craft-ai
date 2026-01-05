-- Price Rules System
-- Règles de tarification dynamique et automatique

CREATE TABLE public.price_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('markup', 'margin', 'fixed', 'rounding', 'competitive', 'tiered')),
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]',
  calculation JSONB NOT NULL DEFAULT '{}',
  apply_to TEXT DEFAULT 'all' CHECK (apply_to IN ('all', 'category', 'supplier', 'tag', 'sku_pattern')),
  apply_filter JSONB,
  is_active BOOLEAN DEFAULT true,
  products_affected INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Price rule history/logs
CREATE TABLE public.price_rule_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.price_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('applied', 'reverted', 'simulated')),
  products_count INTEGER DEFAULT 0,
  total_price_change DECIMAL(12,2),
  avg_price_change_percent DECIMAL(8,4),
  details JSONB,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Price simulation results
CREATE TABLE public.price_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rules_applied JSONB DEFAULT '[]',
  products_simulated INTEGER DEFAULT 0,
  results_summary JSONB,
  sample_results JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_rule_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own price rules"
  ON public.price_rules FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own price rule logs"
  ON public.price_rule_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price rule logs"
  ON public.price_rule_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own price simulations"
  ON public.price_simulations FOR ALL
  USING (auth.uid() = user_id);