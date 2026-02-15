
-- ================================================================
-- Phase 1 : Vues de compatibilité pour les tables Jobs doublons
-- Table canonique : `jobs` (24 colonnes, standard unifié)
-- Tables remplacées : background_jobs, import_jobs, product_import_jobs, extension_jobs
-- ================================================================

-- 1. Drop RLS policies on tables we're about to drop
DROP POLICY IF EXISTS "Users can create their own jobs" ON public.background_jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.background_jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.background_jobs;
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.background_jobs;

DROP POLICY IF EXISTS "Admins can view all extension jobs" ON public.extension_jobs;
DROP POLICY IF EXISTS "Users can manage own extension jobs" ON public.extension_jobs;

DROP POLICY IF EXISTS "Admins can view all import jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Service role full access on import_jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Users can manage own import jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Users can read own import_jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Users can view own import_jobs" ON public.import_jobs;

DROP POLICY IF EXISTS "Users can create own import jobs" ON public.product_import_jobs;
DROP POLICY IF EXISTS "Users can delete own import jobs" ON public.product_import_jobs;
DROP POLICY IF EXISTS "Users can update own import jobs" ON public.product_import_jobs;
DROP POLICY IF EXISTS "Users can view own import jobs" ON public.product_import_jobs;
DROP POLICY IF EXISTS "product_import_jobs_insert" ON public.product_import_jobs;
DROP POLICY IF EXISTS "product_import_jobs_select" ON public.product_import_jobs;
DROP POLICY IF EXISTS "product_import_jobs_update" ON public.product_import_jobs;

-- 2. Drop the duplicate tables (all confirmed empty, 0 rows)
DROP TABLE IF EXISTS public.background_jobs CASCADE;
DROP TABLE IF EXISTS public.import_jobs CASCADE;
DROP TABLE IF EXISTS public.product_import_jobs CASCADE;
DROP TABLE IF EXISTS public.extension_jobs CASCADE;

-- 3. Create compatibility views mapping to canonical `jobs` table

-- background_jobs view (maps column names)
CREATE OR REPLACE VIEW public.background_jobs AS
SELECT 
  id,
  user_id,
  job_type,
  job_subtype,
  name,
  status,
  progress_percent::integer AS progress_percent,
  progress_message,
  input_data,
  output_data,
  error_message,
  metadata->>'error_details' AS error_details_text,
  total_items AS items_total,
  processed_items AS items_processed,
  (processed_items - failed_items) AS items_succeeded,
  failed_items AS items_failed,
  started_at,
  completed_at,
  NULL::timestamptz AS estimated_completion_at,
  duration_ms,
  priority,
  retries,
  max_retries,
  metadata,
  created_at,
  updated_at
FROM public.jobs;

-- import_jobs view
CREATE OR REPLACE VIEW public.import_jobs AS
SELECT
  id,
  user_id,
  job_type,
  status,
  metadata->>'source_url' AS source_url,
  metadata->>'source_platform' AS source_platform,
  total_items AS total_products,
  (processed_items - failed_items) AS successful_imports,
  failed_items AS failed_imports,
  metadata->'error_log' AS error_log,
  started_at,
  completed_at,
  created_at,
  updated_at
FROM public.jobs
WHERE job_type IN ('import', 'csv_import', 'url_import', 'bulk_import');

-- product_import_jobs view
CREATE OR REPLACE VIEW public.product_import_jobs AS
SELECT
  id,
  user_id,
  metadata->>'source_url' AS source_url,
  COALESCE(metadata->>'platform', 'unknown') AS platform,
  status,
  metadata->'missing_fields' AS missing_fields,
  metadata->>'error_code' AS error_code,
  error_message,
  progress_percent::integer AS progress_percent,
  metadata->>'extraction_method' AS extraction_method,
  retries AS retry_count,
  max_retries,
  metadata,
  created_at,
  updated_at,
  started_at,
  completed_at
FROM public.jobs
WHERE job_type IN ('import', 'csv_import', 'url_import', 'product_import', 'scraping');

-- extension_jobs view
CREATE OR REPLACE VIEW public.extension_jobs AS
SELECT
  id,
  user_id,
  (metadata->>'extension_id')::uuid AS extension_id,
  job_type,
  status,
  input_data,
  output_data,
  error_message,
  started_at,
  completed_at,
  created_at
FROM public.jobs
WHERE job_type LIKE 'extension_%' OR metadata->>'source' = 'extension';

-- 4. Drop the old update trigger function for background_jobs (no longer needed)
DROP FUNCTION IF EXISTS public.update_background_jobs_updated_at() CASCADE;
