-- =============================================
-- P4: AUDIT LOGGING INFRASTRUCTURE
-- Comprehensive audit trail for all critical actions
-- =============================================

-- 1. Create dedicated audit_logs table with proper structure
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'api', 'webhook', 'cron', 'admin')),
  actor_email TEXT,
  actor_ip TEXT,
  actor_user_agent TEXT,
  
  -- Action details
  action TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN (
    'auth', 'data', 'admin', 'api', 'import', 'export', 
    'integration', 'billing', 'security', 'system', 'automation'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  
  -- Target information
  resource_type TEXT,
  resource_id TEXT,
  resource_name TEXT,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}',
  request_id TEXT,
  session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- For data retention policies
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '2 years')
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category ON public.audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity) WHERE severity IN ('warn', 'error', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type ON public.audit_logs(actor_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_category_date 
ON public.audit_logs(user_id, action_category, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 4. Create audit log summary view for dashboards
CREATE OR REPLACE VIEW public.audit_log_summary AS
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

-- 5. Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_action_category TEXT,
  p_severity TEXT DEFAULT 'info',
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_actor_type TEXT DEFAULT 'user'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
  v_changed_fields TEXT[];
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users WHERE id = v_user_id;
  END IF;
  
  -- Calculate changed fields if both old and new values provided
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT ARRAY_AGG(key)
    INTO v_changed_fields
    FROM (
      SELECT key FROM jsonb_object_keys(p_new_values) AS key
      WHERE p_old_values->key IS DISTINCT FROM p_new_values->key
    ) changed;
  END IF;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id, actor_type, actor_email,
    action, action_category, severity,
    resource_type, resource_id, resource_name,
    old_values, new_values, changed_fields,
    description, metadata
  ) VALUES (
    v_user_id, p_actor_type, v_user_email,
    p_action, p_action_category, p_severity,
    p_resource_type, p_resource_id, p_resource_name,
    p_old_values, p_new_values, v_changed_fields,
    p_description, p_metadata
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- 6. Function to get user audit trail
CREATE OR REPLACE FUNCTION public.get_user_audit_trail(
  p_user_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT NULL,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  actor_email TEXT,
  actor_type TEXT,
  action TEXT,
  action_category TEXT,
  severity TEXT,
  resource_type TEXT,
  resource_id TEXT,
  resource_name TEXT,
  description TEXT,
  changed_fields TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user UUID;
BEGIN
  -- Determine target user
  v_target_user := COALESCE(p_user_id, auth.uid());
  
  -- Non-admins can only view their own logs
  IF NOT public.has_role(auth.uid(), 'admin') AND v_target_user != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.id,
    al.actor_email,
    al.actor_type,
    al.action,
    al.action_category,
    al.severity,
    al.resource_type,
    al.resource_id,
    al.resource_name,
    al.description,
    al.changed_fields,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  WHERE (p_user_id IS NULL OR al.user_id = v_target_user)
    AND (p_category IS NULL OR al.action_category = p_category)
    AND (p_severity IS NULL OR al.severity = p_severity)
    AND (p_from_date IS NULL OR al.created_at >= p_from_date)
    AND (p_to_date IS NULL OR al.created_at <= p_to_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 7. Function to get audit statistics
CREATE OR REPLACE FUNCTION public.get_audit_statistics(
  p_days INTEGER DEFAULT 30
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'by_category', (
      SELECT jsonb_object_agg(action_category, cnt)
      FROM (
        SELECT action_category, COUNT(*) as cnt
        FROM public.audit_logs
        WHERE created_at > now() - (p_days || ' days')::INTERVAL
        GROUP BY action_category
      ) cat
    ),
    'by_severity', (
      SELECT jsonb_object_agg(severity, cnt)
      FROM (
        SELECT severity, COUNT(*) as cnt
        FROM public.audit_logs
        WHERE created_at > now() - (p_days || ' days')::INTERVAL
        GROUP BY severity
      ) sev
    ),
    'critical_events', (
      SELECT COUNT(*) FROM public.audit_logs
      WHERE severity IN ('error', 'critical')
        AND created_at > now() - (p_days || ' days')::INTERVAL
    ),
    'daily_trend', (
      SELECT jsonb_agg(jsonb_build_object('date', d, 'count', c) ORDER BY d)
      FROM (
        SELECT DATE(created_at) as d, COUNT(*) as c
        FROM public.audit_logs
        WHERE created_at > now() - (p_days || ' days')::INTERVAL
        GROUP BY DATE(created_at)
      ) trend
    )
  ) INTO v_stats
  FROM public.audit_logs
  WHERE created_at > now() - (p_days || ' days')::INTERVAL;
  
  RETURN v_stats;
END;
$$;

-- 8. Automatic cleanup of old audit logs (retention policy)
CREATE OR REPLACE FUNCTION public.cleanup_expired_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Log the cleanup action
  PERFORM public.create_audit_log(
    'audit_cleanup',
    'system',
    'info',
    'audit_logs',
    NULL,
    NULL,
    NULL,
    NULL,
    'Cleaned up ' || v_deleted || ' expired audit logs',
    jsonb_build_object('deleted_count', v_deleted),
    'system'
  );
  
  RETURN v_deleted;
END;
$$;

-- 9. Enable realtime for critical audit events
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;