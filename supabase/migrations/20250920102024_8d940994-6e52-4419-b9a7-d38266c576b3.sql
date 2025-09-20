-- Fix catalog_products security vulnerability
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users view public catalog only" ON public.catalog_products;

-- Create more granular policies for catalog_products
-- Policy 1: Regular users can only see non-sensitive product info
CREATE POLICY "Users can view basic catalog info"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (
  -- This policy is enforced by the secure function, not directly here
  -- We'll use a function-based approach for better control
  false
);

-- Policy 2: Admins can see full business intelligence
CREATE POLICY "Admins can view full catalog data"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create a new secure function that properly masks sensitive data
CREATE OR REPLACE FUNCTION public.get_catalog_products_secure(
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
  updated_at timestamp with time zone,
  -- Sensitive fields - only for admins
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
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'catalog_access',
    CASE WHEN is_admin THEN 'info' ELSE 'info' END,
    CASE 
      WHEN is_admin THEN 'Admin accessed catalog with full business data'
      ELSE 'User accessed catalog with basic data only'
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
    cp.id,
    cp.external_id,
    cp.name,
    cp.description,
    cp.price,
    cp.currency,
    cp.category,
    cp.subcategory,
    cp.brand,
    cp.sku,
    cp.image_url,
    cp.image_urls,
    cp.rating,
    cp.reviews_count,
    cp.availability_status,
    cp.delivery_time,
    cp.tags,
    cp.is_trending,
    cp.is_bestseller,
    cp.created_at,
    cp.updated_at,
    -- Mask sensitive data for non-admin users
    CASE WHEN is_admin THEN cp.supplier_name ELSE NULL END AS supplier_name,
    CASE WHEN is_admin THEN cp.cost_price ELSE NULL END AS cost_price,
    CASE WHEN is_admin THEN cp.profit_margin ELSE NULL END AS profit_margin,
    CASE WHEN is_admin THEN cp.supplier_url ELSE NULL END AS supplier_url,
    CASE WHEN is_admin THEN cp.competition_score ELSE NULL END AS competition_score,
    CASE WHEN is_admin THEN cp.sales_count ELSE NULL END AS sales_count
  FROM public.catalog_products cp
  WHERE 
    cp.availability_status = 'in_stock'
    AND (category_filter IS NULL OR cp.category ILIKE category_filter)
    AND (search_term IS NULL OR (
      cp.name ILIKE '%' || search_term || '%' OR 
      cp.description ILIKE '%' || search_term || '%' OR
      cp.brand ILIKE '%' || search_term || '%'
    ))
  ORDER BY 
    cp.is_bestseller DESC,
    cp.is_trending DESC,
    cp.rating DESC NULLS LAST,
    cp.name ASC
  LIMIT limit_count;
END;
$$;

-- Update the policy to use the new function approach
DROP POLICY IF EXISTS "Users can view basic catalog info" ON public.catalog_products;

-- Create a policy that blocks direct table access, forcing use of the secure function
CREATE POLICY "Block direct catalog access"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (false);

-- Add a comment to document the security approach
COMMENT ON TABLE public.catalog_products IS 'Access to this table is restricted. Use get_catalog_products_secure() function for proper data masking based on user role.';

-- Log the security fix
INSERT INTO public.security_events (
  user_id,
  event_type,
  severity,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'security_fix_applied',
  'critical',
  'Fixed catalog_products security vulnerability - implemented role-based data masking',
  jsonb_build_object(
    'table', 'catalog_products',
    'fix_type', 'role_based_access_control',
    'timestamp', now()
  )
);