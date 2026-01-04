-- Table pour les variantes de produits
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(10,2),
  compare_at_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 0,
  weight NUMERIC(10,3),
  option1_name TEXT,
  option1_value TEXT,
  option2_name TEXT,
  option2_value TEXT,
  option3_name TEXT,
  option3_value TEXT,
  image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les images produits
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_user_id ON public.product_variants(user_id);
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_user_id ON public.product_images(user_id);

-- RLS pour product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product variants"
ON public.product_variants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product variants"
ON public.product_variants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product variants"
ON public.product_variants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product variants"
ON public.product_variants FOR DELETE
USING (auth.uid() = user_id);

-- RLS pour product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product images"
ON public.product_images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product images"
ON public.product_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product images"
ON public.product_images FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product images"
ON public.product_images FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour updated_at sur product_variants
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();