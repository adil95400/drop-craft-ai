-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS feed_products CASCADE;
DROP TABLE IF EXISTS feed_generations CASCADE;
DROP TABLE IF EXISTS category_mapping_rules CASCADE;
DROP TABLE IF EXISTS seo_templates CASCADE;
DROP TABLE IF EXISTS marketplace_feeds CASCADE;

-- Create marketplace_feeds table
CREATE TABLE marketplace_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'xml',
  target_country TEXT DEFAULT 'FR',
  status TEXT NOT NULL DEFAULT 'draft',
  product_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ,
  next_update_at TIMESTAMPTZ,
  update_frequency_hours INTEGER DEFAULT 24,
  optimize_titles BOOLEAN DEFAULT true,
  optimize_descriptions BOOLEAN DEFAULT true,
  auto_categorize BOOLEAN DEFAULT true,
  feed_url TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create feed_generations table
CREATE TABLE feed_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES marketplace_feeds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_products INTEGER DEFAULT 0,
  processed_products INTEGER DEFAULT 0,
  successful_products INTEGER DEFAULT 0,
  failed_products INTEGER DEFAULT 0,
  output_url TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create feed_products table
CREATE TABLE feed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES marketplace_feeds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_product_id UUID,
  source_sku TEXT NOT NULL,
  optimized_title TEXT,
  optimized_description TEXT,
  optimized_category TEXT,
  platform_category_id TEXT,
  optimized_tags TEXT[],
  optimized_images TEXT[],
  original_price DECIMAL(10,2),
  feed_price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  seo_score DECIMAL(3,2),
  title_score DECIMAL(3,2),
  description_score DECIMAL(3,2),
  image_score DECIMAL(3,2),
  validation_errors JSONB,
  is_excluded BOOLEAN DEFAULT false,
  excluded_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feed_id, source_sku)
);

-- Create seo_templates table
CREATE TABLE seo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  template_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  title_template TEXT DEFAULT '{brand} {product_name}',
  title_max_length INTEGER DEFAULT 200,
  description_template TEXT DEFAULT '{description}',
  description_max_length INTEGER DEFAULT 5000,
  keywords_strategy TEXT DEFAULT 'auto',
  forbidden_words TEXT[],
  required_attributes TEXT[],
  image_requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, template_name)
);

-- Create category_mapping_rules table
CREATE TABLE category_mapping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_category TEXT NOT NULL,
  target_platform TEXT NOT NULL,
  target_category TEXT NOT NULL,
  target_category_id TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.90,
  is_manual BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source_category, target_platform)
);

-- Create indexes for performance
CREATE INDEX idx_marketplace_feeds_user ON marketplace_feeds(user_id);
CREATE INDEX idx_marketplace_feeds_status ON marketplace_feeds(status);
CREATE INDEX idx_feed_generations_feed ON feed_generations(feed_id);
CREATE INDEX idx_feed_products_feed ON feed_products(feed_id);
CREATE INDEX idx_feed_products_sku ON feed_products(source_sku);
CREATE INDEX idx_seo_templates_user_platform ON seo_templates(user_id, platform);
CREATE INDEX idx_category_mapping_user_platform ON category_mapping_rules(user_id, target_platform);

-- Enable RLS
ALTER TABLE marketplace_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mapping_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_feeds
CREATE POLICY "Users can view own feeds" ON marketplace_feeds
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feeds" ON marketplace_feeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feeds" ON marketplace_feeds
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feeds" ON marketplace_feeds
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for feed_generations
CREATE POLICY "Users can view own generations" ON feed_generations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own generations" ON feed_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON feed_generations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for feed_products
CREATE POLICY "Users can view own feed products" ON feed_products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feed products" ON feed_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feed products" ON feed_products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feed products" ON feed_products
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for seo_templates
CREATE POLICY "Users can view own templates" ON seo_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON seo_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON seo_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON seo_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for category_mapping_rules
CREATE POLICY "Users can view own mappings" ON category_mapping_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mappings" ON category_mapping_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mappings" ON category_mapping_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mappings" ON category_mapping_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_feeds_updated_at BEFORE UPDATE ON marketplace_feeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_products_updated_at BEFORE UPDATE ON feed_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_templates_updated_at BEFORE UPDATE ON seo_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_mapping_rules_updated_at BEFORE UPDATE ON category_mapping_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();