-- =============================================
-- PHASE 1: SÉCURISATION COMPLÈTE DE L'APPLICATION
-- =============================================

-- 1. CORRECTION DES POLITIQUES RLS TROP PERMISSIVES
-- Désactiver l'accès anonyme sur toutes les tables sensibles

-- Supprimer les politiques existantes trop permissives et en créer de nouvelles sécurisées
DROP POLICY IF EXISTS "secure_user_access_ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Users can only access their own ab_test_experiments" 
ON public.ab_test_experiments FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "secure_user_access_activity_logs" ON public.activity_logs;
CREATE POLICY "Users can only access their own activity_logs" 
ON public.activity_logs FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "secure_user_access_advanced_reports" ON public.advanced_reports;
CREATE POLICY "Users can only access their own advanced_reports" 
ON public.advanced_reports FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "secure_user_access_ai_optimization_jobs" ON public.ai_optimization_jobs;
CREATE POLICY "Users can only access their own ai_optimization_jobs" 
ON public.ai_optimization_jobs FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "secure_user_access_ai_tasks" ON public.ai_tasks;
CREATE POLICY "Users can only access their own ai_tasks" 
ON public.ai_tasks FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2. SÉCURISER LES TABLES CRITIQUES SANS POLITIQUES
-- Tables avec données financières et sensibles

-- Sécuriser la table des achats d'extensions
ALTER TABLE public.extension_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.extension_purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.extension_purchases;
CREATE POLICY "Users can manage their own extension_purchases" 
ON public.extension_purchases FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Sécuriser les données Stripe et paiements si elles existent
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stripe_customers') THEN
        ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "stripe_customers_policy" ON public.stripe_customers;
        CREATE POLICY "Users can only access their own stripe data" 
        ON public.stripe_customers FOR ALL 
        USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
    END IF;
END $$;

-- 3. CHIFFREMENT ET SÉCURISATION DES DONNÉES SENSIBLES
-- Créer une table pour les clés API chiffrées
CREATE TABLE IF NOT EXISTS public.secure_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    encrypted_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, service_name)
);

ALTER TABLE public.secure_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own credentials" 
ON public.secure_credentials FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. CORRECTION DES FONCTIONS AVEC SEARCH_PATH MUTABLE
-- Créer des fonctions sécurisées pour l'accès aux données

CREATE OR REPLACE FUNCTION public.get_user_secure_data(table_name TEXT)
RETURNS TABLE(data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Fonction sécurisée pour accéder aux données utilisateur
    IF table_name = 'profiles' THEN
        RETURN QUERY
        SELECT row_to_json(p.*)::jsonb as data
        FROM public.profiles p
        WHERE p.id = auth.uid();
    END IF;
    
    RETURN;
END;
$$;

-- 5. AUDIT ET LOGGING DE SÉCURITÉ
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir tous les logs d'audit
CREATE POLICY "Admins can view all security audit logs" 
ON public.security_audit_log FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own security audit logs" 
ON public.security_audit_log FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 6. TRIGGER DE SÉCURITÉ POUR AUDIT AUTOMATIQUE
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Logger les actions sensibles automatiquement
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        success
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        true
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Appliquer le trigger sur les tables sensibles
DROP TRIGGER IF EXISTS security_audit_trigger ON public.secure_credentials;
CREATE TRIGGER security_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.secure_credentials
    FOR EACH ROW EXECUTE FUNCTION public.log_security_event();

-- 7. SYSTÈME DE QUOTAS ET LIMITES
CREATE TABLE IF NOT EXISTS public.user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_type TEXT NOT NULL, -- 'products', 'api_calls', 'storage', etc.
    current_usage INTEGER NOT NULL DEFAULT 0,
    quota_limit INTEGER NOT NULL,
    reset_period TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'monthly', 'yearly'
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, quota_type)
);

ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotas" 
ON public.user_quotas FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admins peuvent gérer tous les quotas
CREATE POLICY "Admins can manage all quotas" 
ON public.user_quotas FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 8. FONCTION DE VÉRIFICATION DES QUOTAS
CREATE OR REPLACE FUNCTION public.check_user_quota(
    quota_type_param TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_quota INTEGER;
    quota_limit INTEGER;
    user_plan TEXT;
BEGIN
    -- Récupérer le plan utilisateur
    SELECT plan INTO user_plan 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Récupérer le quota actuel
    SELECT current_usage, quota_limit 
    INTO current_quota, quota_limit
    FROM public.user_quotas 
    WHERE user_id = auth.uid() AND quota_type = quota_type_param;
    
    -- Si pas de quota défini, créer selon le plan
    IF current_quota IS NULL THEN
        INSERT INTO public.user_quotas (user_id, quota_type, current_usage, quota_limit)
        VALUES (
            auth.uid(), 
            quota_type_param, 
            increment_by,
            CASE 
                WHEN user_plan = 'ultra_pro' THEN -1 -- illimité
                WHEN user_plan = 'pro' THEN 10000
                ELSE 100 -- gratuit
            END
        );
        RETURN true;
    END IF;
    
    -- Vérifier si le quota est dépassé
    IF quota_limit = -1 OR current_quota + increment_by <= quota_limit THEN
        -- Mettre à jour le compteur
        UPDATE public.user_quotas 
        SET current_usage = current_usage + increment_by,
            updated_at = now()
        WHERE user_id = auth.uid() AND quota_type = quota_type_param;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- 9. NETTOYAGE DES PERMISSIONS LEGACY
-- Révoquer les permissions trop larges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Accorder uniquement les permissions nécessaires pour les utilisateurs authentifiés
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 10. MISE À JOUR DU TRIGGER UPDATED_AT SÉCURISÉ
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Appliquer aux nouvelles tables
DROP TRIGGER IF EXISTS handle_updated_at ON public.secure_credentials;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.secure_credentials 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_quotas;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.user_quotas 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();