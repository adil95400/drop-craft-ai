-- Phase 2: Store & logistics synchronization tables (excluding existing webhook_events)

-- Table for order fulfillments and shipping
CREATE TABLE IF NOT EXISTS public.order_fulfillments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  integration_id UUID,
  fulfillment_status TEXT NOT NULL DEFAULT 'pending',
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  shipping_cost NUMERIC DEFAULT 0,
  tracking_events JSONB DEFAULT '[]',
  supplier_fulfillment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking numbers and logistics
CREATE TABLE IF NOT EXISTS public.tracking_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  tracking_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_transit',
  current_location TEXT,
  destination TEXT,
  estimated_delivery DATE,
  tracking_history JSONB DEFAULT '[]',
  last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for detailed sync logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  items_processed INTEGER DEFAULT 0,
  items_successful INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  sync_direction TEXT DEFAULT 'import',
  metadata JSONB DEFAULT '{}'
);

-- Table for order routing rules
CREATE TABLE IF NOT EXISTS public.order_routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.order_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_routing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_fulfillments
CREATE POLICY "Users can manage their own fulfillments" 
ON public.order_fulfillments 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for tracking_numbers
CREATE POLICY "Users can manage their own tracking numbers" 
ON public.tracking_numbers 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for sync_logs
CREATE POLICY "Users can view their own sync logs" 
ON public.sync_logs 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for order_routing_rules
CREATE POLICY "Users can manage their own routing rules" 
ON public.order_routing_rules 
FOR ALL 
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_user_id ON public.order_fulfillments(user_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_order_id ON public.order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_status ON public.order_fulfillments(fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_tracking_numbers_user_id ON public.tracking_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_numbers_order_id ON public.tracking_numbers(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_numbers_carrier ON public.tracking_numbers(carrier);

CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);

-- Triggers for updated_at
CREATE TRIGGER update_order_fulfillments_updated_at
  BEFORE UPDATE ON public.order_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracking_numbers_updated_at
  BEFORE UPDATE ON public.tracking_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_routing_rules_updated_at
  BEFORE UPDATE ON public.order_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();