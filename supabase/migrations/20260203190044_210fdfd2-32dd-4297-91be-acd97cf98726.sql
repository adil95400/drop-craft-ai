-- Extension requests table for anti-replay protection
CREATE TABLE IF NOT EXISTS public.extension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  extension_id TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookups and cleanup
CREATE INDEX idx_extension_requests_request_id ON public.extension_requests(request_id);
CREATE INDEX idx_extension_requests_user_id ON public.extension_requests(user_id);
CREATE INDEX idx_extension_requests_created_at ON public.extension_requests(created_at);

-- Enable RLS
ALTER TABLE public.extension_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own requests
CREATE POLICY "Users can view own extension requests"
  ON public.extension_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extension requests"
  ON public.extension_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Idempotency keys table for write operations
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'succeeded', 'failed')),
  response_data JSONB,
  response_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  UNIQUE(idempotency_key, user_id)
);

-- Indexes for idempotency
CREATE INDEX idx_idempotency_keys_lookup ON public.idempotency_keys(idempotency_key, user_id);
CREATE INDEX idx_idempotency_keys_expires ON public.idempotency_keys(expires_at);

-- Enable RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own idempotency keys"
  ON public.idempotency_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own idempotency keys"
  ON public.idempotency_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own idempotency keys"
  ON public.idempotency_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Extension events table for observability
CREATE TABLE IF NOT EXISTS public.extension_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'cancelled')),
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  request_id TEXT,
  extension_id TEXT,
  extension_version TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_extension_events_user_id ON public.extension_events(user_id);
CREATE INDEX idx_extension_events_action ON public.extension_events(action);
CREATE INDEX idx_extension_events_created_at ON public.extension_events(created_at);
CREATE INDEX idx_extension_events_status ON public.extension_events(status);
CREATE INDEX idx_extension_events_platform ON public.extension_events(platform);

-- Enable RLS
ALTER TABLE public.extension_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own extension events"
  ON public.extension_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extension events"
  ON public.extension_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for extension_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.extension_events;

-- Function to cleanup old records (TTL 30 days for requests, 7 days for idempotency)
CREATE OR REPLACE FUNCTION public.cleanup_extension_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old extension requests (30 days TTL)
  DELETE FROM public.extension_requests 
  WHERE created_at < now() - INTERVAL '30 days';
  
  -- Delete expired idempotency keys
  DELETE FROM public.idempotency_keys 
  WHERE expires_at < now();
  
  -- Delete old extension events (90 days TTL for analytics)
  DELETE FROM public.extension_events 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$;

-- Trigger to update updated_at on idempotency_keys
CREATE TRIGGER update_idempotency_keys_updated_at
  BEFORE UPDATE ON public.idempotency_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();