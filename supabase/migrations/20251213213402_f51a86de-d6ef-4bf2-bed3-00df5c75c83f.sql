-- Phase 1: Automation & Fulfillment Infrastructure Core

-- 1. Create auto_fulfillment_orders table for tracking automated order processing
CREATE TABLE IF NOT EXISTS public.auto_fulfillment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_order_id TEXT NOT NULL,
  store_platform TEXT NOT NULL,
  store_integration_id UUID,
  supplier_id UUID,
  supplier_name TEXT,
  supplier_order_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  shipping_address JSONB,
  order_items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  cost_price NUMERIC(10,2),
  profit_margin NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  rule_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create fulfillment_events table for detailed event logging
CREATE TABLE IF NOT EXISTS public.fulfillment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fulfillment_order_id UUID REFERENCES public.auto_fulfillment_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  error_details TEXT,
  source TEXT,
  ip_address TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create fulfillment_rules table with advanced condition logic
CREATE TABLE IF NOT EXISTS public.fulfillment_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  condition_logic TEXT DEFAULT 'AND',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  supplier_preferences JSONB DEFAULT '[]',
  price_rules JSONB DEFAULT '{}',
  stock_rules JSONB DEFAULT '{}',
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create fulfillment_settings table for global user settings
CREATE TABLE IF NOT EXISTS public.fulfillment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  auto_fulfill_enabled BOOLEAN DEFAULT false,
  auto_tracking_sync BOOLEAN DEFAULT true,
  auto_stock_sync BOOLEAN DEFAULT true,
  auto_price_sync BOOLEAN DEFAULT false,
  default_margin_type TEXT DEFAULT 'percentage',
  default_margin_value NUMERIC(10,2) DEFAULT 30,
  minimum_margin NUMERIC(10,2) DEFAULT 10,
  price_rounding TEXT DEFAULT 'nearest',
  auto_deactivate_oos BOOLEAN DEFAULT true,
  retry_failed_orders BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 30,
  notification_email BOOLEAN DEFAULT true,
  notification_webhook TEXT,
  preferred_suppliers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_fulfillment_orders_user_id ON public.auto_fulfillment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_fulfillment_orders_status ON public.auto_fulfillment_orders(status);
CREATE INDEX IF NOT EXISTS idx_auto_fulfillment_orders_store_order_id ON public.auto_fulfillment_orders(store_order_id);
CREATE INDEX IF NOT EXISTS idx_auto_fulfillment_orders_created_at ON public.auto_fulfillment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_order_id ON public.fulfillment_events(fulfillment_order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_user_id ON public.fulfillment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_type ON public.fulfillment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fulfillment_rules_user_id ON public.fulfillment_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_rules_active ON public.fulfillment_rules(is_active);

-- Enable RLS
ALTER TABLE public.auto_fulfillment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auto_fulfillment_orders
CREATE POLICY "Users can view their own fulfillment orders"
  ON public.auto_fulfillment_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fulfillment orders"
  ON public.auto_fulfillment_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fulfillment orders"
  ON public.auto_fulfillment_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fulfillment orders"
  ON public.auto_fulfillment_orders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for fulfillment_events
CREATE POLICY "Users can view their own fulfillment events"
  ON public.fulfillment_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fulfillment events"
  ON public.fulfillment_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fulfillment_rules
CREATE POLICY "Users can view their own fulfillment rules"
  ON public.fulfillment_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fulfillment rules"
  ON public.fulfillment_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fulfillment rules"
  ON public.fulfillment_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fulfillment rules"
  ON public.fulfillment_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for fulfillment_settings
CREATE POLICY "Users can view their own fulfillment settings"
  ON public.fulfillment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fulfillment settings"
  ON public.fulfillment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fulfillment settings"
  ON public.fulfillment_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_auto_fulfillment_orders_updated_at ON public.auto_fulfillment_orders;
CREATE TRIGGER update_auto_fulfillment_orders_updated_at
  BEFORE UPDATE ON public.auto_fulfillment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fulfillment_rules_updated_at ON public.fulfillment_rules;
CREATE TRIGGER update_fulfillment_rules_updated_at
  BEFORE UPDATE ON public.fulfillment_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fulfillment_settings_updated_at ON public.fulfillment_settings;
CREATE TRIGGER update_fulfillment_settings_updated_at
  BEFORE UPDATE ON public.fulfillment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();