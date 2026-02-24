
-- ============================================
-- WAVE 4: Restrict publicly exposed tables
-- ============================================

-- 1. system_status - restrict to authenticated users
DROP POLICY IF EXISTS "System status viewable by all" ON public.system_status;
DROP POLICY IF EXISTS "Anyone can view system status" ON public.system_status;
DROP POLICY IF EXISTS "system_status_select_policy" ON public.system_status;

-- Find and drop any SELECT policy on system_status
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'system_status' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_status', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view system status"
  ON public.system_status FOR SELECT
  TO authenticated
  USING (true);

-- 2. plan_limits - restrict to authenticated users
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'plan_limits' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.plan_limits', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view plan limits"
  ON public.plan_limits FOR SELECT
  TO authenticated
  USING (true);

-- 3. workflow_step_definitions - restrict to authenticated
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'workflow_step_definitions' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workflow_step_definitions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view workflow definitions"
  ON public.workflow_step_definitions FOR SELECT
  TO authenticated
  USING (true);

-- 4. feed_rule_templates - restrict to authenticated
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'feed_rule_templates' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_rule_templates', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view feed rule templates"
  ON public.feed_rule_templates FOR SELECT
  TO authenticated
  USING (true);

-- 5. scoring_rules - restrict to authenticated
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'scoring_rules' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.scoring_rules', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view scoring rules"
  ON public.scoring_rules FOR SELECT
  TO authenticated
  USING (true);

-- 6. exchange_rates - restrict to authenticated
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'exchange_rates' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.exchange_rates', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view exchange rates"
  ON public.exchange_rates FOR SELECT
  TO authenticated
  USING (true);

-- 7. exchange_rate_history - restrict to authenticated
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'exchange_rate_history' AND schemaname = 'public'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.exchange_rate_history', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view exchange rate history"
  ON public.exchange_rate_history FOR SELECT
  TO authenticated
  USING (true);
