-- Create store_integrations table
CREATE TABLE public.store_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'prestashop', 'magento')),
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  webhook_secret TEXT,
  store_config JSONB NOT NULL DEFAULT '{}',
  sync_settings JSONB NOT NULL DEFAULT '{
    "auto_sync": true,
    "sync_frequency": "hourly",
    "sync_products": true,
    "sync_orders": true,
    "sync_customers": true
  }',
  products_count INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  customers_count INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  logo_url TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own store integrations" 
ON public.store_integrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store integrations" 
ON public.store_integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store integrations" 
ON public.store_integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store integrations" 
ON public.store_integrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create store_sync_logs table
CREATE TABLE public.store_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.store_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  items_processed INTEGER DEFAULT 0,
  items_success INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sync logs
CREATE POLICY "Users can view their own store sync logs" 
ON public.store_sync_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store sync logs" 
ON public.store_sync_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create store_webhooks table
CREATE TABLE public.store_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.store_integrations(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhooks
CREATE POLICY "Users can manage their own store webhooks" 
ON public.store_webhooks 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_store_integrations_user_id ON public.store_integrations(user_id);
CREATE INDEX idx_store_integrations_platform ON public.store_integrations(platform);
CREATE INDEX idx_store_integrations_status ON public.store_integrations(status);
CREATE INDEX idx_store_sync_logs_store_id ON public.store_sync_logs(store_id);
CREATE INDEX idx_store_sync_logs_user_id ON public.store_sync_logs(user_id);
CREATE INDEX idx_store_webhooks_store_id ON public.store_webhooks(store_id);

-- Create function to update store statistics
CREATE OR REPLACE FUNCTION public.update_store_statistics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_store_integrations_updated_at
BEFORE UPDATE ON public.store_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_store_statistics();

CREATE TRIGGER update_store_webhooks_updated_at
BEFORE UPDATE ON public.store_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_store_statistics();