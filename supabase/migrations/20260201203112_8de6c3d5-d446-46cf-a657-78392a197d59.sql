-- P1.2: Create cron execution logs table for observability
CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_name TEXT NOT NULL,
  correlation_id TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  metadata JSONB,
  duration_ms INTEGER,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by cron name and time
CREATE INDEX IF NOT EXISTS idx_cron_logs_name_time ON public.cron_execution_logs(cron_name, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_correlation ON public.cron_execution_logs(correlation_id);

-- Enable RLS
ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view cron logs (service role bypasses RLS)
CREATE POLICY "Admins can view cron logs" ON public.cron_execution_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add realtime for monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.cron_execution_logs;

COMMENT ON TABLE public.cron_execution_logs IS 'Logs for cron job executions - P1.2 observability';