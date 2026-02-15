
-- ================================================================
-- Phase 2: Pricing & Automation table unification
-- ================================================================

-- STEP 1: Add missing columns from price_rules to pricing_rules (canonical)
ALTER TABLE public.pricing_rules 
  ADD COLUMN IF NOT EXISTS calculation jsonb,
  ADD COLUMN IF NOT EXISTS apply_to text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS apply_filter jsonb;

-- STEP 2: Migrate data from price_rules → pricing_rules
INSERT INTO public.pricing_rules (id, user_id, name, description, rule_type, priority, conditions, is_active, products_affected, created_at, updated_at, calculation, apply_to, apply_filter)
SELECT id, user_id, name, description, rule_type, priority, conditions, is_active, products_affected, created_at, updated_at, calculation, apply_to, apply_filter
FROM public.price_rules
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Drop price_rules and create compatibility view
DROP TABLE IF EXISTS public.price_rules CASCADE;

CREATE OR REPLACE VIEW public.price_rules AS
SELECT 
  id, user_id, name, description, rule_type, priority,
  COALESCE(conditions, '[]'::jsonb) as conditions,
  COALESCE(calculation, '{}'::jsonb) as calculation,
  COALESCE(apply_to, 'all') as apply_to,
  apply_filter,
  COALESCE(is_active, true) as is_active,
  COALESCE(products_affected, 0) as products_affected,
  last_executed_at as last_applied_at,
  created_at, updated_at
FROM public.pricing_rules;

-- INSTEAD OF triggers for price_rules view
CREATE OR REPLACE FUNCTION public.price_rules_insert_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.pricing_rules (id, user_id, name, description, rule_type, priority, conditions, calculation, apply_to, apply_filter, is_active, products_affected, created_at, updated_at)
  VALUES (COALESCE(NEW.id, gen_random_uuid()), NEW.user_id, NEW.name, NEW.description, NEW.rule_type, COALESCE(NEW.priority, 0), COALESCE(NEW.conditions, '[]'::jsonb), COALESCE(NEW.calculation, '{}'::jsonb), COALESCE(NEW.apply_to, 'all'), NEW.apply_filter, COALESCE(NEW.is_active, true), COALESCE(NEW.products_affected, 0), COALESCE(NEW.created_at, now()), COALESCE(NEW.updated_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END; $$;

CREATE TRIGGER price_rules_insert_trigger
  INSTEAD OF INSERT ON public.price_rules
  FOR EACH ROW EXECUTE FUNCTION public.price_rules_insert_fn();

CREATE OR REPLACE FUNCTION public.price_rules_update_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.pricing_rules SET
    name = COALESCE(NEW.name, OLD.name),
    description = NEW.description,
    rule_type = COALESCE(NEW.rule_type, OLD.rule_type),
    priority = COALESCE(NEW.priority, OLD.priority),
    conditions = COALESCE(NEW.conditions, OLD.conditions),
    calculation = COALESCE(NEW.calculation, OLD.calculation),
    apply_to = COALESCE(NEW.apply_to, OLD.apply_to),
    apply_filter = NEW.apply_filter,
    is_active = COALESCE(NEW.is_active, OLD.is_active),
    products_affected = COALESCE(NEW.products_affected, OLD.products_affected),
    last_executed_at = NEW.last_applied_at,
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END; $$;

CREATE TRIGGER price_rules_update_trigger
  INSTEAD OF UPDATE ON public.price_rules
  FOR EACH ROW EXECUTE FUNCTION public.price_rules_update_fn();

CREATE OR REPLACE FUNCTION public.price_rules_delete_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.pricing_rules WHERE id = OLD.id;
  RETURN OLD;
END; $$;

CREATE TRIGGER price_rules_delete_trigger
  INSTEAD OF DELETE ON public.price_rules
  FOR EACH ROW EXECUTE FUNCTION public.price_rules_delete_fn();

-- STEP 4: Drop pricing_rulesets (empty, no code refs found)
DROP TABLE IF EXISTS public.pricing_rulesets CASCADE;

-- STEP 5: Drop empty unused pricing-adjacent tables
DROP TABLE IF EXISTS public.price_simulations CASCADE;
DROP TABLE IF EXISTS public.price_stock_history CASCADE;
DROP TABLE IF EXISTS public.price_stock_monitoring CASCADE;
DROP TABLE IF EXISTS public.product_price_conversions CASCADE;
DROP TABLE IF EXISTS public.product_prices CASCADE;
DROP TABLE IF EXISTS public.product_pricing_state CASCADE;

-- STEP 6: Automation unification
-- Keep automation_workflows as canonical (used by useAutomationRealData.ts)
-- automation_rules is used by many services/edge functions → create view

-- Add missing columns to automation_workflows for compatibility
ALTER TABLE public.automation_workflows 
  ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS trigger_config jsonb,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS action_config jsonb,
  ADD COLUMN IF NOT EXISTS conditions jsonb,
  ADD COLUMN IF NOT EXISTS trigger_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;

-- Drop automation_rules and create compatibility view
DROP TABLE IF EXISTS public.automation_rules CASCADE;

CREATE OR REPLACE VIEW public.automation_rules AS
SELECT 
  id, user_id, name, description,
  COALESCE(trigger_type, 'manual') as trigger_type,
  trigger_config,
  COALESCE(action_type, 'notification') as action_type,
  action_config,
  COALESCE(is_active, false) as is_active,
  COALESCE(trigger_count, 0) as trigger_count,
  last_triggered_at,
  COALESCE(execution_count, 0) as execution_count,
  created_at, updated_at
FROM public.automation_workflows;

-- INSTEAD OF triggers for automation_rules view
CREATE OR REPLACE FUNCTION public.automation_rules_insert_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.automation_workflows (id, user_id, name, description, trigger_type, trigger_config, action_type, action_config, is_active, trigger_count, execution_count, created_at, updated_at)
  VALUES (COALESCE(NEW.id, gen_random_uuid()), NEW.user_id, NEW.name, NEW.description, COALESCE(NEW.trigger_type, 'manual'), NEW.trigger_config, NEW.action_type, NEW.action_config, COALESCE(NEW.is_active, false), COALESCE(NEW.trigger_count, 0), COALESCE(NEW.execution_count, 0), COALESCE(NEW.created_at, now()), COALESCE(NEW.updated_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END; $$;

CREATE TRIGGER automation_rules_insert_trigger
  INSTEAD OF INSERT ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.automation_rules_insert_fn();

CREATE OR REPLACE FUNCTION public.automation_rules_update_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.automation_workflows SET
    name = COALESCE(NEW.name, OLD.name),
    description = NEW.description,
    trigger_type = COALESCE(NEW.trigger_type, OLD.trigger_type),
    trigger_config = NEW.trigger_config,
    action_type = NEW.action_type,
    action_config = NEW.action_config,
    is_active = COALESCE(NEW.is_active, OLD.is_active),
    trigger_count = COALESCE(NEW.trigger_count, OLD.trigger_count),
    execution_count = COALESCE(NEW.execution_count, OLD.execution_count),
    last_triggered_at = NEW.last_triggered_at,
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END; $$;

CREATE TRIGGER automation_rules_update_trigger
  INSTEAD OF UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.automation_rules_update_fn();

CREATE OR REPLACE FUNCTION public.automation_rules_delete_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.automation_workflows WHERE id = OLD.id;
  RETURN OLD;
END; $$;

CREATE TRIGGER automation_rules_delete_trigger
  INSTEAD OF DELETE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.automation_rules_delete_fn();

-- STEP 7: Drop empty automation tables (no data, low code refs)
-- Keep automation_triggers and automation_actions (have FK relationships)
-- Drop automation_flows and automation_executions (empty, separate domain)
DROP TABLE IF EXISTS public.automation_executions CASCADE;
DROP TABLE IF EXISTS public.automation_flows CASCADE;
DROP TABLE IF EXISTS public.automation_execution_logs CASCADE;

-- STEP 8: Enable RLS on views (views inherit from base tables)
-- pricing_rules already has RLS, automation_workflows already has RLS
