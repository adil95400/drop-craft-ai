-- Fix the ambiguous column reference in get_secure_catalog_products function
CREATE OR REPLACE FUNCTION public.get_secure_catalog_products(category_filter text DEFAULT NULL::text, search_term text DEFAULT NULL::text, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, external_id text, name text, description text, price numeric, currency text, category text, subcategory text, brand text, sku text, image_url text, image_urls text[], rating numeric, reviews_count integer, availability_status text, delivery_time text, tags text[], is_trending boolean, is_bestseller boolean, supplier_name text, cost_price numeric, profit_margin numeric, supplier_url text, competition_score numeric, sales_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    cp.supplier_name,
    -- Mask sensitive data for non-admin users
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
$function$