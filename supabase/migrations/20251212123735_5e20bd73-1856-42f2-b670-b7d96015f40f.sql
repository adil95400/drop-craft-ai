
-- =====================================================
-- SECURITY FIX: Convert views to SECURITY INVOKER
-- =====================================================

-- 1. Drop and recreate fulfillment_dashboard
DROP VIEW IF EXISTS public.fulfillment_dashboard;
CREATE VIEW public.fulfillment_dashboard 
WITH (security_invoker = on)
AS
SELECT user_id,
    count(*) AS total_shipments,
    count(CASE WHEN status = 'delivered'::text THEN 1 ELSE NULL::integer END) AS delivered_shipments,
    count(CASE WHEN status = 'in_transit'::text THEN 1 ELSE NULL::integer END) AS in_transit_shipments,
    count(CASE WHEN status = 'failed'::text THEN 1 ELSE NULL::integer END) AS failed_shipments,
    avg(CASE 
        WHEN delivered_at IS NOT NULL AND shipped_at IS NOT NULL 
        THEN EXTRACT(epoch FROM delivered_at - shipped_at) / 86400::numeric
        ELSE NULL::numeric
    END) AS avg_delivery_days,
    sum(shipping_cost) AS total_shipping_cost
FROM public.fulfillment_shipments
WHERE created_at > (now() - '30 days'::interval)
GROUP BY user_id;

-- 2. Drop and recreate repricing_dashboard
DROP VIEW IF EXISTS public.repricing_dashboard;
CREATE VIEW public.repricing_dashboard 
WITH (security_invoker = on)
AS
SELECT r.user_id,
    count(DISTINCT r.id) AS active_rules_count,
    count(DISTINCT CASE WHEN r.last_executed_at > (now() - '24:00:00'::interval) THEN r.id ELSE NULL::uuid END) AS rules_executed_today,
    count(e.id) AS total_executions_24h,
    sum(CASE WHEN e.status = 'success'::text THEN 1 ELSE 0 END) AS successful_executions_24h,
    avg(e.price_change_percent) AS avg_price_change_percent,
    sum(abs(e.price_change)) AS total_price_adjustments
FROM public.repricing_rules r
LEFT JOIN public.repricing_executions e ON e.rule_id = r.id AND e.executed_at > (now() - '24:00:00'::interval)
WHERE r.is_active = true
GROUP BY r.user_id;

-- 3. Drop and recreate shopify_import_stats
DROP VIEW IF EXISTS public.shopify_import_stats;
CREATE VIEW public.shopify_import_stats 
WITH (security_invoker = on)
AS
SELECT count(*) AS total_products,
    count(*) FILTER (WHERE status::text = 'active'::text) AS active_products,
    count(*) FILTER (WHERE status::text = 'draft'::text) AS draft_products,
    max(updated_at) AS last_import,
    count(*) FILTER (WHERE updated_at > (now() - '24:00:00'::interval)) AS imported_today
FROM public.imported_products
WHERE supplier_name::text = 'Shopify'::text;

-- 4. Drop and recreate shopify_products_with_user
DROP VIEW IF EXISTS public.shopify_products_with_user;
CREATE VIEW public.shopify_products_with_user 
WITH (security_invoker = on)
AS
SELECT sp.id,
    sp.store_integration_id,
    sp.shopify_product_id,
    sp.title,
    sp.description,
    sp.vendor,
    sp.product_type,
    sp.handle,
    sp.status,
    sp.price,
    sp.compare_at_price,
    sp.sku,
    sp.inventory_quantity,
    sp.image_url,
    sp.images,
    sp.variants,
    sp.options,
    sp.tags,
    sp.seo_title,
    sp.seo_description,
    sp.created_at_shopify,
    sp.updated_at_shopify,
    sp.created_at,
    sp.updated_at,
    si.user_id
FROM public.shopify_products sp
LEFT JOIN public.store_integrations si ON sp.store_integration_id = si.id;

-- 5. Drop and recreate supplier_catalog_enriched
DROP VIEW IF EXISTS public.supplier_catalog_enriched;
CREATE VIEW public.supplier_catalog_enriched 
WITH (security_invoker = on)
AS
SELECT sp.id,
    sp.user_id,
    sp.supplier_id,
    sp.supplier_name,
    sp.title,
    sp.description,
    sp.cost_price,
    sp.retail_price,
    sp.suggested_price,
    sp.stock_quantity,
    sp.stock_status,
    sp.images,
    sp.category,
    sp.ai_score,
    sp.profit_margin,
    sp.view_count,
    sp.conversion_rate,
    s.status AS supplier_status,
    s.rating AS supplier_rating,
    (SELECT count(*) FROM public.product_supplier_mapping psm WHERE psm.product_id = sp.id) AS alternative_suppliers_count,
    sp.last_synced_at,
    sp.sync_status,
    sp.created_at,
    sp.updated_at
FROM public.supplier_products_unified sp
LEFT JOIN public.suppliers s ON s.id = sp.supplier_id
WHERE sp.is_active = true;

-- 6. Drop and recreate unified_products_view
DROP VIEW IF EXISTS public.unified_products_view;
CREATE VIEW public.unified_products_view 
WITH (security_invoker = on)
AS
SELECT p.id,
    p.user_id,
    p.name,
    p.description,
    p.price,
    p.cost_price,
    p.sku,
    p.category,
    p.status,
    p.stock_quantity,
    p.image_url,
    p.ai_score,
    p.trend_score,
    p.competition_score,
    p.profit_potential,
    p.is_winner,
    p.is_trending,
    p.is_bestseller,
    p.supplier_ids,
    p.best_supplier_id,
    p.view_count,
    p.conversion_rate,
    p.profit_margin,
    p.created_at,
    p.updated_at,
    'products'::text AS source,
    COALESCE(sp.min_price, p.cost_price) AS best_supplier_price,
    COALESCE(sp.supplier_count, 0::bigint) AS supplier_count,
    CASE
        WHEN p.price > 0::numeric AND p.cost_price > 0::numeric THEN (p.price - p.cost_price) / p.price * 100::numeric
        ELSE 0::numeric
    END AS calculated_margin
FROM public.products p
LEFT JOIN ( 
    SELECT psm.product_id,
        min(sp_1.price) AS min_price,
        count(DISTINCT psm.primary_supplier_id) AS supplier_count
    FROM public.product_supplier_mapping psm
    JOIN public.supplier_products sp_1 ON psm.primary_supplier_id = sp_1.supplier_id
    GROUP BY psm.product_id
) sp ON p.id = sp.product_id
WHERE p.status = 'active'::text
UNION ALL
SELECT ip.id,
    ip.user_id,
    ip.name,
    ip.description,
    ip.price,
    ip.cost_price,
    ip.sku,
    ip.category,
    ip.status::text,
    COALESCE(ip.stock_quantity, 0) AS stock_quantity,
    COALESCE(ip.image_urls[1], ''::text) AS image_url,
    ip.ai_score,
    ip.trend_score,
    ip.competition_score,
    ip.profit_potential,
    ip.is_winner,
    ip.is_trending,
    ip.is_bestseller,
    ip.supplier_ids,
    ip.best_supplier_id,
    ip.view_count,
    ip.conversion_rate,
    CASE
        WHEN ip.price > 0::numeric AND ip.cost_price > 0::numeric THEN (ip.price - ip.cost_price) / ip.price * 100::numeric
        ELSE 0::numeric
    END AS profit_margin,
    ip.created_at,
    ip.updated_at,
    'imported_products'::text AS source,
    ip.cost_price AS best_supplier_price,
    0::bigint AS supplier_count,
    CASE
        WHEN ip.price > 0::numeric AND ip.cost_price > 0::numeric THEN (ip.price - ip.cost_price) / ip.price * 100::numeric
        ELSE 0::numeric
    END AS calculated_margin
FROM public.imported_products ip
WHERE ip.status::text = ANY (ARRAY['active'::text, 'published'::text]);

-- Grant permissions on views
GRANT SELECT ON public.unified_products_view TO authenticated;
GRANT SELECT ON public.shopify_import_stats TO authenticated;
GRANT SELECT ON public.supplier_catalog_enriched TO authenticated;
GRANT SELECT ON public.repricing_dashboard TO authenticated;
GRANT SELECT ON public.fulfillment_dashboard TO authenticated;
GRANT SELECT ON public.shopify_products_with_user TO authenticated;
