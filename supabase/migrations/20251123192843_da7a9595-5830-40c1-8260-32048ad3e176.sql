-- ============================================
-- NETTOYAGE COMPLET DES TRIGGERS PROBLÉMATIQUES
-- ============================================

-- 1. Lister et supprimer TOUS les triggers problématiques sur profiles
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS prevent_role_self_escalation_trigger ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS prevent_unauthorized_role_change_trigger ON public.user_roles CASCADE;

-- 2. Supprimer les fonctions associées en CASCADE
DROP FUNCTION IF EXISTS public.prevent_unauthorized_role_change() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_role_self_escalation() CASCADE;

-- 3. Ajouter la colonne is_admin à profiles (si elle n'existe pas)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- 5. Fonction de synchronisation is_admin <-> user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_admin_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET is_admin = EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = NEW.user_id 
      AND role = 'admin'::app_role
    )
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET is_admin = false
    WHERE id = OLD.user_id
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = OLD.user_id 
      AND role = 'admin'::app_role
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Trigger sur user_roles pour sync auto
DROP TRIGGER IF EXISTS sync_admin_status_trigger ON public.user_roles;
CREATE TRIGGER sync_admin_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_admin_status();

-- 7. Synchroniser les données existantes
UPDATE public.profiles p
SET is_admin = EXISTS (
  SELECT 1 
  FROM public.user_roles ur 
  WHERE ur.user_id = p.id 
  AND ur.role = 'admin'::app_role
);

-- 8. Fonction sécurisée pour vérifier admin
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
$$;

-- 9. Commentaires
COMMENT ON COLUMN public.profiles.is_admin IS 'Admin status synced from user_roles. Use admin_set_role() to modify roles.';
COMMENT ON FUNCTION public.sync_profile_admin_status() IS 'Auto-syncs is_admin when user_roles changes';
COMMENT ON FUNCTION public.is_admin_secure() IS 'Secure server-side admin check via user_roles table';