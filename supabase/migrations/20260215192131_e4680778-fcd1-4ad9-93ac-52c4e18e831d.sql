
-- Create webhook_delivery_logs table for tracking webhook deliveries
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  status_code INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Policy: users can see their own delivery logs via the subscription
CREATE POLICY "Users can view their webhook delivery logs"
  ON public.webhook_delivery_logs
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM public.webhook_subscriptions WHERE user_id = auth.uid()
    )
  );

-- Service role can insert (edge functions)
CREATE POLICY "Service can insert delivery logs"
  ON public.webhook_delivery_logs
  FOR INSERT
  WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX idx_webhook_delivery_logs_subscription ON public.webhook_delivery_logs(subscription_id, created_at DESC);
