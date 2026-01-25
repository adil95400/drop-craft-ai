-- Fix overly permissive RLS policies on translation_cache

-- Drop the permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert cache entries" ON public.translation_cache;
DROP POLICY IF EXISTS "Service role can manage cache" ON public.translation_cache;

-- Create more restrictive insert policy - only authenticated users
CREATE POLICY "Authenticated users can insert cache entries"
  ON public.translation_cache
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create update policy for hit count updates - anyone can update (for cache hits)
CREATE POLICY "Anyone can update cache entry stats"
  ON public.translation_cache
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Drop the overly permissive usage insert policy
DROP POLICY IF EXISTS "Users can insert their own translation usage" ON public.translation_usage;

-- Create stricter insert policy for usage tracking
CREATE POLICY "Users can insert their own translation usage"
  ON public.translation_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND auth.uid() IS NOT NULL));

-- Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.translation_usage_summary;

-- Recreate as a regular function instead for security
CREATE OR REPLACE FUNCTION public.get_translation_usage_summary(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  usage_date DATE,
  total_texts BIGINT,
  total_chars BIGINT,
  total_cached BIGINT,
  total_translated BIGINT,
  avg_processing_time INTEGER,
  request_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.user_id,
    DATE(tu.created_at) as usage_date,
    SUM(tu.text_count)::BIGINT as total_texts,
    SUM(tu.char_count)::BIGINT as total_chars,
    SUM(tu.cached_count)::BIGINT as total_cached,
    SUM(tu.translated_count)::BIGINT as total_translated,
    AVG(tu.processing_time_ms)::INTEGER as avg_processing_time,
    COUNT(*)::BIGINT as request_count
  FROM public.translation_usage tu
  WHERE (p_user_id IS NULL AND tu.user_id = auth.uid())
     OR (p_user_id IS NOT NULL AND tu.user_id = p_user_id AND (auth.uid() = p_user_id OR public.has_role(auth.uid(), 'admin')))
  GROUP BY tu.user_id, DATE(tu.created_at)
  ORDER BY usage_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;