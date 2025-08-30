-- Create enhanced roles and policies system (corrected)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enhanced_app_role') THEN
        CREATE TYPE enhanced_app_role AS ENUM ('admin', 'manager', 'user');
    END IF;
END $$;

-- Update profiles table with enhanced role support and admin features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_mode text CHECK (admin_mode IN ('bypass', 'preview:standard', 'preview:pro', 'preview:ultra_pro'));

-- Create user_sessions table for multi-device management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  device_info jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  location jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_activity_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.user_sessions;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sessions"
ON public.user_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create role_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  permission_name text NOT NULL,
  resource_type text,
  actions text[] DEFAULT '{}',
  conditions jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_name, permission_name, resource_type)
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for role_permissions (readable by all authenticated users)
DROP POLICY IF EXISTS "Role permissions are readable by authenticated users" ON public.role_permissions;
CREATE POLICY "Role permissions are readable by authenticated users"
ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default role permissions (with conflict handling)
INSERT INTO public.role_permissions (role_name, permission_name, resource_type, actions) 
VALUES
('admin', 'manage_users', 'profiles', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'manage_sessions', 'user_sessions', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'manage_roles', 'role_permissions', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'access_analytics', 'analytics', ARRAY['read']),
('admin', 'manage_system', 'system', ARRAY['read', 'update']),
('manager', 'manage_customers', 'customers', ARRAY['create', 'read', 'update']),
('manager', 'manage_orders', 'orders', ARRAY['read', 'update']),
('manager', 'view_analytics', 'analytics', ARRAY['read']),
('manager', 'manage_products', 'products', ARRAY['create', 'read', 'update']),
('user', 'manage_own_data', 'profiles', ARRAY['read', 'update']),
('user', 'view_own_orders', 'orders', ARRAY['read']),
('user', 'manage_own_products', 'products', ARRAY['create', 'read', 'update'])
ON CONFLICT (role_name, permission_name, resource_type) DO NOTHING;

-- Enhanced security functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(role, 'user') FROM public.profiles WHERE id = user_id_param;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
  permission_name_param text,
  resource_type_param text DEFAULT NULL,
  action_param text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.profiles p ON p.role = rp.role_name
    WHERE p.id = auth.uid()
    AND rp.permission_name = permission_name_param
    AND (resource_type_param IS NULL OR rp.resource_type = resource_type_param)
    AND action_param = ANY(rp.actions)
  );
$$;

-- Function to revoke user sessions (for multi-device management)
CREATE OR REPLACE FUNCTION public.revoke_user_sessions(
  target_user_id uuid,
  session_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role text;
  revoked_count integer;
BEGIN
  -- Check permissions
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  
  -- Only admins or the user themselves can revoke sessions
  IF current_user_role != 'admin' AND auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;
  
  -- Revoke specific sessions or all sessions for user
  IF session_ids IS NOT NULL THEN
    UPDATE public.user_sessions 
    SET is_active = false, updated_at = now()
    WHERE user_id = target_user_id AND id = ANY(session_ids)
    AND is_active = true;
  ELSE
    UPDATE public.user_sessions 
    SET is_active = false, updated_at = now()
    WHERE user_id = target_user_id AND is_active = true;
  END IF;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  -- Log security event
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'sessions_revoked',
    'info',
    'User sessions revoked',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'revoked_count', revoked_count,
      'revoked_by_admin', (current_user_role = 'admin'),
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'revoked_count', revoked_count,
    'message', 'Sessions revoked successfully'
  );
END;
$$;