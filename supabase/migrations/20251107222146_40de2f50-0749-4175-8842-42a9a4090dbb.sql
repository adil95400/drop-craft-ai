-- Create sync configurations table
CREATE TABLE IF NOT EXISTS public.shopify_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
  sync_frequency TEXT NOT NULL CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  auto_sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'running', 'success', 'error')),
  last_sync_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sync logs table
CREATE TABLE IF NOT EXISTS public.shopify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES public.shopify_sync_configs(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automatic')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  products_synced INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  errors JSONB,
  duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.shopify_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sync configs
CREATE POLICY "Users can view their own sync configs"
  ON public.shopify_sync_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync configs"
  ON public.shopify_sync_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync configs"
  ON public.shopify_sync_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync configs"
  ON public.shopify_sync_configs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for sync logs
CREATE POLICY "Users can view their own sync logs"
  ON public.shopify_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync logs"
  ON public.shopify_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sync_configs_user_id ON public.shopify_sync_configs(user_id);
CREATE INDEX idx_sync_configs_next_sync ON public.shopify_sync_configs(next_sync_at) WHERE auto_sync_enabled = true;
CREATE INDEX idx_sync_logs_user_id ON public.shopify_sync_logs(user_id);
CREATE INDEX idx_sync_logs_config_id ON public.shopify_sync_logs(config_id);
CREATE INDEX idx_sync_logs_started_at ON public.shopify_sync_logs(started_at DESC);

-- Function to calculate next sync time
CREATE OR REPLACE FUNCTION public.calculate_next_sync(frequency TEXT, base_time TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  CASE frequency
    WHEN 'hourly' THEN RETURN base_time + INTERVAL '1 hour';
    WHEN 'daily' THEN RETURN base_time + INTERVAL '1 day';
    WHEN 'weekly' THEN RETURN base_time + INTERVAL '1 week';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_sync_at
CREATE OR REPLACE FUNCTION public.update_next_sync_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_sync_enabled = true AND NEW.sync_frequency != 'manual' THEN
    NEW.next_sync_at := public.calculate_next_sync(NEW.sync_frequency, COALESCE(NEW.last_sync_at, now()));
  ELSE
    NEW.next_sync_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_sync
  BEFORE INSERT OR UPDATE ON public.shopify_sync_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_next_sync_time();