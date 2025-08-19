-- Backfill existing users: set admin role for @shopopti.io emails, user for others
UPDATE public.profiles 
SET role = CASE 
  WHEN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = profiles.id 
    AND auth.users.email LIKE '%@shopopti.io'
  ) THEN 'admin'
  ELSE 'user'
END
WHERE role IS NULL OR role = '';

-- Create function for admins to set user roles
CREATE OR REPLACE FUNCTION public.admin_set_role(target_user_id UUID, new_role TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is admin
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
  
  -- Update target user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log the role change
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'role_change',
    'info',
    'Admin changed user role',
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