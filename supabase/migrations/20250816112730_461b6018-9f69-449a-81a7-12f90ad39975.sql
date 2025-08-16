-- Fix critical security vulnerabilities in payment and subscription data access

-- 1. Fix subscribers table RLS policies - CRITICAL SECURITY ISSUE  
-- The current policies are too permissive and allow unauthorized access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers; 
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure RLS policies for subscribers table
-- Only allow users to view their own subscription data
CREATE POLICY "subscribers_select_own_data" ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Only allow edge functions (service role) to insert subscription data
CREATE POLICY "subscribers_service_insert" ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only allow edge functions (service role) to update subscription data  
CREATE POLICY "subscribers_service_update" ON public.subscribers
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Enhance subscriptions table security
-- Ensure user_id is never null for data integrity
ALTER TABLE public.subscriptions 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Add audit logging function for sensitive subscription data access
CREATE OR REPLACE FUNCTION public.log_subscription_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive payment data
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'subscription_data_access',
    'info',
    'Subscription data accessed',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'accessed_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'timestamp', now()
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers (only for data modification operations)
CREATE TRIGGER subscription_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_subscription_access();

CREATE TRIGGER subscriber_access_audit  
  AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.log_subscription_access();

-- 4. Create a secure view for subscription status (read-only)
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
  s.id,
  s.user_id,
  s.subscribed,
  s.subscription_tier,
  s.subscription_end,
  s.updated_at
FROM public.subscribers s
WHERE s.user_id = auth.uid()
AND auth.uid() IS NOT NULL;

-- Grant access to the secure view
GRANT SELECT ON public.user_subscription_status TO authenticated;

-- 5. Add security documentation
COMMENT ON TABLE public.subscribers IS 'Contains sensitive Stripe payment data. Access restricted to service role for writes and authenticated users for their own data only.';
COMMENT ON TABLE public.subscriptions IS 'Contains subscription metadata. Users can only access their own subscription data.';