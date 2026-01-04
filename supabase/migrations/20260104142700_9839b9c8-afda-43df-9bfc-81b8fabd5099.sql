-- Create validation function for client-side activity log inserts
CREATE OR REPLACE FUNCTION public.validate_client_activity_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Whitelist allowed actions from client
  IF NEW.action NOT IN (
    'feedback_submitted', 
    'action_abandoned', 
    'faq_helpful_vote', 
    'newsletter_signup',
    'customer_data_access',
    'security_monitoring_init',
    'support_ticket_created',
    'store_connection',
    'cart_recovery',
    'return_action',
    'credential_operation',
    'page_view',
    'user_login',
    'user_logout'
  ) THEN
    RAISE EXCEPTION 'Invalid action type from client: %', NEW.action;
  END IF;
  
  -- Rate limiting: max 100 logs per user per hour
  IF (SELECT COUNT(*) FROM public.activity_logs 
      WHERE user_id = NEW.user_id 
      AND created_at > NOW() - INTERVAL '1 hour') > 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded for activity logging';
  END IF;
  
  -- Force source to 'client' for transparency when not set
  IF NEW.source IS NULL OR NEW.source = '' THEN
    NEW.source := 'client';
  END IF;
  
  -- Ensure user_id matches authenticated user
  IF NEW.user_id IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot log activity for another user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_activity_log_insert ON public.activity_logs;
CREATE TRIGGER validate_activity_log_insert
BEFORE INSERT ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.validate_client_activity_log();