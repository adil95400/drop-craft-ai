-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  platform_type TEXT NOT NULL,
  platform_url TEXT,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  shop_domain TEXT,
  seller_id TEXT,
  store_config JSONB DEFAULT '{}',
  connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_frequency TEXT NOT NULL DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own integrations" 
ON public.integrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations" 
ON public.integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" 
ON public.integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" 
ON public.integrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create sync_logs table for tracking synchronization
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'success', 'error')),
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_logs
CREATE POLICY "Users can view sync logs for their integrations" 
ON public.sync_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.integrations 
    WHERE integrations.id = sync_logs.integration_id 
    AND integrations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create sync logs for their integrations" 
ON public.sync_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.integrations 
    WHERE integrations.id = sync_logs.integration_id 
    AND integrations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update sync logs for their integrations" 
ON public.sync_logs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.integrations 
    WHERE integrations.id = sync_logs.integration_id 
    AND integrations.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_platform_name ON public.integrations(platform_name);
CREATE INDEX idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);