-- Migration simplifiée pour éviter les conflits
-- 1. Ajouter les colonnes manquantes à profiles
DO $$ 
BEGIN
    -- Ajouter role si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
    
    -- Ajouter admin_mode si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'admin_mode') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_mode text DEFAULT NULL;
    END IF;
    
    -- Ajouter is_admin si elle n'existe pas pour compatibilité
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
    END IF;
END $$;

-- 2. Créer le type pour les rôles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'manager');
    END IF;
END $$;

-- 3. Créer la table suppliers uniquement si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers' AND table_schema = 'public') THEN
        CREATE TABLE public.suppliers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            website TEXT,
            country TEXT,
            category TEXT,
            supplier_type TEXT DEFAULT 'marketplace',
            status TEXT DEFAULT 'active',
            logo_url TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            api_key TEXT,
            api_secret TEXT,
            encrypted_credentials JSONB DEFAULT '{}',
            connection_status TEXT DEFAULT 'disconnected',
            last_sync_at TIMESTAMP WITH TIME ZONE,  
            sync_frequency TEXT DEFAULT 'daily',
            product_count INTEGER DEFAULT 0,
            rating NUMERIC DEFAULT 0,
            tags TEXT[] DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
        
        -- Politiques pour suppliers
        CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
            FOR ALL USING (auth.uid() = user_id);
            
        CREATE POLICY "Admins can view all suppliers" ON public.suppliers
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
                )
            );
    END IF;
END $$;

-- 4. Créer les fonctions utilitaires pour les rôles
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND (role = 'admin' OR is_admin = true)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND (role = required_role OR (required_role = 'admin' AND is_admin = true))
    );
END;
$$;