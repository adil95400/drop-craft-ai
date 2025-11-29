-- Table pour le catalog watcher (événements de surveillance)
CREATE TABLE IF NOT EXISTS public.catalog_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'product_created',
    'product_updated', 
    'product_deleted',
    'product_audit_failed',
    'product_rule_applied',
    'product_auto_fixed',
    'inventory_low',
    'price_changed',
    'score_degraded'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_catalog_events_user ON public.catalog_events(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_events_product ON public.catalog_events(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_events_severity ON public.catalog_events(severity);
CREATE INDEX IF NOT EXISTS idx_catalog_events_type ON public.catalog_events(event_type);
CREATE INDEX IF NOT EXISTS idx_catalog_events_created ON public.catalog_events(created_at DESC);

-- RLS policies
ALTER TABLE public.catalog_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own catalog events"
  ON public.catalog_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own catalog events"
  ON public.catalog_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table pour les règles d'optimisation produit
CREATE TABLE IF NOT EXISTS public.product_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
  channel TEXT NOT NULL DEFAULT 'global' CHECK (channel IN ('global', 'google', 'meta', 'tiktok', 'amazon', 'shopify')),
  condition_group JSONB NOT NULL,
  actions JSONB NOT NULL,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  stop_on_error BOOLEAN DEFAULT false,
  skip_if_already_modified BOOLEAN DEFAULT false,
  log_changes BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_rules_user ON public.product_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_product_rules_enabled ON public.product_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_product_rules_channel ON public.product_rules(channel);
CREATE INDEX IF NOT EXISTS idx_product_rules_priority ON public.product_rules(priority);

-- RLS policies  
ALTER TABLE public.product_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own product rules"
  ON public.product_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_product_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_rules_updated_at
  BEFORE UPDATE ON public.product_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rules_updated_at();

-- Table pour l'historique d'exécution des règles
CREATE TABLE IF NOT EXISTS public.rule_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.product_rules(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  applied_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  execution_time INTEGER, -- ms
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_rule_executions_user ON public.rule_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule ON public.rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_product ON public.rule_executions(product_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_created ON public.rule_executions(created_at DESC);

-- RLS
ALTER TABLE public.rule_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rule executions"
  ON public.rule_executions
  FOR SELECT
  USING (auth.uid() = user_id);