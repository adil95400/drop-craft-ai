-- Supprimer la vue SECURITY DEFINER et la recréer avec SECURITY INVOKER
DROP VIEW IF EXISTS public.shopify_products_with_user;

CREATE VIEW public.shopify_products_with_user 
WITH (security_invoker = true) AS
SELECT 
  sp.*,
  i.user_id
FROM public.shopify_products sp
LEFT JOIN public.integrations i ON sp.store_integration_id = i.id;