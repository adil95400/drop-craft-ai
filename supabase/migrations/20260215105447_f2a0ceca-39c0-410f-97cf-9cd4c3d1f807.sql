
-- P0.3: Corrective migration — align DB ↔ API ↔ UI (retry)

-- 1) PRODUCTS: status constraint
UPDATE public.products SET status = 'draft' WHERE status IS NULL OR status NOT IN ('draft', 'active', 'paused', 'archived', 'error');

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('draft', 'active', 'paused', 'archived', 'error'));

-- 2) JOBS: Enrich for unified system (skip existing constraint)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_subtype TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS celery_task_id TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS input_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS output_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS progress_message TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS retries INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Drop and re-add jobs status constraint to include all needed values
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_type ON public.jobs(user_id, job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_celery_task ON public.jobs(celery_task_id) WHERE celery_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON public.job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_items_product_id ON public.job_items(product_id) WHERE product_id IS NOT NULL;

-- 3) Realtime on jobs + job_items
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.job_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4) RLS policies on jobs + job_items
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Users can view own jobs') THEN
    CREATE POLICY "Users can view own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Users can insert own jobs') THEN
    CREATE POLICY "Users can insert own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Users can update own jobs') THEN
    CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_items' AND policyname = 'Users can view own job items') THEN
    CREATE POLICY "Users can view own job items" ON public.job_items FOR SELECT 
      USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_items' AND policyname = 'Users can insert own job items') THEN
    CREATE POLICY "Users can insert own job items" ON public.job_items FOR INSERT 
      WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_items' AND policyname = 'Users can update own job items') THEN
    CREATE POLICY "Users can update own job items" ON public.job_items FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
  END IF;
END $$;
