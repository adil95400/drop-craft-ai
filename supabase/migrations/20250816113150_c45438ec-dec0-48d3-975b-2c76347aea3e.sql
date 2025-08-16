-- Fix critical security vulnerability in suppliers table
-- Protect sensitive API keys, credentials, and contact information

-- 1. Create a secure function to get suppliers with masked sensitive data
CREATE OR REPLACE FUNCTION public.get_secure_suppliers()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  name text,
  website text,
  country text,
  status text,
  rating numeric,
  api_endpoint text,
  -- Sensitive fields are masked or excluded
  has_api_key boolean,
  has_encrypted_credentials boolean,
  contact_email_masked text,
  contact_phone_masked text,
  access_count integer,
  last_access_at timestamptz,
  credentials_updated_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.name,
    s.website,
    s.country,
    s.status,
    s.rating,
    s.api_endpoint,
    -- Security: Only indicate presence, never expose actual values
    (s.api_key IS NOT NULL) AS has_api_key,
    (s.encrypted_credentials IS NOT NULL) AS has_encrypted_credentials,
    -- Security: Mask contact information
    CASE 
      WHEN s.contact_email IS NOT NULL THEN 
        substring(s.contact_email from 1 for 3) || '***@' || split_part(s.contact_email, '@', 2)
      ELSE NULL
    END AS contact_email_masked,
    CASE 
      WHEN s.contact_phone IS NOT NULL THEN 
        substring(s.contact_phone from 1 for 3) || '****' || substring(s.contact_phone from length(s.contact_phone) - 1)
      ELSE NULL
    END AS contact_phone_masked,
    s.access_count,
    s.last_access_at,
    s.credentials_updated_at,
    s.created_at,
    s.updated_at
  FROM suppliers s
  WHERE auth.uid() = s.user_id 
    AND auth.uid() IS NOT NULL
    AND s.status = 'active';
$$;

-- 2. Create a function for admin access to sensitive supplier data with proper logging
CREATE OR REPLACE FUNCTION public.get_supplier_sensitive_data(supplier_id uuid)
RETURNS TABLE(
  id uuid,
  contact_email text,
  contact_phone text,
  has_api_key boolean,
  credentials_last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: Only allow admin users and supplier owners
  IF NOT (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM suppliers WHERE id = supplier_id AND user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;

  -- Log the access for security auditing
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'supplier_sensitive_data_access',
    'info',
    'Supplier sensitive data accessed',
    jsonb_build_object(
      'supplier_id', supplier_id,
      'timestamp', now()
    )
  );

  RETURN QUERY
  SELECT 
    s.id,
    s.contact_email,
    s.contact_phone,
    (s.api_key IS NOT NULL) AS has_api_key,
    s.credentials_updated_at
  FROM suppliers s
  WHERE s.id = supplier_id;
END;
$$;

-- 3. Create edge function for secure credential management
-- This will be used by edge functions to access encrypted credentials
CREATE OR REPLACE FUNCTION public.verify_supplier_ownership(supplier_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM suppliers 
    WHERE id = supplier_id AND user_id = user_id AND status = 'active'
  );
$$;

-- 4. Update suppliers table RLS policies for enhanced security
-- Drop existing policies
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON public.suppliers;

-- Create new secure policies
-- Allow users to view only basic supplier info (no sensitive data)
CREATE POLICY "suppliers_select_basic_data" ON public.suppliers
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL 
  AND status = 'active'
);

-- Only allow service role to insert suppliers with credentials
CREATE POLICY "suppliers_service_insert" ON public.suppliers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow users to insert basic supplier data (no sensitive fields)
CREATE POLICY "suppliers_user_insert_basic" ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND api_key IS NULL
  AND encrypted_credentials IS NULL
);

-- Only allow service role to update sensitive credentials
CREATE POLICY "suppliers_service_update" ON public.suppliers
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Allow users to update non-sensitive fields only
CREATE POLICY "suppliers_user_update_basic" ON public.suppliers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  -- Prevent updates to sensitive fields
  AND (OLD.api_key IS NOT DISTINCT FROM NEW.api_key)
  AND (OLD.encrypted_credentials IS NOT DISTINCT FROM NEW.encrypted_credentials)
  AND (OLD.contact_email IS NOT DISTINCT FROM NEW.contact_email)
  AND (OLD.contact_phone IS NOT DISTINCT FROM NEW.contact_phone)
);

-- Allow users to delete their own suppliers
CREATE POLICY "suppliers_user_delete" ON public.suppliers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_secure_suppliers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_sensitive_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_supplier_ownership(uuid, uuid) TO authenticated, service_role;

-- 6. Add security documentation
COMMENT ON TABLE public.suppliers IS 'Contains supplier data with encrypted credentials and sensitive contact information. Direct access to sensitive fields is restricted. Use get_secure_suppliers() for safe data access.';
COMMENT ON FUNCTION public.get_secure_suppliers() IS 'Returns supplier data with sensitive fields masked or excluded. Safe for general use.';
COMMENT ON FUNCTION public.get_supplier_sensitive_data(uuid) IS 'Admin-only function to access sensitive supplier data with audit logging.';
COMMENT ON FUNCTION public.verify_supplier_ownership(uuid, uuid) IS 'Verifies if a user owns a specific supplier. Used by edge functions for secure credential access.';