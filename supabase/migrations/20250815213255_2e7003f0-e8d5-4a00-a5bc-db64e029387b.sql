-- Drop the existing problematic view
DROP VIEW IF EXISTS public.customers_secure;

-- Create a safer approach using RLS policies instead of SECURITY DEFINER functions in views
-- First, let's create a safe version of has_role that doesn't use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.user_has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER  -- This is the key change - INVOKER instead of DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Create a new secure view that uses the safe function
CREATE VIEW public.customers_secure AS
SELECT 
  id,
  name,
  CASE 
    WHEN user_has_role('admin'::app_role) THEN email
    ELSE mask_customer_email(email)
  END as email,
  CASE 
    WHEN user_has_role('admin'::app_role) THEN phone
    ELSE mask_customer_phone(phone)
  END as phone,
  status,
  total_spent,
  total_orders,
  address,
  user_id,
  created_at,
  updated_at
FROM public.customers
WHERE auth.uid() = user_id;

-- Add RLS policies to the view (though views inherit from underlying tables)
-- The security is enforced by the WHERE clause and the SECURITY INVOKER function

-- Update the customer security monitoring to use the secure view
COMMENT ON VIEW public.customers_secure IS 'Secure view for customer data with automatic masking for non-admin users';

-- Create a notification function that logs when sensitive data is accessed
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Using INVOKER for security
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    'info',
    'Customer sensitive data accessed through secure view',
    jsonb_build_object(
      'timestamp', now(),
      'view_used', 'customers_secure'
    )
  );
END;
$$;