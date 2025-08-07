-- Création du système de catalogue et sourcing complet

-- Table pour stocker les catalogues de produits externes
CREATE TABLE public.catalog_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,
  original_price numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  category text,
  subcategory text,
  brand text,
  sku text,
  ean text,
  image_url text,
  image_urls text[],
  supplier_id text NOT NULL,
  supplier_name text NOT NULL,
  supplier_url text,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  availability_status text DEFAULT 'in_stock',
  delivery_time text,
  shipping_cost numeric DEFAULT 0,
  tags text[],
  attributes jsonb DEFAULT '{}',
  seo_data jsonb DEFAULT '{}',
  profit_margin numeric DEFAULT 0,
  competition_score numeric DEFAULT 0,
  trend_score numeric DEFAULT 0,
  is_winner boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table pour les favoris utilisateur
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  catalog_product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, catalog_product_id)
);

-- Table pour l'historique de sourcing
CREATE TABLE public.sourcing_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  catalog_product_id uuid NOT NULL REFERENCES catalog_products(id),
  action text NOT NULL, -- 'view', 'favorite', 'import', 'analyze'
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Table pour les alertes de prix
CREATE TABLE public.price_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  catalog_product_id uuid NOT NULL REFERENCES catalog_products(id),
  target_price numeric NOT NULL,
  current_price numeric NOT NULL,
  is_active boolean DEFAULT true,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_catalog_products_supplier ON catalog_products(supplier_id);
CREATE INDEX idx_catalog_products_category ON catalog_products(category);
CREATE INDEX idx_catalog_products_price ON catalog_products(price);
CREATE INDEX idx_catalog_products_rating ON catalog_products(rating);
CREATE INDEX idx_catalog_products_trending ON catalog_products(is_trending);
CREATE INDEX idx_catalog_products_winner ON catalog_products(is_winner);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_sourcing_history_user ON sourcing_history(user_id);

-- RLS Policies
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Policies pour catalog_products (public pour lecture, mais création limitée)
CREATE POLICY "Catalog products are viewable by everyone" 
ON public.catalog_products FOR SELECT 
USING (true);

-- Policies pour user_favorites
CREATE POLICY "Users can manage their own favorites" 
ON public.user_favorites FOR ALL 
USING (auth.uid() = user_id);

-- Policies pour sourcing_history
CREATE POLICY "Users can view their own sourcing history" 
ON public.sourcing_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sourcing history" 
ON public.sourcing_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies pour price_alerts
CREATE POLICY "Users can manage their own price alerts" 
ON public.price_alerts FOR ALL 
USING (auth.uid() = user_id);

-- Trigger pour mise à jour des timestamps
CREATE TRIGGER update_catalog_products_updated_at
BEFORE UPDATE ON public.catalog_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer la marge
CREATE OR REPLACE FUNCTION calculate_profit_margin(price numeric, cost_price numeric)
RETURNS numeric AS $$
BEGIN
  IF cost_price IS NULL OR cost_price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND(((price - cost_price) / cost_price * 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Insérer des données d'exemple de catalogues
INSERT INTO public.catalog_products (
  external_id, name, description, price, cost_price, original_price, 
  category, subcategory, brand, supplier_id, supplier_name, 
  rating, reviews_count, sales_count, stock_quantity, 
  tags, is_winner, is_trending, is_bestseller
) VALUES 
-- Produits Amazon
('AMZN001', 'Apple AirPods Pro (2ème génération)', 'Écouteurs sans fil avec réduction de bruit active', 279.99, 180.00, 329.99, 'Électronique', 'Audio', 'Apple', 'amazon', 'Amazon', 4.8, 15420, 8934, 150, ARRAY['apple', 'airpods', 'bluetooth', 'noise-cancelling'], true, true, true),
('AMZN002', 'Samsung Galaxy Watch 6', 'Montre connectée avec GPS et suivi santé', 319.99, 200.00, 399.99, 'Électronique', 'Wearables', 'Samsung', 'amazon', 'Amazon', 4.6, 8932, 4521, 89, ARRAY['samsung', 'smartwatch', 'fitness', 'gps'], false, true, false),
('AMZN003', 'Sony WH-1000XM5', 'Casque audio sans fil avec réduction de bruit', 399.99, 250.00, 449.99, 'Électronique', 'Audio', 'Sony', 'amazon', 'Amazon', 4.9, 12304, 6789, 67, ARRAY['sony', 'headphones', 'noise-cancelling', 'wireless'], true, false, true),

-- Produits AliExpress
('ALI001', 'Aspirateur robot intelligent', 'Robot aspirateur avec navigation laser et contrôle par app', 159.99, 85.00, 299.99, 'Électroménager', 'Nettoyage', 'ILIFE', 'aliExpress', 'AliExpress', 4.3, 2847, 15423, 234, ARRAY['robot', 'aspirateur', 'smart', 'laser'], false, true, false),
('ALI002', 'Projecteur LED portable', 'Mini projecteur WiFi 1080P pour cinéma maison', 89.99, 35.00, 199.99, 'Électronique', 'Image', 'VILINICE', 'aliExpress', 'AliExpress', 4.1, 1923, 8764, 456, ARRAY['projecteur', 'wifi', '1080p', 'portable'], false, false, false),
('ALI003', 'Kit éclairage LED RGB', 'Bandes LED connectées 5m avec télécommande', 29.99, 12.00, 79.99, 'Électronique', 'Éclairage', 'Govee', 'aliExpress', 'AliExpress', 4.4, 5632, 23456, 789, ARRAY['led', 'rgb', 'smart', 'decoration'], false, true, true),

-- Produits Cdiscount
('CDC001', 'Téléviseur Samsung 55" QLED', 'TV QLED 4K HDR avec Tizen OS', 699.99, 450.00, 899.99, 'Électronique', 'TV', 'Samsung', 'cdiscount', 'Cdiscount', 4.5, 3421, 1234, 23, ARRAY['samsung', 'qled', '4k', 'hdr'], true, false, false),
('CDC002', 'Réfrigérateur Bosch 300L', 'Réfrigérateur combiné classe A++', 549.99, 350.00, 699.99, 'Électroménager', 'Froid', 'Bosch', 'cdiscount', 'Cdiscount', 4.7, 892, 567, 12, ARRAY['bosch', 'refrigerateur', 'a++', 'combiné'], false, false, true),

-- Produits Decathlon
('DEC001', 'Vélo électrique Riverside', 'VTT électrique 27.5" autonomie 90km', 1299.99, 800.00, 1599.99, 'Sport', 'Cyclisme', 'Decathlon', 'decathlon', 'Decathlon', 4.6, 456, 234, 8, ARRAY['velo', 'electrique', 'vtt', 'riverside'], true, true, false),
('DEC002', 'Tapis de course pliable', 'Tapis de course électrique 12 km/h', 399.99, 250.00, 599.99, 'Sport', 'Fitness', 'Domyos', 'decathlon', 'Decathlon', 4.2, 678, 345, 15, ARRAY['tapis', 'course', 'fitness', 'domyos'], false, false, false);

-- Mettre à jour les marges
UPDATE public.catalog_products 
SET profit_margin = calculate_profit_margin(price, cost_price);