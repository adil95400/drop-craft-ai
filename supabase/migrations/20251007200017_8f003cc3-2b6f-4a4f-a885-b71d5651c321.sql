-- PHASE 1A: Création du système de rôles sécurisé (FINAL)
-- =======================================================

-- 1. Créer l'enum pour les rôles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Créer la table user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Activer RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Créer fonction sécurisée pour vérifier les rôles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Créer fonction helper pour obtenir le rôle principal
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY CASE 
    WHEN role = 'admin' THEN 1 
    WHEN role = 'user' THEN 2 
  END
  LIMIT 1
$$;

-- 6. Migrer UNIQUEMENT les utilisateurs valides de profiles vers user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'admin' THEN 'admin'::app_role
    ELSE 'user'::app_role
  END,
  COALESCE(p.role_updated_at, p.created_at, now())
FROM public.profiles p
WHERE p.role IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = p.id) -- Ne migrer que les users valides
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Policies RLS pour user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Créer fonction admin_set_role sécurisée
CREATE OR REPLACE FUNCTION public.admin_set_role(
  target_user_id uuid,
  new_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_role(admin_user_id, 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  IF target_user_id = admin_user_id THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, admin_user_id);
  
  INSERT INTO public.security_events (
    user_id, event_type, severity, description, metadata
  ) VALUES (
    admin_user_id, 'role_change', 'critical', 'Admin changed user role',
    jsonb_build_object('target_user_id', target_user_id, 'new_role', new_role, 'timestamp', now())
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'target_user_id', target_user_id,
    'new_role', new_role
  );
END;
$$;

-- 9. Mettre à jour is_user_admin pour utiliser user_roles
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(check_user_id, 'admin');
$$;