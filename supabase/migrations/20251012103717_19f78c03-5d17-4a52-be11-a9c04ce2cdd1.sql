-- Create API keys table for public API authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{"products": ["read", "write"], "orders": ["read"], "customers": ["read"]}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own API keys
CREATE POLICY "Users manage own API keys"
  ON public.api_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast key lookups
CREATE INDEX idx_api_keys_key ON public.api_keys(key) WHERE is_active = true;
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

-- Function to generate secure API keys
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_prefix TEXT := 'sk_';
  random_part TEXT;
BEGIN
  -- Generate 32 character random string
  random_part := encode(gen_random_bytes(24), 'base64');
  random_part := replace(random_part, '/', '_');
  random_part := replace(random_part, '+', '-');
  random_part := replace(random_part, '=', '');
  
  RETURN key_prefix || random_part;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.api_keys IS 'API keys for public API authentication';
COMMENT ON COLUMN public.api_keys.permissions IS 'JSON object defining resource permissions: {"resource": ["read", "write", "delete"]}';
