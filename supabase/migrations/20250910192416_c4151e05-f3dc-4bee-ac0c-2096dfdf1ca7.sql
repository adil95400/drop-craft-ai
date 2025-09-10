-- Create table for extension sync logs
CREATE TABLE IF NOT EXISTS public.extension_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  source TEXT NOT NULL,
  extension_version TEXT,
  products_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own extension sync logs" 
ON public.extension_sync_logs 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Extension service can insert sync logs" 
ON public.extension_sync_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_extension_sync_logs_user_id ON public.extension_sync_logs(user_id);
CREATE INDEX idx_extension_sync_logs_created_at ON public.extension_sync_logs(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_extension_sync_logs_updated_at
BEFORE UPDATE ON public.extension_sync_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();