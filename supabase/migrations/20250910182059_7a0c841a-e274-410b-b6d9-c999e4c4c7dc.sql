-- Fix the admin_get_all_users function to correct the return type mismatch
DROP FUNCTION IF EXISTS admin_get_all_users();

-- Create the corrected admin_get_all_users function
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  role_updated_at TIMESTAMPTZ,
  plan TEXT,
  subscription_status TEXT,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(au.email, 'user-' || p.id::text || '@domain.com')::TEXT as email,
    COALESCE(p.full_name, 'Unknown User')::TEXT as full_name,
    COALESCE(p.role, 'user')::TEXT as role,
    COALESCE(p.is_admin, false) as is_admin,
    p.created_at,
    au.last_sign_in_at,
    p.role_updated_at,
    COALESCE(p.plan, 'free')::TEXT as plan,
    COALESCE(p.subscription_status, 'inactive')::TEXT as subscription_status,
    au.last_sign_in_at as last_login_at,
    COALESCE(p.login_count, 0) as login_count
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;