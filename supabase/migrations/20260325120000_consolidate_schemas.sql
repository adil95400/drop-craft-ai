-- Consolidate 3 workflow systems → automation_workflows (canonical)
-- Unify repricing_rules → pricing_rules (canonical, exposed via price_rules view)

-- 1. Re-point workflow_executions FK to canonical table
ALTER TABLE public.workflow_executions 
  DROP CONSTRAINT IF EXISTS workflow_executions_workflow_id_fkey;

ALTER TABLE public.workflow_executions 
  ADD CONSTRAINT workflow_executions_workflow_id_fkey 
  FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id) ON DELETE CASCADE;

-- 2. Drop legacy workflow tables (all empty, no code references)
DROP TABLE IF EXISTS public.saved_workflows CASCADE;
DROP TABLE IF EXISTS public.workflow_templates CASCADE;

-- 3. Drop unused repricing_rules (empty, pricing_rules is canonical)
DROP TABLE IF EXISTS public.repricing_rules CASCADE;

-- 4. Drop orphaned trigger functions
DROP FUNCTION IF EXISTS public.automation_rules_insert_fn() CASCADE;
DROP FUNCTION IF EXISTS public.automation_rules_update_fn() CASCADE;
DROP FUNCTION IF EXISTS public.automation_rules_delete_fn() CASCADE;
