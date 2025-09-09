-- Correction complète des politiques RLS avec récursion infinie

-- 1. Supprimer TOUTES les politiques existantes sur la table profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 2. Créer ou recréer les fonctions sécurisées
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(role, 'user') FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_admin_mode()
RETURNS TEXT AS $$
  SELECT admin_mode FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 3. Créer de nouvelles politiques RLS sans récursion
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_admin_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_current_user_admin());

-- 4. Créer une fonction RPC sécurisée pour mettre à jour les plans utilisateur
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  target_user_id UUID,
  new_plan TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_user_role TEXT;
BEGIN
  -- Vérifier si l'utilisateur actuel est admin via une requête directe
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Vérifier que le nouveau plan est valide
  IF new_plan NOT IN ('standard', 'pro', 'ultra_pro') THEN
    RAISE EXCEPTION 'Invalid plan: must be standard, pro, or ultra_pro';
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

-- 5. Créer une fonction RPC sécurisée pour mettre à jour les rôles utilisateur
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_user_role TEXT;
BEGIN
  -- Vérifier si l'utilisateur actuel est admin via une requête directe
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Vérifier que le nouveau rôle est valide
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or user';
  END IF;

  -- Empêcher de changer son propre rôle
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
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