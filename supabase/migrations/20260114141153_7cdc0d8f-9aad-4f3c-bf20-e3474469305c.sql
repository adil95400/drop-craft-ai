-- Create marketplace_feeds table
CREATE TABLE IF NOT EXISTS public.marketplace_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'amazon',
  format TEXT NOT NULL DEFAULT 'xml',
  target_country TEXT DEFAULT 'FR',
  status TEXT DEFAULT 'draft',
  product_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  optimize_titles BOOLEAN DEFAULT true,
  optimize_descriptions BOOLEAN DEFAULT true,
  auto_categorize BOOLEAN DEFAULT true,
  update_frequency_hours INTEGER DEFAULT 24,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  next_update_at TIMESTAMP WITH TIME ZONE,
  feed_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create feed_generations table
CREATE TABLE IF NOT EXISTS public.feed_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.marketplace_feeds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  generation_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  total_products INTEGER DEFAULT 0,
  processed_products INTEGER DEFAULT 0,
  successful_products INTEGER DEFAULT 0,
  failed_products INTEGER DEFAULT 0,
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seo_templates table
CREATE TABLE IF NOT EXISTS public.seo_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  title_template TEXT DEFAULT '{brand} {product_name}',
  description_template TEXT DEFAULT '{description}',
  title_max_length INTEGER DEFAULT 200,
  description_max_length INTEGER DEFAULT 5000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create category_mapping_rules table
CREATE TABLE IF NOT EXISTS public.category_mapping_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_category TEXT NOT NULL,
  target_platform TEXT NOT NULL,
  target_category TEXT NOT NULL,
  target_category_id TEXT,
  confidence_score NUMERIC DEFAULT 0.0,
  is_manual BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, source_category, target_platform)
);

-- Create feed_products table
CREATE TABLE IF NOT EXISTS public.feed_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.marketplace_feeds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_product_id UUID,
  source_sku TEXT NOT NULL,
  optimized_title TEXT,
  optimized_description TEXT,
  optimized_category TEXT,
  platform_category_id TEXT,
  optimized_tags TEXT[],
  original_price NUMERIC,
  feed_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  optimized_images TEXT[],
  seo_score NUMERIC DEFAULT 0.0,
  title_score NUMERIC DEFAULT 0.0,
  description_score NUMERIC DEFAULT 0.0,
  image_score NUMERIC DEFAULT 0.0,
  is_excluded BOOLEAN DEFAULT false,
  exclusion_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(feed_id, source_sku)
);

-- Enable RLS on all tables
ALTER TABLE public.marketplace_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_feeds
CREATE POLICY "Users can view their own marketplace feeds"
  ON public.marketplace_feeds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own marketplace feeds"
  ON public.marketplace_feeds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace feeds"
  ON public.marketplace_feeds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace feeds"
  ON public.marketplace_feeds FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for feed_generations
CREATE POLICY "Users can view their own feed generations"
  ON public.feed_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feed generations"
  ON public.feed_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed generations"
  ON public.feed_generations FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for seo_templates
CREATE POLICY "Users can view their own seo templates"
  ON public.seo_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own seo templates"
  ON public.seo_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seo templates"
  ON public.seo_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seo templates"
  ON public.seo_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for category_mapping_rules
CREATE POLICY "Users can view their own category mappings"
  ON public.category_mapping_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category mappings"
  ON public.category_mapping_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category mappings"
  ON public.category_mapping_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category mappings"
  ON public.category_mapping_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for feed_products
CREATE POLICY "Users can view their own feed products"
  ON public.feed_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feed products"
  ON public.feed_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed products"
  ON public.feed_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed products"
  ON public.feed_products FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_feeds_user_id ON public.marketplace_feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_feeds_platform ON public.marketplace_feeds(platform);
CREATE INDEX IF NOT EXISTS idx_feed_generations_feed_id ON public.feed_generations(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_products_feed_id ON public.feed_products(feed_id);
CREATE INDEX IF NOT EXISTS idx_category_mapping_rules_user_platform ON public.category_mapping_rules(user_id, target_platform);