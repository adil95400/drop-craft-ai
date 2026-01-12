-- CRITICAL SECURITY FIX: Restrict contact_submissions SELECT to admin only
-- Previously, any authenticated user could see all contact submissions (PII exposure)

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view contact submissions" ON contact_submissions;

-- Create restrictive policy - only admins can view submissions
CREATE POLICY "Admins can view contact submissions"
ON contact_submissions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fix rate_limit_tracking - restrict to service role only
DROP POLICY IF EXISTS "Limited newsletter signup" ON rate_limit_tracking;
DROP POLICY IF EXISTS "Anyone can insert rate limit records" ON rate_limit_tracking;

-- Service role can manage rate limits (used by Edge Functions)
CREATE POLICY "Service role can manage rate limits"
ON rate_limit_tracking FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Fix user_quotas INSERT - restrict to service role only  
DROP POLICY IF EXISTS "System can insert quotas" ON user_quotas;

CREATE POLICY "Service role can insert quotas"
ON user_quotas FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');