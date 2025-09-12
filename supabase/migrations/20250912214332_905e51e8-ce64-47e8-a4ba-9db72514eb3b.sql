-- Créer les tables pour les imports Shopify
CREATE TABLE IF NOT EXISTS public.shopify_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_integration_id UUID NOT NULL,
  shopify_product_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  product_type TEXT,
  handle TEXT,
  status TEXT DEFAULT 'active',
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  sku TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  options JSONB DEFAULT '[]',
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_integration_id, shopify_product_id)
);

CREATE TABLE IF NOT EXISTS public.shopify_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_integration_id UUID NOT NULL,
  shopify_order_id BIGINT NOT NULL,
  order_number TEXT NOT NULL,
  email TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  subtotal_price DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  financial_status TEXT,
  fulfillment_status TEXT,
  customer_id BIGINT,
  billing_address JSONB,
  shipping_address JSONB,
  line_items JSONB DEFAULT '[]',
  shipping_lines JSONB DEFAULT '[]',
  tax_lines JSONB DEFAULT '[]',
  order_status_url TEXT,
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  processed_at_shopify TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_integration_id, shopify_order_id)
);

CREATE TABLE IF NOT EXISTS public.shopify_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_integration_id UUID NOT NULL,
  shopify_customer_id BIGINT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  verified_email BOOLEAN DEFAULT false,
  accepts_marketing BOOLEAN DEFAULT false,
  state TEXT DEFAULT 'enabled',
  tags TEXT[],
  total_spent DECIMAL(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  default_address JSONB,
  addresses JSONB DEFAULT '[]',
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_integration_id, shopify_customer_id)
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_shopify_products_store_integration ON public.shopify_products(store_integration_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_store_integration ON public.shopify_orders(store_integration_id);
CREATE INDEX IF NOT EXISTS idx_shopify_customers_store_integration ON public.shopify_customers(store_integration_id);

-- Créer les triggers pour les timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shopify_products_updated_at
  BEFORE UPDATE ON public.shopify_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_orders_updated_at
  BEFORE UPDATE ON public.shopify_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_customers_updated_at
  BEFORE UPDATE ON public.shopify_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_customers ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view their own shopify products" 
ON public.shopify_products 
FOR SELECT 
USING (
  store_integration_id IN (
    SELECT id FROM public.store_integrations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own shopify products" 
ON public.shopify_products 
FOR ALL 
USING (
  store_integration_id IN (
    SELECT id FROM public.store_integrations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own shopify orders" 
ON public.shopify_orders 
FOR SELECT 
USING (
  store_integration_id IN (
    SELECT id FROM public.store_integrations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own shopify orders" 
ON public.shopify_orders 
FOR ALL 
USING (
  store_integration_id IN (
    SELECT id FROM public.store_integrations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own shopify customers" 
ON public.shopify_customers 
FOR SELECT 
USING (
  store_integration_id IN (
    SELECT id FROM public.store_integrations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own shopify customers" 
ON public.shopify_customers 
FOR ALL 
USING (
  store_integration_id IN (
    SELECT id FROM public.store_integrations WHERE user_id = auth.uid()
  )
);