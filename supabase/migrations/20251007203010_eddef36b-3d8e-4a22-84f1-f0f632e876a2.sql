-- PHASE 2A: Gestion Avancée du Stock
-- =====================================

-- Table des entrepôts (warehouses)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  capacity INTEGER NOT NULL DEFAULT 0,
  current_utilization INTEGER NOT NULL DEFAULT 0,
  manager_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  warehouse_type TEXT NOT NULL DEFAULT 'standard', -- standard, cold_storage, hazmat
  operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des niveaux de stock par entrepôt
CREATE TABLE IF NOT EXISTS public.stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  reorder_point INTEGER NOT NULL DEFAULT 10,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  max_stock_level INTEGER NOT NULL DEFAULT 100,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  last_restock_date TIMESTAMPTZ,
  last_count_date TIMESTAMPTZ,
  location_in_warehouse TEXT, -- e.g., "Aisle 3, Shelf B2"
  batch_number TEXT,
  expiry_date TIMESTAMPTZ,
  cost_per_unit NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- Table des prédictions de stock (ML)
CREATE TABLE IF NOT EXISTS public.stock_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  prediction_date TIMESTAMPTZ NOT NULL,
  predicted_demand INTEGER NOT NULL,
  predicted_stockout_date TIMESTAMPTZ,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.75, -- 0.00 to 1.00
  recommended_reorder_quantity INTEGER,
  recommended_reorder_date TIMESTAMPTZ,
  factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- seasonality, trends, etc.
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des alertes de stock
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- low_stock, out_of_stock, overstocked, expiring_soon
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  current_quantity INTEGER NOT NULL,
  threshold_quantity INTEGER NOT NULL,
  message TEXT NOT NULL,
  recommended_action TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notification_channels TEXT[] DEFAULT ARRAY[]::TEXT[], -- email, sms, push, webhook
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- inbound, outbound, transfer, adjustment, return
  quantity INTEGER NOT NULL,
  from_warehouse_id UUID REFERENCES public.warehouses(id),
  to_warehouse_id UUID REFERENCES public.warehouses(id),
  reference_id UUID, -- order_id, transfer_id, etc.
  reference_type TEXT, -- order, transfer, adjustment
  reason TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  cost_impact NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des configurations d'alerte
CREATE TABLE IF NOT EXISTS public.stock_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  notification_channels TEXT[] NOT NULL DEFAULT ARRAY['email']::TEXT[],
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON public.stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON public.stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_user ON public.stock_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_predictions_product ON public.stock_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_predictions_date ON public.stock_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved ON public.stock_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON public.stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_user ON public.warehouses(user_id);

-- Enable RLS sur toutes les tables
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alert_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (secured user access)
CREATE POLICY "Users can manage their warehouses"
ON public.warehouses FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can manage their stock levels"
ON public.stock_levels FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view their stock predictions"
ON public.stock_predictions FOR SELECT
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can manage their stock alerts"
ON public.stock_alerts FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view their stock movements"
ON public.stock_movements FOR SELECT
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert stock movements"
ON public.stock_movements FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can manage their alert configs"
ON public.stock_alert_configs FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at
BEFORE UPDATE ON public.stock_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_alerts_updated_at
BEFORE UPDATE ON public.stock_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_alert_configs_updated_at
BEFORE UPDATE ON public.stock_alert_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();