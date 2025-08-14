-- Fix critical security vulnerabilities

-- 1. Fix Newsletter Email Harvesting Vulnerability
-- Drop the existing public select policy that allows anyone to read emails
DROP POLICY IF EXISTS "select_anon" ON public.newsletters;

-- Create new policy that only allows authenticated admin users to read newsletter emails
-- Anonymous users can still insert (signup), but cannot read the email list
CREATE POLICY "Admin can view newsletter emails" 
ON public.newsletters 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Secure Database Functions
-- Update has_role function with proper search_path for security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Review and secure catalog_products access
-- Keep basic product info public but ensure no sensitive business data is exposed
-- The current policy allows viewing all catalog products, which is acceptable for a marketplace
-- but we should ensure sensitive fields are not exposed in the frontend

-- 4. Add security monitoring table for tracking sensitive access
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admin can view security events" 
ON public.security_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow system to insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);