-- Enable pg_cron and pg_net extensions for automated import processing
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create function to process pending imports
CREATE OR REPLACE FUNCTION public.process_pending_imports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_job RECORD;
  api_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get Supabase URL and service role key from environment
  api_url := 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/api-import-execute';
  
  -- Get one pending import job that's ready to process
  SELECT *
  INTO pending_job
  FROM public.import_jobs
  WHERE status = 'pending'
    AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    AND (started_at IS NULL OR started_at < NOW() - INTERVAL '10 minutes') -- Retry stuck jobs
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- If we found a job, trigger the edge function
  IF pending_job.id IS NOT NULL THEN
    -- Mark as processing
    UPDATE public.import_jobs
    SET 
      status = 'processing',
      started_at = NOW(),
      updated_at = NOW()
    WHERE id = pending_job.id;
    
    -- Call the edge function via pg_net (async HTTP request)
    PERFORM net.http_post(
      url := api_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI'
      ),
      body := jsonb_build_object(
        'job_id', pending_job.id,
        'user_id', pending_job.user_id,
        'config', pending_job.configuration
      ),
      timeout_milliseconds := 300000 -- 5 minutes timeout
    );
    
    -- Log the trigger in activity
    INSERT INTO public.activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    ) VALUES (
      pending_job.user_id,
      'import_triggered',
      'import_job',
      pending_job.id::text,
      'Import job triggered automatically by cron',
      jsonb_build_object(
        'job_id', pending_job.id,
        'source_type', pending_job.source_type,
        'timestamp', NOW()
      )
    );
  END IF;
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-pending-imports',
  '* * * * *', -- Every minute
  $$SELECT public.process_pending_imports();$$
);

-- Create function to retry failed imports
CREATE OR REPLACE FUNCTION public.retry_failed_import(job_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_record RECORD;
  result jsonb;
BEGIN
  -- Check if user owns this job or is admin
  SELECT * INTO job_record
  FROM public.import_jobs
  WHERE id = job_id
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Job not found or access denied'
    );
  END IF;
  
  -- Reset the job to pending
  UPDATE public.import_jobs
  SET 
    status = 'pending',
    started_at = NULL,
    completed_at = NULL,
    errors = NULL,
    processed_rows = 0,
    failed_rows = 0,
    updated_at = NOW()
  WHERE id = job_id;
  
  -- Log the retry
  INSERT INTO public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    description
  ) VALUES (
    auth.uid(),
    'import_retry',
    'import_job',
    job_id::text,
    'Import job manually retried'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Import job reset to pending and will be processed soon',
    'job_id', job_id
  );
END;
$$;

-- Reset the 7 stuck imports to pending so they get processed
UPDATE public.import_jobs
SET 
  status = 'pending',
  started_at = NULL,
  updated_at = NOW()
WHERE status = 'pending'
  AND started_at IS NULL
  AND created_at < NOW() - INTERVAL '1 day';

-- Add helpful comments
COMMENT ON FUNCTION public.process_pending_imports() IS 'Automatically processes pending import jobs every minute via cron';
COMMENT ON FUNCTION public.retry_failed_import(UUID) IS 'Allows users to retry failed or stuck import jobs';