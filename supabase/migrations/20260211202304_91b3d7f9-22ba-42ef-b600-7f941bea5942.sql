
-- Fix search_path on functions without it
ALTER FUNCTION public.cleanup_expired_import_records() SET search_path = public;
ALTER FUNCTION public.get_import_job_with_product(uuid, uuid) SET search_path = public;

-- Fix overly permissive RLS policies
-- contact_messages: keep INSERT true (public contact form - legitimate)
-- The "Service role can insert" policies are fine since service_role bypasses RLS anyway,
-- but let's tighten them to require service_role explicitly

-- Extension scope usage log - restrict to authenticated
DROP POLICY IF EXISTS "Service role can insert scope usage" ON public.extension_scope_usage_log;
CREATE POLICY "Authenticated can insert scope usage" ON public.extension_scope_usage_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- gateway_logs - restrict to authenticated  
DROP POLICY IF EXISTS "Service role can insert gateway logs" ON public.gateway_logs;
CREATE POLICY "Authenticated can insert gateway logs" ON public.gateway_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- import_pipeline_logs - restrict to authenticated
DROP POLICY IF EXISTS "Service role can insert pipeline logs" ON public.import_pipeline_logs;
CREATE POLICY "Authenticated can insert pipeline logs" ON public.import_pipeline_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- request_replay_log - restrict to authenticated
DROP POLICY IF EXISTS "Service role can insert replay logs" ON public.request_replay_log;
CREATE POLICY "Authenticated can insert replay logs" ON public.request_replay_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- security_audit_log - restrict to authenticated
DROP POLICY IF EXISTS "Service role can insert security logs" ON public.security_audit_log;
CREATE POLICY "Authenticated can insert security logs" ON public.security_audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- unified_sync_logs - restrict to authenticated
DROP POLICY IF EXISTS "unified_sync_logs_service_insert" ON public.unified_sync_logs;
CREATE POLICY "Authenticated can insert sync logs" ON public.unified_sync_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
