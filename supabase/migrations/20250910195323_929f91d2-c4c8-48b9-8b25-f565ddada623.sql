-- Create import_configurations table
CREATE TABLE IF NOT EXISTS public.import_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_type TEXT NOT NULL CHECK (config_type IN ('url', 'xml', 'ftp', 'csv', 'api')),
  config_name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own import configurations" 
ON public.import_configurations 
FOR ALL 
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_import_configurations_user_id ON public.import_configurations(user_id);
CREATE INDEX idx_import_configurations_type ON public.import_configurations(config_type);

-- Add trigger for updated_at
CREATE TRIGGER update_import_configurations_updated_at
BEFORE UPDATE ON public.import_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();