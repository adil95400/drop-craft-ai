ALTER TABLE public.jobs DROP CONSTRAINT jobs_job_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_job_type_check CHECK (job_type = ANY (ARRAY['sync','import','export','pricing','ai_enrich','bulk_edit','publish','unpublish','ai_generation','scraping','seo_audit','fulfillment','webhook','email']));
