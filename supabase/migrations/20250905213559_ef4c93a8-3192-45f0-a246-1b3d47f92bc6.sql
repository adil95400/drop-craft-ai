-- === CORRECTION ET SUITE DE LA REFONTE ===

-- Nettoyer les politiques existantes conflictuelles
DROP POLICY IF EXISTS "Users can manage their own supplier feeds" ON public.supplier_feeds;
DROP POLICY IF EXISTS "Users can manage their own supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Users can manage their own ingestion jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Users can manage their own store integrations" ON public.store_integrations;
DROP POLICY IF EXISTS "Users can manage their own order routing" ON public.order_routing;

-- Recréer les politiques avec des noms uniques
CREATE POLICY "supplier_feeds_user_access" ON public.supplier_feeds
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "supplier_products_user_access" ON public.supplier_products
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ingestion_jobs_user_access" ON public.ingestion_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "store_integrations_user_access" ON public.store_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "order_routing_user_access" ON public.order_routing
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sync_history_user_access" ON public.sync_history
  FOR ALL USING (auth.uid() = user_id);

-- === FONCTIONS UTILITAIRES POUR LE SYSTÈME UNIFIÉ ===

-- Fonction pour vérifier les feature flags
CREATE OR REPLACE FUNCTION public.has_feature_flag(user_id_param UUID, flag_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_flags JSONB;
  user_plan TEXT;
BEGIN
  -- Récupérer les feature flags et le plan de l'utilisateur
  SELECT feature_flags, subscription_plan 
  INTO user_flags, user_plan
  FROM public.profiles 
  WHERE id = user_id_param;
  
  -- Si pas de flags définis, utiliser les defaults selon le plan
  IF user_flags IS NULL THEN
    user_flags := CASE user_plan
      WHEN 'ultra' THEN '{"ai_import": true, "bulk_import": true, "advanced_analytics": true, "marketing_automation": true, "premium_integrations": true, "enterprise_features": true}'::jsonb
      WHEN 'pro' THEN '{"ai_import": false, "bulk_import": true, "advanced_analytics": true, "marketing_automation": false, "premium_integrations": false, "enterprise_features": false}'::jsonb
      ELSE '{"ai_import": false, "bulk_import": true, "advanced_analytics": false, "marketing_automation": false, "premium_integrations": false, "enterprise_features": false}'::jsonb
    END;
  END IF;
  
  RETURN COALESCE((user_flags ->> flag_name)::boolean, false);
END;
$$;

-- Fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_stats(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'suppliers', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.suppliers WHERE user_id = user_id_param), 0),
      'connected', COALESCE((SELECT COUNT(*) FROM public.suppliers WHERE user_id = user_id_param AND connection_status = 'connected'), 0),
      'active', COALESCE((SELECT COUNT(*) FROM public.suppliers WHERE user_id = user_id_param AND is_active = true), 0)
    ),
    'products', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.supplier_products WHERE user_id = user_id_param), 0),
      'available', COALESCE((SELECT COUNT(*) FROM public.supplier_products WHERE user_id = user_id_param AND is_available = true), 0)
    ),
    'integrations', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.store_integrations WHERE user_id = user_id_param), 0),
      'active', COALESCE((SELECT COUNT(*) FROM public.store_integrations WHERE user_id = user_id_param AND is_active = true), 0)
    ),
    'orders', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.order_routing WHERE user_id = user_id_param), 0),
      'pending', COALESCE((SELECT COUNT(*) FROM public.order_routing WHERE user_id = user_id_param AND status = 'pending'), 0)
    ),
    'jobs', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.ingestion_jobs WHERE user_id = user_id_param), 0),
      'running', COALESCE((SELECT COUNT(*) FROM public.ingestion_jobs WHERE user_id = user_id_param AND status = 'running'), 0),
      'completed', COALESCE((SELECT COUNT(*) FROM public.ingestion_jobs WHERE user_id = user_id_param AND status = 'completed'), 0)
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- === TABLES POUR LA GESTION DES RÔLES ET PERMISSIONS ===

-- Table pour les permissions détaillées
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'admin', 'super_admin')),
  resource TEXT NOT NULL, -- 'suppliers', 'products', 'integrations', etc.
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, permission_type, resource)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_permissions_access" ON public.user_permissions
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = granted_by);

-- === POLITIQUES RLS AVANCÉES POUR ADMIN/USER ===

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id_param 
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$;

-- Mettre à jour les politiques pour inclure l'accès admin
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
CREATE POLICY "suppliers_access_policy" ON public.suppliers
  FOR ALL USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );

-- Appliquer la même logique aux autres tables
DROP POLICY IF EXISTS "supplier_feeds_user_access" ON public.supplier_feeds;
CREATE POLICY "supplier_feeds_access_policy" ON public.supplier_feeds
  FOR ALL USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "supplier_products_user_access" ON public.supplier_products;
CREATE POLICY "supplier_products_access_policy" ON public.supplier_products
  FOR ALL USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );

-- === DONNÉES D'EXEMPLE POUR LE DÉVELOPPEMENT ===

-- Insérer quelques fournisseurs d'exemple pour la démonstration
INSERT INTO public.suppliers (
  user_id, name, display_name, description, website, country, sector, 
  supplier_type, connection_status, product_count, rating, is_premium
) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'cdiscount_pro', 'Cdiscount Pro', 'Marketplace française leader', 
  'https://www.cdiscount.com', 'France', 'Marketplace',
  'marketplace', 'disconnected', 0, 4.2, true
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'syncee', 'Syncee', 'Plateforme de dropshipping européenne',
  'https://syncee.com', 'Hongrie', 'Dropshipping',
  'dropshipping', 'disconnected', 0, 4.5, true
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'eprolo', 'Eprolo', 'Dropshipping depuis la Chine',
  'https://www.eprolo.com', 'Chine', 'Dropshipping',
  'dropshipping', 'disconnected', 0, 4.1, false
)
ON CONFLICT DO NOTHING;

-- === VUES POUR FACILITER LES REQUÊTES ===

-- Vue pour les statistiques des fournisseurs
CREATE OR REPLACE VIEW public.supplier_stats AS
SELECT 
  s.user_id,
  COUNT(*) as total_suppliers,
  COUNT(*) FILTER (WHERE s.connection_status = 'connected') as connected_suppliers,
  COUNT(*) FILTER (WHERE s.is_active = true) as active_suppliers,
  COUNT(*) FILTER (WHERE s.is_premium = true) as premium_suppliers,
  AVG(s.rating) as average_rating,
  SUM(s.product_count) as total_products
FROM public.suppliers s
GROUP BY s.user_id;

-- Vue pour le dashboard utilisateur
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.subscription_plan,
  p.feature_flags,
  COALESCE(ss.total_suppliers, 0) as total_suppliers,
  COALESCE(ss.connected_suppliers, 0) as connected_suppliers,
  COALESCE(ss.total_products, 0) as total_products,
  (SELECT COUNT(*) FROM public.store_integrations si WHERE si.user_id = p.id) as total_integrations,
  (SELECT COUNT(*) FROM public.ingestion_jobs ij WHERE ij.user_id = p.id AND ij.status = 'running') as running_jobs
FROM public.profiles p
LEFT JOIN public.supplier_stats ss ON ss.user_id = p.id;