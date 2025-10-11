-- Activer la réplication pour les imports en temps réel
ALTER TABLE public.import_jobs REPLICA IDENTITY FULL;

-- Activer les publications realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_jobs;

-- Créer un index pour optimiser les requêtes realtime
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_realtime 
ON public.import_jobs(user_id, status, updated_at DESC)
WHERE status IN ('pending', 'processing');

-- Fonction pour nettoyer automatiquement les jobs terminés après 7 jours
CREATE OR REPLACE FUNCTION public.archive_old_import_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archiver les jobs terminés de plus de 7 jours
  DELETE FROM public.import_jobs
  WHERE status IN ('completed', 'failed')
  AND completed_at < NOW() - INTERVAL '7 days';
  
  RAISE NOTICE 'Old import jobs archived';
END;
$$;

-- Planifier le nettoyage hebdomadaire
SELECT cron.schedule(
  'archive-old-imports',
  '0 2 * * 0', -- Dimanche à 2h du matin
  $$SELECT public.archive_old_import_jobs()$$
);