-- Fix SECURITY DEFINER view issue by ensuring views use SECURITY INVOKER
-- This prevents views from bypassing RLS policies

-- Drop and recreate pricing_analytics view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.pricing_analytics;
CREATE VIEW public.pricing_analytics 
WITH (security_invoker = true)
AS
SELECT 
  p.id AS user_id,
  count(DISTINCT pr.id) AS total_rules,
  count(DISTINCT pc.product_id) AS products_tracked,
  count(DISTINCT cp.competitor_name) AS competitors_tracked,
  avg(pc.gross_margin_percent) AS avg_margin,
  sum(pc.net_profit) AS total_profit
FROM profiles p
LEFT JOIN pricing_rules pr ON pr.user_id = p.id
LEFT JOIN profit_calculations pc ON pc.user_id = p.id
LEFT JOIN competitor_prices cp ON cp.user_id = p.id
GROUP BY p.id;

-- Drop and recreate shopify_import_stats view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.shopify_import_stats;
CREATE VIEW public.shopify_import_stats
WITH (security_invoker = true)
AS
SELECT 
  count(*) AS total_products,
  count(*) FILTER (WHERE status = 'active') AS active_products,
  count(*) FILTER (WHERE status = 'draft') AS draft_products,
  max(updated_at) AS last_import,
  count(*) FILTER (WHERE updated_at > now() - interval '24 hours') AS imported_today
FROM imported_products
WHERE supplier_name = 'Shopify';

-- Add comment documenting the security configuration
COMMENT ON VIEW public.pricing_analytics IS 'Analytics view with SECURITY INVOKER - respects RLS policies of querying user';
COMMENT ON VIEW public.shopify_import_stats IS 'Import statistics view with SECURITY INVOKER - respects RLS policies of querying user';