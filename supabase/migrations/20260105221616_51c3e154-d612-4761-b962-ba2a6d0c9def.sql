
-- AI Content Generator tables
CREATE TABLE public.ai_content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'description', -- description, title, seo, bullet_points
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  tone TEXT DEFAULT 'professional', -- professional, casual, luxury, technical
  language TEXT DEFAULT 'fr',
  max_tokens INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.ai_content_templates(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  original_content TEXT,
  generated_content TEXT NOT NULL,
  variables_used JSONB DEFAULT '{}'::jsonb,
  quality_score NUMERIC(3,2),
  status TEXT DEFAULT 'draft', -- draft, approved, applied, rejected
  applied_at TIMESTAMP WITH TIME ZONE,
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_content_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.ai_content_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  product_filter JSONB DEFAULT '{}'::jsonb,
  total_products INTEGER DEFAULT 0,
  processed_products INTEGER DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Multi-Channel Sync tables
CREATE TABLE public.sales_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL, -- shopify, amazon, ebay, woocommerce, prestashop, custom
  api_credentials JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  sync_config JSONB DEFAULT '{"auto_sync": true, "sync_interval_minutes": 60}'::jsonb,
  status TEXT DEFAULT 'inactive', -- active, inactive, error, syncing
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  products_synced INTEGER DEFAULT 0,
  orders_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.channel_product_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  external_product_id TEXT,
  external_sku TEXT,
  sync_status TEXT DEFAULT 'pending', -- pending, synced, error, excluded
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  price_override NUMERIC(10,2),
  stock_override INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, product_id)
);

CREATE TABLE public.channel_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- full, incremental, products, orders, inventory
  direction TEXT DEFAULT 'push', -- push, pull, bidirectional
  status TEXT DEFAULT 'running', -- running, completed, failed
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Enable RLS
ALTER TABLE public.ai_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Content
CREATE POLICY "Users can manage their AI templates" ON public.ai_content_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their generated content" ON public.ai_generated_content FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their content batches" ON public.ai_content_batches FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Multi-Channel
CREATE POLICY "Users can manage their sales channels" ON public.sales_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their channel mappings" ON public.channel_product_mappings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their sync logs" ON public.channel_sync_logs FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_templates_user ON public.ai_content_templates(user_id);
CREATE INDEX idx_ai_content_product ON public.ai_generated_content(product_id);
CREATE INDEX idx_ai_content_status ON public.ai_generated_content(status);
CREATE INDEX idx_sales_channels_user ON public.sales_channels(user_id);
CREATE INDEX idx_channel_mappings_channel ON public.channel_product_mappings(channel_id);
CREATE INDEX idx_channel_mappings_product ON public.channel_product_mappings(product_id);
CREATE INDEX idx_sync_logs_channel ON public.channel_sync_logs(channel_id);
