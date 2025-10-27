-- Phase 3B: Premium Suppliers System
-- Tables pour les fournisseurs premium et leurs produits

-- ENUM types
CREATE TYPE premium_tier AS ENUM ('gold', 'platinum', 'diamond');
CREATE TYPE delivery_region AS ENUM ('eu', 'us', 'uk', 'worldwide');
CREATE TYPE quality_certification AS ENUM ('iso_9001', 'fda_approved', 'ce_certified', 'eco_friendly', 'fair_trade');

-- Table des fournisseurs premium
CREATE TABLE IF NOT EXISTS public.premium_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  country TEXT NOT NULL,
  tier premium_tier DEFAULT 'gold',
  
  -- Shipping & Delivery
  delivery_regions delivery_region[] DEFAULT ARRAY['eu']::delivery_region[],
  avg_delivery_days INTEGER DEFAULT 7,
  express_delivery_available BOOLEAN DEFAULT false,
  free_shipping_threshold NUMERIC(10,2),
  
  -- Quality & Certifications
  certifications quality_certification[] DEFAULT ARRAY[]::quality_certification[],
  quality_score NUMERIC(3,2) DEFAULT 4.5 CHECK (quality_score >= 0 AND quality_score <= 5),
  reliability_score NUMERIC(3,2) DEFAULT 4.5 CHECK (reliability_score >= 0 AND reliability_score <= 5),
  
  -- Business Info
  minimum_order_value NUMERIC(10,2) DEFAULT 0,
  product_count INTEGER DEFAULT 0,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Contact & Support
  support_email TEXT,
  support_phone TEXT,
  response_time_hours INTEGER DEFAULT 24,
  
  -- API & Integration
  api_endpoint TEXT,
  requires_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des produits premium
CREATE TABLE IF NOT EXISTS public.premium_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.premium_suppliers(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  
  -- Product Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  sku TEXT NOT NULL,
  
  -- Pricing
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  
  -- Shipping
  weight_kg NUMERIC(8,2),
  dimensions_cm JSONB, -- {length, width, height}
  ships_from TEXT,
  delivery_regions delivery_region[] DEFAULT ARRAY['eu']::delivery_region[],
  
  -- Quality & Trust
  quality_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications quality_certification[] DEFAULT ARRAY[]::quality_certification[],
  rating NUMERIC(3,2) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  
  -- SEO & Marketing
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_trending BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  profit_margin NUMERIC(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, external_id)
);

-- Table des connexions utilisateur aux fournisseurs premium
CREATE TABLE IF NOT EXISTS public.premium_supplier_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.premium_suppliers(id) ON DELETE CASCADE,
  
  -- Connection Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  approved_at TIMESTAMPTZ,
  
  -- Configuration
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  
  -- Pricing Rules
  markup_percentage NUMERIC(5,2) DEFAULT 30.00,
  pricing_rules JSONB DEFAULT '{}',
  
  -- Stats
  products_synced INTEGER DEFAULT 0,
  products_imported INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, supplier_id)
);

-- Table des logs de synchronisation premium
CREATE TABLE IF NOT EXISTS public.premium_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.premium_supplier_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.premium_suppliers(id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'products', 'inventory', 'prices')),
  status TEXT DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Progress
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Results
  errors JSONB DEFAULT '[]',
  summary JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_premium_suppliers_tier ON public.premium_suppliers(tier);
CREATE INDEX IF NOT EXISTS idx_premium_suppliers_country ON public.premium_suppliers(country);
CREATE INDEX IF NOT EXISTS idx_premium_suppliers_featured ON public.premium_suppliers(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_premium_products_supplier ON public.premium_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_premium_products_category ON public.premium_products(category);
CREATE INDEX IF NOT EXISTS idx_premium_products_trending ON public.premium_products(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_premium_connections_user ON public.premium_supplier_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_connections_status ON public.premium_supplier_connections(status);
CREATE INDEX IF NOT EXISTS idx_premium_sync_logs_connection ON public.premium_sync_logs(connection_id);

-- RLS Policies
ALTER TABLE public.premium_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_supplier_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_sync_logs ENABLE ROW LEVEL SECURITY;

-- Premium suppliers are viewable by all authenticated users
CREATE POLICY "Premium suppliers are viewable by authenticated users"
ON public.premium_suppliers FOR SELECT
TO authenticated
USING (is_active = true);

-- Premium products are viewable by all authenticated users
CREATE POLICY "Premium products are viewable by authenticated users"
ON public.premium_products FOR SELECT
TO authenticated
USING (is_active = true);

-- Users can view their own connections
CREATE POLICY "Users can view their own premium connections"
ON public.premium_supplier_connections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own connections
CREATE POLICY "Users can create their own premium connections"
ON public.premium_supplier_connections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update their own premium connections"
ON public.premium_supplier_connections FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can view their own sync logs
CREATE POLICY "Users can view their own premium sync logs"
ON public.premium_sync_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_premium_suppliers_updated_at
  BEFORE UPDATE ON public.premium_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_premium_products_updated_at
  BEFORE UPDATE ON public.premium_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_premium_connections_updated_at
  BEFORE UPDATE ON public.premium_supplier_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour mettre à jour le product_count
CREATE OR REPLACE FUNCTION public.update_premium_supplier_product_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.premium_suppliers
  SET product_count = (
    SELECT COUNT(*) 
    FROM public.premium_products 
    WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_premium_product_count
  AFTER INSERT OR UPDATE OR DELETE ON public.premium_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_premium_supplier_product_count();

-- Seed data: Premium Suppliers
INSERT INTO public.premium_suppliers (name, display_name, description, country, tier, delivery_regions, avg_delivery_days, certifications, quality_score, reliability_score, categories, featured, logo_url) VALUES
('spocket-eu', 'Spocket EU Premium', 'Fournisseur premium européen avec livraison rapide 2-5 jours', 'Germany', 'platinum', ARRAY['eu', 'uk']::delivery_region[], 3, ARRAY['iso_9001', 'eco_friendly']::quality_certification[], 4.8, 4.9, ARRAY['Fashion', 'Home & Garden', 'Electronics'], true, 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200'),
('modalyst-us', 'Modalyst US Fast Shipping', 'Fournisseur US premium avec livraison express disponible', 'United States', 'platinum', ARRAY['us', 'worldwide']::delivery_region[], 4, ARRAY['fda_approved', 'iso_9001']::quality_certification[], 4.7, 4.8, ARRAY['Fashion', 'Beauty', 'Accessories'], true, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'),
('printful-global', 'Printful Print on Demand', 'Leader mondial du print-on-demand de qualité premium', 'Latvia', 'diamond', ARRAY['eu', 'us', 'uk', 'worldwide']::delivery_region[], 5, ARRAY['iso_9001', 'eco_friendly', 'fair_trade']::quality_certification[], 4.9, 4.9, ARRAY['Fashion', 'Home & Garden', 'Accessories'], true, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200'),
('oberlo-dropship', 'Oberlo Premium Dropshipping', 'Produits premium sélectionnés pour dropshipping', 'China', 'gold', ARRAY['worldwide']::delivery_region[], 12, ARRAY['ce_certified']::quality_certification[], 4.3, 4.4, ARRAY['Electronics', 'Home & Garden', 'Toys'], false, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200'),
('cjdropshipping-pro', 'CJ Dropshipping Pro', 'Fournisseur professionnel avec entrepôts EU/US', 'China', 'gold', ARRAY['eu', 'us', 'worldwide']::delivery_region[], 8, ARRAY['ce_certified', 'iso_9001']::quality_certification[], 4.5, 4.6, ARRAY['Fashion', 'Electronics', 'Sports'], true, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200');

-- Seed data: Premium Products (exemples)
INSERT INTO public.premium_products (supplier_id, external_id, name, description, category, brand, sku, price, compare_at_price, cost_price, stock_quantity, images, delivery_regions, quality_badges, is_trending, profit_margin) 
SELECT 
  id,
  'PREM-' || FLOOR(random() * 10000)::text,
  'Premium ' || (ARRAY['Montre Luxe', 'Sac Designer', 'Chaussures Premium', 'T-shirt Bio', 'Casque Audio'])[FLOOR(random() * 5 + 1)],
  'Produit premium de haute qualité avec livraison rapide garantie',
  (ARRAY['Fashion', 'Electronics', 'Accessories'])[FLOOR(random() * 3 + 1)],
  (ARRAY['PremiumBrand', 'LuxuryLabel', 'QualityFirst'])[FLOOR(random() * 3 + 1)],
  'SKU-' || FLOOR(random() * 100000)::text,
  ROUND((50 + random() * 450)::numeric, 2),
  ROUND((80 + random() * 600)::numeric, 2),
  ROUND((30 + random() * 200)::numeric, 2),
  FLOOR(random() * 500 + 50)::integer,
  ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
  ARRAY['eu', 'us']::delivery_region[],
  ARRAY['Fast Shipping', 'Premium Quality', 'Verified Seller'],
  random() > 0.7,
  ROUND((25 + random() * 35)::numeric, 2)
FROM public.premium_suppliers
LIMIT 10;