-- Create webhook_events table for tracking webhooks
CREATE TABLE public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    shop_domain TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_events
CREATE POLICY "Users can view their own webhook events"
ON public.webhook_events FOR SELECT
USING (user_id = auth.uid());

-- Add tracking fields to orders table if not exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_status TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_events JSONB DEFAULT '[]';