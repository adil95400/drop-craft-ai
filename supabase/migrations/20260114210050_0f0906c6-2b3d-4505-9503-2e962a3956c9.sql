-- Table pour stocker les connexions fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id TEXT NOT NULL,
  connector_name TEXT NOT NULL,
  credentials_encrypted TEXT, -- Credentials JSON chiffré
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error', 'pending')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_stats JSONB DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, connector_id)
);

-- Table pour les commandes fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID, -- Référence à la commande client
  supplier_id TEXT NOT NULL,
  supplier_order_id TEXT,
  status TEXT DEFAULT 'pending',
  items JSONB DEFAULT '[]',
  total_cost DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  tracking_number TEXT,
  carrier TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_supplier_connections_user ON public.supplier_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_connections_status ON public.supplier_connections(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_user ON public.supplier_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON public.supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON public.supplier_orders(status);

-- RLS
ALTER TABLE public.supplier_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;

-- Policies supplier_connections
CREATE POLICY "Users can view their own supplier connections"
ON public.supplier_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplier connections"
ON public.supplier_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier connections"
ON public.supplier_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplier connections"
ON public.supplier_connections FOR DELETE
USING (auth.uid() = user_id);

-- Policies supplier_orders
CREATE POLICY "Users can view their own supplier orders"
ON public.supplier_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplier orders"
ON public.supplier_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier orders"
ON public.supplier_orders FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_supplier_connections_updated_at
  BEFORE UPDATE ON public.supplier_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at
  BEFORE UPDATE ON public.supplier_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();