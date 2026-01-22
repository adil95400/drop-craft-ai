-- Create scheduled_imports table for automated import scheduling
CREATE TABLE public.scheduled_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'csv', 'xml', 'api', 'feed')),
  source_url TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  cron_expression TEXT,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 day',
  last_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  last_run_status TEXT DEFAULT 'never' CHECK (last_run_status IN ('completed', 'failed', 'pending', 'never', 'running')),
  products_imported INTEGER DEFAULT 0,
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scheduled_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_imports
CREATE POLICY "Users can view their own scheduled imports"
ON public.scheduled_imports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled imports"
ON public.scheduled_imports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled imports"
ON public.scheduled_imports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled imports"
ON public.scheduled_imports FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_scheduled_imports_user_id ON public.scheduled_imports(user_id);
CREATE INDEX idx_scheduled_imports_next_run ON public.scheduled_imports(next_run_at) WHERE is_active = true;

-- Add import_config column to user_settings for import configuration
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS import_config JSONB DEFAULT '{}'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_imports_updated_at
BEFORE UPDATE ON public.scheduled_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();