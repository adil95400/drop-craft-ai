-- Create integrations table to store platform connections
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform_type TEXT NOT NULL, -- 'ecommerce', 'marketplace', 'payment', 'marketing'
  platform_name TEXT NOT NULL, -- 'shopify', 'amazon', 'aliexpress', etc.
  platform_url TEXT,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  shop_domain TEXT, -- for Shopify, WooCommerce
  seller_id TEXT, -- for Amazon, eBay
  store_config JSONB DEFAULT '{}', -- platform-specific configuration
  connection_status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
  is_active BOOLEAN DEFAULT false,
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

-- Create sync_logs table to track synchronization history
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'products', 'orders', 'inventory', 'customers'
  status TEXT NOT NULL, -- 'success', 'error', 'in_progress'
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_logs (through integration relationship)
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

-- Create index for better performance
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_platform ON public.integrations(platform_name, user_id);
CREATE INDEX idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status, started_at);