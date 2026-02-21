
-- =============================================================
-- Table: stock_sync_configs — Configuration sync stock par fournisseur
-- =============================================================
CREATE TABLE IF NOT EXISTS public.stock_sync_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  out_of_stock_action TEXT NOT NULL DEFAULT 'notify' CHECK (out_of_stock_action IN ('pause','notify','hide')),
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  total_syncs INTEGER NOT NULL DEFAULT 0,
  failed_syncs INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

ALTER TABLE public.stock_sync_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stock sync configs"
  ON public.stock_sync_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_stock_sync_configs_updated_at
  BEFORE UPDATE ON public.stock_sync_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- Table: stock_history — Historique des mouvements de stock
-- =============================================================
CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_source TEXT NOT NULL DEFAULT 'products',
  previous_quantity INTEGER NOT NULL DEFAULT 0,
  new_quantity INTEGER NOT NULL DEFAULT 0,
  change_amount INTEGER NOT NULL DEFAULT 0,
  change_reason TEXT NOT NULL DEFAULT 'manual',
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  sync_config_id UUID REFERENCES public.stock_sync_configs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stock history"
  ON public.stock_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own stock history"
  ON public.stock_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_stock_history_user_product ON public.stock_history (user_id, product_id);
CREATE INDEX idx_stock_history_created_at ON public.stock_history (created_at DESC);

-- Enable Realtime on stock_history for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_history;

-- Also enable Realtime on supplier_products for stock change notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_products;
