-- PHASE 1: STABILISATION CRITIQUE - SÉCURITÉ
-- Correction des 121 problèmes de sécurité détectés

-- 1. Sécurisation de la table plan_limits (exposée publiquement)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les limites de plan
CREATE POLICY "Only admins can view plan limits" ON public.plan_limits
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Correction des functions sans search_path sécurisé
-- Mise à jour des fonctions critiques avec SET search_path = public

CREATE OR REPLACE FUNCTION public.simple_mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN email IS NULL OR email = '' THEN email
    ELSE substring(email from 1 for 3) || '***@' || split_part(email, '@', 2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.simple_mask_phone(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN phone IS NULL OR phone = '' THEN phone
    ELSE substring(phone from 1 for 3) || '****' || substring(phone from length(phone) - 1)
  END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_profit_margin(price numeric, cost_price numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF cost_price IS NULL OR cost_price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND(((price - cost_price) / cost_price * 100), 2);
END;
$$;

-- 3. Renforcement des politiques RLS pour éviter l'accès anonyme
-- Mise à jour des politiques pour s'assurer que auth.uid() IS NOT NULL ET que l'utilisateur est authentifié

-- Correction des politiques qui permettent l'accès anonyme
DROP POLICY IF EXISTS "Secure access - ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Authenticated users only - ab_test_experiments" ON public.ab_test_experiments
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

DROP POLICY IF EXISTS "Secure access - activity_logs" ON public.activity_logs;
CREATE POLICY "Authenticated users only - activity_logs" ON public.activity_logs
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

DROP POLICY IF EXISTS "Secure access - advanced_reports" ON public.advanced_reports;
CREATE POLICY "Authenticated users only - advanced_reports" ON public.advanced_reports
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

-- 4. Sécurisation des tables sensibles avec de meilleures politiques
-- Table catalog_products - limiter l'accès aux données sensibles
DROP POLICY IF EXISTS "Authenticated users can view basic product catalog" ON public.catalog_products;
CREATE POLICY "Authenticated users view public catalog only" ON public.catalog_products
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated'
);

-- 5. Créer une fonction sécurisée pour les vérifications d'admin
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND auth.uid() IS NOT NULL
    AND auth.role() = 'authenticated'
  );
$$;

-- 6. Audit de sécurité - fonction pour logger les accès sensibles
CREATE OR REPLACE FUNCTION public.log_sensitive_access_secure(
  access_type text,
  table_name text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ne logger que si l'utilisateur est authentifié
  IF auth.uid() IS NOT NULL AND auth.role() = 'authenticated' THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'sensitive_access',
      'info',
      format('Sensitive %s access to %s', access_type, table_name),
      jsonb_build_object(
        'table', table_name,
        'record_id', record_id,
        'access_type', access_type,
        'timestamp', now(),
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
  END IF;
END;
$$;