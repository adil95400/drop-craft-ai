-- Add sync_logs table for tracking synchronization history
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'products', 'orders', 'inventory', 'variants'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'success', 'error'
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add webhook_events table for handling platform webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'shopify', 'woocommerce'
  event_type TEXT NOT NULL, -- 'products/update', 'inventory_levels/update', etc.
  webhook_data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add product_variants table for managing variations
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_sku TEXT,
  variant_sku TEXT,
  name TEXT NOT NULL,
  options JSONB DEFAULT '{}', -- {size: "L", color: "Red"}
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  shopify_variant_id TEXT,
  woocommerce_variant_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add inventory_levels table for detailed stock tracking
CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  location_name TEXT NOT NULL DEFAULT 'default',
  location_id TEXT, -- shopify location_id or woo location
  available_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  platform TEXT NOT NULL, -- 'local', 'shopify', 'woocommerce'
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add sync_schedules table for CRON management
CREATE TABLE IF NOT EXISTS public.sync_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  frequency_minutes INTEGER NOT NULL DEFAULT 30, -- every 30 minutes
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their sync logs" ON public.sync_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.integrations i 
    WHERE i.id = sync_logs.integration_id AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their webhook events" ON public.webhook_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.integrations i 
    WHERE i.id = webhook_events.integration_id AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their product variants" ON public.product_variants
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their inventory levels" ON public.inventory_levels
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their sync schedules" ON public.sync_schedules
FOR ALL USING (auth.uid() = user_id);

-- Service role can manage webhooks for processing
CREATE POLICY "Service role can manage all webhook events" ON public.webhook_events
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_integration_id ON public.webhook_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product_id ON public.inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_sync_schedules_next_run ON public.sync_schedules(next_run_at) WHERE is_active = true;