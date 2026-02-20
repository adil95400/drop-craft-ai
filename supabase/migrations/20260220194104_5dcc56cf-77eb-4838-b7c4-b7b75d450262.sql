
-- Add retry_count and stripe_session_id columns for webhook hardening

-- Retry tracking on webhook_events
ALTER TABLE public.webhook_events 
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Credit addons: track Stripe session for idempotent fulfillment
ALTER TABLE public.credit_addons 
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_addons_stripe_session 
  ON public.credit_addons(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Function to atomically increment retry count and mark failed
CREATE OR REPLACE FUNCTION public.increment_webhook_retry(p_stripe_event_id TEXT, p_error TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.webhook_events
  SET 
    retry_count = COALESCE(retry_count, 0) + 1,
    status = 'failed',
    error_message = p_error,
    processed_at = now()
  WHERE stripe_event_id = p_stripe_event_id;
END;
$$;
