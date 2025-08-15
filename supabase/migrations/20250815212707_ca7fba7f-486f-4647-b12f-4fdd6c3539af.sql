-- First create the masking functions that were missing
CREATE OR REPLACE FUNCTION public.mask_customer_email(email text)
RETURNS text AS $$
BEGIN
  IF email IS NULL OR email = '' THEN
    RETURN email;
  END IF;
  
  RETURN substring(email from 1 for 3) || '***@' || split_part(email, '@', 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add phone masking function
CREATE OR REPLACE FUNCTION public.mask_customer_phone(phone text)
RETURNS text AS $$
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN phone;
  END IF;
  
  RETURN substring(phone from 1 for 3) || '****' || substring(phone from length(phone) - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Now create the secure view
CREATE OR REPLACE VIEW public.customers_secure AS
SELECT 
  id,
  name,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN email
    ELSE mask_customer_email(email)
  END as email,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN phone
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