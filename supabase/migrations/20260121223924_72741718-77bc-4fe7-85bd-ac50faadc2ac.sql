-- Create installed_extensions table for tracking user extension installations
CREATE TABLE public.installed_extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  extension_id TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, extension_id)
);

-- Enable RLS
ALTER TABLE public.installed_extensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own installed extensions"
  ON public.installed_extensions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can install extensions"
  ON public.installed_extensions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installed extensions"
  ON public.installed_extensions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installed extensions"
  ON public.installed_extensions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_installed_extensions_user_id ON public.installed_extensions(user_id);
CREATE INDEX idx_installed_extensions_extension_id ON public.installed_extensions(extension_id);

-- Trigger for updated_at
CREATE TRIGGER update_installed_extensions_updated_at
  BEFORE UPDATE ON public.installed_extensions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();