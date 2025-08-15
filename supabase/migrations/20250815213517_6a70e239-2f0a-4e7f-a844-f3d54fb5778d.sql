-- The issue is with the integrations_safe view. Let's check and fix it
-- Drop and recreate the integrations_safe view to ensure it doesn't use SECURITY DEFINER

DROP VIEW IF EXISTS public.integrations_safe;

-- Recreate the integrations_safe view without any SECURITY DEFINER functions
CREATE VIEW public.integrations_safe AS
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
  -- Simple boolean checks without any elevated functions
  (api_key IS NOT NULL) AS has_api_key,
  (api_secret IS NOT NULL) AS has_api_secret,
  (access_token IS NOT NULL) AS has_access_token,
  (refresh_token IS NOT NULL) AS has_refresh_token,
  (encrypted_credentials IS NOT NULL) AS has_encrypted_credentials,
  last_credential_access,
  require_additional_auth
FROM public.integrations
WHERE auth.uid() = user_id;

COMMENT ON VIEW public.integrations_safe IS 'Safe view of integrations without exposing sensitive credentials';

-- Now update the customer component to use the simple masked view
-- Make sure all our new functions have proper search paths set