
-- Table des mappings de variantes fournisseur → catalogue
CREATE TABLE public.variant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Mapping source (fournisseur)
  source_variant_id TEXT,
  source_sku TEXT,
  source_option_name TEXT NOT NULL, -- "Size", "Color", "Material"
  source_option_value TEXT NOT NULL, -- "XL", "Rouge", "Cotton"
  
  -- Mapping cible (catalogue)
  target_option_name TEXT NOT NULL,
  target_option_value TEXT NOT NULL,
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte d'unicité
  UNIQUE(user_id, supplier_id, source_option_name, source_option_value, target_option_name)
);

-- Table des règles de mapping automatique (templates)
CREATE TABLE public.variant_mapping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  
  rule_name TEXT NOT NULL,
  option_type TEXT NOT NULL, -- "size", "color", "material", "custom"
  
  -- Règles de transformation
  source_pattern TEXT NOT NULL, -- Regex ou valeur exacte
  target_value TEXT NOT NULL,
  transformation_type TEXT DEFAULT 'exact', -- "exact", "regex", "contains", "prefix"
  
  -- Priorité et activation
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  apply_to_all_products BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des templates de mapping prédéfinis
CREATE TABLE public.variant_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  option_type TEXT NOT NULL,
  mappings JSONB NOT NULL DEFAULT '[]', -- [{source: "S", target: "Small"}, ...]
  is_global BOOLEAN DEFAULT false, -- Templates système vs utilisateur
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_variant_mappings_user ON public.variant_mappings(user_id);
CREATE INDEX idx_variant_mappings_supplier ON public.variant_mappings(supplier_id);
CREATE INDEX idx_variant_mappings_product ON public.variant_mappings(product_id);
CREATE INDEX idx_variant_mapping_rules_user ON public.variant_mapping_rules(user_id);

-- Trigger updated_at
CREATE TRIGGER update_variant_mappings_updated_at
  BEFORE UPDATE ON public.variant_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_variant_mapping_rules_updated_at
  BEFORE UPDATE ON public.variant_mapping_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.variant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_mapping_templates ENABLE ROW LEVEL SECURITY;

-- Policies variant_mappings
CREATE POLICY "Users can view their own variant mappings"
  ON public.variant_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own variant mappings"
  ON public.variant_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variant mappings"
  ON public.variant_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variant mappings"
  ON public.variant_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- Policies variant_mapping_rules
CREATE POLICY "Users can view their own mapping rules"
  ON public.variant_mapping_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mapping rules"
  ON public.variant_mapping_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mapping rules"
  ON public.variant_mapping_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mapping rules"
  ON public.variant_mapping_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Policies variant_mapping_templates
CREATE POLICY "Users can view global or own templates"
  ON public.variant_mapping_templates FOR SELECT
  USING (is_global = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.variant_mapping_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users can update their own templates"
  ON public.variant_mapping_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.variant_mapping_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Insérer des templates globaux prédéfinis
INSERT INTO public.variant_mapping_templates (name, description, option_type, mappings, is_global) VALUES
('Tailles EU → Standard', 'Conversion tailles européennes', 'size', 
 '[{"source":"XS","target":"Extra Small"},{"source":"S","target":"Small"},{"source":"M","target":"Medium"},{"source":"L","target":"Large"},{"source":"XL","target":"Extra Large"},{"source":"XXL","target":"2X Large"}]', true),
('Tailles US Shoes', 'Pointures US vers EU', 'size',
 '[{"source":"6","target":"39"},{"source":"7","target":"40"},{"source":"8","target":"41"},{"source":"9","target":"42"},{"source":"10","target":"43"},{"source":"11","target":"44"},{"source":"12","target":"45"}]', true),
('Couleurs FR → EN', 'Traduction couleurs français-anglais', 'color',
 '[{"source":"Noir","target":"Black"},{"source":"Blanc","target":"White"},{"source":"Rouge","target":"Red"},{"source":"Bleu","target":"Blue"},{"source":"Vert","target":"Green"},{"source":"Jaune","target":"Yellow"},{"source":"Rose","target":"Pink"},{"source":"Gris","target":"Gray"},{"source":"Marron","target":"Brown"},{"source":"Orange","target":"Orange"}]', true),
('Couleurs EN → FR', 'Traduction couleurs anglais-français', 'color',
 '[{"source":"Black","target":"Noir"},{"source":"White","target":"Blanc"},{"source":"Red","target":"Rouge"},{"source":"Blue","target":"Bleu"},{"source":"Green","target":"Vert"},{"source":"Yellow","target":"Jaune"},{"source":"Pink","target":"Rose"},{"source":"Gray","target":"Gris"},{"source":"Brown","target":"Marron"}]', true);
