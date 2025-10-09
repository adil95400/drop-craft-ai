-- CRITICAL FIX: Résoudre la récursion infinie sur la table profiles
-- Les policies ne doivent JAMAIS référencer la table profiles directement

-- 1. Supprimer toutes les policies existantes sur profiles qui causent la récursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "strict_user_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "secure_user_access_profiles" ON public.profiles;

-- 2. Créer des fonctions SECURITY DEFINER sans récursion
CREATE OR REPLACE FUNCTION public.is_own_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin_secure(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_status boolean;
BEGIN
  -- Requête directe sans passer par RLS
  SELECT is_admin INTO admin_status
  FROM public.profiles
  WHERE id = check_user_id;
  
  RETURN COALESCE(admin_status, false);
END;
$$;

-- 3. Créer des policies simples qui utilisent UNIQUEMENT des fonctions SECURITY DEFINER
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_own_profile(id));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_own_profile(id))
WITH CHECK (public.is_own_profile(id));

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_own_profile(id));

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_user_admin_secure(auth.uid()));

-- 4. Corriger la fonction process_pending_imports
CREATE OR REPLACE FUNCTION public.process_pending_imports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_job RECORD;
  api_url TEXT;
BEGIN
  api_url := 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/api-import-execute';
  
  SELECT *
  INTO pending_job
  FROM public.import_jobs
  WHERE status = 'pending'
    AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    AND (started_at IS NULL OR started_at < NOW() - INTERVAL '10 minutes')
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF pending_job.id IS NOT NULL THEN
    UPDATE public.import_jobs
    SET 
      status = 'processing',
      started_at = NOW(),
      updated_at = NOW()
    WHERE id = pending_job.id;
    
    PERFORM net.http_post(
      url := api_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI'
      ),
      body := jsonb_build_object(
        'job_id', pending_job.id,
        'user_id', pending_job.user_id,
        'source_type', pending_job.source_type,
        'source_url', pending_job.source_url
      ),
      timeout_milliseconds := 300000
    );
  END IF;
END;
$$;