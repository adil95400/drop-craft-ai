-- Étendre la table suppliers pour supporter les nouveaux fournisseurs Wise2Sync
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supplier_type text DEFAULT 'api';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS connector_type text DEFAULT 'generic';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS setup_complexity text DEFAULT 'medium';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS integration_features jsonb DEFAULT '{"products": true, "inventory": false, "orders": false, "webhooks": false}'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS rate_limits jsonb DEFAULT '{"requestsPerMinute": 60, "requestsPerHour": 1000}'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supported_regions text[] DEFAULT '{"EU"}';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS setup_fee numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS minimum_order_value numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS delivery_time_days integer DEFAULT 3;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS product_count integer DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS sync_frequency text DEFAULT 'daily';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS last_sync_status text DEFAULT 'never';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS success_rate numeric DEFAULT 100.0;

-- Créer un index pour améliorer les performances des suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_type_status ON public.suppliers(supplier_type, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_connector ON public.suppliers(user_id, connector_type);

-- Créer une fonction pour obtenir les statistiques des fournisseurs
CREATE OR REPLACE FUNCTION public.get_supplier_stats(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_suppliers', COUNT(*),
    'connected_suppliers', COUNT(*) FILTER (WHERE status = 'active'),
    'premium_suppliers', COUNT(*) FILTER (WHERE is_premium = true),
    'sync_errors', SUM(error_count),
    'avg_success_rate', AVG(success_rate),
    'total_products', SUM(product_count)
  ) INTO stats
  FROM public.suppliers
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$;