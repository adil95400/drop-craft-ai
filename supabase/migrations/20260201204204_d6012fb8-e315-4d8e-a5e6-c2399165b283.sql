-- Fix RLS policy for audit log (was using 'true' which is too permissive)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.feature_flag_audit_log;

-- Replace with proper policy that only allows inserts from triggers/functions
CREATE POLICY "Authenticated users can insert audit logs for their actions"
ON public.feature_flag_audit_log FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);