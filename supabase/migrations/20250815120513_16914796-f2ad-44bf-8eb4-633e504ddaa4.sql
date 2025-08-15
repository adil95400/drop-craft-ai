-- Create API cache table for storing cached responses from external APIs
CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON public.api_cache(expires_at);

-- Enable RLS
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (cached data is generally public)
CREATE POLICY "API cache is publicly readable" 
ON public.api_cache 
FOR SELECT 
USING (true);

-- Create policy for service role to manage cache
CREATE POLICY "Service role can manage API cache" 
ON public.api_cache 
FOR ALL 
USING (true);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.api_cache 
  WHERE expires_at < now();
END;
$$;

-- Add trigger to automatically update timestamps
CREATE TRIGGER update_api_cache_updated_at
BEFORE UPDATE ON public.api_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();