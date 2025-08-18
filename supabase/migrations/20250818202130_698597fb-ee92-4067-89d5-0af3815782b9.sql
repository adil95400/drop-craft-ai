-- Fix catalog_products security issue by creating secure view function
-- This function masks sensitive business data for non-admin users

CREATE OR REPLACE FUNCTION public.get_secure_catalog_products(
  category_filter text DEFAULT NULL::text,
  search_term text DEFAULT NULL::text,
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
  updated_at timestamp with time zone,
  -- Only show supplier name for non-admins, hide other sensitive data
  supplier_name text,
  -- For admins only: these fields will be NULL for regular users
  cost_price numeric,
  profit_margin numeric,
  supplier_url text,
  competition_score numeric,
  sales_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO is_admin;

  -- Log access attempt for security monitoring
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'catalog_products_access',
    'info',
    CASE 
      WHEN is_admin THEN 'Admin accessing catalog products with full data'
      ELSE 'Regular user accessing catalog products with masked data'
    END,
    jsonb_build_object(
      'is_admin', is_admin,
      'category_filter', category_filter,
      'search_term', search_term,
      'limit_count', limit_count
    )
  );

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
    p.updated_at,
    p.supplier_name,
    -- Mask sensitive data for non-admin users
    CASE WHEN is_admin THEN p.cost_price ELSE NULL END AS cost_price,
    CASE WHEN is_admin THEN p.profit_margin ELSE NULL END AS profit_margin,
    CASE WHEN is_admin THEN p.supplier_url ELSE NULL END AS supplier_url,
    CASE WHEN is_admin THEN p.competition_score ELSE NULL END AS competition_score,
    CASE WHEN is_admin THEN p.sales_count ELSE NULL END AS sales_count
  FROM catalog_products p
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

-- Update the existing get_marketplace_products function to use secure access
DROP FUNCTION IF EXISTS public.get_marketplace_products(text, text, integer);

CREATE OR REPLACE FUNCTION public.get_marketplace_products(
  category_filter text DEFAULT NULL::text,
  search_term text DEFAULT NULL::text,
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use the secure function but only return public fields
  RETURN QUERY
  SELECT 
    s.id,
    s.external_id,
    s.name,
    s.description,
    s.price,
    s.currency,
    s.category,
    s.subcategory,
    s.brand,
    s.sku,
    s.image_url,
    s.image_urls,
    s.rating,
    s.reviews_count,
    s.availability_status,
    s.delivery_time,
    s.tags,
    s.is_trending,
    s.is_bestseller,
    s.created_at,
    s.updated_at
  FROM public.get_secure_catalog_products(category_filter, search_term, limit_count) s;
END;
$$;

-- Revoke direct access to catalog_products table for regular users
-- Keep only admin access and secure function access
DROP POLICY IF EXISTS "Authenticated users can view basic product info only" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.catalog_products;

-- Create more restrictive policies
CREATE POLICY "Only service role can modify catalog_products" 
ON public.catalog_products 
FOR ALL
USING (
  -- Only service role can access directly
  (auth.jwt() ->> 'role')::text = 'service_role'
);

-- Grant execute permission on the secure function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_secure_catalog_products(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_products(text, text, integer) TO authenticated;