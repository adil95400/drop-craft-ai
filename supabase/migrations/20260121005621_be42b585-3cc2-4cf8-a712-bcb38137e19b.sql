
-- Add audit logging trigger for customer data access (GDPR compliance)
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all SELECT operations on customers table by admins
  IF TG_OP = 'SELECT' AND public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.activity_logs (
      user_id, 
      action, 
      entity_type, 
      entity_id,
      description, 
      source,
      severity
    ) VALUES (
      auth.uid(),
      'admin_customer_data_access',
      'customer',
      NEW.id::text,
      'Admin accessed customer data',
      'system',
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Add audit logging function for sensitive data modifications
CREATE OR REPLACE FUNCTION public.log_sensitive_data_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id, 
    action, 
    entity_type, 
    entity_id,
    description, 
    details,
    source,
    severity
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'customer_created'
      WHEN TG_OP = 'UPDATE' THEN 'customer_updated'
      WHEN TG_OP = 'DELETE' THEN 'customer_deleted'
    END,
    'customer',
    COALESCE(NEW.id, OLD.id)::text,
    TG_OP || ' on customer record',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'is_admin', public.has_role(auth.uid(), 'admin')
    ),
    'system',
    CASE WHEN TG_OP = 'DELETE' THEN 'warn' ELSE 'info' END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger for customer modifications audit
DROP TRIGGER IF EXISTS audit_customer_changes ON public.customers;
CREATE TRIGGER audit_customer_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_data_change();

-- Add index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type_action 
ON public.activity_logs(entity_type, action) 
WHERE entity_type = 'customer';

-- Record security improvement
INSERT INTO public.security_events (
  event_type, 
  severity, 
  description, 
  metadata
) VALUES (
  'security_improvement',
  'info',
  'Added GDPR-compliant audit logging for customer data access and modifications',
  jsonb_build_object(
    'improvement', 'audit_logging',
    'tables_affected', ARRAY['customers'],
    'compliance', 'GDPR'
  )
);
