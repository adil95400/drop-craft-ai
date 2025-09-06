-- Mettre à jour la table profiles avec des contraintes appropriées pour les rôles
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN role SET NOT NULL;

-- Créer un type enum pour les rôles si pas déjà existant
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((role = 'admin' OR is_admin = true), false) 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- Fonction pour obtenir le rôle de l'utilisateur actuel  
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT COALESCE(role, 'user') 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- Fonction pour permettre aux admins de changer les rôles
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  target_user_id uuid, 
  new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  target_user_exists boolean;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  SELECT public.get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Vérifier que le nouvel rôle est valide
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or user';
  END IF;
  
  -- Vérifier que l'utilisateur cible existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO target_user_exists;
  IF NOT target_user_exists THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Empêcher de changer son propre rôle
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  -- Mettre à jour le rôle
  UPDATE public.profiles 
  SET 
    role = new_role,
    is_admin = CASE WHEN new_role = 'admin' THEN true ELSE false END,
    role_updated_at = now(),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Logger l'événement de sécurité
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
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'target_user_id', target_user_id,
    'new_role', new_role
  );
END;
$$;

-- Fonction pour obtenir la liste des utilisateurs (admin seulement)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id uuid,
  full_name text,
  role text,
  is_admin boolean,
  created_at timestamptz,
  last_login_at timestamptz,
  login_count integer,
  plan text,
  subscription_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.role,
    COALESCE(p.is_admin, false) as is_admin,
    p.created_at,
    p.last_login_at,
    COALESCE(p.login_count, 0) as login_count,
    p.plan::text,
    p.subscription_status
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;