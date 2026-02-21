
-- Add missing columns to job_items for robust import pipeline
ALTER TABLE public.job_items ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.job_items ADD COLUMN IF NOT EXISTS line_number INTEGER DEFAULT 0;
ALTER TABLE public.job_items ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE public.job_items ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.job_items ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Rename 'message' to keep backward compat but also use error_message
-- Update existing data
UPDATE public.job_items SET error_message = message WHERE error_message IS NULL AND message IS NOT NULL;

-- Index for pipeline queries
CREATE INDEX IF NOT EXISTS idx_job_items_user_id ON public.job_items(user_id);
CREATE INDEX IF NOT EXISTS idx_job_items_user_status ON public.job_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_items_job_status ON public.job_items(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_items_line ON public.job_items(job_id, line_number);

-- Enable RLS if not already
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can insert their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can update their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can delete their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Service role full access on job_items" ON public.job_items;

-- RLS policies
CREATE POLICY "Users can view their own job items"
  ON public.job_items FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access on job_items"
  ON public.job_items FOR ALL
  USING (true)
  WITH CHECK (true);
