-- =============================================
-- PROGRESSIVE IMPORT MODEL v1.0
-- Async job-based import with status tracking
-- =============================================

-- 1. Product Import Jobs table (central tracking)
CREATE TABLE IF NOT EXISTS public.product_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'scraping', 'enriching', 'ready', 'error_incomplete', 'error')),
  missing_fields TEXT[] DEFAULT '{}',
  error_code TEXT,
  error_message TEXT,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  extraction_method TEXT, -- 'api' | 'headless' | 'html' | 'mixed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2. Add job_id and new fields to imported_products
ALTER TABLE public.imported_products 
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.product_import_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description_html TEXT,
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS variants_json JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS completeness_score INTEGER DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  ADD COLUMN IF NOT EXISTS sources_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

-- 3. Create index for efficient job lookups
CREATE INDEX IF NOT EXISTS idx_product_import_jobs_user_status 
  ON public.product_import_jobs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_product_import_jobs_created 
  ON public.product_import_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_imported_products_job_id 
  ON public.imported_products(job_id);

-- 4. Enable RLS
ALTER TABLE public.product_import_jobs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for product_import_jobs
CREATE POLICY "Users can view own import jobs"
  ON public.product_import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import jobs"
  ON public.product_import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import jobs"
  ON public.product_import_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import jobs"
  ON public.product_import_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_product_import_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_product_import_jobs_updated_at ON public.product_import_jobs;
CREATE TRIGGER trigger_update_product_import_jobs_updated_at
  BEFORE UPDATE ON public.product_import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_import_jobs_updated_at();

-- 7. Enable realtime for job status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_import_jobs;