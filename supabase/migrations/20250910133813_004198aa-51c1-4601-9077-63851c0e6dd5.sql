-- Create user roles system for Drop Craft AI
-- Add role column to profiles table and create secure role management

-- First, add role column to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_updated_at TIMESTAMPTZ;

-- Create enum for valid roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Update the role column to use the enum (after adding it as text first)
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Set default value for role
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(role::text, 'user') 
  FROM public.profiles 
  WHERE id = user_id;
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(role = 'admin' OR is_admin = true, false) 
  FROM public.profiles 
  WHERE id = user_id;
$$;

-- Create function for admins to change user roles
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID, 
  new_role user_role
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_is_admin BOOLEAN;
  result JSON;
BEGIN
  -- Check if current user is admin
  SELECT public.is_user_admin(auth.uid()) INTO current_user_is_admin;
  
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Prevent self-demotion (admin cannot demote themselves)
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin role';
  END IF;
  
  -- Update the target user's role
  UPDATE public.profiles 
  SET 
    role = new_role,
    is_admin = (new_role = 'admin'),
    role_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log the role change in security events
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'role_change',
    'critical',
    'Admin changed user role',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_role', new_role,
      'timestamp', NOW()
    )
  );
  
  SELECT json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'target_user_id', target_user_id,
    'new_role', new_role
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  role_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_user_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.role,
    p.is_admin,
    p.created_at,
    au.last_sign_in_at,
    p.role_updated_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Update RLS policies for profiles table to handle admin access
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

-- New RLS policies for profiles
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true); -- Everyone can see basic profile info

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_update_all" ON public.profiles
  FOR UPDATE
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

-- Create first admin user if none exists (for the current authenticated user)
-- This will run only if no admin exists yet
INSERT INTO public.profiles (id, role, is_admin, full_name, created_at, updated_at)
SELECT 
  auth.uid(),
  'admin'::user_role,
  true,
  'Admin User',
  NOW(),
  NOW()
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin' OR is_admin = true)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role,
  is_admin = true,
  updated_at = NOW();