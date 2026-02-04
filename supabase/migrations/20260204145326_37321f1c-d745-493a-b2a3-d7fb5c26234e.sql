-- =============================================================================
-- Anti-Replay Protection: extension_requests table
-- TTL: 30 days (cleaned by cron)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.extension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  extension_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint for anti-replay
  CONSTRAINT extension_requests_request_id_unique UNIQUE (request_id)
);

-- Index for cleanup (TTL)
CREATE INDEX IF NOT EXISTS idx_extension_requests_created_at 
ON public.extension_requests (created_at);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_extension_requests_lookup 
ON public.extension_requests (request_id);

-- Enable RLS
ALTER TABLE public.extension_requests ENABLE ROW LEVEL SECURITY;

-- Service role only (edge functions)
CREATE POLICY "Service role full access on extension_requests" 
ON public.extension_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- =============================================================================
-- Idempotency Keys: idempotency_keys table
-- TTL: 7 days (cleaned by cron)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'succeeded', 'failed')),
  response_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint per user + key
  CONSTRAINT idempotency_keys_user_key_unique UNIQUE (user_id, idempotency_key)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
ON public.idempotency_keys (user_id, idempotency_key);

-- Index for cleanup (TTL)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at 
ON public.idempotency_keys (created_at);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status 
ON public.idempotency_keys (status);

-- Enable RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Service role only (edge functions)
CREATE POLICY "Service role full access on idempotency_keys" 
ON public.idempotency_keys 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- =============================================================================
-- Extension Events table (for rate limiting & logging)
-- Add if not exists
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.extension_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  request_id TEXT,
  extension_id TEXT,
  extension_version TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_extension_events_rate_limit 
ON public.extension_events (user_id, action, created_at);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_extension_events_action_status 
ON public.extension_events (action, status, created_at);

-- Enable RLS
ALTER TABLE public.extension_events ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role full access on extension_events" 
ON public.extension_events 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Users can read their own events
CREATE POLICY "Users can read own extension_events" 
ON public.extension_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- =============================================================================
-- Import Jobs table for progress tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'product_import',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'error_incomplete')),
  source_url TEXT,
  platform TEXT,
  
  -- Progress tracking
  total_items INTEGER DEFAULT 1,
  processed_items INTEGER DEFAULT 0,
  
  -- Results
  result_product_ids UUID[] DEFAULT '{}',
  extraction_method TEXT,
  completeness_score INTEGER,
  
  -- Error handling
  error_code TEXT,
  error_log JSONB DEFAULT '[]',
  missing_fields TEXT[] DEFAULT '{}',
  
  -- Field tracking with source attribution
  field_sources JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_status 
ON public.import_jobs (user_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on import_jobs" 
ON public.import_jobs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Users can read their own jobs
CREATE POLICY "Users can read own import_jobs" 
ON public.import_jobs 
FOR SELECT 
USING (auth.uid() = user_id);