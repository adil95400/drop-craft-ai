-- CRITICAL SECURITY FIXES

-- 1. Fix Role Escalation Vulnerability - Prevent users from changing their own role
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

CREATE POLICY "users_can_update_own_profile_non_role" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Allow users to update their own profile but NOT the role field
    OLD.role = NEW.role
    OR 
    -- Only admins can change roles
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
);

-- 2. Create secure admin function for role management with proper authorization
CREATE OR REPLACE FUNCTION public.secure_admin_set_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role TEXT;
  target_user_exists BOOLEAN;
BEGIN
  -- Verify current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or user';
  END IF;
  
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO target_user_exists;
  IF NOT target_user_exists THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Prevent self-role changes through this function (extra safety)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  -- Update target user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the role change
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'admin_role_change',
    'critical',
    'Admin changed user role via secure function',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_role', new_role,
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'target_user_id', target_user_id,
    'new_role', new_role
  );
END;
$$;

-- 3. Fix Anonymous Access Policies - Add authenticated user checks
-- Fix activity_logs policy
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can create their own activity logs" ON public.activity_logs
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Fix ai_optimization_jobs policy
DROP POLICY IF EXISTS "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs;
CREATE POLICY "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Fix ai_tasks policy
DROP POLICY IF EXISTS "Users can manage their own AI tasks" ON public.ai_tasks;
CREATE POLICY "Users can manage their own AI tasks" ON public.ai_tasks
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Fix automation_executions policy
DROP POLICY IF EXISTS "Users can manage their own automation executions" ON public.automation_executions;
CREATE POLICY "Users can manage their own automation executions" ON public.automation_executions
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Fix automation_workflows policy
DROP POLICY IF EXISTS "Users can manage their own automation workflows" ON public.automation_workflows;
CREATE POLICY "Users can manage their own automation workflows" ON public.automation_workflows
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. Fix Function Search Path Issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;