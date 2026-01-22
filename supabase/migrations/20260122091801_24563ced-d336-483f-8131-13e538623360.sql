-- Extension MVP Tables for Shopopti+

-- Product Sources (for stock sync tracking)
CREATE TABLE IF NOT EXISTS public.product_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.imported_products(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  source_url TEXT,
  source_data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source_platform, external_product_id)
);

-- Stock Sync Jobs
CREATE TABLE IF NOT EXISTS public.stock_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID,
  source_id UUID REFERENCES public.product_sources(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Sync Logs
CREATE TABLE IF NOT EXISTS public.stock_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID,
  source_id UUID,
  sync_type TEXT DEFAULT 'manual',
  previous_stock INTEGER,
  new_stock INTEGER,
  previous_price NUMERIC,
  new_price NUMERIC,
  changes TEXT[],
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Settings (for import rules)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  import_rules JSONB DEFAULT '{"pricing":{"enabled":true,"markupType":"percentage","markupValue":30},"currency":"EUR","defaultStatus":"draft"}',
  notification_preferences JSONB DEFAULT '{}',
  extension_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their product sources" ON public.product_sources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their sync jobs" ON public.stock_sync_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their sync logs" ON public.stock_sync_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Service role policies for edge functions
CREATE POLICY "Service role full access product_sources" ON public.product_sources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access sync_jobs" ON public.stock_sync_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access sync_logs" ON public.stock_sync_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access user_settings" ON public.user_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_sources_user ON public.product_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_product_sources_product ON public.product_sources(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_sync_jobs_user ON public.stock_sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_sync_logs_user ON public.stock_sync_logs(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_product_sources_updated_at BEFORE UPDATE ON public.product_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();