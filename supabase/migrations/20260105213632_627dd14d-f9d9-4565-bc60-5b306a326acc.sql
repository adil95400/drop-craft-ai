
-- Table des commandes groupées (bulk orders)
CREATE TABLE public.bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Infos commande
  order_number TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'draft', -- draft, pending, processing, shipped, completed, cancelled
  
  -- Fournisseur principal (optionnel, peut être multi-fournisseurs)
  primary_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  
  -- Totaux
  total_items INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Shipping
  shipping_method TEXT,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  estimated_delivery_date DATE,
  
  -- Métadonnées
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Dates
  submitted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des items de commande groupée
CREATE TABLE public.bulk_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_order_id UUID NOT NULL REFERENCES public.bulk_orders(id) ON DELETE CASCADE,
  
  -- Produit
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  
  -- Infos produit
  product_title TEXT NOT NULL,
  product_sku TEXT,
  variant_info JSONB DEFAULT '{}', -- {size: "XL", color: "Red", etc}
  
  -- Quantités et prix
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Statut de l'item
  status TEXT DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  
  -- Tracking
  tracking_number TEXT,
  carrier_code TEXT,
  
  -- Métadonnées
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour regrouper les items par fournisseur
CREATE TABLE public.bulk_order_supplier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_order_id UUID NOT NULL REFERENCES public.bulk_orders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  
  -- Totaux pour ce fournisseur
  items_count INTEGER DEFAULT 0,
  subtotal DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Statut par fournisseur
  status TEXT DEFAULT 'pending', -- pending, ordered, shipped, delivered
  
  -- Infos commande fournisseur
  supplier_order_number TEXT,
  ordered_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_bulk_orders_user ON public.bulk_orders(user_id);
CREATE INDEX idx_bulk_orders_status ON public.bulk_orders(status);
CREATE INDEX idx_bulk_order_items_order ON public.bulk_order_items(bulk_order_id);
CREATE INDEX idx_bulk_order_items_supplier ON public.bulk_order_items(supplier_id);
CREATE INDEX idx_bulk_order_groups_order ON public.bulk_order_supplier_groups(bulk_order_id);

-- Trigger updated_at
CREATE TRIGGER update_bulk_orders_updated_at
  BEFORE UPDATE ON public.bulk_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulk_order_items_updated_at
  BEFORE UPDATE ON public.bulk_order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulk_order_groups_updated_at
  BEFORE UPDATE ON public.bulk_order_supplier_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_order_supplier_groups ENABLE ROW LEVEL SECURITY;

-- Policies bulk_orders
CREATE POLICY "Users can view their own bulk orders"
  ON public.bulk_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bulk orders"
  ON public.bulk_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk orders"
  ON public.bulk_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bulk orders"
  ON public.bulk_orders FOR DELETE
  USING (auth.uid() = user_id);

-- Policies bulk_order_items (via bulk_order ownership)
CREATE POLICY "Users can view items of their bulk orders"
  ON public.bulk_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_items.bulk_order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create items in their bulk orders"
  ON public.bulk_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_items.bulk_order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their bulk orders"
  ON public.bulk_order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_items.bulk_order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their bulk orders"
  ON public.bulk_order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_items.bulk_order_id AND user_id = auth.uid()
  ));

-- Policies bulk_order_supplier_groups
CREATE POLICY "Users can view groups of their bulk orders"
  ON public.bulk_order_supplier_groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_supplier_groups.bulk_order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create groups in their bulk orders"
  ON public.bulk_order_supplier_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_supplier_groups.bulk_order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update groups in their bulk orders"
  ON public.bulk_order_supplier_groups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_supplier_groups.bulk_order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete groups from their bulk orders"
  ON public.bulk_order_supplier_groups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bulk_orders 
    WHERE id = bulk_order_supplier_groups.bulk_order_id AND user_id = auth.uid()
  ));

-- Fonction pour générer numéro de commande
CREATE OR REPLACE FUNCTION public.generate_bulk_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_number := 'BO-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5));
    
    IF NOT EXISTS (SELECT 1 FROM public.bulk_orders WHERE order_number = new_number) THEN
      RETURN new_number;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Could not generate unique bulk order number';
    END IF;
  END LOOP;
END;
$$;
