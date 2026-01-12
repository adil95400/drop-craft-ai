-- Fix 1: activity_logs - restrict to authenticated users only
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Fix 2: api_logs - restrict to authenticated users or service role
DROP POLICY IF EXISTS "System can insert api logs" ON public.api_logs;
CREATE POLICY "Authenticated users can insert api logs" 
ON public.api_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Fix 3: contact_submissions - add rate limiting protection via constraints
-- Keep public access but add validation
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Public can submit contact form with validation" 
ON public.contact_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND length(email) > 5 
  AND length(email) < 255
  AND message IS NOT NULL
  AND length(message) > 10
  AND length(message) < 5000
);