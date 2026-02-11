
-- Add stripe_event_id column for idempotence
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

-- Add unique constraint for Stripe idempotence
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id 
  ON public.webhook_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- Add status column if missing
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
