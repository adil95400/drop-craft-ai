-- Feed Rules System Tables
-- Table des règles de feed
CREATE TABLE public.feed_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  feed_id UUID REFERENCES public.campaign_product_feeds(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  match_type TEXT DEFAULT 'all' CHECK (match_type IN ('all', 'any')),
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des templates de règles
CREATE TABLE public.feed_rule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_global BOOLEAN DEFAULT false,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  match_type TEXT DEFAULT 'all',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des logs d'exécution des règles
CREATE TABLE public.feed_rule_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.feed_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feed_id UUID REFERENCES public.campaign_product_feeds(id) ON DELETE SET NULL,
  products_matched INTEGER DEFAULT 0,
  products_modified INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  changes_summary JSONB,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_rule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_rule_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_rules
CREATE POLICY "Users can view their own feed rules"
  ON public.feed_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feed rules"
  ON public.feed_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed rules"
  ON public.feed_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed rules"
  ON public.feed_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for feed_rule_templates
CREATE POLICY "Users can view global or own templates"
  ON public.feed_rule_templates FOR SELECT
  USING (is_global = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.feed_rule_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.feed_rule_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.feed_rule_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for feed_rule_executions
CREATE POLICY "Users can view their own executions"
  ON public.feed_rule_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own executions"
  ON public.feed_rule_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert global templates
INSERT INTO public.feed_rule_templates (name, description, category, is_global, conditions, actions, match_type) VALUES
('Prix < 10€ → Exclure', 'Exclut les produits avec un prix inférieur à 10€', 'pricing', true, 
 '[{"field": "price", "operator": "less_than", "value": 10}]',
 '[{"type": "exclude", "reason": "Prix trop bas"}]', 'all'),
('Stock = 0 → Exclure', 'Exclut les produits en rupture de stock', 'inventory', true,
 '[{"field": "stock", "operator": "equals", "value": 0}]',
 '[{"type": "exclude", "reason": "Rupture de stock"}]', 'all'),
('Titre contient "test" → Exclure', 'Exclut les produits de test', 'cleanup', true,
 '[{"field": "title", "operator": "contains", "value": "test"}]',
 '[{"type": "exclude", "reason": "Produit de test"}]', 'all'),
('Marge < 20% → Ajuster prix', 'Augmente le prix si la marge est trop faible', 'pricing', true,
 '[{"field": "margin_percent", "operator": "less_than", "value": 20}]',
 '[{"type": "modify_field", "field": "price", "operation": "multiply", "value": 1.15}]', 'all'),
('Catégorie vide → Définir par défaut', 'Définit une catégorie par défaut', 'categorization', true,
 '[{"field": "category", "operator": "is_empty"}]',
 '[{"type": "set_field", "field": "category", "value": "Autres"}]', 'all');