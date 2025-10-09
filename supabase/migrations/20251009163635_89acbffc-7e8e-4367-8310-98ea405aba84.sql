-- Add 'api' to the allowed source_type values
ALTER TABLE public.import_jobs DROP CONSTRAINT IF EXISTS import_jobs_source_type_check;

ALTER TABLE public.import_jobs ADD CONSTRAINT import_jobs_source_type_check 
CHECK (source_type = ANY (ARRAY['csv'::text, 'excel'::text, 'shopify'::text, 'aliexpress'::text, 'amazon'::text, 'api'::text]));