-- PHASE 1B: SYSTÈME DE QUOTAS ET LIMITES
-- Création du système de quotas sécurisé

-- 1. Créer table des quotas utilisateur
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

-- Politiques sécurisées pour les quotas
CREATE POLICY "Users can view their own quotas" 
ON public.user_quotas FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Service role can manage quotas" 
ON public.user_quotas FOR ALL 
USING (auth.role() = 'service_role');

-- 2. Fonction de vérification des quotas
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

-- 3. Créer table pour les credentials sécurisées
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

-- 4. Trigger de mise à jour automatique
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
CREATE TRIGGER handle_updated_at_secure_credentials 
    BEFORE UPDATE ON public.secure_credentials 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_quotas 
    BEFORE UPDATE ON public.user_quotas 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();