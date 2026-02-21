
-- Feed diagnostics reports table
CREATE TABLE public.feed_diagnostic_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'google_shopping', 'shopify', 'facebook', 'amazon'
  report_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_products INTEGER DEFAULT 0,
  valid_products INTEGER DEFAULT 0,
  warning_products INTEGER DEFAULT 0,
  error_products INTEGER DEFAULT 0,
  score NUMERIC(5,2) DEFAULT 0, -- 0-100 quality score
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_diagnostic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feed reports"
  ON public.feed_diagnostic_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feed reports"
  ON public.feed_diagnostic_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feed reports"
  ON public.feed_diagnostic_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Feed diagnostic items (per-product issues)
CREATE TABLE public.feed_diagnostic_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.feed_diagnostic_reports(id) ON DELETE CASCADE,
  product_id UUID,
  product_title TEXT,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'error', 'warning', 'info'
  rule_code TEXT NOT NULL, -- e.g. 'MISSING_GTIN', 'TITLE_TOO_SHORT'
  field_name TEXT, -- affected field
  message TEXT NOT NULL,
  suggestion TEXT, -- auto-fix suggestion
  current_value TEXT,
  expected_value TEXT,
  auto_fixable BOOLEAN DEFAULT false,
  fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_diagnostic_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feed items via report"
  ON public.feed_diagnostic_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.feed_diagnostic_reports r
    WHERE r.id = feed_diagnostic_items.report_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "System can insert feed items"
  ON public.feed_diagnostic_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.feed_diagnostic_reports r
    WHERE r.id = feed_diagnostic_items.report_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can update feed items"
  ON public.feed_diagnostic_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.feed_diagnostic_reports r
    WHERE r.id = feed_diagnostic_items.report_id AND r.user_id = auth.uid()
  ));

-- Saved product views table (for chantier 3)
CREATE TABLE public.saved_product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  sort_config JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_preset BOOLEAN DEFAULT false, -- system presets
  icon TEXT,
  color TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own views"
  ON public.saved_product_views FOR ALL
  USING (auth.uid() = user_id);

-- AI auto-action config table (for chantier 2)
CREATE TABLE public.ai_auto_action_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'optimize_title', 'optimize_description', 'suggest_price', 'generate_tags', 'fix_seo'
  is_enabled BOOLEAN DEFAULT false,
  threshold_score NUMERIC(5,2) DEFAULT 70, -- min score to auto-apply
  scope TEXT DEFAULT 'all', -- 'all', 'draft', 'active'
  max_daily_actions INTEGER DEFAULT 50,
  actions_today INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_auto_action_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI configs"
  ON public.ai_auto_action_configs FOR ALL
  USING (auth.uid() = user_id);

-- AI auto-action logs
CREATE TABLE public.ai_auto_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_id UUID REFERENCES public.ai_auto_action_configs(id) ON DELETE SET NULL,
  product_id UUID,
  action_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  confidence_score NUMERIC(5,2),
  status TEXT DEFAULT 'applied', -- 'applied', 'rejected', 'reverted'
  reverted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_auto_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI logs"
  ON public.ai_auto_action_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_feed_diag_reports_user ON public.feed_diagnostic_reports(user_id, channel);
CREATE INDEX idx_feed_diag_items_report ON public.feed_diagnostic_items(report_id, severity);
CREATE INDEX idx_saved_views_user ON public.saved_product_views(user_id);
CREATE INDEX idx_ai_auto_configs_user ON public.ai_auto_action_configs(user_id, action_type);
CREATE INDEX idx_ai_auto_logs_user ON public.ai_auto_action_logs(user_id, created_at DESC);
