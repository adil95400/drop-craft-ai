-- The issue might be that the view is still calling functions that use SECURITY DEFINER
-- Let's completely rewrite the approach to avoid any SECURITY DEFINER dependencies

-- Drop the view again and create a simpler, more secure approach
DROP VIEW IF EXISTS public.customers_secure;

-- Instead of using a view with conditional logic, let's create separate approaches
-- for admins and regular users using proper RLS policies on the base table

-- Create a simple masking function that doesn't require elevated privileges
CREATE OR REPLACE FUNCTION public.simple_mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
AS $$
  SELECT CASE 
    WHEN email IS NULL OR email = '' THEN email
    ELSE substring(email from 1 for 3) || '***@' || split_part(email, '@', 2)
  END;
$$;

-- Create a simple masking function for phone
CREATE OR REPLACE FUNCTION public.simple_mask_phone(phone text)
RETURNS text  
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
AS $$
  SELECT CASE 
    WHEN phone IS NULL OR phone = '' THEN phone
    ELSE substring(phone from 1 for 3) || '****' || substring(phone from length(phone) - 1)
  END;
$$;

-- Create a basic view without role checking - security is handled by RLS on underlying table
CREATE VIEW public.customers_masked AS
SELECT 
  id,
  name,
  simple_mask_email(email) as email,
  simple_mask_phone(phone) as phone,
  status,
  total_spent,
  total_orders,
  address,
  user_id,
  created_at,
  updated_at
FROM public.customers
WHERE auth.uid() = user_id;

-- For full access, admins should use the base customers table directly
-- The RLS policies on customers table will handle the security

COMMENT ON VIEW public.customers_masked IS 'Masked customer data view for regular users. Admins should query customers table directly.';