-- Créer la table pour les mappings de catégories
CREATE TABLE IF NOT EXISTS public.category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_category TEXT NOT NULL,
  platform TEXT NOT NULL,
  target_category TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_category, platform)
);

-- Créer la table pour les mappings de champs personnalisés
CREATE TABLE IF NOT EXISTS public.field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform_function TEXT,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, source_field)
);

-- Enable RLS
ALTER TABLE public.category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_mappings ENABLE ROW LEVEL SECURITY;

-- Policies pour category_mappings
CREATE POLICY "Users can view their own category mappings"
  ON public.category_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category mappings"
  ON public.category_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category mappings"
  ON public.category_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category mappings"
  ON public.category_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour field_mappings
CREATE POLICY "Users can view their own field mappings"
  ON public.field_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own field mappings"
  ON public.field_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own field mappings"
  ON public.field_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own field mappings"
  ON public.field_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_category_mappings_updated_at
  BEFORE UPDATE ON public.category_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_mappings_updated_at
  BEFORE UPDATE ON public.field_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_category_mappings_user_platform ON public.category_mappings(user_id, platform);
CREATE INDEX idx_field_mappings_user_platform ON public.field_mappings(user_id, platform);