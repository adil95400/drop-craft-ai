-- Create extensions system tables
CREATE TABLE public.extensions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL, -- 'product_import', 'review_import', 'automation'
  provider text NOT NULL, -- 'amazon', 'ebay', 'shopify', 'loox', etc.
  version text NOT NULL DEFAULT '1.0.0',
  status text NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'error'
  configuration jsonb NOT NULL DEFAULT '{}',
  permissions jsonb NOT NULL DEFAULT '[]',
  metadata jsonb NOT NULL DEFAULT '{}',
  api_endpoints jsonb NOT NULL DEFAULT '{}',
  rate_limits jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamp with time zone,
  sync_frequency text DEFAULT 'manual', -- 'manual', 'hourly', 'daily', 'weekly'
  install_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own extensions" 
ON public.extensions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create extension_jobs table for tracking import/sync jobs
CREATE TABLE public.extension_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  extension_id uuid NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  job_type text NOT NULL, -- 'import', 'sync', 'export'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress integer NOT NULL DEFAULT 0,
  total_items integer DEFAULT 0,
  processed_items integer DEFAULT 0,
  success_items integer DEFAULT 0,
  error_items integer DEFAULT 0,
  input_data jsonb NOT NULL DEFAULT '{}',
  output_data jsonb NOT NULL DEFAULT '{}',
  error_details jsonb NOT NULL DEFAULT '[]',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own extension jobs" 
ON public.extension_jobs 
FOR ALL 
USING (auth.uid() = user_id);

-- Create extension_data table for storing imported data
CREATE TABLE public.extension_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  extension_id uuid NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.extension_jobs(id) ON DELETE SET NULL,
  data_type text NOT NULL, -- 'product', 'review', 'order', 'customer'
  external_id text,
  data_content jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'imported', -- 'imported', 'processed', 'published', 'error'
  quality_score numeric DEFAULT 0,
  ai_enhanced boolean DEFAULT false,
  ai_metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own extension data" 
ON public.extension_data 
FOR ALL 
USING (auth.uid() = user_id);

-- Create extension_webhooks table for automation
CREATE TABLE public.extension_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  extension_id uuid NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  webhook_secret text,
  event_types text[] NOT NULL DEFAULT '{}', -- ['product.created', 'review.imported', etc.]
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamp with time zone,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own extension webhooks" 
ON public.extension_webhooks 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_extensions_user_category ON public.extensions(user_id, category);
CREATE INDEX idx_extensions_status ON public.extensions(status);
CREATE INDEX idx_extension_jobs_status ON public.extension_jobs(status);
CREATE INDEX idx_extension_jobs_extension ON public.extension_jobs(extension_id);
CREATE INDEX idx_extension_data_type ON public.extension_data(data_type);
CREATE INDEX idx_extension_data_external ON public.extension_data(external_id);

-- Create trigger for updated_at
CREATE TRIGGER update_extensions_updated_at
BEFORE UPDATE ON public.extensions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extension_jobs_updated_at
BEFORE UPDATE ON public.extension_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extension_data_updated_at
BEFORE UPDATE ON public.extension_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extension_webhooks_updated_at
BEFORE UPDATE ON public.extension_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();