-- Ajouter les colonnes manquantes à la table imported_products pour supporter l'import CSV complet

-- Colonnes de base manquantes
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS sub_category text,
ADD COLUMN IF NOT EXISTS compare_at_price numeric,
ADD COLUMN IF NOT EXISTS suggested_price numeric,
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order integer,
ADD COLUMN IF NOT EXISTS max_order integer;

-- Colonnes physiques
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS length numeric,
ADD COLUMN IF NOT EXISTS width numeric,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS dimension_unit text DEFAULT 'cm';

-- Colonnes d'attributs produit
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS style text;

-- Colonnes SEO étendues
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS seo_keywords text[],
ADD COLUMN IF NOT EXISTS meta_tags text[];

-- Colonnes de variantes
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS variant_group text,
ADD COLUMN IF NOT EXISTS variant_name text,
ADD COLUMN IF NOT EXISTS variant_sku text;

-- Colonnes fournisseur étendues
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS supplier_sku text,
ADD COLUMN IF NOT EXISTS supplier_price numeric;

-- Colonnes de livraison
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS shipping_time text,
ADD COLUMN IF NOT EXISTS shipping_cost numeric;

-- Codes produit
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS ean text,
ADD COLUMN IF NOT EXISTS upc text,
ADD COLUMN IF NOT EXISTS gtin text;

-- Localisation
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS country_of_origin text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr';