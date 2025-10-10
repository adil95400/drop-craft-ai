-- Phase 2: Correction du schéma et optimisation des performances (FIXED)

-- Ajouter des colonnes manquantes si elles n'existent pas déjà
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS configuration jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS import_type text;

-- Créer des index de performance pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_status 
ON public.import_jobs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_import_jobs_created 
ON public.import_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status_updated 
ON public.import_jobs(status, updated_at DESC);

-- Corriger: utiliser import_id au lieu de import_job_id
CREATE INDEX IF NOT EXISTS idx_imported_products_import_id 
ON public.imported_products(import_id);

CREATE INDEX IF NOT EXISTS idx_imported_products_user_status 
ON public.imported_products(user_id, status);

-- Fonction pour nettoyer les anciens jobs terminés (garder 30 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_import_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.import_jobs
  WHERE status IN ('completed', 'failed')
  AND completed_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Fonction pour débloquer les jobs coincés en "processing"
CREATE OR REPLACE FUNCTION public.unlock_stuck_import_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Marquer comme failed les jobs en processing depuis plus de 30 minutes
  UPDATE public.import_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    errors = ARRAY['Job timeout - stuck in processing for more than 30 minutes'],
    updated_at = NOW()
  WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '30 minutes';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;