-- Corriger les politiques RLS qui causent la récursion infinie sur la table profiles

-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "admin_bypass_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_bypass_update_profiles" ON public.profiles;

-- Créer des politiques sécurisées sans récursion
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil (sauf le rôle)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Politique pour permettre aux admins de voir tous les profils (utilise user_roles au lieu de profiles)
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);

-- Politique pour permettre aux admins de modifier tous les profils (utilise user_roles au lieu de profiles)
CREATE POLICY "Admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);

-- Permettre l'insertion de nouveaux profils
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);