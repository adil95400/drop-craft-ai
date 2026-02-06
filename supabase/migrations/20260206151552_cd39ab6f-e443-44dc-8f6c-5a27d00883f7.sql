
-- =============================================
-- PHASE 1: SCHÉMA DB UNIFIÉ - SHOPOTI
-- =============================================

-- 1. STORES & CONNECTIONS
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'prestashop', 'other')),
  name TEXT NOT NULL,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  encrypted_credentials TEXT,
  scopes TEXT[],
  connected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PRODUCT VARIANTS (normalisation catalogue)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  title TEXT,
  price NUMERIC(12,2),
  cost_price NUMERIC(12,2),
  compare_at_price NUMERIC(12,2),
  inventory_qty INTEGER DEFAULT 0,
  weight NUMERIC(8,2),
  weight_unit TEXT DEFAULT 'kg',
  option1_name TEXT,
  option1_value TEXT,
  option2_name TEXT,
  option2_value TEXT,
  option3_name TEXT,
  option3_value TEXT,
  barcode TEXT,
  is_default BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT false,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PRODUCT <-> STORE LINKS (multi-boutique)
CREATE TABLE IF NOT EXISTS public.product_store_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  external_product_id TEXT,
  external_variant_ids JSONB DEFAULT '[]',
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'outdated')),
  published BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, store_id)
);

-- 5. PRICING RULES
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('margin_percent', 'margin_fixed', 'markup', 'round', 'competitor', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  applies_to JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_pricing_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE SET NULL,
  computed_price NUMERIC(12,2),
  base_cost NUMERIC(12,2),
  margin_percent NUMERIC(6,2),
  margin_amount NUMERIC(12,2),
  last_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_id)
);

-- 6. JOBS & JOB ITEMS (système unifié)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('sync', 'import', 'export', 'pricing', 'ai_enrich', 'bulk_edit', 'publish', 'unpublish')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'skipped')),
  message TEXT,
  before_state JSONB,
  after_state JSONB,
  error_code TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ENRICHIR TABLE PRODUCTS (colonnes manquantes)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='tags') THEN
    ALTER TABLE public.products ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='product_type') THEN
    ALTER TABLE public.products ADD COLUMN product_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='vendor') THEN
    ALTER TABLE public.products ADD COLUMN vendor TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='weight') THEN
    ALTER TABLE public.products ADD COLUMN weight NUMERIC(8,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='weight_unit') THEN
    ALTER TABLE public.products ADD COLUMN weight_unit TEXT DEFAULT 'kg';
  END IF;
END $$;

-- 8. INDEXES PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_user_status ON public.products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_user_category ON public.products(user_id, category);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_store_links_product ON public.product_store_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_store_links_store ON public.product_store_links(store_id);
CREATE INDEX IF NOT EXISTS idx_product_store_links_sync ON public.product_store_links(sync_status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_items_job ON public.job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_items_product ON public.job_items(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_user ON public.pricing_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user ON public.stores(user_id);

-- 9. RLS POLICIES
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_store_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- stores: user owns
CREATE POLICY "stores_select" ON public.stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stores_insert" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stores_update" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stores_delete" ON public.stores FOR DELETE USING (auth.uid() = user_id);

-- store_connections: via store ownership
CREATE POLICY "store_connections_select" ON public.store_connections FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_connections.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "store_connections_insert" ON public.store_connections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_connections.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "store_connections_update" ON public.store_connections FOR UPDATE USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_connections.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "store_connections_delete" ON public.store_connections FOR DELETE USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_connections.store_id AND stores.user_id = auth.uid()));

-- product_variants: via product ownership
CREATE POLICY "product_variants_select" ON public.product_variants FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_variants_insert" ON public.product_variants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_variants_update" ON public.product_variants FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_variants_delete" ON public.product_variants FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));

-- product_images: via product ownership
CREATE POLICY "product_images_select" ON public.product_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_images_insert" ON public.product_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_images_update" ON public.product_images FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_images_delete" ON public.product_images FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.user_id = auth.uid()));

-- product_store_links: via product ownership
CREATE POLICY "product_store_links_select" ON public.product_store_links FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_store_links.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_store_links_insert" ON public.product_store_links FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_store_links.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_store_links_update" ON public.product_store_links FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_store_links.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_store_links_delete" ON public.product_store_links FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_store_links.product_id AND products.user_id = auth.uid()));

-- pricing_rules: user owns
CREATE POLICY "pricing_rules_select" ON public.pricing_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pricing_rules_insert" ON public.pricing_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pricing_rules_update" ON public.pricing_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pricing_rules_delete" ON public.pricing_rules FOR DELETE USING (auth.uid() = user_id);

-- product_pricing_state: via product ownership
CREATE POLICY "product_pricing_state_select" ON public.product_pricing_state FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_pricing_state.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_pricing_state_insert" ON public.product_pricing_state FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_pricing_state.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_pricing_state_update" ON public.product_pricing_state FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_pricing_state.product_id AND products.user_id = auth.uid()));
CREATE POLICY "product_pricing_state_delete" ON public.product_pricing_state FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_pricing_state.product_id AND products.user_id = auth.uid()));

-- jobs: user owns
CREATE POLICY "jobs_select" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "jobs_insert" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_update" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "jobs_delete" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- job_items: via job ownership
CREATE POLICY "job_items_select" ON public.job_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "job_items_insert" ON public.job_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "job_items_update" ON public.job_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "job_items_delete" ON public.job_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));

-- 10. TRIGGERS updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_updated_at_stores BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_store_connections BEFORE UPDATE ON public.store_connections FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_product_variants BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_product_store_links BEFORE UPDATE ON public.product_store_links FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_pricing_rules BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_product_pricing_state BEFORE UPDATE ON public.product_pricing_state FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_jobs BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 11. REALTIME pour jobs (suivi progression)
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_items;
