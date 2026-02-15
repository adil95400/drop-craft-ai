
-- ================================================================
-- Make compatibility views writable via INSTEAD OF triggers
-- This allows existing code to INSERT/UPDATE/DELETE on views
-- while data goes to the canonical `jobs` table
-- ================================================================

-- Drop existing views first (need to recreate as they can't have triggers as-is)
DROP VIEW IF EXISTS public.background_jobs CASCADE;
DROP VIEW IF EXISTS public.import_jobs CASCADE;
DROP VIEW IF EXISTS public.product_import_jobs CASCADE;
DROP VIEW IF EXISTS public.extension_jobs CASCADE;

-- ================================================================
-- import_jobs — writable view
-- ================================================================
CREATE VIEW public.import_jobs AS
SELECT
  id,
  user_id,
  job_type,
  status,
  metadata->>'source_url' AS source_url,
  metadata->>'source_platform' AS source_platform,
  total_items AS total_products,
  processed_items AS processed_products,
  (processed_items - failed_items) AS successful_imports,
  failed_items AS failed_imports,
  metadata->'error_log' AS error_log,
  metadata->>'supplier_id' AS supplier_id,
  metadata->'import_settings' AS import_settings,
  metadata->'mapping_config' AS mapping_config,
  started_at,
  completed_at,
  created_at,
  updated_at
FROM public.jobs;

CREATE OR REPLACE FUNCTION public.import_jobs_insert_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.jobs (
    id, user_id, job_type, job_subtype, status, 
    total_items, processed_items, failed_items,
    started_at, completed_at, metadata
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    COALESCE(NEW.job_type, 'import'),
    NEW.source_platform,
    COALESCE(NEW.status, 'pending'),
    COALESCE(NEW.total_products, 0),
    COALESCE(NEW.processed_products, 0),
    COALESCE(NEW.failed_imports, 0),
    NEW.started_at,
    NEW.completed_at,
    jsonb_build_object(
      'source_url', NEW.source_url,
      'source_platform', NEW.source_platform,
      'supplier_id', NEW.supplier_id,
      'import_settings', NEW.import_settings,
      'mapping_config', NEW.mapping_config,
      'error_log', NEW.error_log
    )
  ) RETURNING * INTO NEW;
  RETURN NEW;
END;
$$;

CREATE TRIGGER import_jobs_insert_trigger
INSTEAD OF INSERT ON public.import_jobs
FOR EACH ROW EXECUTE FUNCTION public.import_jobs_insert_fn();

CREATE OR REPLACE FUNCTION public.import_jobs_update_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  new_metadata jsonb;
BEGIN
  -- Build new metadata by merging
  SELECT COALESCE(j.metadata, '{}'::jsonb) INTO new_metadata FROM public.jobs j WHERE j.id = OLD.id;
  
  IF NEW.source_url IS DISTINCT FROM OLD.source_url THEN
    new_metadata = new_metadata || jsonb_build_object('source_url', NEW.source_url);
  END IF;
  IF NEW.source_platform IS DISTINCT FROM OLD.source_platform THEN
    new_metadata = new_metadata || jsonb_build_object('source_platform', NEW.source_platform);
  END IF;
  IF NEW.supplier_id IS DISTINCT FROM OLD.supplier_id THEN
    new_metadata = new_metadata || jsonb_build_object('supplier_id', NEW.supplier_id);
  END IF;
  IF NEW.import_settings IS DISTINCT FROM OLD.import_settings THEN
    new_metadata = new_metadata || jsonb_build_object('import_settings', NEW.import_settings);
  END IF;
  IF NEW.mapping_config IS DISTINCT FROM OLD.mapping_config THEN
    new_metadata = new_metadata || jsonb_build_object('mapping_config', NEW.mapping_config);
  END IF;
  IF NEW.error_log IS DISTINCT FROM OLD.error_log THEN
    new_metadata = new_metadata || jsonb_build_object('error_log', NEW.error_log);
  END IF;

  UPDATE public.jobs SET
    status = COALESCE(NEW.status, OLD.status),
    total_items = COALESCE(NEW.total_products, OLD.total_products),
    processed_items = COALESCE(NEW.processed_products, OLD.processed_products),
    failed_items = COALESCE(NEW.failed_imports, OLD.failed_imports),
    started_at = COALESCE(NEW.started_at, OLD.started_at),
    completed_at = COALESCE(NEW.completed_at, OLD.completed_at),
    metadata = new_metadata,
    updated_at = now()
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER import_jobs_update_trigger
INSTEAD OF UPDATE ON public.import_jobs
FOR EACH ROW EXECUTE FUNCTION public.import_jobs_update_fn();

CREATE OR REPLACE FUNCTION public.import_jobs_delete_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  DELETE FROM public.jobs WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER import_jobs_delete_trigger
INSTEAD OF DELETE ON public.import_jobs
FOR EACH ROW EXECUTE FUNCTION public.import_jobs_delete_fn();

-- ================================================================
-- extension_jobs — writable view
-- ================================================================
CREATE VIEW public.extension_jobs AS
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

CREATE OR REPLACE FUNCTION public.extension_jobs_insert_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.jobs (
    id, user_id, job_type, status, input_data, output_data, error_message,
    started_at, completed_at, metadata
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    COALESCE(NEW.job_type, 'extension_import'),
    COALESCE(NEW.status, 'pending'),
    NEW.input_data,
    NEW.output_data,
    NEW.error_message,
    NEW.started_at,
    NEW.completed_at,
    jsonb_build_object('extension_id', NEW.extension_id, 'source', 'extension')
  ) RETURNING * INTO NEW;
  RETURN NEW;
END;
$$;

CREATE TRIGGER extension_jobs_insert_trigger
INSTEAD OF INSERT ON public.extension_jobs
FOR EACH ROW EXECUTE FUNCTION public.extension_jobs_insert_fn();

CREATE OR REPLACE FUNCTION public.extension_jobs_update_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.jobs SET
    status = COALESCE(NEW.status, OLD.status),
    input_data = COALESCE(NEW.input_data, OLD.input_data),
    output_data = COALESCE(NEW.output_data, OLD.output_data),
    error_message = COALESCE(NEW.error_message, OLD.error_message),
    started_at = COALESCE(NEW.started_at, OLD.started_at),
    completed_at = COALESCE(NEW.completed_at, OLD.completed_at),
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER extension_jobs_update_trigger
INSTEAD OF UPDATE ON public.extension_jobs
FOR EACH ROW EXECUTE FUNCTION public.extension_jobs_update_fn();

-- ================================================================
-- product_import_jobs — writable view  
-- ================================================================
CREATE VIEW public.product_import_jobs AS
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

CREATE OR REPLACE FUNCTION public.product_import_jobs_insert_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.jobs (
    id, user_id, job_type, status, error_message,
    progress_percent, retries, max_retries,
    started_at, completed_at, metadata
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    'product_import',
    COALESCE(NEW.status, 'received'),
    NEW.error_message,
    COALESCE(NEW.progress_percent, 0),
    COALESCE(NEW.retry_count, 0),
    COALESCE(NEW.max_retries, 3),
    NEW.started_at,
    NEW.completed_at,
    COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
      'source_url', NEW.source_url,
      'platform', NEW.platform,
      'missing_fields', NEW.missing_fields,
      'error_code', NEW.error_code,
      'extraction_method', NEW.extraction_method
    )
  ) RETURNING * INTO NEW;
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_import_jobs_insert_trigger
INSTEAD OF INSERT ON public.product_import_jobs
FOR EACH ROW EXECUTE FUNCTION public.product_import_jobs_insert_fn();

CREATE OR REPLACE FUNCTION public.product_import_jobs_update_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  new_metadata jsonb;
BEGIN
  SELECT COALESCE(j.metadata, '{}'::jsonb) INTO new_metadata FROM public.jobs j WHERE j.id = OLD.id;
  
  IF NEW.source_url IS DISTINCT FROM OLD.source_url THEN
    new_metadata = new_metadata || jsonb_build_object('source_url', NEW.source_url);
  END IF;
  IF NEW.platform IS DISTINCT FROM OLD.platform THEN
    new_metadata = new_metadata || jsonb_build_object('platform', NEW.platform);
  END IF;
  IF NEW.error_code IS DISTINCT FROM OLD.error_code THEN
    new_metadata = new_metadata || jsonb_build_object('error_code', NEW.error_code);
  END IF;
  IF NEW.extraction_method IS DISTINCT FROM OLD.extraction_method THEN
    new_metadata = new_metadata || jsonb_build_object('extraction_method', NEW.extraction_method);
  END IF;

  UPDATE public.jobs SET
    status = COALESCE(NEW.status, OLD.status),
    error_message = COALESCE(NEW.error_message, OLD.error_message),
    progress_percent = COALESCE(NEW.progress_percent, OLD.progress_percent),
    retries = COALESCE(NEW.retry_count, OLD.retry_count),
    max_retries = COALESCE(NEW.max_retries, OLD.max_retries),
    started_at = COALESCE(NEW.started_at, OLD.started_at),
    completed_at = COALESCE(NEW.completed_at, OLD.completed_at),
    metadata = new_metadata,
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_import_jobs_update_trigger
INSTEAD OF UPDATE ON public.product_import_jobs
FOR EACH ROW EXECUTE FUNCTION public.product_import_jobs_update_fn();

-- ================================================================
-- background_jobs — writable view
-- ================================================================
CREATE VIEW public.background_jobs AS
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

CREATE OR REPLACE FUNCTION public.background_jobs_insert_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.jobs (
    id, user_id, job_type, job_subtype, name, status,
    progress_percent, progress_message, input_data, output_data,
    error_message, total_items, processed_items, failed_items,
    started_at, completed_at, duration_ms, priority, retries, max_retries, metadata
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.job_type,
    NEW.job_subtype,
    NEW.name,
    COALESCE(NEW.status, 'pending'),
    COALESCE(NEW.progress_percent, 0),
    NEW.progress_message,
    NEW.input_data,
    NEW.output_data,
    NEW.error_message,
    COALESCE(NEW.items_total, 0),
    COALESCE(NEW.items_processed, 0),
    COALESCE(NEW.items_failed, 0),
    NEW.started_at,
    NEW.completed_at,
    NEW.duration_ms,
    COALESCE(NEW.priority, 5),
    COALESCE(NEW.retries, 0),
    COALESCE(NEW.max_retries, 3),
    COALESCE(NEW.metadata, '{}'::jsonb)
  ) RETURNING * INTO NEW;
  RETURN NEW;
END;
$$;

CREATE TRIGGER background_jobs_insert_trigger
INSTEAD OF INSERT ON public.background_jobs
FOR EACH ROW EXECUTE FUNCTION public.background_jobs_insert_fn();

CREATE OR REPLACE FUNCTION public.background_jobs_update_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.jobs SET
    status = COALESCE(NEW.status, OLD.status),
    progress_percent = COALESCE(NEW.progress_percent, OLD.progress_percent),
    progress_message = COALESCE(NEW.progress_message, OLD.progress_message),
    total_items = COALESCE(NEW.items_total, OLD.items_total),
    processed_items = COALESCE(NEW.items_processed, OLD.items_processed),
    failed_items = COALESCE(NEW.items_failed, OLD.items_failed),
    started_at = COALESCE(NEW.started_at, OLD.started_at),
    completed_at = COALESCE(NEW.completed_at, OLD.completed_at),
    error_message = COALESCE(NEW.error_message, OLD.error_message),
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER background_jobs_update_trigger
INSTEAD OF UPDATE ON public.background_jobs
FOR EACH ROW EXECUTE FUNCTION public.background_jobs_update_fn();
