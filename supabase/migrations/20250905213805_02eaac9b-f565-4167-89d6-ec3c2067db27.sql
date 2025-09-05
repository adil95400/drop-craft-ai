-- === CRÉATION DES FONCTIONS DE BASE ===

-- Créer la fonction is_admin d'abord
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

-- Maintenant créer les politiques qui utilisent cette fonction
DROP POLICY IF EXISTS "ingestion_jobs_access_policy" ON public.ingestion_jobs;
CREATE POLICY "ingestion_jobs_access_policy" ON public.ingestion_jobs
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- === SYSTÈME DE FEATURE FLAGS ===

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
  IF user_flags IS NULL OR user_flags = '{}' THEN
    user_flags := CASE user_plan
      WHEN 'ultra' THEN '{"ai_import": true, "bulk_import": true, "advanced_analytics": true, "marketing_automation": true, "premium_integrations": true, "enterprise_features": true}'::jsonb
      WHEN 'pro' THEN '{"ai_import": false, "bulk_import": true, "advanced_analytics": true, "marketing_automation": false, "premium_integrations": false, "enterprise_features": false}'::jsonb
      ELSE '{"ai_import": false, "bulk_import": true, "advanced_analytics": false, "marketing_automation": false, "premium_integrations": false, "enterprise_features": false}'::jsonb
    END;
  END IF;
  
  RETURN COALESCE((user_flags ->> flag_name)::boolean, false);
END;
$$;

-- === HOOKS/SERVICES POUR L'APPLICATION ===

-- Fonction sécurisée pour obtenir les fournisseurs
CREATE OR REPLACE FUNCTION public.get_secure_suppliers()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  name TEXT,
  display_name TEXT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country TEXT,
  sector TEXT,
  supplier_type TEXT,
  connection_status TEXT,
  product_count INTEGER,
  rating NUMERIC,
  is_active BOOLEAN,
  is_premium BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.name,
    s.display_name,
    s.description,
    s.website,
    s.logo_url,
    s.country,
    s.sector,
    s.supplier_type,
    s.connection_status,
    s.product_count,
    s.rating,
    s.is_active,
    s.is_premium,
    s.created_at
  FROM suppliers s
  WHERE auth.uid() = s.user_id 
    AND auth.uid() IS NOT NULL
    AND s.is_active = true;
$$;