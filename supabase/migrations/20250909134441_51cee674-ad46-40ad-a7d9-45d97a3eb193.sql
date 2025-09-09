-- Correction des politiques RLS qui causent la récursion infinie

-- 1. Créer une fonction security definer pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Créer une fonction pour obtenir le mode admin de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_current_user_admin_mode()
RETURNS TEXT AS $$
  SELECT admin_mode FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 3. Créer une fonction pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 4. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 5. Créer de nouvelles politiques RLS sans récursion
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_current_user_admin());

-- 6. Créer une fonction RPC pour mettre à jour les plans utilisateur (réservée aux admins)
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  target_user_id UUID,
  new_plan TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier si l'utilisateur actuel est admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Mettre à jour le plan de l'utilisateur cible
  UPDATE public.profiles 
  SET 
    plan = new_plan,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Vérifier si la mise à jour a réussi
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Retourner le résultat
  SELECT json_build_object(
    'success', true,
    'message', 'Plan updated successfully',
    'user_id', target_user_id,
    'new_plan', new_plan
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer une fonction RPC pour mettre à jour les rôles utilisateur (réservée aux admins)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier si l'utilisateur actuel est admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Mettre à jour le rôle de l'utilisateur cible
  UPDATE public.profiles 
  SET 
    role = new_role,
    role_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Vérifier si la mise à jour a réussi
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Retourner le résultat
  SELECT json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'user_id', target_user_id,
    'new_role', new_role
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;