-- Supprimer toutes les politiques existantes sur profiles pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_bypass_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_bypass_update_profiles" ON public.profiles;

-- Créer une fonction security definer pour obtenir le rôle sans récursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT ur.role::text 
  FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'::app_role
  LIMIT 1;
$$;

-- Recréer les politiques sécurisées
CREATE POLICY "users_can_view_own_profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Politique admin qui utilise la fonction security definer
CREATE POLICY "admins_can_view_all_profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "admins_can_update_all_profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');