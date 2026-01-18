-- Table pour les favoris utilisateurs persistants
CREATE TABLE public.user_product_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'supplier_product',
  product_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, product_type)
);

-- Enable RLS
ALTER TABLE public.user_product_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own favorites" 
ON public.user_product_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_product_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_product_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_product_favorites_user_id ON public.user_product_favorites(user_id);
CREATE INDEX idx_user_product_favorites_product_id ON public.user_product_favorites(product_id);

-- Table pour les filtres sauvegardés
CREATE TABLE public.saved_catalog_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_catalog_filters ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own saved filters" 
ON public.saved_catalog_filters 
FOR ALL 
USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_saved_catalog_filters_user_id ON public.saved_catalog_filters(user_id);