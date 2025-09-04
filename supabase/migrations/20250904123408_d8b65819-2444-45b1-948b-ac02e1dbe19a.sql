-- Create missing tables for the e-commerce application

-- Products table (different from imported_products)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'draft',
  category TEXT,
  brand TEXT,
  weight NUMERIC,
  dimensions JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address JSONB DEFAULT '{}',
  country TEXT,
  status TEXT DEFAULT 'active',
  rating NUMERIC DEFAULT 0,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory levels table
CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  warehouse TEXT DEFAULT 'main',
  reserved INTEGER DEFAULT 0,
  available INTEGER GENERATED ALWAYS AS (stock - reserved) STORED,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  status TEXT DEFAULT 'pending',
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  shipping_address JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing country column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Users can manage their own products" 
ON public.products 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for suppliers
CREATE POLICY "Users can manage their own suppliers" 
ON public.suppliers 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for inventory_levels
CREATE POLICY "Users can manage inventory for their products" 
ON public.inventory_levels 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = inventory_levels.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Create RLS policies for shipments
CREATE POLICY "Users can manage shipments for their orders" 
ON public.shipments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = shipments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Create foreign key constraints
ALTER TABLE public.inventory_levels
ADD CONSTRAINT fk_inventory_product
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.shipments
ADD CONSTRAINT fk_shipment_order
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);

-- Create triggers for updated_at columns
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_levels_updated_at
  BEFORE UPDATE ON public.inventory_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();