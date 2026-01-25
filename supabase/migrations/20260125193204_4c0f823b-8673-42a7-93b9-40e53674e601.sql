-- Fix the remaining permissive update policy on translation_cache
-- The cache update should only allow updating hit_count and last_accessed_at, not content

DROP POLICY IF EXISTS "Anyone can update cache entry stats" ON public.translation_cache;

-- Allow authenticated users to update cache stats (hit count)
CREATE POLICY "Authenticated users can update cache stats"
  ON public.translation_cache
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);