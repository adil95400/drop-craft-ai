-- CORRECTIF URGENT: Résoudre la récursion infinie dans les policies RLS de profiles

-- 1. Supprimer toutes les policies qui causent la récursion
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Recréer des policies simples et sûres
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Policy admin sécurisée (sans récursion)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  -- L'admin peut voir tous les profils
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    LIMIT 1
  )
  OR 
  -- Ou l'utilisateur peut voir son propre profil
  auth.uid() = id
);