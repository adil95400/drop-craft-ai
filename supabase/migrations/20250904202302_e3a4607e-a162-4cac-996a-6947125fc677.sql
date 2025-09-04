-- Migration corrective - Sécurité Phase 2
-- Date: 2025-01-04

-- 1. CORRECTION POLITIQUE SUBSCRIPTIONS SEULEMENT SI NÉCESSAIRE
DO $$ 
BEGIN
    -- Vérifier si la politique existe et la corriger si nécessaire
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can view their own subscriptions') THEN
        DROP POLICY "Users can view their own subscriptions" ON public.subscriptions;
        CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
          FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);
    END IF;
END $$;

-- 2. SÉCURISATION DES FONCTIONS RESTANTES AVEC search_path
CREATE OR REPLACE FUNCTION public.search_suppliers(search_term text DEFAULT NULL::text, country_filter text DEFAULT NULL::text, sector_filter text DEFAULT NULL::text, supplier_type_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
RETURNS TABLE(id uuid, name text, supplier_type text, country text, sector text, logo_url text, description text, connection_status text, product_count integer, tags text[], rating numeric, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.supplier_type,
    s.country,
    s.sector,
    s.logo_url,
    s.description,
    s.connection_status,
    s.product_count,
    s.tags,
    s.rating,
    s.created_at
  FROM public.suppliers s
  WHERE 
    s.user_id = auth.uid()
    AND (search_term IS NULL OR s.name ILIKE '%' || search_term || '%' OR s.description ILIKE '%' || search_term || '%')
    AND (country_filter IS NULL OR s.country = country_filter)
    AND (sector_filter IS NULL OR s.sector = sector_filter)
    AND (supplier_type_filter IS NULL OR s.supplier_type = supplier_type_filter)
  ORDER BY s.product_count DESC, s.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Update get_marketplace_products function
CREATE OR REPLACE FUNCTION public.get_marketplace_products(category_filter text DEFAULT NULL::text, search_term text DEFAULT NULL::text, limit_count integer DEFAULT 50)
RETURNS TABLE(id uuid, external_id text, name text, description text, price numeric, currency text, category text, subcategory text, brand text, sku text, image_url text, image_urls text[], rating numeric, reviews_count integer, availability_status text, delivery_time text, tags text[], is_trending boolean, is_bestseller boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.external_id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.category,
    p.subcategory,
    p.brand,
    p.sku,
    p.image_url,
    p.image_urls,
    p.rating,
    p.reviews_count,
    p.availability_status,
    p.delivery_time,
    p.tags,
    p.is_trending,
    p.is_bestseller,
    p.created_at,
    p.updated_at
  FROM public.catalog_products p
  WHERE 
    p.availability_status = 'in_stock'
    AND (category_filter IS NULL OR p.category ILIKE category_filter)
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
  ORDER BY 
    p.is_bestseller DESC,
    p.is_trending DESC,
    p.rating DESC NULLS LAST
  LIMIT limit_count;
END;
$function$;

-- 3. CRÉATION SYSTÈME DE RÔLES SÉCURISÉ (éviter les récursions RLS)
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction sécurisée pour vérifier les rôles (évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction helper pour obtenir le rôle actuel
CREATE OR REPLACE FUNCTION public.user_has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Politiques pour user_roles
CREATE POLICY IF NOT EXISTS "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. CORRECTION DES POLITIQUES CATALOG_PRODUCTS (trop permissives)
DROP POLICY IF EXISTS "Authenticated users can view basic product info only" ON public.catalog_products;
CREATE POLICY "Authenticated users can view basic product info only" ON public.catalog_products
  FOR SELECT USING (auth.uid() IS NOT NULL AND availability_status = 'in_stock');

-- 5. SÉCURISATION NOTIFICATIONS (enlever accès anonyme)
DROP POLICY IF EXISTS "secure_select_notifications" ON public.notifications;
CREATE POLICY "secure_select_notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 6. POLITIQUE STRICTE POUR SECURITY_EVENTS (admin seulement)
DROP POLICY IF EXISTS "Admin can view security events" ON public.security_events;
CREATE POLICY "Admin can view security events" ON public.security_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL);

-- 7. FONCTION DE VÉRIFICATION DE SESSION VALIDE
CREATE OR REPLACE FUNCTION public.is_session_valid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND 
         NOT EXISTS (
           SELECT 1 FROM public.revoked_tokens 
           WHERE user_id = auth.uid() AND expires_at > now()
         );
$$;

-- 8. CRÉATION D'UN UTILISATEUR ADMIN PAR DÉFAUT SI N'EXISTE PAS
-- Cette fonction doit être appelée manuellement après création du premier utilisateur
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Chercher l'utilisateur par email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RETURN false; -- Utilisateur non trouvé
  END IF;
  
  -- Ajouter le rôle admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- 9. TRIGGER DE SÉCURITÉ POUR LOGGER LES CHANGEMENTS CRITIQUES
CREATE OR REPLACE FUNCTION public.log_critical_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Logger les changements sur les tables critiques
  IF TG_TABLE_NAME IN ('user_roles', 'profiles', 'subscriptions') THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'critical_data_change',
      'warning',
      format('Critical table %s modified', TG_TABLE_NAME),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Appliquer les triggers de sécurité
DROP TRIGGER IF EXISTS log_user_roles_changes ON public.user_roles;
CREATE TRIGGER log_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_changes();

DROP TRIGGER IF EXISTS log_profiles_changes ON public.profiles;  
CREATE TRIGGER log_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_changes();

-- 10. NETTOYAGE FINAL - Supprimer les permissions dangereuses
REVOKE ALL ON public.catalog_products FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- Accorder seulement les permissions nécessaires aux utilisateurs authentifiés
GRANT SELECT ON public.catalog_products TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;