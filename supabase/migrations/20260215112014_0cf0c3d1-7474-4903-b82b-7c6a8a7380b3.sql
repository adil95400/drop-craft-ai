
-- P1.2: Create a compatibility view so any remaining legacy references to background_jobs
-- (edge functions, external tools) continue to work transparently.
-- This view maps jobs table columns to the old background_jobs column names.

CREATE OR REPLACE VIEW public.background_jobs_compat AS
SELECT
  id,
  user_id,
  job_type,
  job_subtype,
  name,
  status,
  progress_percent,
  progress_message,
  input_data,
  output_data,
  error_message,
  -- Map jobs columns to old background_jobs column names
  total_items AS items_total,
  processed_items AS items_processed,
  GREATEST(0, COALESCE(processed_items, 0) - COALESCE(failed_items, 0)) AS items_succeeded,
  failed_items AS items_failed,
  started_at,
  completed_at,
  created_at,
  updated_at,
  celery_task_id,
  priority,
  duration_ms,
  max_retries,
  retries,
  metadata
FROM public.jobs;

-- Add comment for documentation
COMMENT ON VIEW public.background_jobs_compat IS 'Legacy compatibility view mapping jobs → background_jobs column names. DO NOT use for new code. Use jobs table directly.';
