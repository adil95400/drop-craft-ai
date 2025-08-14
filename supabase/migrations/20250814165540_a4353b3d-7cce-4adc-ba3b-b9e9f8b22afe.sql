-- Fix critical security vulnerabilities in suppliers table
-- 1. Force RLS to prevent bypassing
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;

-- 2. Drop the overly permissive policy that allows 'public' role access
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;

-- 3. Create secure, specific policies for authenticated users only
CREATE POLICY "Users can view only their own suppliers" 
ON public.suppliers 
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert only their own suppliers" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update only their own suppliers" 
ON public.suppliers 
FOR UPDATE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete only their own suppliers" 
ON public.suppliers 
FOR DELETE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. Add a new column for encrypted API credentials (replacing plain text api_key)
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS encrypted_credentials JSONB DEFAULT '{}';

-- 5. Add comments to warn about sensitive data handling
COMMENT ON COLUMN public.suppliers.api_key IS 'DEPRECATED: Use encrypted_credentials instead. This field should be migrated and removed.';
COMMENT ON COLUMN public.suppliers.encrypted_credentials IS 'Encrypted JSON object containing sensitive API credentials and access tokens.';

-- 6. Log this critical security fix
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'suppliers_security_hardened',
    'critical',
    'Fixed critical vulnerabilities in suppliers table: forced RLS, removed public access, added encryption support',
    '{"table": "suppliers", "fixes": ["forced_rls", "removed_public_access", "added_encryption_column", "restricted_to_authenticated"], "action": "security_fix"}'::jsonb
);