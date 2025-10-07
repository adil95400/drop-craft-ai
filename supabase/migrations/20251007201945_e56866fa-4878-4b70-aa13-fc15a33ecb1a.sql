-- PHASE 1C: Protections Anti-Scraping Catalogue
-- ============================================

-- Table pour tracker les accès au catalogue (rate limiting)
CREATE TABLE IF NOT EXISTS public.catalog_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  access_count INTEGER DEFAULT 1,
  first_access_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_access_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_suspicious BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_catalog_access_user ON public.catalog_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_access_ip ON public.catalog_access_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_catalog_access_suspicious ON public.catalog_access_log(is_suspicious) WHERE is_suspicious = true;

-- RLS sur catalog_access_log (admins only)
ALTER TABLE public.catalog_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs"
ON public.catalog_access_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fonction de détection de scraping
CREATE OR REPLACE FUNCTION public.detect_catalog_scraping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_access_count INTEGER;
  is_blocked BOOLEAN;
BEGIN
  -- Compter les accès récents (dernières 5 minutes)
  SELECT COUNT(*) INTO recent_access_count
  FROM public.catalog_access_log
  WHERE 
    (user_id = NEW.user_id OR ip_address = NEW.ip_address)
    AND last_access_at > now() - interval '5 minutes';
  
  -- Détection de pattern de scraping (>50 requêtes en 5min)
  IF recent_access_count > 50 THEN
    NEW.is_suspicious := true;
    NEW.blocked_until := now() + interval '1 hour';
    
    -- Logger l'incident
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'potential_scraping_detected',
      'critical',
      'Suspicious catalog access pattern detected',
      jsonb_build_object(
        'ip_address', NEW.ip_address,
        'access_count', recent_access_count,
        'user_agent', NEW.user_agent,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger de détection
DROP TRIGGER IF EXISTS trigger_detect_scraping ON public.catalog_access_log;
CREATE TRIGGER trigger_detect_scraping
BEFORE INSERT ON public.catalog_access_log
FOR EACH ROW
EXECUTE FUNCTION public.detect_catalog_scraping();

-- Fonction améliorée avec rate limiting
CREATE OR REPLACE FUNCTION public.get_catalog_products_with_ratelimit(
  category_filter TEXT DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  user_ip TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  external_id TEXT,
  name TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  sku TEXT,
  image_url TEXT,
  image_urls TEXT[],
  rating NUMERIC,
  reviews_count INTEGER,
  availability_status TEXT,
  delivery_time TEXT,
  tags TEXT[],
  is_trending BOOLEAN,
  is_bestseller BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  supplier_name TEXT,
  cost_price NUMERIC,
  profit_margin NUMERIC,
  supplier_url TEXT,
  competition_score NUMERIC,
  sales_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN := false;
  current_user_role TEXT;
  is_user_blocked BOOLEAN := false;
  blocked_until_time TIMESTAMPTZ;
BEGIN
  -- Vérifier authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Vérifier si l'utilisateur est bloqué
  SELECT blocked_until INTO blocked_until_time
  FROM public.catalog_access_log
  WHERE user_id = auth.uid() OR ip_address = user_ip
  ORDER BY last_access_at DESC
  LIMIT 1;
  
  IF blocked_until_time IS NOT NULL AND blocked_until_time > now() THEN
    RAISE EXCEPTION 'Access temporarily blocked due to suspicious activity. Try again later.';
  END IF;

  -- Logger l'accès pour rate limiting
  INSERT INTO public.catalog_access_log (user_id, ip_address, user_agent)
  VALUES (auth.uid(), user_ip, user_agent_param)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    access_count = catalog_access_log.access_count + 1,
    last_access_at = now();

  -- Vérifier si admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  is_admin := (current_user_role = 'admin');

  -- Logger l'accès normal
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'catalog_access',
    'info',
    CASE 
      WHEN is_admin THEN 'Admin accessed catalog with full data'
      ELSE 'User accessed catalog with public data'
    END,
    jsonb_build_object(
      'is_admin', is_admin,
      'category_filter', category_filter,
      'search_term', search_term,
      'limit_count', limit_count,
      'ip_address', user_ip,
      'timestamp', now()
    )
  );

  -- Retourner les données selon le rôle
  RETURN QUERY
  SELECT 
    cp.id,
    cp.external_id,
    cp.name,
    cp.description,
    cp.price,
    cp.currency,
    cp.category,
    cp.subcategory,
    cp.brand,
    cp.sku,
    cp.image_url,
    cp.image_urls,
    cp.rating,
    cp.reviews_count,
    cp.availability_status,
    cp.delivery_time,
    cp.tags,
    cp.is_trending,
    cp.is_bestseller,
    cp.created_at,
    cp.updated_at,
    CASE WHEN is_admin THEN cp.supplier_name ELSE NULL END,
    CASE WHEN is_admin THEN cp.cost_price ELSE NULL END,
    CASE WHEN is_admin THEN cp.profit_margin ELSE NULL END,
    CASE WHEN is_admin THEN cp.supplier_url ELSE NULL END,
    CASE WHEN is_admin THEN cp.competition_score ELSE NULL END,
    CASE WHEN is_admin THEN cp.sales_count ELSE NULL END
  FROM public.catalog_products cp
  WHERE 
    cp.availability_status = 'in_stock'
    AND (category_filter IS NULL OR cp.category ILIKE category_filter)
    AND (search_term IS NULL OR (
      cp.name ILIKE '%' || search_term || '%' OR 
      cp.description ILIKE '%' || search_term || '%' OR
      cp.brand ILIKE '%' || search_term || '%'
    ))
  ORDER BY 
    cp.is_bestseller DESC,
    cp.is_trending DESC,
    cp.rating DESC NULLS LAST,
    cp.name ASC
  LIMIT limit_count;
END;
$$;