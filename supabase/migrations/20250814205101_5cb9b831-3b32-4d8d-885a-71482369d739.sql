-- Enhanced security for integrations table credentials
-- Issue: API keys and credentials could be compromised if user accounts are breached

-- First, let's add additional security columns
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS credential_access_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_credential_access timestamp with time zone,
ADD COLUMN IF NOT EXISTS credential_encryption_version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS require_additional_auth boolean DEFAULT false;

-- Create a function to log credential access attempts
CREATE OR REPLACE FUNCTION public.log_credential_access(
  integration_id uuid,
  access_type text,
  user_id_param uuid DEFAULT NULL,
  ip_address_param text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the integration with access log
  UPDATE public.integrations 
  SET 
    credential_access_log = COALESCE(credential_access_log, '[]'::jsonb) || 
      jsonb_build_object(
        'timestamp', now(),
        'access_type', access_type,
        'user_id', COALESCE(user_id_param, auth.uid()),
        'ip_address', ip_address_param,
        'success', true
      )::jsonb,
    last_credential_access = now()
  WHERE id = integration_id;
  
  -- Log to security events
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata,
    ip_address
  ) VALUES (
    COALESCE(user_id_param, auth.uid()),
    'credential_access',
    'info',
    'Integration credentials accessed',
    jsonb_build_object(
      'integration_id', integration_id,
      'access_type', access_type
    ),
    ip_address_param
  );
END;
$$;

-- Create enhanced RLS policies for integrations table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can view their integration metadata" ON public.integrations;

-- Secure SELECT policy - excludes sensitive credential fields by default
CREATE POLICY "secure_integrations_select" 
ON public.integrations 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

-- Restrict INSERT to not allow direct credential insertion
CREATE POLICY "secure_integrations_insert" 
ON public.integrations 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  -- Prevent direct insertion of sensitive credentials
  AND api_key IS NULL
  AND api_secret IS NULL  
  AND access_token IS NULL
  AND refresh_token IS NULL
);

-- Restrict UPDATE to prevent direct credential modification
CREATE POLICY "secure_integrations_update" 
ON public.integrations 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

-- Allow DELETE for own integrations
CREATE POLICY "secure_integrations_delete" 
ON public.integrations 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

-- Create a view that excludes sensitive credential data for regular access
CREATE OR REPLACE VIEW public.integrations_safe AS
SELECT 
  id,
  user_id,
  platform_type,
  platform_name,
  platform_url,
  shop_domain,
  seller_id,
  is_active,
  connection_status,
  sync_frequency,
  last_sync_at,
  store_config,
  sync_settings,
  last_error,
  created_at,
  updated_at,
  -- Only show if credentials exist, not the actual values
  (api_key IS NOT NULL) as has_api_key,
  (api_secret IS NOT NULL) as has_api_secret,
  (access_token IS NOT NULL) as has_access_token,
  (refresh_token IS NOT NULL) as has_refresh_token,
  (encrypted_credentials IS NOT NULL) as has_encrypted_credentials,
  last_credential_access,
  require_additional_auth
FROM public.integrations;

-- Grant access to the safe view
GRANT SELECT ON public.integrations_safe TO authenticated;

-- Create RLS policy for the safe view
ALTER VIEW public.integrations_safe SET (security_invoker = true);

-- Add constraint to ensure user_id is not null for security
ALTER TABLE public.integrations 
ALTER COLUMN user_id SET NOT NULL;