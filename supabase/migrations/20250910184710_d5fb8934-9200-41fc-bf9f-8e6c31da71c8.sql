-- Drop and recreate the admin_get_all_users function with proper return types
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  plan text,
  subscription_status text,
  last_login_at timestamp with time zone,
  login_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return user data with explicit type casting
  RETURN QUERY
  SELECT 
    p.id,
    au.email::text,
    p.full_name::text,
    COALESCE(p.role::text, 'user') as role,
    COALESCE(p.plan, 'free')::text as plan,
    COALESCE(p.subscription_status, 'inactive')::text as subscription_status,
    p.last_login_at,
    COALESCE(p.login_count, 0) as login_count,
    p.created_at,
    p.updated_at
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;