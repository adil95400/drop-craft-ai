-- Create sync_jobs table for PR1 Core Sync
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('products', 'orders', 'customers', 'inventory', 'full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  success_items INTEGER DEFAULT 0,
  error_items INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  sync_options JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own sync jobs" ON public.sync_jobs
FOR ALL USING (auth.uid() = user_id);

-- Create update trigger
CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create platform_connections table for storing connector credentials
CREATE TABLE IF NOT EXISTS public.platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'testing')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  webhook_endpoints JSONB DEFAULT '[]'::jsonb,
  sync_settings JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_test_at TIMESTAMP WITH TIME ZONE,
  test_results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform_name)
);

-- Enable RLS
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own platform connections" ON public.platform_connections
FOR ALL USING (auth.uid() = user_id);

-- Create update trigger
CREATE TRIGGER update_platform_connections_updated_at
  BEFORE UPDATE ON public.platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();