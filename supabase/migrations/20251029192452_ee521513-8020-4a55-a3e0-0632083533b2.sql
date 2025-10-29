-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE public.import_jobs REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER TABLE public.extension_auth_tokens REPLICA IDENTITY FULL;