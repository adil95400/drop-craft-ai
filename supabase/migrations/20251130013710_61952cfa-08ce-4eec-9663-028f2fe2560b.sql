-- ============================================
-- MIGRATION: Fulfillment Automatisé Avancé (Correction)
-- Description: Tables pour transporteurs, expéditions, étiquettes
-- ============================================

-- Table: Transporteurs (Carriers)
CREATE TABLE IF NOT EXISTS fulfillment_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informations transporteur
  carrier_name TEXT NOT NULL,
  carrier_code TEXT NOT NULL,
  logo_url TEXT,
  
  -- Configuration API
  api_endpoint TEXT,
  api_key TEXT,
  account_number TEXT,
  credentials JSONB DEFAULT '{}'::jsonb,
  
  -- Zones de livraison
  supported_countries TEXT[] DEFAULT ARRAY['FR']::TEXT[],
  default_for_country TEXT,
  
  -- Tarifs
  pricing_rules JSONB DEFAULT '[]'::jsonb,
  
  -- État
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index avec IF NOT EXISTS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_carriers_user') THEN
    CREATE INDEX idx_fulfillment_carriers_user ON fulfillment_carriers(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_carriers_active') THEN
    CREATE INDEX idx_fulfillment_carriers_active ON fulfillment_carriers(user_id, is_active);
  END IF;
END $$;

-- RLS
ALTER TABLE fulfillment_carriers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_carriers' AND policyname = 'Users can view their own carriers'
  ) THEN
    CREATE POLICY "Users can view their own carriers"
      ON fulfillment_carriers FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_carriers' AND policyname = 'Users can create their own carriers'
  ) THEN
    CREATE POLICY "Users can create their own carriers"
      ON fulfillment_carriers FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_carriers' AND policyname = 'Users can update their own carriers'
  ) THEN
    CREATE POLICY "Users can update their own carriers"
      ON fulfillment_carriers FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_carriers' AND policyname = 'Users can delete their own carriers'
  ) THEN
    CREATE POLICY "Users can delete their own carriers"
      ON fulfillment_carriers FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: Expéditions (Shipments)
CREATE TABLE IF NOT EXISTS fulfillment_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  carrier_id UUID REFERENCES fulfillment_carriers(id) ON DELETE SET NULL,
  
  tracking_number TEXT NOT NULL,
  label_url TEXT,
  label_format TEXT DEFAULT 'pdf',
  
  weight_kg DECIMAL(10,2),
  dimensions JSONB,
  shipping_address JSONB NOT NULL,
  
  status TEXT DEFAULT 'created',
  tracking_events JSONB DEFAULT '[]'::jsonb,
  
  shipping_cost DECIMAL(10,2),
  insurance_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  estimated_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_shipments_user') THEN
    CREATE INDEX idx_fulfillment_shipments_user ON fulfillment_shipments(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_shipments_order') THEN
    CREATE INDEX idx_fulfillment_shipments_order ON fulfillment_shipments(order_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_shipments_tracking') THEN
    CREATE INDEX idx_fulfillment_shipments_tracking ON fulfillment_shipments(tracking_number);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_shipments_status') THEN
    CREATE INDEX idx_fulfillment_shipments_status ON fulfillment_shipments(user_id, status);
  END IF;
END $$;

ALTER TABLE fulfillment_shipments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_shipments' AND policyname = 'Users can view their own shipments'
  ) THEN
    CREATE POLICY "Users can view their own shipments"
      ON fulfillment_shipments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_shipments' AND policyname = 'Users can create their own shipments'
  ) THEN
    CREATE POLICY "Users can create their own shipments"
      ON fulfillment_shipments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_shipments' AND policyname = 'Users can update their own shipments'
  ) THEN
    CREATE POLICY "Users can update their own shipments"
      ON fulfillment_shipments FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: Règles d'automatisation
CREATE TABLE IF NOT EXISTS fulfillment_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  
  trigger_on_order_status TEXT DEFAULT 'paid',
  order_conditions JSONB DEFAULT '{}'::jsonb,
  
  auto_select_carrier BOOLEAN DEFAULT true,
  carrier_selection_criteria TEXT DEFAULT 'cheapest',
  preferred_carrier_id UUID REFERENCES fulfillment_carriers(id) ON DELETE SET NULL,
  
  auto_generate_label BOOLEAN DEFAULT true,
  auto_print_label BOOLEAN DEFAULT false,
  
  auto_notify_customer BOOLEAN DEFAULT true,
  notification_template TEXT,
  
  carrier_rules JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_automation_rules_user') THEN
    CREATE INDEX idx_fulfillment_automation_rules_user ON fulfillment_automation_rules(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fulfillment_automation_rules_active') THEN
    CREATE INDEX idx_fulfillment_automation_rules_active ON fulfillment_automation_rules(user_id, is_active);
  END IF;
END $$;

ALTER TABLE fulfillment_automation_rules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_automation_rules' AND policyname = 'Users can view their own automation rules'
  ) THEN
    CREATE POLICY "Users can view their own automation rules"
      ON fulfillment_automation_rules FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_automation_rules' AND policyname = 'Users can create their own automation rules'
  ) THEN
    CREATE POLICY "Users can create their own automation rules"
      ON fulfillment_automation_rules FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_automation_rules' AND policyname = 'Users can update their own automation rules'
  ) THEN
    CREATE POLICY "Users can update their own automation rules"
      ON fulfillment_automation_rules FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_automation_rules' AND policyname = 'Users can delete their own automation rules'
  ) THEN
    CREATE POLICY "Users can delete their own automation rules"
      ON fulfillment_automation_rules FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: Étiquettes
CREATE TABLE IF NOT EXISTS shipping_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shipment_id UUID REFERENCES fulfillment_shipments(id) ON DELETE CASCADE,
  
  label_url TEXT NOT NULL,
  label_format TEXT DEFAULT 'pdf',
  file_size_bytes INTEGER,
  
  generated_at TIMESTAMPTZ DEFAULT now(),
  printed_at TIMESTAMPTZ,
  print_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_labels_user') THEN
    CREATE INDEX idx_shipping_labels_user ON shipping_labels(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_labels_shipment') THEN
    CREATE INDEX idx_shipping_labels_shipment ON shipping_labels(shipment_id);
  END IF;
END $$;

ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Users can view their own labels'
  ) THEN
    CREATE POLICY "Users can view their own labels"
      ON shipping_labels FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Users can create their own labels'
  ) THEN
    CREATE POLICY "Users can create their own labels"
      ON shipping_labels FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fulfillment_carriers_updated_at') THEN
    CREATE TRIGGER update_fulfillment_carriers_updated_at
      BEFORE UPDATE ON fulfillment_carriers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fulfillment_shipments_updated_at') THEN
    CREATE TRIGGER update_fulfillment_shipments_updated_at
      BEFORE UPDATE ON fulfillment_shipments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fulfillment_automation_rules_updated_at') THEN
    CREATE TRIGGER update_fulfillment_automation_rules_updated_at
      BEFORE UPDATE ON fulfillment_automation_rules
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;