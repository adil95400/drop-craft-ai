-- Table pour les jobs de génération en masse
CREATE TABLE IF NOT EXISTS public.bulk_content_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('videos', 'images', 'social_posts')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  input_data JSONB NOT NULL,
  results JSONB DEFAULT '[]'::jsonb,
  error_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulk_content_jobs ENABLE ROW LEVEL SECURITY;

-- Policies pour bulk_content_jobs
CREATE POLICY "Users can view their own bulk jobs"
  ON public.bulk_content_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bulk jobs"
  ON public.bulk_content_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk jobs"
  ON public.bulk_content_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bulk jobs"
  ON public.bulk_content_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_bulk_content_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bulk_content_jobs_updated_at
  BEFORE UPDATE ON public.bulk_content_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bulk_content_jobs_updated_at();

-- Index pour performance
CREATE INDEX idx_bulk_content_jobs_user_id ON public.bulk_content_jobs(user_id);
CREATE INDEX idx_bulk_content_jobs_status ON public.bulk_content_jobs(status);
CREATE INDEX idx_bulk_content_jobs_created_at ON public.bulk_content_jobs(created_at DESC);