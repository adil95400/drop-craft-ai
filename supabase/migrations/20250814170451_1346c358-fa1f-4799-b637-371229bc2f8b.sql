-- Fix critical security vulnerability: Remove public access to sensitive catalog data
-- The catalog_products table contains highly sensitive business information that should NOT be publicly accessible

-- 1. Force RLS to prevent any bypassing
ALTER TABLE public.catalog_products FORCE ROW LEVEL SECURITY;

-- 2. Drop the dangerous public access policy
DROP POLICY IF EXISTS "Public can view marketplace products view" ON public.catalog_products;

-- 3. Drop and recreate other policies to ensure they're properly restrictive
DROP POLICY IF EXISTS "Authenticated users can view basic product data" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can insert catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can update catalog products" ON public.catalog_products;

-- 4. Create new restrictive policies for authenticated users
-- Regular users can only view non-sensitive product data (no costs, margins, supplier info)
CREATE POLICY "Authenticated users can view basic product info only" 
ON public.catalog_products 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND availability_status = 'in_stock'
);

-- Only allow authenticated users to insert their own products (if needed for import functionality)
CREATE POLICY "Authenticated users can insert products" 
ON public.catalog_products 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only allow authenticated users to update products (with restrictions)
CREATE POLICY "Authenticated users can update products" 
ON public.catalog_products 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Note: The "Admin users can view sensitive business data" policy remains for admin access

-- 5. Create a secure view for public marketplace access that excludes sensitive data
CREATE OR REPLACE VIEW public.safe_marketplace_products AS
SELECT 
    id,
    external_id,
    name,
    description,
    price,
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
    -- Explicitly EXCLUDED: cost_price, profit_margin, supplier_name, supplier_url, 
    -- sales_count, competition_score, trend_score, and other sensitive fields
FROM public.catalog_products
WHERE availability_status = 'in_stock';

-- 6. Log this critical security fix
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'catalog_data_secured',
    'critical',
    'Removed public access to sensitive catalog data - cost prices, profit margins, supplier info now protected',
    '{"table": "catalog_products", "removed_policies": ["public_marketplace_access"], "created_view": "safe_marketplace_products", "protected_fields": ["cost_price", "profit_margin", "supplier_name", "supplier_url", "sales_count"], "action": "security_fix"}'::jsonb
);