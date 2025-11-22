-- Create installed_extensions table for tracking user-installed extensions
CREATE TABLE IF NOT EXISTS public.installed_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extension_id TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_installed_extensions_user_id ON public.installed_extensions(user_id);
CREATE INDEX IF NOT EXISTS idx_installed_extensions_extension_id ON public.installed_extensions(extension_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_installed_extensions_user_extension ON public.installed_extensions(user_id, extension_id);

-- Enable RLS
ALTER TABLE public.installed_extensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own installed extensions"
  ON public.installed_extensions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can install extensions"
  ON public.installed_extensions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installed extensions"
  ON public.installed_extensions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installed extensions"
  ON public.installed_extensions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_installed_extensions_updated_at
  BEFORE UPDATE ON public.installed_extensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();