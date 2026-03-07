
-- Add missing columns to existing webhook_events
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Users can view own webhook events') THEN
    CREATE POLICY "Users can view own webhook events" ON public.webhook_events FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Users can insert own webhook events') THEN
    CREATE POLICY "Users can insert own webhook events" ON public.webhook_events FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_endpoint_id ON public.webhook_events(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON public.webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_events;
