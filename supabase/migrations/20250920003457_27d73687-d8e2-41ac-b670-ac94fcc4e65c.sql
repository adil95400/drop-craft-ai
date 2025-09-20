-- Create tables for import management and synchronization

-- Table for storing import jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('one-click', 'chrome-extension', 'ai-scraper', 'bulk-csv', 'api-connector', 'marketplace-feeds')),
  source_name TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_products INTEGER DEFAULT 0,
  imported_products INTEGER DEFAULT 0,
  failed_products INTEGER DEFAULT 0,
  configuration JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table for storing imported products
CREATE TABLE IF NOT EXISTS public.imported_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  import_job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  images JSONB DEFAULT '[]',
  categories JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  source_url TEXT,
  sku TEXT,
  stock_quantity INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for API synchronization configurations
CREATE TABLE IF NOT EXISTS public.sync_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'oauth', 'basic', 'bearer')),
  credentials JSONB NOT NULL DEFAULT '{}',
  sync_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  sync_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.sync_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_config_id UUID REFERENCES public.sync_configurations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'update', 'delete', 'full_sync')),
  products_processed INTEGER DEFAULT 0,
  products_imported INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for import_jobs
CREATE POLICY "Users can view their own import jobs" 
ON public.import_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import jobs" 
ON public.import_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import jobs" 
ON public.import_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own import jobs" 
ON public.import_jobs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for imported_products
CREATE POLICY "Users can view their own imported products" 
ON public.imported_products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported products" 
ON public.imported_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported products" 
ON public.imported_products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported products" 
ON public.imported_products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for sync_configurations
CREATE POLICY "Users can view their own sync configs" 
ON public.sync_configurations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync configs" 
ON public.sync_configurations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync configs" 
ON public.sync_configurations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync configs" 
ON public.sync_configurations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for sync_operations
CREATE POLICY "Users can view their own sync operations" 
ON public.sync_operations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync operations" 
ON public.sync_operations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync operations" 
ON public.sync_operations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON public.import_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_imported_products_user_id ON public.imported_products(user_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_import_job_id ON public.imported_products(import_job_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_status ON public.imported_products(status);

CREATE INDEX IF NOT EXISTS idx_sync_configurations_user_id ON public.sync_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_configurations_is_active ON public.sync_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_sync_operations_user_id ON public.sync_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_sync_config_id ON public.sync_operations(sync_config_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON public.sync_operations(status);

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imported_products_updated_at
  BEFORE UPDATE ON public.imported_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_configurations_updated_at
  BEFORE UPDATE ON public.sync_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for real-time updates
ALTER TABLE public.import_jobs REPLICA IDENTITY FULL;
ALTER TABLE public.imported_products REPLICA IDENTITY FULL;
ALTER TABLE public.sync_operations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.imported_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_operations;