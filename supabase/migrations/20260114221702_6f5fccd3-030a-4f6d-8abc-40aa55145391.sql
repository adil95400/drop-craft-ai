-- Create extension_tokens table for Chrome extension authentication
CREATE TABLE IF NOT EXISTS public.extension_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  extension_id TEXT NOT NULL DEFAULT 'shopopti-chrome',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, extension_id)
);

-- Enable RLS
ALTER TABLE public.extension_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view their own extension tokens"
  ON public.extension_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own tokens
CREATE POLICY "Users can create their own extension tokens"
  ON public.extension_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update their own extension tokens"
  ON public.extension_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete their own extension tokens"
  ON public.extension_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_extension_tokens_token ON public.extension_tokens(token);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_id ON public.extension_tokens(user_id);

-- Add comment
COMMENT ON TABLE public.extension_tokens IS 'Stores authentication tokens for Chrome extension users';