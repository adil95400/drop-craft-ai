
-- =====================================================
-- P0-1: UNIFIER LE MODÈLE PRODUIT CANONIQUE
-- =====================================================

-- 1. Ajouter les colonnes canoniques manquantes à products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS profit_margin numeric(10,2),
  ADD COLUMN IF NOT EXISTS main_image_url text,
  ADD COLUMN IF NOT EXISTS bullet_points text[],
  ADD COLUMN IF NOT EXISTS collections text[],
  ADD COLUMN IF NOT EXISTS source_of_truth text DEFAULT 'internal';

-- 2. Créer la table product_attributes (attributs structurés typés)
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  namespace text NOT NULL DEFAULT 'custom',
  key text NOT NULL,
  value text,
  value_type text DEFAULT 'string',
  confidence numeric(5,2),
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, namespace, key)
);

ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own product attributes"
  ON public.product_attributes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_product_attributes_product ON public.product_attributes(product_id);
CREATE INDEX idx_product_attributes_key ON public.product_attributes(namespace, key);

CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON public.product_attributes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Ajouter promoted_to_product_id sur imported_products (staging → canonique)
ALTER TABLE public.imported_products
  ADD COLUMN IF NOT EXISTS promoted_to_product_id uuid REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS promotion_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_imported_promoted ON public.imported_products(promoted_to_product_id) WHERE promoted_to_product_id IS NOT NULL;

-- 4. Supprimer catalog_products (0 rows, table morte)
DROP TABLE IF EXISTS public.catalog_products CASCADE;

-- 5. Ajouter idempotency_key sur jobs pour P0-3
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_idempotency ON public.jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;
