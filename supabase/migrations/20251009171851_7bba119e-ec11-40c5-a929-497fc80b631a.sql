-- ============================================
-- PHASE 4: CORRIGER LES ERREURS CRITIQUES DE SÉCURITÉ
-- ============================================

-- ============================================
-- 1. CORRIGER LA VUE pricing_analytics QUI EXPOSE auth.users
-- ============================================

-- Supprimer la vue existante qui expose auth.users
DROP VIEW IF EXISTS public.pricing_analytics CASCADE;

-- Recréer la vue en utilisant profiles au lieu de auth.users
CREATE VIEW public.pricing_analytics
WITH (security_invoker = true)
AS
SELECT 
  p.id AS user_id,
  COUNT(DISTINCT pr.id) AS total_rules,
  COUNT(DISTINCT pc.product_id) AS products_tracked,
  COUNT(DISTINCT cp.competitor_name) AS competitors_tracked,
  AVG(pc.gross_margin_percent) AS avg_margin,
  SUM(pc.net_profit) AS total_profit
FROM public.profiles p
LEFT JOIN public.pricing_rules pr ON pr.user_id = p.id
LEFT JOIN public.profit_calculations pc ON pc.user_id = p.id
LEFT JOIN public.competitor_prices cp ON cp.user_id = p.id
GROUP BY p.id;

COMMENT ON VIEW public.pricing_analytics IS 'Vue analytique des prix - utilise profiles au lieu de auth.users pour la sécurité';

-- Ajouter RLS sur la vue
ALTER VIEW public.pricing_analytics SET (security_invoker = true);

-- ============================================
-- 2. CORRIGER LES FONCTIONS SANS search_path SÉCURISÉ
-- ============================================

-- Fonction 1: create_imported_reviews_table_if_not_exists
CREATE OR REPLACE FUNCTION public.create_imported_reviews_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cette fonction existe pour permettre à l'edge function de vérifier l'existence de la table
  -- La table est déjà créée, donc c'est juste un placeholder
  NULL;
END;
$$;

-- Fonction 2: generate_tenant_slug
CREATE OR REPLACE FUNCTION public.generate_tenant_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Assurer l'unicité
    WHILE EXISTS (
      SELECT 1 FROM public.tenants 
      WHERE slug = NEW.slug 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      NEW.slug := NEW.slug || '-' || FLOOR(random() * 1000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Fonction 3: get_marketplace_analytics
CREATE OR REPLACE FUNCTION public.get_marketplace_analytics(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_connections', COALESCE((
      SELECT COUNT(*) FROM public.marketplace_connections 
      WHERE user_id = user_id_param
    ), 0),
    'active_syncs', COALESCE((
      SELECT COUNT(*) FROM public.marketplace_connections 
      WHERE user_id = user_id_param AND status = 'connected'
    ), 0),
    'products_synced', COALESCE((
      SELECT SUM((sync_stats->>'products_synced')::int) 
      FROM public.marketplace_connections
      WHERE user_id = user_id_param AND sync_stats IS NOT NULL
    ), 0),
    'revenue_by_platform', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'platform', platform,
          'revenue', FLOOR(random() * 10000) + 1000
        )
      )
      FROM public.marketplace_connections 
      WHERE user_id = user_id_param AND status = 'connected'
    ), '[]'::jsonb),
    'sync_performance', jsonb_build_object(
      'success_rate', 98.5,
      'avg_sync_time', '2.3 minutes',
      'last_sync', (
        SELECT MAX(last_sync_at) 
        FROM public.marketplace_connections 
        WHERE user_id = user_id_param
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================
-- 3. VÉRIFICATION FINALE
-- ============================================

-- Créer une fonction pour vérifier la sécurité des fonctions
CREATE OR REPLACE FUNCTION public.check_security_definer_functions()
RETURNS TABLE(
  function_name text,
  has_search_path boolean,
  is_secure boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.proname::text AS function_name,
    EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS cfg 
      WHERE cfg LIKE 'search_path=%'
    ) AS has_search_path,
    (p.prosecdef AND EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS cfg 
      WHERE cfg LIKE 'search_path=%'
    )) AS is_secure
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
  ORDER BY p.proname;
$$;

COMMENT ON FUNCTION public.check_security_definer_functions() IS 'Vérifie que toutes les fonctions SECURITY DEFINER ont search_path défini';