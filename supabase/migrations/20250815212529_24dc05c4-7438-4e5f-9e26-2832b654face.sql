-- Add additional security constraints to customers table
ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_not_null CHECK (user_id IS NOT NULL);

-- Create function to log customer data access for audit trail
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to security_events table
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'customer_data_access',
    'info',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'Customer data viewed'
      WHEN TG_OP = 'INSERT' THEN 'Customer data created'
      WHEN TG_OP = 'UPDATE' THEN 'Customer data updated'
      WHEN TG_OP = 'DELETE' THEN 'Customer data deleted'
    END,
    jsonb_build_object(
      'customer_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for customer access logging
CREATE TRIGGER customers_access_log
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_customer_access();

-- Add data masking function for sensitive customer data
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

-- Create view for masked customer data (for regular users)
CREATE OR REPLACE VIEW public.customers_masked AS
SELECT 
  id,
  name,
  mask_customer_email(email) as email,
  mask_customer_phone(phone) as phone,
  status,
  total_spent,
  total_orders,
  address,
  user_id,
  created_at,
  updated_at
FROM public.customers
WHERE auth.uid() = user_id;

-- Enable RLS on the view
ALTER VIEW public.customers_masked ENABLE ROW LEVEL SECURITY;

-- Create policy for masked view
CREATE POLICY "Users can view their own masked customer data"
ON public.customers_masked
FOR SELECT
USING (auth.uid() = user_id);