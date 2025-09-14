-- PHASE 2: SYSTÈME DE PLANS COMMERCIAUX AVANCÉ
-- Création des plans tarifaires et fonctionnalités

-- 1. Mise à jour de l'enum des plans si nécessaire
DO $$
BEGIN
    -- Vérifier si le type existe déjà
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE plan_type AS ENUM ('free', 'standard', 'pro', 'ultra_pro', 'enterprise');
    END IF;
END $$;

-- 2. Créer table des limites par plan
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name plan_type NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL DEFAULT 0,
    yearly_price_cents INTEGER DEFAULT NULL,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    features JSONB NOT NULL DEFAULT '{}',
    quotas JSONB NOT NULL DEFAULT '{}',
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer les plans par défaut si la table est vide
INSERT INTO public.plan_features (plan_name, display_name, monthly_price_cents, yearly_price_cents, features, quotas, is_popular)
VALUES 
    ('free', 'Gratuit', 0, 0, 
     '{"products": 100, "integrations": 1, "ai_features": false, "support": "community", "api_access": false, "bulk_import": false, "advanced_analytics": false}',
     '{"products": 100, "api_calls": 100, "storage_mb": 100, "imports_per_month": 5}',
     false),
    ('standard', 'Standard', 1900, 19800, 
     '{"products": 1000, "integrations": 3, "ai_features": "basic", "support": "email", "api_access": "limited", "bulk_import": true, "advanced_analytics": false}',
     '{"products": 1000, "api_calls": 1000, "storage_mb": 1000, "imports_per_month": 50}',
     false),
    ('pro', 'Professionnel', 2900, 30800, 
     '{"products": 10000, "integrations": "unlimited", "ai_features": "advanced", "support": "priority", "api_access": true, "bulk_import": true, "advanced_analytics": true}',
     '{"products": 10000, "api_calls": 10000, "storage_mb": 5000, "imports_per_month": 500}',
     true),
    ('ultra_pro', 'Ultra Pro', 9900, 108000, 
     '{"products": "unlimited", "integrations": "unlimited", "ai_features": "premium", "support": "dedicated", "api_access": true, "bulk_import": true, "advanced_analytics": true, "white_label": true}',
     '{"products": -1, "api_calls": -1, "storage_mb": 50000, "imports_per_month": -1}',
     false)
ON CONFLICT (plan_name) DO NOTHING;

-- 3. Mettre à jour la table profiles si elle existe
DO $$
BEGIN
    -- Ajouter la colonne plan si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'plan'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN plan plan_type DEFAULT 'free';
    END IF;
    
    -- Ajouter des colonnes pour le tracking des abonnements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
        ALTER TABLE public.profiles ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 4. Fonction pour vérifier l'accès aux fonctionnalités selon le plan
CREATE OR REPLACE FUNCTION public.check_plan_feature(feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_plan plan_type;
    plan_features JSONB;
    feature_value TEXT;
BEGIN
    -- Récupérer le plan de l'utilisateur
    SELECT plan INTO user_plan 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF user_plan IS NULL THEN
        RETURN false;
    END IF;
    
    -- Récupérer les fonctionnalités du plan
    SELECT features INTO plan_features
    FROM public.plan_features
    WHERE plan_name = user_plan;
    
    IF plan_features IS NULL THEN
        RETURN false;
    END IF;
    
    -- Vérifier la fonctionnalité spécifique
    feature_value := plan_features ->> feature_name;
    
    -- Gérer les différents types de valeurs
    CASE feature_value
        WHEN 'true' THEN RETURN true;
        WHEN 'false' THEN RETURN false;
        WHEN 'unlimited' THEN RETURN true;
        WHEN NULL THEN RETURN false;
        ELSE 
            -- Pour les valeurs numériques ou textuelles, considérer comme true si non null
            RETURN feature_value IS NOT NULL AND feature_value != 'false';
    END CASE;
END;
$$;

-- 5. Créer table pour l'onboarding des nouveaux utilisateurs
CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    completed_steps JSONB NOT NULL DEFAULT '[]',
    current_step TEXT DEFAULT 'welcome',
    total_steps INTEGER DEFAULT 5,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    demo_data_created BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding" 
ON public.user_onboarding FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 6. Fonction pour initialiser l'onboarding d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.initialize_user_onboarding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Créer l'entrée d'onboarding
    INSERT INTO public.user_onboarding (user_id, current_step)
    VALUES (NEW.id, 'welcome')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialiser les quotas pour le plan gratuit
    INSERT INTO public.user_quotas (user_id, quota_type, current_usage, quota_limit)
    VALUES 
        (NEW.id, 'products', 0, 100),
        (NEW.id, 'api_calls', 0, 100),
        (NEW.id, 'storage_mb', 0, 100),
        (NEW.id, 'imports_per_month', 0, 5)
    ON CONFLICT (user_id, quota_type) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger pour initialiser l'onboarding automatiquement
DO $$
BEGIN
    -- Supprimer le trigger s'il existe déjà
    DROP TRIGGER IF EXISTS initialize_onboarding_trigger ON public.profiles;
    
    -- Créer le nouveau trigger
    CREATE TRIGGER initialize_onboarding_trigger
        AFTER INSERT ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.initialize_user_onboarding();
END $$;

-- 7. RLS pour la lecture des plans (public)
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan features" 
ON public.plan_features FOR SELECT 
USING (true);

-- Seuls les admins peuvent modifier les plans
CREATE POLICY "Only admins can modify plans" 
ON public.plan_features FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 8. Trigger pour mettre à jour les timestamps
CREATE TRIGGER handle_updated_at_plan_features 
    BEFORE UPDATE ON public.plan_features 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_onboarding 
    BEFORE UPDATE ON public.user_onboarding 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();