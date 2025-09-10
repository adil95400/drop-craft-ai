-- Fix the ambiguous column reference in admin_get_all_users
DROP FUNCTION IF EXISTS admin_get_all_users();

CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
  id uuid,
  email character varying(255),
  full_name character varying(255),
  role user_role,
  plan character varying(50),
  subscription_status character varying(50),
  last_login_at timestamp with time zone,
  login_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
SECURITY DEFINER 
SET search_path = public, auth
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

  -- Return user data with explicit table aliases
  RETURN QUERY
  SELECT 
    p.id,
    au.email::character varying(255),
    p.full_name::character varying(255),
    p.role,
    COALESCE(p.plan, 'free')::character varying(50) as plan,
    COALESCE(p.subscription_status, 'inactive')::character varying(50) as subscription_status,
    p.last_login_at,
    COALESCE(p.login_count, 0) as login_count,
    p.created_at,
    p.updated_at
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;