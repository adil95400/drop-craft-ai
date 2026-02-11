
-- Usage events table for internal KPI tracking (activation, retention, funnel)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'general',
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_event_name ON public.usage_events(event_name);
CREATE INDEX idx_usage_events_created_at ON public.usage_events(created_at DESC);
CREATE INDEX idx_usage_events_category ON public.usage_events(event_category);

-- Enable RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events" ON public.usage_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
CREATE POLICY "Users can read own events" ON public.usage_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Usage counters (aggregated daily metrics per user)
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  counter_key TEXT NOT NULL,
  counter_value INTEGER NOT NULL DEFAULT 0,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, counter_key, period_date)
);

CREATE INDEX idx_usage_counters_user ON public.usage_counters(user_id, counter_key);
CREATE INDEX idx_usage_counters_date ON public.usage_counters(period_date DESC);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own counters" ON public.usage_counters
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to increment a counter atomically
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_user_id UUID,
  p_counter_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_val INTEGER;
BEGIN
  INSERT INTO public.usage_counters (user_id, counter_key, counter_value, period_date)
  VALUES (p_user_id, p_counter_key, p_increment, CURRENT_DATE)
  ON CONFLICT (user_id, counter_key, period_date)
  DO UPDATE SET counter_value = usage_counters.counter_value + p_increment,
               updated_at = now()
  RETURNING counter_value INTO new_val;
  
  RETURN new_val;
END;
$$;
