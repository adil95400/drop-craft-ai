-- P0.3 FIX: Secure RLS policies for tables with overly permissive policies

-- extension_heartbeats: Restrict to user's own heartbeats
DROP POLICY IF EXISTS "System can manage extension heartbeats" ON public.extension_heartbeats;
DROP POLICY IF EXISTS "extension_heartbeats_user_own" ON public.extension_heartbeats;
DROP POLICY IF EXISTS "extension_heartbeats_service" ON public.extension_heartbeats;

CREATE POLICY "extension_heartbeats_user_own"
ON public.extension_heartbeats FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "extension_heartbeats_service"
ON public.extension_heartbeats FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- extension_sessions: Restrict to user's own sessions
DROP POLICY IF EXISTS "System can insert extension sessions" ON public.extension_sessions;
DROP POLICY IF EXISTS "System can update extension sessions" ON public.extension_sessions;
DROP POLICY IF EXISTS "extension_sessions_user_select" ON public.extension_sessions;
DROP POLICY IF EXISTS "extension_sessions_service_all" ON public.extension_sessions;

CREATE POLICY "extension_sessions_user_select"
ON public.extension_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "extension_sessions_service_all"
ON public.extension_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- unified_sync_logs: Restrict to user's own logs
DROP POLICY IF EXISTS "System can insert sync logs" ON public.unified_sync_logs;
DROP POLICY IF EXISTS "unified_sync_logs_user_select" ON public.unified_sync_logs;
DROP POLICY IF EXISTS "unified_sync_logs_service_insert" ON public.unified_sync_logs;

CREATE POLICY "unified_sync_logs_user_select"
ON public.unified_sync_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "unified_sync_logs_service_insert"
ON public.unified_sync_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Log this security fix
INSERT INTO public.security_events (event_type, severity, description, metadata)
VALUES (
  'rls_security_fix_applied',
  'warning',
  'P0.3 RLS policy fix: Removed overly permissive policies and added user-scoped access controls',
  jsonb_build_object(
    'fixed_tables', ARRAY['extension_heartbeats', 'extension_sessions', 'unified_sync_logs'],
    'applied_at', now()
  )
);