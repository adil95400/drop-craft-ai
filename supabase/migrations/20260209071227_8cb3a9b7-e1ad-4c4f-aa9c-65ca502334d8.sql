
-- Table pour persister les presets de mapping CSV par utilisateur
CREATE TABLE public.mapping_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'csv',
  mapping JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mapping_presets_user ON public.mapping_presets(user_id);

ALTER TABLE public.mapping_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own presets"
  ON public.mapping_presets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presets"
  ON public.mapping_presets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets"
  ON public.mapping_presets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets"
  ON public.mapping_presets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mapping_presets_updated_at
  BEFORE UPDATE ON public.mapping_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
