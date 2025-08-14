-- Fix security vulnerability: Force RLS on customers table to prevent bypassing
-- This ensures RLS cannot be bypassed even by privileged users when accessing via API

ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;

-- Verify all policies are restrictive and properly implemented
-- Drop any potentially overly permissive policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

-- Create more secure and explicit policies
CREATE POLICY "Users can view only their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert only their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update only their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete only their own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Log this security enhancement
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'rls_security_enhanced',
    'info',
    'Enhanced RLS security on customers table by forcing RLS and strengthening policies',
    '{"table": "customers", "changes": ["forced_rls", "explicit_auth_checks"], "action": "security_fix"}'::jsonb
);