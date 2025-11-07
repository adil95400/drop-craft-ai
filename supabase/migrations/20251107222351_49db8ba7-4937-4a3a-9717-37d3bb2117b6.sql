-- Create product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 0,
  weight NUMERIC(10,2),
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, sku)
);

-- Create product options table
CREATE TABLE IF NOT EXISTS public.product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  values TEXT[] NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for variants
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

-- RLS Policies for options
CREATE POLICY "Users can view their own product options"
  ON public.product_options FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product options"
  ON public.product_options FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product options"
  ON public.product_options FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product options"
  ON public.product_options FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_variants_user_id ON public.product_variants(user_id);
CREATE INDEX idx_options_product_id ON public.product_options(product_id);

-- Update trigger
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();