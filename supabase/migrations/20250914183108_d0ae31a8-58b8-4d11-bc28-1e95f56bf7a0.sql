-- Migration de sécurité critique : correction des politiques RLS (version corrigée)

-- 1. Corriger les politiques qui permettent l'accès anonyme
DROP POLICY IF EXISTS "Authenticated users only - ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Secure access - ab_test_experiments" ON public.ab_test_experiments
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users only - activity_logs" ON public.activity_logs;
CREATE POLICY "Secure access - activity_logs" ON public.activity_logs
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users only - advanced_reports" ON public.advanced_reports;
CREATE POLICY "Secure access - advanced_reports" ON public.advanced_reports
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2. Sécuriser le cache API
ALTER TABLE IF EXISTS public.api_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only - api_cache" ON public.api_cache;
CREATE POLICY "Service role only - api_cache" ON public.api_cache
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Créer la table des quotas utilisateur si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quota_key TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER NOT NULL DEFAULT -1,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quota_key)
);

-- Activer RLS seulement si la table a été créée
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- 4. Créer la table des limites par plan
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT -1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_type, limit_key)
);

-- Insérer les limites par plan seulement si elles n'existent pas
INSERT INTO public.plan_limits (plan_type, limit_key, limit_value) 
SELECT * FROM (VALUES
  ('standard', 'products', 1000),
  ('standard', 'suppliers', 5),
  ('standard', 'orders', 100),
  ('standard', 'exports', 10),
  ('standard', 'ai_analysis', 5),
  ('pro', 'products', 10000),
  ('pro', 'suppliers', 25),
  ('pro', 'orders', 1000),
  ('pro', 'exports', 50),
  ('pro', 'ai_analysis', 50),
  ('pro', 'automations', 10),
  ('ultra_pro', 'products', -1),
  ('ultra_pro', 'suppliers', -1),
  ('ultra_pro', 'orders', -1), 
  ('ultra_pro', 'exports', -1),
  ('ultra_pro', 'ai_analysis', -1),
  ('ultra_pro', 'automations', -1),
  ('ultra_pro', 'white_label', 1)
) AS v(plan_type, limit_key, limit_value)
ON CONFLICT (plan_type, limit_key) DO NOTHING;

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
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT COALESCE(plan, 'standard') INTO user_plan 
  FROM public.profiles 
  WHERE id = current_user_id;
  
  SELECT limit_value INTO plan_limit 
  FROM public.plan_limits 
  WHERE plan_type = user_plan AND limit_key = quota_key_param;
  
  IF plan_limit IS NULL OR plan_limit = -1 THEN
    RETURN true;
  END IF;
  
  INSERT INTO public.user_quotas (user_id, quota_key, current_count, limit_value)
  VALUES (current_user_id, quota_key_param, 0, plan_limit)
  ON CONFLICT (user_id, quota_key) 
  DO UPDATE SET 
    limit_value = plan_limit,
    updated_at = now()
  RETURNING current_count, reset_date INTO current_usage, quota_reset_date;
  
  IF quota_reset_date < now() THEN
    UPDATE public.user_quotas 
    SET current_count = 0, 
        reset_date = now() + INTERVAL '1 month',
        updated_at = now()
    WHERE user_id = current_user_id AND quota_key = quota_key_param;
    current_usage := 0;
  END IF;
  
  IF current_usage + increment_by <= plan_limit THEN
    UPDATE public.user_quotas 
    SET current_count = current_count + increment_by,
        updated_at = now()
    WHERE user_id = current_user_id AND quota_key = quota_key_param;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;