-- === CRÉATION DES TABLES MANQUANTES ===

-- Créer la table ingestion_jobs qui était manquante
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('import', 'sync', 'update_prices', 'update_stock')),
  source_type TEXT CHECK (source_type IN ('csv', 'xml', 'json', 'api', 'ftp', 'url', 'email')),
  source_config JSONB DEFAULT '{}',
  mapping_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  results JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS et créer la politique
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingestion_jobs_access_policy" ON public.ingestion_jobs
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Appliquer le trigger de mise à jour
CREATE TRIGGER update_ingestion_jobs_updated_at BEFORE UPDATE ON public.ingestion_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user_id ON public.ingestion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created_at ON public.ingestion_jobs(created_at);

-- === FONCTIONS UTILITAIRES SIMPLIFIÉES ===

-- Fonction pour obtenir les statistiques d'un utilisateur (version simplifiée)
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
      'connected', COALESCE((SELECT COUNT(*) FROM public.suppliers WHERE user_id = user_id_param AND connection_status = 'connected'), 0)
    ),
    'products', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.supplier_products WHERE user_id = user_id_param), 0)
    ),
    'integrations', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.store_integrations WHERE user_id = user_id_param), 0)
    ),
    'jobs', jsonb_build_object(
      'total', COALESCE((SELECT COUNT(*) FROM public.ingestion_jobs WHERE user_id = user_id_param), 0),
      'running', COALESCE((SELECT COUNT(*) FROM public.ingestion_jobs WHERE user_id = user_id_param AND status = 'running'), 0)
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- === CORRECTION DES POLITIQUES EXISTANTES ===

-- Corriger les autres politiques pour inclure l'accès admin
DROP POLICY IF EXISTS "store_integrations_user_access" ON public.store_integrations;
CREATE POLICY "store_integrations_access_policy" ON public.store_integrations
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "order_routing_user_access" ON public.order_routing;
CREATE POLICY "order_routing_access_policy" ON public.order_routing
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sync_history_user_access" ON public.sync_history;
CREATE POLICY "sync_history_access_policy" ON public.sync_history
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- === VUE SIMPLIFIÉE POUR LE DASHBOARD ===

CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.subscription_plan,
  p.feature_flags,
  p.role,
  p.is_admin,
  COALESCE((SELECT COUNT(*) FROM public.suppliers s WHERE s.user_id = p.id), 0) as total_suppliers,
  COALESCE((SELECT COUNT(*) FROM public.suppliers s WHERE s.user_id = p.id AND s.connection_status = 'connected'), 0) as connected_suppliers,
  COALESCE((SELECT COUNT(*) FROM public.supplier_products sp WHERE sp.user_id = p.id), 0) as total_products,
  COALESCE((SELECT COUNT(*) FROM public.store_integrations si WHERE si.user_id = p.id), 0) as total_integrations,
  COALESCE((SELECT COUNT(*) FROM public.ingestion_jobs ij WHERE ij.user_id = p.id AND ij.status = 'running'), 0) as running_jobs
FROM public.profiles p;