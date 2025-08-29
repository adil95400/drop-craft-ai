-- =====================================================================
-- COMPREHENSIVE SUPPLIER HUB & ECOMMERCE PLATFORM MIGRATION
-- =====================================================================

-- Create enums for better type safety
CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE feed_status AS ENUM ('active', 'inactive', 'error', 'processing');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE sync_direction AS ENUM ('inbound', 'outbound', 'bidirectional');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- =====================================================================
-- 1. SUPPLIER HUB TABLES
-- =====================================================================

-- Suppliers table with comprehensive fields
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country TEXT,
  
  -- API configuration
  api_endpoint TEXT,
  api_key TEXT, -- encrypted
  api_secret TEXT, -- encrypted
  encrypted_credentials JSONB DEFAULT '{}'::jsonb,
  
  -- Contact & business info
  contact_email TEXT,
  contact_phone TEXT,
  business_address JSONB DEFAULT '{}'::jsonb,
  tax_info JSONB DEFAULT '{}'::jsonb,
  
  -- Status & metrics
  status supplier_status DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  
  -- Features & capabilities
  supported_formats TEXT[] DEFAULT ARRAY['csv', 'xml', 'json'],
  supported_frequencies TEXT[] DEFAULT ARRAY['hourly', 'daily', 'weekly'],
  has_inventory_sync BOOLEAN DEFAULT false,
  has_price_sync BOOLEAN DEFAULT true,
  has_image_sync BOOLEAN DEFAULT true,
  
  -- Sync settings
  sync_frequency TEXT DEFAULT 'daily',
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  
  -- Security & access
  access_count INTEGER DEFAULT 0,
  last_access_at TIMESTAMPTZ,
  credentials_updated_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, name)
);

-- Supplier feeds for different data sources
CREATE TABLE IF NOT EXISTS public.supplier_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feed configuration
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL, -- 'csv', 'xml', 'json', 'api', 'ftp'
  feed_url TEXT,
  ftp_config JSONB DEFAULT '{}'::jsonb,
  
  -- Processing settings
  field_mapping JSONB DEFAULT '{}'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  transformations JSONB DEFAULT '{}'::jsonb,
  
  -- Sync configuration
  sync_frequency TEXT DEFAULT 'daily',
  auto_sync BOOLEAN DEFAULT true,
  
  -- Status & metrics
  status feed_status DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  total_records INTEGER DEFAULT 0,
  success_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  
  -- Error handling
  last_error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, name)
);

-- Supplier products catalog
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES public.supplier_feeds(id) ON DELETE SET NULL,
  
  -- External references
  external_id TEXT NOT NULL,
  external_sku TEXT,
  external_url TEXT,
  
  -- Product information
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  
  -- Pricing
  cost_price DECIMAL(12,2),
  suggested_price DECIMAL(12,2),
  msrp DECIMAL(12,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER,
  
  -- Physical properties
  weight DECIMAL(8,3),
  weight_unit TEXT DEFAULT 'kg',
  dimensions JSONB DEFAULT '{}'::jsonb,
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Identifiers
  sku TEXT,
  ean TEXT,
  upc TEXT,
  barcode TEXT,
  
  -- Shipping & logistics
  shipping_cost DECIMAL(8,2),
  shipping_time TEXT,
  shipping_methods JSONB DEFAULT '[]'::jsonb,
  
  -- SEO & marketing
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Variants support
  has_variants BOOLEAN DEFAULT false,
  variant_options JSONB DEFAULT '{}'::jsonb, -- {size: [...], color: [...]}
  
  -- Quality & compliance
  quality_score DECIMAL(3,2) DEFAULT 0,
  compliance_data JSONB DEFAULT '{}'::jsonb,
  
  -- Sync status
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  raw_data JSONB DEFAULT '{}'::jsonb,
  processed_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, external_id)
);

-- Product variants for supplier products
CREATE TABLE IF NOT EXISTS public.supplier_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id UUID NOT NULL REFERENCES public.supplier_products(id) ON DELETE CASCADE,
  
  -- Variant information
  external_variant_id TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,
  
  -- Variant options
  options JSONB NOT NULL DEFAULT '{}'::jsonb, -- {size: "L", color: "red"}
  
  -- Pricing & inventory
  cost_price DECIMAL(12,2),
  suggested_price DECIMAL(12,2),
  stock_quantity INTEGER DEFAULT 0,
  
  -- Physical properties
  weight DECIMAL(8,3),
  dimensions JSONB DEFAULT '{}'::jsonb,
  
  -- Media
  image_url TEXT,
  additional_images TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_product_id, external_variant_id)
);

-- =====================================================================
-- 2. INGESTION & PROCESSING TABLES
-- =====================================================================

-- Ingestion jobs for processing feeds
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES public.supplier_feeds(id) ON DELETE SET NULL,
  
  -- Job configuration
  job_type TEXT NOT NULL, -- 'manual', 'scheduled', 'webhook'
  source_type TEXT NOT NULL, -- 'csv', 'xml', 'json', 'api', 'ftp'
  source_url TEXT,
  
  -- Processing configuration
  mapping_config JSONB DEFAULT '{}'::jsonb,
  filter_config JSONB DEFAULT '{}'::jsonb,
  transformation_config JSONB DEFAULT '{}'::jsonb,
  
  -- Status & progress
  status job_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  
  -- Metrics
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  success_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  
  -- Results & errors
  result_summary JSONB DEFAULT '{}'::jsonb,
  error_details JSONB DEFAULT '[]'::jsonb,
  
  -- Files & data
  input_file_url TEXT,
  output_file_url TEXT,
  sample_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 3. CHANNEL INTEGRATION TABLES
-- =====================================================================

-- Enhanced integrations table (extend existing)
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS store_type TEXT DEFAULT 'generic',
ADD COLUMN IF NOT EXISTS store_version TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS location_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS currency_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tax_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS shipping_settings JSONB DEFAULT '{}'::jsonb;

-- Channel products mapping
CREATE TABLE IF NOT EXISTS public.channel_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  local_product_id UUID, -- reference to products table
  
  -- Remote product information
  remote_product_id TEXT NOT NULL,
  remote_variant_ids JSONB DEFAULT '[]'::jsonb,
  remote_inventory_item_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Mapping metadata
  sync_direction sync_direction DEFAULT 'outbound',
  auto_sync BOOLEAN DEFAULT true,
  
  -- Sync status
  last_sync_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  
  -- Product data cache
  cached_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(integration_id, remote_product_id)
);

-- =====================================================================
-- 4. SUBSCRIPTION & BILLING TABLES
-- =====================================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan details
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(8,2),
  price_yearly DECIMAL(8,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Stripe integration
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  
  -- Features & limits
  features JSONB DEFAULT '{}' ::jsonb,
  limits JSONB DEFAULT '{}'::jsonb, -- {suppliers: 5, products_per_day: 100}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  trial_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  
  -- Stripe data
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Subscription details
  status subscription_status DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Billing
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'yearly'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage metrics
  metric_name TEXT NOT NULL, -- 'suppliers_connected', 'products_imported', 'api_calls'
  metric_value INTEGER DEFAULT 0,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, metric_name, period_start)
);

-- =====================================================================
-- 5. SEO & CONTENT TABLES
-- =====================================================================

-- SEO templates
CREATE TABLE IF NOT EXISTS public.seo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template fields
  title_template TEXT,
  meta_description_template TEXT,
  h1_template TEXT,
  
  -- Variables & rules
  variables JSONB DEFAULT '[]'::jsonb,
  rules JSONB DEFAULT '[]'::jsonb,
  
  -- Usage
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, name)
);

-- Product SEO analysis
CREATE TABLE IF NOT EXISTS public.product_seo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL, -- reference to products table
  
  -- SEO metrics
  overall_score INTEGER DEFAULT 0,
  title_score INTEGER DEFAULT 0,
  description_score INTEGER DEFAULT 0,
  keyword_score INTEGER DEFAULT 0,
  
  -- Analysis results
  analysis_data JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Keywords
  target_keywords TEXT[] DEFAULT '{}',
  keyword_density JSONB DEFAULT '{}'::jsonb,
  
  -- Generated content
  generated_title TEXT,
  generated_description TEXT,
  generated_tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id)
);

-- =====================================================================
-- 6. ENHANCED EXISTING TABLES
-- =====================================================================

-- Add columns to existing sync_logs table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
    ALTER TABLE public.sync_logs 
    ADD COLUMN IF NOT EXISTS sync_direction sync_direction DEFAULT 'outbound',
    ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- =====================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_seo_analysis ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 8. RLS POLICIES
-- =====================================================================

-- Suppliers policies
CREATE POLICY "Users can manage their own suppliers"
  ON public.suppliers FOR ALL
  USING (auth.uid() = user_id);

-- Supplier feeds policies
CREATE POLICY "Users can manage their own supplier feeds"
  ON public.supplier_feeds FOR ALL
  USING (auth.uid() = user_id);

-- Supplier products policies  
CREATE POLICY "Users can view supplier products from their suppliers"
  ON public.supplier_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s 
    WHERE s.id = supplier_products.supplier_id 
    AND s.user_id = auth.uid()
  ));

-- Supplier product variants policies
CREATE POLICY "Users can manage variants of their supplier products"
  ON public.supplier_product_variants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.supplier_products sp
    JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.id = supplier_product_variants.supplier_product_id 
    AND s.user_id = auth.uid()
  ));

-- Ingestion jobs policies
CREATE POLICY "Users can manage their own ingestion jobs"
  ON public.ingestion_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Channel products policies
CREATE POLICY "Users can manage their own channel products"
  ON public.channel_products FOR ALL
  USING (auth.uid() = user_id);

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- User subscriptions policies
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage tracking policies
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage tracking"
  ON public.usage_tracking FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- SEO templates policies
CREATE POLICY "Users can manage their own SEO templates"
  ON public.seo_templates FOR ALL
  USING (auth.uid() = user_id);

-- Product SEO analysis policies
CREATE POLICY "Users can manage their own product SEO analysis"
  ON public.product_seo_analysis FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================================

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_next_sync ON public.suppliers(next_sync_at) WHERE sync_enabled = true;

-- Supplier feeds indexes
CREATE INDEX IF NOT EXISTS idx_supplier_feeds_supplier_id ON public.supplier_feeds(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_feeds_user_id ON public.supplier_feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_feeds_next_sync ON public.supplier_feeds(next_sync_at) WHERE auto_sync = true;

-- Supplier products indexes
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_external_id ON public.supplier_products(supplier_id, external_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_category ON public.supplier_products(category);
CREATE INDEX IF NOT EXISTS idx_supplier_products_brand ON public.supplier_products(brand);
CREATE INDEX IF NOT EXISTS idx_supplier_products_active ON public.supplier_products(is_active);

-- Ingestion jobs indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user_id ON public.ingestion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_supplier_id ON public.ingestion_jobs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created_at ON public.ingestion_jobs(created_at);

-- Channel products indexes
CREATE INDEX IF NOT EXISTS idx_channel_products_integration_id ON public.channel_products(integration_id);
CREATE INDEX IF NOT EXISTS idx_channel_products_user_id ON public.channel_products(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_products_local_product ON public.channel_products(local_product_id);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_metric ON public.usage_tracking(user_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- =====================================================================
-- 10. TRIGGERS FOR UPDATED_AT
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all new tables
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_feeds_updated_at
  BEFORE UPDATE ON public.supplier_feeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_product_variants_updated_at
  BEFORE UPDATE ON public.supplier_product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ingestion_jobs_updated_at
  BEFORE UPDATE ON public.ingestion_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_products_updated_at
  BEFORE UPDATE ON public.channel_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_templates_updated_at
  BEFORE UPDATE ON public.seo_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_seo_analysis_updated_at
  BEFORE UPDATE ON public.product_seo_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 11. INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================================

INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('standard', 'Standard', 'Plan pour débuter avec les fonctionnalités essentielles', 29.00, 290.00, 
  '{"suppliers": true, "basic_sync": true, "basic_analytics": true}',
  '{"suppliers": 3, "products_per_day": 100, "api_calls_per_hour": 500}'
),
('pro', 'Pro', 'Plan avancé pour les professionnels', 79.00, 790.00,
  '{"suppliers": true, "advanced_sync": true, "advanced_analytics": true, "automation": true, "webhooks": true}',
  '{"suppliers": 10, "products_per_day": 1000, "api_calls_per_hour": 5000}'
),
('ultra_pro', 'Ultra Pro', 'Plan premium avec toutes les fonctionnalités', 199.00, 1990.00,
  '{"suppliers": true, "advanced_sync": true, "premium_analytics": true, "full_automation": true, "webhooks": true, "white_label": true}',
  '{"suppliers": -1, "products_per_day": -1, "api_calls_per_hour": -1}'
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = now();