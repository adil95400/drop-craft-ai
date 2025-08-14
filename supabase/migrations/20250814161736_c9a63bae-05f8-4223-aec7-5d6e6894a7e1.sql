-- Fix the function signature issue by dropping and recreating
DROP FUNCTION IF EXISTS public.get_marketplace_products(text, text, integer);

-- Create the secure marketplace function with complete column set
CREATE OR REPLACE FUNCTION public.get_marketplace_products(
  category_filter text DEFAULT NULL,
  search_term text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  external_id text,
  name text,
  description text,
  price numeric,
  currency text,
  category text,
  subcategory text,
  brand text,
  sku text,
  image_url text,
  image_urls text[],
  rating numeric,
  reviews_count integer,
  availability_status text,
  delivery_time text,
  tags text[],
  is_trending boolean,
  is_bestseller boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.external_id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.category,
    p.subcategory,
    p.brand,
    p.sku,
    p.image_url,
    p.image_urls,
    p.rating,
    p.reviews_count,
    p.availability_status,
    p.delivery_time,
    p.tags,
    p.is_trending,
    p.is_bestseller,
    p.created_at,
    p.updated_at
  FROM public.catalog_products p
  WHERE 
    p.availability_status = 'in_stock'
    AND (category_filter IS NULL OR p.category ILIKE category_filter)
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
  ORDER BY 
    p.is_bestseller DESC,
    p.is_trending DESC,
    p.rating DESC NULLS LAST
  LIMIT limit_count;
END;
$$;