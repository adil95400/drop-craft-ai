-- Add CRON job for automation engine
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to clean up old security events
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete security events older than 90 days
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Log cleanup activity
  INSERT INTO public.security_events (
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    'system_cleanup',
    'info',
    'Cleaned up old security events',
    jsonb_build_object('timestamp', now())
  );
END;
$$;

-- Schedule the automation engine to run every hour
SELECT cron.schedule(
  'automation-engine-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/automation-engine',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
    body := '{"action": "schedule_jobs"}'::jsonb
  ) as request_id;
  $$
);

-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
  'daily-cleanup',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/automation-engine',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
    body := '{"action": "create_job", "jobType": "cleanup_data", "userId": null, "inputData": {"immediate": true}}'::jsonb
  ) as request_id;
  $$
);