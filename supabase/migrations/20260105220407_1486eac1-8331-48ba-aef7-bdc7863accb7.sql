-- Category Mapping System
-- Mapping des catégories entre sources et destinations

CREATE TABLE public.category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('supplier', 'import', 'manual')),
  source_id UUID,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('shopify', 'google', 'facebook', 'custom')),
  destination_id UUID,
  mappings JSONB NOT NULL DEFAULT '[]',
  default_category TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_map_enabled BOOLEAN DEFAULT false,
  products_mapped INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Category taxonomy/hierarchy
CREATE TABLE public.category_taxonomies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('google', 'facebook', 'shopify', 'custom')),
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  parent_id TEXT,
  full_path TEXT,
  level INTEGER DEFAULT 0,
  is_leaf BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  is_global BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI suggested mappings
CREATE TABLE public.category_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapping_id UUID REFERENCES public.category_mappings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_category TEXT NOT NULL,
  suggested_category TEXT NOT NULL,
  suggested_category_id TEXT,
  confidence_score DECIMAL(5,4) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
  user_choice TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category_mappings
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

-- RLS Policies for category_taxonomies
CREATE POLICY "Users can view global or own taxonomies"
  ON public.category_taxonomies FOR SELECT
  USING (is_global = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own taxonomies"
  ON public.category_taxonomies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for category_suggestions
CREATE POLICY "Users can view their own suggestions"
  ON public.category_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suggestions"
  ON public.category_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions"
  ON public.category_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert sample Google taxonomy categories
INSERT INTO public.category_taxonomies (taxonomy_type, category_id, category_name, parent_id, full_path, level, is_global) VALUES
('google', '1', 'Animaux', NULL, 'Animaux', 0, true),
('google', '2', 'Arts et loisirs créatifs', NULL, 'Arts et loisirs créatifs', 0, true),
('google', '3', 'Bébé et puériculture', NULL, 'Bébé et puériculture', 0, true),
('google', '4', 'Commerces et entreprises', NULL, 'Commerces et entreprises', 0, true),
('google', '5', 'Électronique', NULL, 'Électronique', 0, true),
('google', '6', 'Alimentation, boissons et tabac', NULL, 'Alimentation, boissons et tabac', 0, true),
('google', '7', 'Meubles', NULL, 'Meubles', 0, true),
('google', '8', 'Santé et beauté', NULL, 'Santé et beauté', 0, true),
('google', '166', 'Vêtements et accessoires', NULL, 'Vêtements et accessoires', 0, true),
('google', '469', 'Logiciels', NULL, 'Logiciels', 0, true),
('google', '922', 'Sports et loisirs', NULL, 'Sports et loisirs', 0, true),
('google', '1239', 'Maison et jardin', NULL, 'Maison et jardin', 0, true);