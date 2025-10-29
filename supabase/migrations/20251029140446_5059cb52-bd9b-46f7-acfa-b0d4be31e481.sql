-- Extension authentication and analytics tables
CREATE TABLE IF NOT EXISTS public.extension_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.extension_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for extension_auth_tokens
CREATE POLICY "Users can view their own tokens"
  ON public.extension_auth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens"
  ON public.extension_auth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.extension_auth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for extension_analytics
CREATE POLICY "Users can view their own analytics"
  ON public.extension_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.extension_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_extension_auth_tokens_user_id ON public.extension_auth_tokens(user_id);
CREATE INDEX idx_extension_auth_tokens_token ON public.extension_auth_tokens(token);
CREATE INDEX idx_extension_auth_tokens_is_active ON public.extension_auth_tokens(is_active);
CREATE INDEX idx_extension_analytics_user_id ON public.extension_analytics(user_id);
CREATE INDEX idx_extension_analytics_created_at ON public.extension_analytics(created_at);

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_extension_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.extension_auth_tokens
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$;