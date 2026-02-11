
-- ============================================================
-- PHASE 1: ALTER existing tables
-- ============================================================

-- products: add 3 columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_language text DEFAULT 'fr';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_html text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image_url text;

-- product_variants: add 3 columns
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'g';
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- stores: add 1 column
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS access_token_encrypted text;

-- ============================================================
-- PHASE 2: CREATE 14 new tables + indexes + RLS
-- ============================================================

-- 1) product_tags
CREATE TABLE public.product_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tags" ON public.product_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) product_tag_links
CREATE TABLE public.product_tag_links (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE public.product_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tag links" ON public.product_tag_links FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid()));

-- 3) product_collections
CREATE TABLE public.product_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.product_collections(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collections" ON public.product_collections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_product_collections_user ON public.product_collections(user_id);

-- 4) product_collection_links
CREATE TABLE public.product_collection_links (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.product_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);
ALTER TABLE public.product_collection_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collection links" ON public.product_collection_links FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid()));

-- 5) product_costs
CREATE TABLE public.product_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'EUR',
  cost_amount numeric(12,2) NOT NULL DEFAULT 0,
  shipping_cost_amount numeric(12,2),
  landed_cost_amount numeric(12,2),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('supplier','manual','estimate')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own costs" ON public.product_costs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_product_costs_variant ON public.product_costs(user_id, variant_id);

-- 6) pricing_rulesets
CREATE TABLE public.pricing_rulesets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  name text NOT NULL,
  rules_json jsonb NOT NULL DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_rulesets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rulesets" ON public.pricing_rulesets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7) product_prices
CREATE TABLE public.product_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  currency text NOT NULL DEFAULT 'EUR',
  price_amount numeric(12,2) NOT NULL DEFAULT 0,
  compare_at_amount numeric(12,2),
  pricing_ruleset_id uuid REFERENCES public.pricing_rulesets(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prices" ON public.product_prices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_product_prices_variant ON public.product_prices(user_id, variant_id);
CREATE INDEX idx_product_prices_store ON public.product_prices(store_id, variant_id);

-- 8) inventory_locations
CREATE TABLE public.inventory_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'warehouse' CHECK (type IN ('supplier','warehouse','store')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own locations" ON public.inventory_locations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9) inventory_levels
CREATE TABLE public.inventory_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
  qty_available int NOT NULL DEFAULT 0,
  qty_reserved int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own levels" ON public.inventory_levels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_inventory_levels_variant ON public.inventory_levels(user_id, variant_id);
CREATE INDEX idx_inventory_levels_location ON public.inventory_levels(location_id);

-- 10) product_seo
CREATE TABLE public.product_seo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  language text NOT NULL DEFAULT 'fr',
  handle text,
  seo_title text,
  meta_description text,
  canonical_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, store_id, language)
);
ALTER TABLE public.product_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own seo" ON public.product_seo FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11) product_seo_versions
CREATE TABLE public.product_seo_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  language text NOT NULL DEFAULT 'fr',
  version int NOT NULL DEFAULT 1,
  fields_json jsonb NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai','import','sync')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_seo_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own seo versions" ON public.product_seo_versions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_seo_versions_product ON public.product_seo_versions(product_id, store_id, language);

-- 12) ai_generations
CREATE TABLE public.ai_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('product','variant','seo_audit','collection')),
  target_id uuid NOT NULL,
  task text NOT NULL CHECK (task IN ('seo_title','meta_desc','tags','category','rewrite_desc')),
  language text NOT NULL DEFAULT 'fr',
  provider text NOT NULL DEFAULT 'lovable' CHECK (provider IN ('openai','lovable','other')),
  model text,
  prompt_hash text,
  input_json jsonb NOT NULL DEFAULT '{}',
  output_json jsonb NOT NULL DEFAULT '{}',
  cost_usd numeric(10,6),
  tokens_in int,
  tokens_out int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own generations" ON public.ai_generations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ai_gen_target ON public.ai_generations(user_id, target_type, target_id);
CREATE INDEX idx_ai_gen_hash ON public.ai_generations(prompt_hash);

-- 13) store_variants
CREATE TABLE public.store_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  external_variant_id text NOT NULL,
  external_inventory_item_id text,
  last_synced_at timestamptz,
  UNIQUE(store_id, external_variant_id)
);
ALTER TABLE public.store_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store variants" ON public.store_variants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_store_variants_variant ON public.store_variants(variant_id);

-- 14) product_events
CREATE TABLE public.product_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('created','updated','synced','price_changed','stock_changed','seo_applied','ai_generated')),
  actor_type text NOT NULL DEFAULT 'system' CHECK (actor_type IN ('user','system','webhook')),
  actor_id text,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.product_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_product_events_product ON public.product_events(user_id, product_id);
CREATE INDEX idx_product_events_created ON public.product_events(created_at DESC);
