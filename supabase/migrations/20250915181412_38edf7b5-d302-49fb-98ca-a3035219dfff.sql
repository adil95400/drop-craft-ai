-- Phase 1 - Corrections critiques sécurité RLS (Suite)
-- Correction de l'erreur précédente

-- 1. Supprimer et recréer la fonction get_user_role_secure  
DROP FUNCTION IF EXISTS public.get_user_role_secure(uuid);

CREATE OR REPLACE FUNCTION public.get_user_role_secure(check_user_id uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role, 'user') 
  FROM public.profiles 
  WHERE id = check_user_id 
    AND check_user_id IS NOT NULL 
    AND auth.uid() IS NOT NULL
    AND auth.role() = 'authenticated';
$function$;

-- 2. Créer une fonction sécurisée pour vérifier les permissions admin
CREATE OR REPLACE FUNCTION public.is_authenticated_admin_secure()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND auth.uid() IS NOT NULL
    AND auth.role() = 'authenticated'
  );
$function$;