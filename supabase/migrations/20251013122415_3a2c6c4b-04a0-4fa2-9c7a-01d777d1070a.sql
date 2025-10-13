-- Fix infinite recursion in profiles RLS policies
-- Drop ALL existing policies on profiles to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Create secure policies using security definer functions (avoiding recursion)
-- These policies use the existing get_user_role() function which is already security definer

-- Policy: Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile (non-admin only)
-- Role changes are prevented by a separate trigger
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  AND public.get_user_role(auth.uid()) != 'admin'
)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can update any profile including roles
CREATE POLICY "profiles_update_admin" ON public.profiles
FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Policy: No one can delete profiles (only cascade from auth.users deletion)
CREATE POLICY "profiles_no_delete" ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- Create trigger to prevent non-admins from changing roles
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to change roles
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF public.get_user_role(auth.uid()) != 'admin' THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();