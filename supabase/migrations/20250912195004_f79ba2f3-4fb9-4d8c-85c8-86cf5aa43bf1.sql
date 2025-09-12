-- Enable RLS on catalog_products table
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

-- Create basic read policy for authenticated users (public product info only)
CREATE POLICY "Authenticated users can view basic product catalog"
ON public.catalog_products
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Create admin-only policy for sensitive data access
-- Note: This will be handled through secure functions rather than direct table access

-- Create function to get public catalog data (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_public_catalog_products(
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
  is_bestseller boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Log access for security monitoring
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'catalog_access',
    'info',
    'User accessed public catalog products',
    jsonb_build_object(
      'category_filter', category_filter,
      'search_term', search_term,
      'limit_count', limit_count,
      'timestamp', now()
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
    p.is_bestseller
  FROM public.catalog_products p
  WHERE 
    p.availability_status = 'in_stock'
    AND (category_filter IS NULL OR p.category ILIKE category_filter)
    AND (search_term IS NULL OR (
      p.name ILIKE '%' || search_term || '%' OR 
      p.description ILIKE '%' || search_term || '%' OR
      p.brand ILIKE '%' || search_term || '%'
    ))
  ORDER BY 
    p.is_bestseller DESC,
    p.is_trending DESC,
    p.rating DESC NULLS LAST,
    p.name ASC
  LIMIT limit_count;
END;
$$;

-- Create function to get business intelligence data (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_catalog_intelligence(
  category_filter text DEFAULT NULL,
  limit_count integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  cost_price numeric,
  profit_margin numeric,
  supplier_name text,
  supplier_url text,
  competition_score numeric,
  trend_score numeric,
  sales_count integer,
  category text,
  availability_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Check if user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required for business intelligence data';
  END IF;

  -- Log admin access for security monitoring
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'admin_catalog_intelligence_access',
    'critical',
    'Admin accessed sensitive business intelligence data',
    jsonb_build_object(
      'category_filter', category_filter,
      'limit_count', limit_count,
      'timestamp', now()
    )
  );

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.cost_price,
    p.profit_margin,
    p.supplier_name,
    p.supplier_url,
    p.competition_score,
    p.trend_score,
    p.sales_count,
    p.category,
    p.availability_status
  FROM public.catalog_products p
  WHERE 
    (category_filter IS NULL OR p.category ILIKE category_filter)
  ORDER BY 
    p.profit_margin DESC NULLS LAST,
    p.trend_score DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- Update existing get_secure_catalog_products function to use new security model
DROP FUNCTION IF EXISTS public.get_secure_catalog_products(text, text, integer);

CREATE OR REPLACE FUNCTION public.get_secure_catalog_products(
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
  supplier_name text,
  cost_price numeric,
  profit_margin numeric,
  supplier_url text,
  competition_score numeric,
  sales_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  current_user_role text;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  is_admin := (current_user_role = 'admin');

  -- Log access for security monitoring
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'secure_catalog_access',
    CASE WHEN is_admin THEN 'info' ELSE 'info' END,
    CASE 
      WHEN is_admin THEN 'Admin accessed catalog with sensitive data'
      ELSE 'User accessed catalog with public data only'
    END,
    jsonb_build_object(
      'is_admin', is_admin,
      'category_filter', category_filter,
      'search_term', search_term,
      'limit_count', limit_count,
      'timestamp', now()
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
    p.supplier_name,
    -- Mask sensitive data for non-admin users
    CASE WHEN is_admin THEN p.cost_price ELSE NULL END AS cost_price,
    CASE WHEN is_admin THEN p.profit_margin ELSE NULL END AS profit_margin,
    CASE WHEN is_admin THEN p.supplier_url ELSE NULL END AS supplier_url,
    CASE WHEN is_admin THEN p.competition_score ELSE NULL END AS competition_score,
    CASE WHEN is_admin THEN p.sales_count ELSE NULL END AS sales_count
  FROM public.catalog_products p
  WHERE 
    p.availability_status = 'in_stock'
    AND (category_filter IS NULL OR p.category ILIKE category_filter)
    AND (search_term IS NULL OR (
      p.name ILIKE '%' || search_term || '%' OR 
      p.description ILIKE '%' || search_term || '%' OR
      p.brand ILIKE '%' || search_term || '%'
    ))
  ORDER BY 
    p.is_bestseller DESC,
    p.is_trending DESC,
    p.rating DESC NULLS LAST,
    p.name ASC
  LIMIT limit_count;
END;
$$;