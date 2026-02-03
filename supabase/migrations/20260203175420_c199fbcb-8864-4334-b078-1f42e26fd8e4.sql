-- =============================================================================
-- P1: Extension Action History Table for SaaS Visibility
-- =============================================================================

-- Create extension_action_logs table for tracking all extension actions
CREATE TABLE IF NOT EXISTS public.extension_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'success',
  platform TEXT,
  product_title TEXT,
  product_url TEXT,
  product_id UUID,
  metadata JSONB DEFAULT '{}',
  extension_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_extension_action_logs_user_id ON public.extension_action_logs(user_id);
CREATE INDEX idx_extension_action_logs_created_at ON public.extension_action_logs(created_at DESC);
CREATE INDEX idx_extension_action_logs_action_type ON public.extension_action_logs(action_type);

-- Enable RLS
ALTER TABLE public.extension_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own extension logs"
  ON public.extension_action_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extension logs"
  ON public.extension_action_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.extension_action_logs;

-- Add comment for documentation
COMMENT ON TABLE public.extension_action_logs IS 'Tracks all Chrome extension actions for SaaS dashboard visibility';