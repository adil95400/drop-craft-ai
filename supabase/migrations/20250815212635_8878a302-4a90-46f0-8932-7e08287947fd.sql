-- Fix the previous migration - create a proper data masking view
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

-- Create additional security function to validate customer data access
CREATE OR REPLACE FUNCTION public.validate_customer_access(customer_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user owns this customer record
  RETURN EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = customer_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;