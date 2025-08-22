-- CRITICAL SECURITY FIXES - CORRECTED VERSION

-- 1. Fix Role Escalation Vulnerability - Create secure role update policy
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile_non_role" ON public.profiles;

-- Allow users to update their profile but prevent role changes unless they're admin
CREATE POLICY "users_can_update_own_profile_secure" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id AND auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() = id 
  AND auth.uid() IS NOT NULL
  AND (
    -- If role is being changed, user must be admin
    (NEW.role != (SELECT role FROM public.profiles WHERE id = auth.uid())) = false
    OR 
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
-- Fix activity_logs policies
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can create their own activity logs" ON public.activity_logs;

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own activity logs" ON public.activity_logs
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Fix other critical user-owned table policies
DROP POLICY IF EXISTS "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs;
CREATE POLICY "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their own AI tasks" ON public.ai_tasks;
CREATE POLICY "Users can manage their own AI tasks" ON public.ai_tasks
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. Add security monitoring for role changes
CREATE OR REPLACE FUNCTION public.log_role_change_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log any role change attempt
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'role_change_attempt',
      'critical',
      'User attempted to change role',
      jsonb_build_object(
        'target_user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role change monitoring
DROP TRIGGER IF EXISTS monitor_role_changes ON public.profiles;
CREATE TRIGGER monitor_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change_attempt();