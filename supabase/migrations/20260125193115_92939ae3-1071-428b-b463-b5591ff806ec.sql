-- Translation Cache Table
-- Stores cached translations to avoid redundant API calls
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'auto',
  target_lang VARCHAR(10) NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  char_count INTEGER DEFAULT 0,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_translation_cache_key ON public.translation_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_translation_cache_langs ON public.translation_cache(source_lang, target_lang);
CREATE INDEX IF NOT EXISTS idx_translation_cache_accessed ON public.translation_cache(last_accessed_at);

-- Translation Usage Tracking Table
-- Tracks translation usage per user for analytics and rate limiting
CREATE TABLE IF NOT EXISTS public.translation_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'auto',
  target_lang VARCHAR(10) NOT NULL,
  text_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0,
  cached_count INTEGER DEFAULT 0,
  translated_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  context VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for usage analytics
CREATE INDEX IF NOT EXISTS idx_translation_usage_user ON public.translation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_usage_date ON public.translation_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_translation_usage_langs ON public.translation_usage(source_lang, target_lang);

-- Enable RLS
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for translation_cache
-- Cache is shared across all users (read by anyone, write by authenticated)
CREATE POLICY "Anyone can read translation cache"
  ON public.translation_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cache entries"
  ON public.translation_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage cache"
  ON public.translation_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for translation_usage
-- Users can only see their own usage
CREATE POLICY "Users can view their own translation usage"
  ON public.translation_usage
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own translation usage"
  ON public.translation_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all translation usage"
  ON public.translation_usage
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update cache hit count and last accessed
CREATE OR REPLACE FUNCTION public.update_translation_cache_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when we "hit" a cache entry
  NEW.hit_count := COALESCE(OLD.hit_count, 0) + 1;
  NEW.last_accessed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to clean old cache entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_translation_cache(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.translation_cache
  WHERE last_accessed_at < now() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Daily usage summary view
CREATE OR REPLACE VIEW public.translation_usage_summary AS
SELECT 
  user_id,
  DATE(created_at) as usage_date,
  SUM(text_count) as total_texts,
  SUM(char_count) as total_chars,
  SUM(cached_count) as total_cached,
  SUM(translated_count) as total_translated,
  AVG(processing_time_ms)::INTEGER as avg_processing_time,
  COUNT(*) as request_count
FROM public.translation_usage
GROUP BY user_id, DATE(created_at)
ORDER BY usage_date DESC;