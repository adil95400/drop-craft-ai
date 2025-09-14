-- Migration de sécurité critique : correction des politiques RLS et fonctions

-- 1. Sécuriser toutes les politiques RLS pour éviter l'accès anonyme
-- Corrections des politiques qui permettent l'accès anonyme

-- Corriger les politiques pour n'autoriser que les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users only - ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Secure access - ab_test_experiments" ON public.ab_test_experiments
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users only - activity_logs" ON public.activity_logs;
CREATE POLICY "Secure access - activity_logs" ON public.activity_logs
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users only - advanced_reports" ON public.advanced_reports;
CREATE POLICY "Secure access - advanced_reports" ON public.advanced_reports
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Corriger la politique du catalogue pour être plus restrictive
DROP POLICY IF EXISTS "Authenticated users can view basic product catalog" ON public.catalog_products;
CREATE POLICY "Authenticated catalog access" ON public.catalog_products
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. Ajouter des politiques RLS manquantes pour les tables sans politiques
ALTER TABLE IF EXISTS public.api_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - api_cache" ON public.api_cache
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Créer la table des quotas utilisateur pour le système commercial
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quota_key TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER NOT NULL DEFAULT -1, -- -1 = illimité
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quota_key)
);

ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quotas" ON public.user_quotas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage quotas" ON public.user_quotas
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Créer la table des limites par plan
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT -1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_type, limit_key)
);

-- Insérer les limites par plan
INSERT INTO public.plan_limits (plan_type, limit_key, limit_value) VALUES
-- Plan Standard
('standard', 'products', 1000),
('standard', 'suppliers', 5),
('standard', 'orders', 100),
('standard', 'exports', 10),
('standard', 'ai_analysis', 5),

-- Plan Pro  
('pro', 'products', 10000),
('pro', 'suppliers', 25),
('pro', 'orders', 1000),
('pro', 'exports', 50),
('pro', 'ai_analysis', 50),
('pro', 'automations', 10),

-- Plan Ultra Pro
('ultra_pro', 'products', -1), -- illimité
('ultra_pro', 'suppliers', -1),
('ultra_pro', 'orders', -1), 
('ultra_pro', 'exports', -1),
('ultra_pro', 'ai_analysis', -1),
('ultra_pro', 'automations', -1),
('ultra_pro', 'white_label', 1);

-- 5. Fonction sécurisée pour vérifier les quotas
CREATE OR REPLACE FUNCTION public.check_user_quota(
  quota_key_param TEXT,
  increment_by INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_plan TEXT;
  current_usage INTEGER := 0;
  plan_limit INTEGER := 0;
  quota_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Vérifier l'authentification
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Récupérer le plan utilisateur
  SELECT COALESCE(plan, 'standard') INTO user_plan 
  FROM public.profiles 
  WHERE id = current_user_id;
  
  -- Récupérer la limite pour ce plan
  SELECT limit_value INTO plan_limit 
  FROM public.plan_limits 
  WHERE plan_type = user_plan AND limit_key = quota_key_param;
  
  -- Si pas de limite définie ou illimitée, autoriser
  IF plan_limit IS NULL OR plan_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Récupérer ou créer l'entrée de quota utilisateur
  INSERT INTO public.user_quotas (user_id, quota_key, current_count, limit_value)
  VALUES (current_user_id, quota_key_param, 0, plan_limit)
  ON CONFLICT (user_id, quota_key) 
  DO UPDATE SET 
    limit_value = plan_limit,
    updated_at = now()
  RETURNING current_count, reset_date INTO current_usage, quota_reset_date;
  
  -- Vérifier si le quota a expiré et le réinitialiser
  IF quota_reset_date < now() THEN
    UPDATE public.user_quotas 
    SET current_count = 0, 
        reset_date = now() + INTERVAL '1 month',
        updated_at = now()
    WHERE user_id = current_user_id AND quota_key = quota_key_param;
    current_usage := 0;
  END IF;
  
  -- Vérifier si l'utilisateur peut procéder
  IF current_usage + increment_by <= plan_limit THEN
    -- Incrémenter le compteur
    UPDATE public.user_quotas 
    SET current_count = current_count + increment_by,
        updated_at = now()
    WHERE user_id = current_user_id AND quota_key = quota_key_param;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 6. Trigger pour mettre à jour les timestamps
CREATE OR REPLACE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON public.user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Fonction pour obtenir le statut des quotas utilisateur
CREATE OR REPLACE FUNCTION public.get_user_quota_status()
RETURNS TABLE (
  quota_key TEXT,
  current_count INTEGER,
  limit_value INTEGER,
  percentage_used NUMERIC,
  reset_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_plan TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT COALESCE(plan, 'standard') INTO user_plan 
  FROM public.profiles 
  WHERE id = current_user_id;
  
  RETURN QUERY
  SELECT 
    pl.limit_key,
    COALESCE(uq.current_count, 0),
    pl.limit_value,
    CASE 
      WHEN pl.limit_value = -1 THEN 0
      ELSE ROUND((COALESCE(uq.current_count, 0) * 100.0) / NULLIF(pl.limit_value, 0), 2)
    END,
    COALESCE(uq.reset_date, now() + INTERVAL '1 month')
  FROM public.plan_limits pl
  LEFT JOIN public.user_quotas uq ON (
    uq.user_id = current_user_id 
    AND uq.quota_key = pl.limit_key
  )
  WHERE pl.plan_type = user_plan
  ORDER BY pl.limit_key;
END;
$$;