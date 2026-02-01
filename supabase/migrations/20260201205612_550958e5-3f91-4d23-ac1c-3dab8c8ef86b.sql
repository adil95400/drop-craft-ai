-- Fix security warnings for P4

-- 1. Drop SECURITY DEFINER view and recreate as regular view
DROP VIEW IF EXISTS public.audit_log_summary;

CREATE VIEW public.audit_log_summary 
WITH (security_invoker = true)
AS
SELECT 
  DATE(created_at) as log_date,
  action_category,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.audit_logs
WHERE created_at > now() - INTERVAL '30 days'
GROUP BY DATE(created_at), action_category, severity
ORDER BY log_date DESC, event_count DESC;

-- 2. Fix the overly permissive INSERT policy - require valid action and category
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (
  -- Must have valid action and category (enforced by CHECK constraints)
  action IS NOT NULL 
  AND action_category IS NOT NULL
  AND (
    -- Either authenticated user logging their own action
    (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
    -- Or system actor type for automated processes
    OR actor_type IN ('system', 'cron', 'webhook')
  )
);