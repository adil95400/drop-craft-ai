-- Migration de sécurité critique - Correction des problèmes de sécurité
-- Date: 2025-01-04

-- 1. CORRECTION DES COLONNES MANQUANTES
-- Ajouter la colonne country à customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country TEXT;

-- Ajouter la colonne slug à suppliers  
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. CRÉATION DE LA TABLE SUBSCRIPTIONS MANQUANTE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Secure RLS policy for subscriptions (authenticated users only)
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions  
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 3. SÉCURISATION DES FONCTIONS EXISTANTES - AJOUT DE search_path
-- Update function get_supplier_stats
CREATE OR REPLACE FUNCTION public.get_supplier_stats(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Update function calculate_profit_margin
CREATE OR REPLACE FUNCTION public.calculate_profit_margin(price numeric, cost_price numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF cost_price IS NULL OR cost_price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND(((price - cost_price) / cost_price * 100), 2);
END;
$function$;

-- 4. RENFORCEMENT DES POLITIQUES RLS - RESTRICTION ACCÈS ANONYME
-- Update customers policies to require authentication
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;  
CREATE POLICY "Users can create their own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
CREATE POLICY "Users can delete their own customers" ON public.customers
  FOR DELETE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update suppliers policies
DROP POLICY IF EXISTS "Users can view only their own suppliers" ON public.suppliers;
CREATE POLICY "Users can view only their own suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update only their own suppliers" ON public.suppliers;
CREATE POLICY "Users can update only their own suppliers" ON public.suppliers
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete only their own suppliers" ON public.suppliers;
CREATE POLICY "Users can delete only their own suppliers" ON public.suppliers
  FOR DELETE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update products policies
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update orders policies  
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
CREATE POLICY "Users can manage their own orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update profiles policies (keep admin access but require authentication)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    (auth.uid() = id AND auth.uid() IS NOT NULL) OR 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (
    (auth.uid() = id AND auth.uid() IS NOT NULL) OR 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

-- 5. RESTRICTION API CACHE (garder public mais sécurisé)
DROP POLICY IF EXISTS "API cache is publicly readable" ON public.api_cache;
CREATE POLICY "API cache authenticated access" ON public.api_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. SÉCURISATION DES EXTENSIONS
-- Update extensions policies
DROP POLICY IF EXISTS "Users can manage their own extensions" ON public.extensions;
CREATE POLICY "Users can manage their own extensions" ON public.extensions
  FOR ALL USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 7. FONCTION DE NETTOYAGE DES SESSIONS EXPIRÉES
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Nettoyer les sessions expirées
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR (last_activity_at < now() - INTERVAL '7 days');
  
  -- Logger l'opération
  INSERT INTO public.security_events (
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    'session_cleanup',
    'info',
    'Expired sessions cleaned up',
    jsonb_build_object('timestamp', now())
  );
END;
$function$;

-- 8. TRIGGER POUR MISE À JOUR AUTOMATIQUE DES TIMESTAMPS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Ajouter le trigger aux tables importantes
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. AUDIT DE SÉCURITÉ - Logger les accès sensibles
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Logger les accès aux données sensibles
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    'info',
    format('Access to sensitive table: %s', TG_TABLE_NAME),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 10. INDEX POUR PERFORMANCES ET SÉCURITÉ
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

-- 11. CONTRAINTES DE SÉCURITÉ
ALTER TABLE public.subscriptions ADD CONSTRAINT valid_status 
  CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'unpaid'));

ALTER TABLE public.customers ADD CONSTRAINT valid_status_customer
  CHECK (status IN ('active', 'inactive', 'blocked')); 

-- 12. RÉVOCATION DES PERMISSIONS EXCESSIVES
-- Révoquer les permissions par défaut sur les tables sensibles
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.security_events FROM anon;
REVOKE ALL ON public.user_sessions FROM anon;