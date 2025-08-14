-- Remove the view that's causing security warnings
-- We already have the secure get_marketplace_products() function for public access
DROP VIEW IF EXISTS public.safe_marketplace_products;

-- Ensure the get_marketplace_products function is the ONLY way to access catalog data publicly
-- Update the function to ensure it only returns non-sensitive fields
CREATE OR REPLACE FUNCTION public.get_marketplace_products(
  category_filter text DEFAULT NULL,
  search_term text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
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
  -- NOTE: Explicitly EXCLUDES sensitive fields like cost_price, profit_margin, 
  -- supplier_name, supplier_url, sales_count, competition_score, trend_score
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Log the view removal
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'view_removed_security',
    'info',
    'Removed safe_marketplace_products view to eliminate security definer warning - using secure function only',
    '{"view": "safe_marketplace_products", "replacement": "get_marketplace_products_function", "reason": "security_definer_warning", "action": "security_fix"}'::jsonb
);