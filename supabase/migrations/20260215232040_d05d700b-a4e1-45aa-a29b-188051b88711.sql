
-- Sprint 3: Fix SECURITY DEFINER views → SECURITY INVOKER
-- This ensures views respect the calling user's RLS policies

-- 1. background_jobs view
CREATE OR REPLACE VIEW public.background_jobs
WITH (security_invoker = true)
AS
SELECT id, user_id, job_type, job_subtype, name, status,
    progress_percent::integer AS progress_percent,
    progress_message, input_data, output_data, error_message,
    (metadata ->> 'error_details') AS error_details_text,
    total_items AS items_total,
    processed_items AS items_processed,
    (processed_items - failed_items) AS items_succeeded,
    failed_items AS items_failed,
    started_at, completed_at,
    NULL::timestamptz AS estimated_completion_at,
    duration_ms, priority, retries, max_retries, metadata, created_at, updated_at
FROM jobs;

-- 2. background_jobs_compat view
CREATE OR REPLACE VIEW public.background_jobs_compat
WITH (security_invoker = true)
AS
SELECT id, user_id, job_type, job_subtype, name, status,
    progress_percent, progress_message, input_data, output_data, error_message,
    total_items AS items_total,
    processed_items AS items_processed,
    GREATEST(0, COALESCE(processed_items, 0) - COALESCE(failed_items, 0)) AS items_succeeded,
    failed_items AS items_failed,
    started_at, completed_at, created_at, updated_at,
    celery_task_id, priority, duration_ms, max_retries, retries, metadata
FROM jobs;

-- 3. automation_rules view
CREATE OR REPLACE VIEW public.automation_rules
WITH (security_invoker = true)
AS
SELECT id, user_id, name, description,
    COALESCE(trigger_type, 'manual') AS trigger_type,
    trigger_config,
    COALESCE(action_type, 'notification') AS action_type,
    action_config,
    COALESCE(is_active, false) AS is_active,
    COALESCE(trigger_count, 0) AS trigger_count,
    last_triggered_at,
    COALESCE(execution_count, 0) AS execution_count,
    created_at, updated_at
FROM automation_workflows;

-- 4. extension_jobs view
CREATE OR REPLACE VIEW public.extension_jobs
WITH (security_invoker = true)
AS
SELECT id, user_id,
    (metadata ->> 'extension_id')::uuid AS extension_id,
    job_type, status, input_data, output_data, error_message,
    started_at, completed_at, created_at
FROM jobs
WHERE job_type LIKE 'extension_%' OR (metadata ->> 'source') = 'extension';

-- 5. import_jobs view
CREATE OR REPLACE VIEW public.import_jobs
WITH (security_invoker = true)
AS
SELECT id, user_id, job_type, status,
    (metadata ->> 'source_url') AS source_url,
    (metadata ->> 'source_platform') AS source_platform,
    total_items AS total_products,
    processed_items AS processed_products,
    (processed_items - failed_items) AS successful_imports,
    failed_items AS failed_imports,
    (metadata -> 'error_log') AS error_log,
    (metadata ->> 'supplier_id') AS supplier_id,
    (metadata -> 'import_settings') AS import_settings,
    (metadata -> 'mapping_config') AS mapping_config,
    started_at, completed_at, created_at, updated_at
FROM jobs;

-- 6. price_rules view
CREATE OR REPLACE VIEW public.price_rules
WITH (security_invoker = true)
AS
SELECT id, user_id, name, description, rule_type, priority,
    COALESCE(conditions, '[]'::jsonb) AS conditions,
    COALESCE(calculation, '{}'::jsonb) AS calculation,
    COALESCE(apply_to, 'all') AS apply_to,
    apply_filter,
    COALESCE(is_active, true) AS is_active,
    COALESCE(products_affected, 0) AS products_affected,
    last_executed_at AS last_applied_at,
    created_at, updated_at
FROM pricing_rules;

-- 7. product_import_jobs view
CREATE OR REPLACE VIEW public.product_import_jobs
WITH (security_invoker = true)
AS
SELECT id, user_id,
    (metadata ->> 'source_url') AS source_url,
    COALESCE((metadata ->> 'platform'), 'unknown') AS platform,
    status,
    (metadata -> 'missing_fields') AS missing_fields,
    (metadata ->> 'error_code') AS error_code,
    error_message,
    progress_percent::integer AS progress_percent,
    (metadata ->> 'extraction_method') AS extraction_method,
    retries AS retry_count,
    max_retries, metadata, created_at, updated_at, started_at, completed_at
FROM jobs
WHERE job_type = ANY(ARRAY['import', 'csv_import', 'url_import', 'product_import', 'scraping']);

-- 8. audit_log_summary view  
CREATE OR REPLACE VIEW public.audit_log_summary
WITH (security_invoker = true)
AS
SELECT date(created_at) AS log_date,
    action_category, severity,
    count(*) AS event_count,
    count(DISTINCT user_id) AS unique_users
FROM audit_logs
WHERE created_at > (now() - interval '30 days')
GROUP BY date(created_at), action_category, severity
ORDER BY date(created_at) DESC, count(*) DESC;
