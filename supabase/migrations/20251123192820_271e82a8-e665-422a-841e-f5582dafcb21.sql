-- ============================================
-- SÉCURISATION ADMIN - Nettoyage et Réimplémentation
-- ============================================

-- 1. Supprimer TOUS les triggers et fonctions problématiques en CASCADE
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS prevent_unauthorized_role_change_trigger ON public.user_roles CASCADE;
DROP TRIGGER IF EXISTS prevent_role_self_escalation_trigger ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.prevent_unauthorized_role_change() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_role_self_escalation() CASCADE;

-- 2. Ajouter la colonne is_admin à profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 3. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- 4. Fonction pour synchroniser is_admin avec user_roles
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
    SET is_admin = EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = OLD.user_id 
      AND role = 'admin'::app_role
    )
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Trigger pour synchroniser is_admin automatiquement
DROP TRIGGER IF EXISTS sync_admin_status_trigger ON public.user_roles;
CREATE TRIGGER sync_admin_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_admin_status();

-- 6. Empêcher modification directe de is_admin dans profiles
CREATE OR REPLACE FUNCTION public.protect_is_admin_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si tentative de modification de is_admin
  IF TG_OP = 'UPDATE' AND OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    -- Seuls les admins peuvent modifier (et seulement via les fonctions appropriées)
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      -- Restaurer l'ancienne valeur
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_is_admin_trigger ON public.profiles;
CREATE TRIGGER protect_is_admin_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_is_admin_column();

-- 7. Synchroniser les données existantes
UPDATE public.profiles p
SET is_admin = EXISTS (
  SELECT 1 
  FROM public.user_roles ur 
  WHERE ur.user_id = p.id 
  AND ur.role = 'admin'::app_role
);

-- 8. Fonction sécurisée pour vérifier le statut admin (simplifée)
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
COMMENT ON COLUMN public.profiles.is_admin IS 'Read-only: Auto-synced from user_roles table. Use admin_set_role() to modify.';
COMMENT ON FUNCTION public.sync_profile_admin_status() IS 'Automatically synchronizes is_admin with user_roles';
COMMENT ON FUNCTION public.is_admin_secure() IS 'Secure server-side admin verification from user_roles';
COMMENT ON FUNCTION public.protect_is_admin_column() IS 'Prevents unauthorized modification of is_admin column';