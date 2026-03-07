
-- Create webhook_endpoints table
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'generic',
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  event_types TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook endpoints" ON public.webhook_endpoints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own webhook endpoints" ON public.webhook_endpoints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhook endpoints" ON public.webhook_endpoints FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhook endpoints" ON public.webhook_endpoints FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_webhook_endpoints_user_id ON public.webhook_endpoints(user_id);
