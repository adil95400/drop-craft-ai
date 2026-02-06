
-- ============================================================
-- FIX: Replace overly permissive public policies with service_role
-- These tables are only written/read by Edge Functions (service_role)
-- ============================================================

-- 1. extension_events
DROP POLICY IF EXISTS "Service role full access on extension_events" ON public.extension_events;
CREATE POLICY "Service role full access on extension_events"
  ON public.extension_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. extension_requests
DROP POLICY IF EXISTS "Service role full access on extension_requests" ON public.extension_requests;
CREATE POLICY "Service role full access on extension_requests"
  ON public.extension_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. idempotency_keys
DROP POLICY IF EXISTS "Service role full access on idempotency_keys" ON public.idempotency_keys;
CREATE POLICY "Service role full access on idempotency_keys"
  ON public.idempotency_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. import_jobs
DROP POLICY IF EXISTS "Service role full access on import_jobs" ON public.import_jobs;
CREATE POLICY "Service role full access on import_jobs"
  ON public.import_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Keep authenticated users able to read their own import jobs
CREATE POLICY "Users can view own import_jobs"
  ON public.import_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 5. gateway_logs
DROP POLICY IF EXISTS "Service can insert gateway logs" ON public.gateway_logs;
CREATE POLICY "Service role can insert gateway logs"
  ON public.gateway_logs FOR INSERT TO service_role WITH CHECK (true);

-- 6. import_pipeline_logs
DROP POLICY IF EXISTS "System can insert pipeline logs" ON public.import_pipeline_logs;
CREATE POLICY "Service role can insert pipeline logs"
  ON public.import_pipeline_logs FOR INSERT TO service_role WITH CHECK (true);

-- 7. request_replay_log
DROP POLICY IF EXISTS "Service can insert replay logs" ON public.request_replay_log;
CREATE POLICY "Service role can insert replay logs"
  ON public.request_replay_log FOR INSERT TO service_role WITH CHECK (true);
