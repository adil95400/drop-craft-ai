-- Migration pour unifier les rôles utilisateurs et créer les tables manquantes
-- 1. Ajouter la colonne role et admin_mode à la table profiles si elles n'existent pas
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

-- 3. Créer la table suppliers si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.suppliers (
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

-- 4. Créer la table supplier_products
CREATE TABLE IF NOT EXISTS public.supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC,
    currency TEXT DEFAULT 'EUR',
    sku TEXT,
    category TEXT,
    brand TEXT,
    image_urls TEXT[] DEFAULT '{}',
    stock_quantity INTEGER DEFAULT 0,
    availability_status TEXT DEFAULT 'in_stock',
    attributes JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(supplier_id, external_id)
);

-- 5. Créer la table orders si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    shipping_address JSONB,
    billing_address JSONB,
    order_items JSONB DEFAULT '[]',
    tracking_number TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS pour suppliers
CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suppliers" ON public.suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
        )
    );

-- 8. Créer les politiques RLS pour supplier_products
CREATE POLICY "Users can manage their own supplier products" ON public.supplier_products
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all supplier products" ON public.supplier_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
        )
    );

-- 9. Créer les politiques RLS pour orders
CREATE POLICY "Users can manage their own orders" ON public.orders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
        )
    );

-- 10. Créer des fonctions utilitaires pour les rôles
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
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

CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role TEXT)
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

-- 11. Créer des triggers pour update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insérer des données de test pour les fournisseurs
INSERT INTO public.suppliers (name, description, country, category, supplier_type, status, product_count, rating) VALUES
('AliExpress Wholesale', 'Leading B2B marketplace from Alibaba Group', 'China', 'Electronics', 'marketplace', 'active', 50000, 4.2),
('DHgate Suppliers', 'Global wholesale marketplace', 'China', 'Fashion', 'marketplace', 'active', 30000, 4.0),
('VidaXL', 'European dropshipping supplier', 'Netherlands', 'Home & Garden', 'dropshipping', 'active', 15000, 4.5),
('Printful', 'Print-on-demand services', 'Latvia', 'Custom Products', 'pod', 'active', 5000, 4.8),
('Oberlo Suppliers', 'Shopify integrated suppliers', 'Global', 'General', 'marketplace', 'active', 25000, 4.1)
ON CONFLICT DO NOTHING;