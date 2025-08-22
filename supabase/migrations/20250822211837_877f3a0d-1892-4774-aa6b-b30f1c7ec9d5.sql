-- CRITICAL SECURITY FIXES - SIMPLIFIED APPROACH

-- 1. Fix Role Escalation - Simple policy with trigger protection
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile_non_role" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile_secure" ON public.profiles;

-- Simple policy allowing profile updates for own profile
CREATE POLICY "users_can_update_own_profile" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = id AND auth.uid() IS NOT NULL);

-- 2. Create trigger to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Get current user's role
    SELECT role INTO current_user_role 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Only admins can change roles, and they cannot change their own role
    IF current_user_role != 'admin' OR NEW.id = auth.uid() THEN
      -- Log the attempt
      INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        description,
        metadata
      ) VALUES (
        auth.uid(),
        'unauthorized_role_change_attempt',
        'critical',
        'Unauthorized attempt to change user role',
        jsonb_build_object(
          'target_user_id', NEW.id,
          'old_role', OLD.role,
          'new_role', NEW.role,
          'current_user_role', current_user_role,
          'timestamp', now()
        )
      );
      
      RAISE EXCEPTION 'Access denied: Only admins can change roles and cannot change their own role';
    END IF;
    
    -- Log successful role change
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'role_change_success',
      'info',
      'Admin successfully changed user role',
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

-- Create trigger for role change protection
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- 3. Create secure admin function for role management
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
  
  -- Prevent self-role changes
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  -- Update target user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'target_user_id', target_user_id,
    'new_role', new_role
  );
END;
$$;