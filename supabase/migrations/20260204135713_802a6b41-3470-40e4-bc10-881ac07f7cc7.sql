-- Table générique pour le suivi de toutes les tâches de fond
-- (imports, sync IA, génération de rapports, etc.)

CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Identification du job
  job_type TEXT NOT NULL, -- 'import', 'ai_generation', 'sync', 'report', 'bulk_operation'
  job_subtype TEXT, -- 'csv', 'xml', 'seo', 'description', 'shopify', etc.
  name TEXT, -- Nom lisible pour l'utilisateur
  
  -- État du job
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  progress_percent INTEGER DEFAULT 0,
  progress_message TEXT,
  
  -- Données d'entrée/sortie
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  error_details JSONB,
  
  -- Métriques
  items_total INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Métadonnées
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_background_jobs_user_id ON public.background_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON public.background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_job_type ON public.background_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_at ON public.background_jobs(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_background_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Calculer la durée si le job est terminé
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
    IF NEW.started_at IS NOT NULL THEN
      NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_background_jobs_updated_at
  BEFORE UPDATE ON public.background_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_background_jobs_updated_at();

-- Enable RLS
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see/manage their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.background_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
  ON public.background_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.background_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON public.background_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.background_jobs IS 'Generic table for tracking all async background tasks (imports, AI, sync, reports)';