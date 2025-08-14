-- Fix RLS policies for user_api_keys table to prevent unauthorized access
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.user_api_keys;

-- Create more restrictive policies
CREATE POLICY "Users can view their own API keys" 
ON public.user_api_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
ON public.user_api_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.user_api_keys 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.user_api_keys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Security audit: Log this policy change
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'rls_policy_update',
    'info',
    'Fixed overly permissive RLS policy on user_api_keys table',
    '{"table": "user_api_keys", "action": "policy_fix", "reason": "prevent_unauthorized_access"}'::jsonb
);