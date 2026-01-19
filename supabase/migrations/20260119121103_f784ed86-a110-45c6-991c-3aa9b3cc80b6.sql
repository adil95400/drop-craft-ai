-- =====================================================
-- PHASE 1: SECURITY FIXES - Immediate Security Hardening
-- =====================================================

-- 1. FIX: Function Search Path Mutable
-- Add SET search_path = public to prevent schema injection attacks
CREATE OR REPLACE FUNCTION public.generate_dispute_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dispute_num text;
  counter int;
BEGIN
  -- Generate a unique dispute number with format DSP-YYYYMMDD-XXXX
  SELECT COUNT(*) + 1 INTO counter FROM public.disputes 
  WHERE created_at::date = CURRENT_DATE;
  
  dispute_num := 'DSP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(counter::text, 4, '0');
  
  RETURN dispute_num;
END;
$$;

-- 2. FIX: RLS Policy Always True - exchange_rates table
-- Remove overly permissive policy and replace with proper user-scoped policy
DROP POLICY IF EXISTS "Authenticated users can manage exchange rates" ON public.exchange_rates;

-- Create proper policies for exchange_rates (admin-only management)
CREATE POLICY "Admins can manage exchange rates" 
ON public.exchange_rates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. FIX: RLS Policy Always True - exchange_rate_history table
-- Remove overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert exchange rate history" ON public.exchange_rate_history;

-- Create proper policy (admin-only or system inserts)
CREATE POLICY "Admins can insert exchange rate history" 
ON public.exchange_rate_history 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. BONUS: Ensure critical tables have proper RLS enabled
-- Verify RLS is enabled on sensitive tables mentioned in security scan

-- Add user isolation policies for tables flagged in scan if missing
-- Check and fix profiles table RLS
DO $$
BEGIN
  -- Ensure profiles can only be viewed by the owner
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can only view own profile'
  ) THEN
    CREATE POLICY "Users can only view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION public.generate_dispute_number() IS 'Generates unique dispute numbers with secure search_path. Format: DSP-YYYYMMDD-XXXX';

-- Log security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata,
  created_at
) VALUES (
  'security_fix',
  'info',
  'Phase 1 Security Fixes Applied: Fixed function search_path, removed permissive RLS policies',
  jsonb_build_object(
    'fixes_applied', jsonb_build_array(
      'generate_dispute_number: Added SET search_path = public',
      'exchange_rates: Replaced USING(true) with admin-only policy',
      'exchange_rate_history: Replaced WITH CHECK(true) with admin-only policy'
    ),
    'applied_at', now()
  ),
  now()
);