
-- ============================================================
-- Phase 1: Tables manquantes pour Source of Truth produit
-- ============================================================

-- 1. stock_snapshots — Historique des niveaux de stock
CREATE TABLE IF NOT EXISTS public.stock_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.inventory_locations(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  snapshot_type TEXT NOT NULL DEFAULT 'daily' CHECK (snapshot_type IN ('hourly', 'daily', 'weekly', 'monthly', 'manual')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_stock_snapshots_product ON public.stock_snapshots(product_id, recorded_at DESC);
CREATE INDEX idx_stock_snapshots_user ON public.stock_snapshots(user_id, recorded_at DESC);

ALTER TABLE public.stock_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stock snapshots"
  ON public.stock_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. product_metrics — KPI produit (vues, ventes, conversion, revenus)
CREATE TABLE IF NOT EXISTS public.product_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  add_to_cart INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  units_sold INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0,
  return_rate NUMERIC(5,4) DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, period_type, period_start)
);

CREATE INDEX idx_product_metrics_product ON public.product_metrics(product_id, period_start DESC);
CREATE INDEX idx_product_metrics_user ON public.product_metrics(user_id, period_start DESC);

ALTER TABLE public.product_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own product metrics"
  ON public.product_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. store_products — Séparation catalogue canonique / boutique
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.store_integrations(id) ON DELETE CASCADE,
  external_product_id TEXT,
  external_variant_id TEXT,
  title_override TEXT,
  description_override TEXT,
  price_override NUMERIC(10,2),
  compare_at_price_override NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived', 'error')),
  is_synced BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  channel_specific_data JSONB DEFAULT '{}',
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, store_id)
);

CREATE INDEX idx_store_products_store ON public.store_products(store_id, status);
CREATE INDEX idx_store_products_product ON public.store_products(product_id);
CREATE INDEX idx_store_products_user ON public.store_products(user_id);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store products"
  ON public.store_products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_metrics_updated_at
  BEFORE UPDATE ON public.product_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
