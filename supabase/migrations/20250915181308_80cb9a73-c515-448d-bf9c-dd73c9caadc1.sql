-- Phase 1 - Corrections critiques sécurité RLS
-- Correction des politiques RLS qui autorisent l'accès anonyme

-- 1. Corriger les politiques pour forcer l'authentification
-- Supprimer les anciennes politiques problématiques et les remplacer

-- Correction pour ab_test_experiments
DROP POLICY IF EXISTS "Authenticated users only - ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Authenticated users only - ab_test_experiments" ON public.ab_test_experiments
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

-- Correction pour activity_logs  
DROP POLICY IF EXISTS "Authenticated users only - activity_logs" ON public.activity_logs;
CREATE POLICY "Authenticated users only - activity_logs" ON public.activity_logs
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

-- Correction pour advanced_reports
DROP POLICY IF EXISTS "Authenticated users only - advanced_reports" ON public.advanced_reports;  
CREATE POLICY "Authenticated users only - advanced_reports" ON public.advanced_reports
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

-- 2. Sécuriser les fonctions avec search_path approprié
-- Correction pour get_user_role
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

-- 3. Protéger les tables critiques comme api_cache
DROP POLICY IF EXISTS "Service role only - api_cache" ON public.api_cache;
CREATE POLICY "Service role only - api_cache" ON public.api_cache
FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
  AND auth.uid() IS NOT NULL
);

-- 4. Logger les accès critiques pour audit
CREATE OR REPLACE FUNCTION public.log_security_access_secure(
  access_type text,
  table_name text,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ne logger que si l'utilisateur est authentifié  
  IF auth.uid() IS NOT NULL AND auth.role() = 'authenticated' THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      user_id_param,
      'data_access',
      'info',
      format('Secure access to %s: %s', table_name, access_type),
      jsonb_build_object(
        'table', table_name,
        'access_type', access_type,
        'timestamp', now()
      )
    );
  END IF;
END;
$function$;