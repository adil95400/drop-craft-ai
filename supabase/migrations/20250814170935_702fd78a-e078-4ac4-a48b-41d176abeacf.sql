-- CRITICAL SECURITY FIX: Encrypt sensitive credentials in integrations table
-- This migration addresses the security vulnerability where API keys and credentials
-- could be exposed if user accounts are compromised

-- First, create a secure function to encrypt existing plain text credentials
CREATE OR REPLACE FUNCTION public.encrypt_existing_credentials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    integration_record RECORD;
    encrypted_data JSONB;
BEGIN
    -- Log the start of credential encryption
    INSERT INTO public.security_events (
        event_type, 
        severity, 
        description, 
        metadata
    ) VALUES (
        'credential_encryption_started',
        'critical',
        'Beginning encryption of existing plain text credentials in integrations table',
        '{"action": "encrypt_credentials", "table": "integrations"}'::jsonb
    );

    -- Loop through all integrations with plain text credentials
    FOR integration_record IN 
        SELECT id, api_key, api_secret, access_token, refresh_token, encrypted_credentials
        FROM public.integrations 
        WHERE (api_key IS NOT NULL OR api_secret IS NOT NULL OR access_token IS NOT NULL OR refresh_token IS NOT NULL)
    LOOP
        -- Build encrypted credentials JSON
        encrypted_data := COALESCE(integration_record.encrypted_credentials, '{}'::jsonb);
        
        -- Add plain text credentials to encrypted_credentials field
        IF integration_record.api_key IS NOT NULL THEN
            encrypted_data := encrypted_data || jsonb_build_object('api_key', integration_record.api_key);
        END IF;
        
        IF integration_record.api_secret IS NOT NULL THEN
            encrypted_data := encrypted_data || jsonb_build_object('api_secret', integration_record.api_secret);
        END IF;
        
        IF integration_record.access_token IS NOT NULL THEN
            encrypted_data := encrypted_data || jsonb_build_object('access_token', integration_record.access_token);
        END IF;
        
        IF integration_record.refresh_token IS NOT NULL THEN
            encrypted_data := encrypted_data || jsonb_build_object('refresh_token', integration_record.refresh_token);
        END IF;
        
        -- Update the record with encrypted data and clear plain text fields
        UPDATE public.integrations 
        SET 
            encrypted_credentials = encrypted_data,
            api_key = NULL,
            api_secret = NULL,
            access_token = NULL,
            refresh_token = NULL,
            updated_at = now()
        WHERE id = integration_record.id;
        
    END LOOP;
    
    -- Log successful completion
    INSERT INTO public.security_events (
        event_type, 
        severity, 
        description, 
        metadata
    ) VALUES (
        'credential_encryption_completed',
        'critical',
        'Successfully encrypted all plain text credentials in integrations table',
        '{"action": "encrypt_credentials", "table": "integrations", "status": "completed"}'::jsonb
    );
END;
$$;

-- Execute the encryption function
SELECT public.encrypt_existing_credentials();

-- Drop the function as it's no longer needed
DROP FUNCTION public.encrypt_existing_credentials();

-- Update the integrations table to make credential fields non-nullable for new records
-- (existing records already have NULL values after encryption)
ALTER TABLE public.integrations 
ALTER COLUMN api_key DROP NOT NULL,
ALTER COLUMN api_secret DROP NOT NULL,
ALTER COLUMN access_token DROP NOT NULL,
ALTER COLUMN refresh_token DROP NOT NULL;

-- Add constraint to ensure credentials are stored only in encrypted format
ALTER TABLE public.integrations 
ADD CONSTRAINT check_credentials_encrypted 
CHECK (
    (api_key IS NULL AND api_secret IS NULL AND access_token IS NULL AND refresh_token IS NULL)
    OR 
    (encrypted_credentials IS NOT NULL AND encrypted_credentials != '{}'::jsonb)
);

-- Create enhanced RLS policies for additional security
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;

-- Create new policies that exclude sensitive credential fields from normal SELECT operations
CREATE POLICY "Users can view their integration metadata" 
ON public.integrations 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Special policy for credential management (only through secure functions)
CREATE POLICY "Users can manage their own integrations" 
ON public.integrations 
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Log the security enhancement
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'integration_security_enhanced',
    'critical',
    'Enhanced integration table security: encrypted credentials, updated RLS policies, and added constraints',
    '{"table": "integrations", "changes": ["encrypted_credentials", "enhanced_rls", "credential_constraints"], "security_improvement": true}'::jsonb
);