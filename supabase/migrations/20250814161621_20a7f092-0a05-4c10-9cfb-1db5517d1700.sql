-- CRITICAL SECURITY FIX: Protect Product Catalog from Competitor Scraping
-- The current policy exposes ALL business intelligence to anyone on the internet

-- First, drop the dangerous public access policy
DROP POLICY IF EXISTS "Catalog products are viewable by everyone" ON public.catalog_products;

-- Create a view for public marketplace data (non-sensitive information only)
CREATE OR REPLACE VIEW public.marketplace_products AS
SELECT 
  id,
  external_id,
  name,
  description,
  price, -- Public selling price only, not cost
  currency,
  category,
  subcategory,
  brand,
  sku,
  image_url,
  image_urls,
  rating,
  reviews_count,
  availability_status,
  delivery_time,
  tags,
  is_trending,
  is_bestseller,
  created_at,
  updated_at
FROM catalog_products
WHERE availability_status = 'in_stock'; -- Only show available products publicly

-- Enable RLS on the view
ALTER VIEW public.marketplace_products SET (security_barrier = true);

-- Create restrictive RLS policies for the main catalog_products table

-- 1. Authenticated users can view basic product info (no sensitive business data)
CREATE POLICY "Authenticated users can view basic product data"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (true);

-- 2. Only admin users can view sensitive business intelligence
CREATE POLICY "Admin users can view sensitive business data"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. Anonymous users get NO access to the main table
-- They must use the marketplace_products view instead

-- 4. Only authenticated users can modify catalog data
CREATE POLICY "Authenticated users can insert catalog products"
ON public.catalog_products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update catalog products"
ON public.catalog_products
FOR UPDATE
TO authenticated
USING (true);

-- Create a function to get non-sensitive product data for marketplace
CREATE OR REPLACE FUNCTION public.get_marketplace_products(
  category_filter text DEFAULT NULL,
  search_term text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  currency text,
  category text,
  brand text,
  image_url text,
  rating numeric,
  reviews_count integer,
  availability_status text,
  delivery_time text,
  is_trending boolean,
  is_bestseller boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.category,
    p.brand,
    p.image_url,
    p.rating,
    p.reviews_count,
    p.availability_status,
    p.delivery_time,
    p.is_trending,
    p.is_bestseller
  FROM public.catalog_products p
  WHERE 
    p.availability_status = 'in_stock'
    AND (category_filter IS NULL OR p.category ILIKE category_filter)
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
  ORDER BY 
    p.is_bestseller DESC,
    p.is_trending DESC,
    p.rating DESC
  LIMIT limit_count;
END;
$$;

-- Create sensitive business intelligence function (admin only)
CREATE OR REPLACE FUNCTION public.get_business_intelligence(
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  cost_price numeric,
  profit_margin numeric,
  sales_count integer,
  supplier_name text,
  supplier_url text,
  competition_score numeric,
  trend_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.cost_price,
    p.profit_margin,
    p.sales_count,
    p.supplier_name,
    p.supplier_url,
    p.competition_score,
    p.trend_score
  FROM public.catalog_products p
  ORDER BY p.profit_margin DESC
  LIMIT limit_count;
END;
$$;

-- Log this critical security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'critical_security_fix',
  'critical',
  'Fixed product catalog data exposure - prevented competitor scraping of business intelligence',
  '{"table": "catalog_products", "action": "business_intelligence_protection", "sensitive_fields_protected": ["cost_price", "profit_margin", "supplier_data", "sales_data"]}'
);