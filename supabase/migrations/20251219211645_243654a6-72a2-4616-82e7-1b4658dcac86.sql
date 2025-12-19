-- Create function to get all users for admin management
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role_updated_at timestamptz,
  plan text,
  subscription_status text,
  last_login_at timestamptz,
  login_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    COALESCE(ur.role::text, 'user') as role,
    (ur.role = 'admin') as is_admin,
    p.created_at,
    p.last_login_at as last_sign_in_at,
    ur.created_at as role_updated_at,
    p.subscription_plan as plan,
    CASE 
      WHEN p.subscription_plan IN ('pro', 'ultra_pro') THEN 'active'
      ELSE 'inactive'
    END as subscription_status,
    p.last_login_at,
    p.login_count
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY p.created_at DESC;
END;
$$;