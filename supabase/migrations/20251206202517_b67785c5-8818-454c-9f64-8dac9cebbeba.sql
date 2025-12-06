-- Phase 1: Colonnes prioritaires Shopify sur products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS handle text,
ADD COLUMN IF NOT EXISTS vendor text,
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS compare_at_price numeric,
ADD COLUMN IF NOT EXISTS product_type text;

-- Phase 3: Champs Google Shopping sur products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS google_product_category text,
ADD COLUMN IF NOT EXISTS google_gender text,
ADD COLUMN IF NOT EXISTS google_age_group text,
ADD COLUMN IF NOT EXISTS mpn text,
ADD COLUMN IF NOT EXISTS product_condition text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS google_custom_labels jsonb DEFAULT '{}';

-- Phase 4: Champs inventaire/shipping sur products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS inventory_policy text DEFAULT 'deny',
ADD COLUMN IF NOT EXISTS fulfillment_service text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS requires_shipping boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS taxable boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tax_code text,
ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg';

-- Mise à jour de product_variants existante avec colonnes Shopify manquantes
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS title text DEFAULT 'Default Title',
ADD COLUMN IF NOT EXISTS compare_at_price numeric,
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS inventory_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_policy text DEFAULT 'deny',
ADD COLUMN IF NOT EXISTS fulfillment_service text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS requires_shipping boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS taxable boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS option1_name text,
ADD COLUMN IF NOT EXISTS option1_value text,
ADD COLUMN IF NOT EXISTS option2_name text,
ADD COLUMN IF NOT EXISTS option2_value text,
ADD COLUMN IF NOT EXISTS option3_name text,
ADD COLUMN IF NOT EXISTS option3_value text,
ADD COLUMN IF NOT EXISTS position integer DEFAULT 1;

-- Phase 5: Table des images produit
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  src text NOT NULL,
  alt text,
  position integer DEFAULT 1,
  width integer,
  height integer,
  variant_ids uuid[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_products_handle ON public.products(handle);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- RLS pour product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own images"
ON public.product_images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own images"
ON public.product_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
ON public.product_images FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
ON public.product_images FOR DELETE
USING (auth.uid() = user_id);