
-- ══════════════════════════════════════════════════════════════
-- SEO Professional Module: Tables + Quota fix
-- ══════════════════════════════════════════════════════════════

-- 1. seo_audits — structured audit records
CREATE TABLE IF NOT EXISTS public.seo_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'product', -- product | category | site | url
  target_id TEXT,
  url TEXT,
  score_global INTEGER DEFAULT 0,
  score_title INTEGER DEFAULT 0,
  score_meta INTEGER DEFAULT 0,
  score_keywords INTEGER DEFAULT 0,
  score_structure INTEGER DEFAULT 0,
  score_content INTEGER DEFAULT 0,
  score_images INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  issues JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  provider TEXT DEFAULT 'openai',
  language TEXT DEFAULT 'fr',
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own seo_audits" ON public.seo_audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own seo_audits" ON public.seo_audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own seo_audits" ON public.seo_audits FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_seo_audits_user ON public.seo_audits(user_id);
CREATE INDEX idx_seo_audits_target ON public.seo_audits(target_type, target_id);

-- 2. seo_scores — latest score snapshot per product
CREATE TABLE IF NOT EXISTS public.seo_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  score_global INTEGER DEFAULT 0,
  score_title INTEGER DEFAULT 0,
  score_meta INTEGER DEFAULT 0,
  score_keywords INTEGER DEFAULT 0,
  score_structure INTEGER DEFAULT 0,
  score_content INTEGER DEFAULT 0,
  score_images INTEGER DEFAULT 0,
  score_ai_readiness INTEGER DEFAULT 0,
  status TEXT DEFAULT 'needs_work', -- optimized | needs_work | critical
  issues_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  estimated_traffic_gain NUMERIC(5,2) DEFAULT 0,
  estimated_conversion_gain NUMERIC(5,2) DEFAULT 0,
  estimated_ctr NUMERIC(5,2),
  estimated_ranking_potential TEXT, -- top10 | top20 | top50 | low
  priority TEXT DEFAULT 'normal', -- urgent | high | normal
  last_audit_id UUID REFERENCES public.seo_audits(id),
  last_audit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.seo_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own seo_scores" ON public.seo_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own seo_scores" ON public.seo_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own seo_scores" ON public.seo_scores FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_seo_scores_user ON public.seo_scores(user_id);
CREATE INDEX idx_seo_scores_status ON public.seo_scores(status);

-- 3. seo_history_snapshots — versioned score history
CREATE TABLE IF NOT EXISTS public.seo_history_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  audit_id UUID REFERENCES public.seo_audits(id),
  version INTEGER NOT NULL DEFAULT 1,
  score_global INTEGER DEFAULT 0,
  score_title INTEGER DEFAULT 0,
  score_meta INTEGER DEFAULT 0,
  score_keywords INTEGER DEFAULT 0,
  score_structure INTEGER DEFAULT 0,
  scores_detail JSONB DEFAULT '{}'::jsonb,
  fields_before JSONB DEFAULT '{}'::jsonb,
  fields_after JSONB DEFAULT '{}'::jsonb,
  change_source TEXT DEFAULT 'manual', -- manual | ai_generation | bulk | api
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_history_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own seo_history" ON public.seo_history_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own seo_history" ON public.seo_history_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_seo_history_product ON public.seo_history_snapshots(user_id, product_id);

-- 4. seo_generation_logs — AI generation tracking
CREATE TABLE IF NOT EXISTS public.seo_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT,
  job_id TEXT,
  actions TEXT[] DEFAULT '{}',
  tone TEXT DEFAULT 'conversion',
  language TEXT DEFAULT 'fr',
  provider TEXT DEFAULT 'openai',
  model TEXT DEFAULT 'gpt-4.1-mini',
  prompt_hash TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  duration_ms INTEGER,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- pending | completed | failed | cached
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own seo_gen_logs" ON public.seo_generation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own seo_gen_logs" ON public.seo_generation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_seo_gen_logs_user ON public.seo_generation_logs(user_id);
CREATE INDEX idx_seo_gen_logs_hash ON public.seo_generation_logs(prompt_hash);

-- 5. seo_quota_usage — monthly SEO-specific usage counters
CREATE TABLE IF NOT EXISTS public.seo_quota_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month TEXT NOT NULL, -- e.g. '2026-02'
  seo_audits_used INTEGER DEFAULT 0,
  seo_category_audits_used INTEGER DEFAULT 0,
  seo_site_audits_used INTEGER DEFAULT 0,
  seo_generations_used INTEGER DEFAULT 0,
  seo_applies_used INTEGER DEFAULT 0,
  seo_bulk_used INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  ai_cost_usd NUMERIC(10,4) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.seo_quota_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own seo_quota" ON public.seo_quota_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own seo_quota" ON public.seo_quota_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own seo_quota" ON public.seo_quota_usage FOR UPDATE USING (auth.uid() = user_id);

-- 6. Fix quota consistency: strictly increasing across plans
-- Delete old SEO entries and reinsert properly
DELETE FROM public.plan_limits WHERE limit_key IN (
  'seo_audits', 'seo_generations', 'seo_applies',
  'seo_category_audits', 'seo_site_audits', 'seo_languages',
  'seo_bulk_limit', 'seo_history_days'
);

-- FREE (= Basic)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description) VALUES
  ('free', 'seo_audits', 20, 'SEO product audits per month'),
  ('free', 'seo_category_audits', 5, 'SEO category audits per month'),
  ('free', 'seo_site_audits', 0, 'SEO site audits per month'),
  ('free', 'seo_generations', 50, 'AI SEO generations per month'),
  ('free', 'seo_applies', 10, 'SEO optimizations applied per month'),
  ('free', 'seo_languages', 1, 'Supported SEO languages'),
  ('free', 'seo_bulk_limit', 0, 'Max products per bulk optimization'),
  ('free', 'seo_history_days', 0, 'SEO history retention in days');

-- STANDARD (= Pro)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description) VALUES
  ('standard', 'seo_audits', 150, 'SEO product audits per month'),
  ('standard', 'seo_category_audits', 30, 'SEO category audits per month'),
  ('standard', 'seo_site_audits', 10, 'SEO site audits per month'),
  ('standard', 'seo_generations', 400, 'AI SEO generations per month'),
  ('standard', 'seo_applies', 100, 'SEO optimizations applied per month'),
  ('standard', 'seo_languages', 3, 'Supported SEO languages'),
  ('standard', 'seo_bulk_limit', 50, 'Max products per bulk optimization'),
  ('standard', 'seo_history_days', 90, 'SEO history retention in days');

-- PRO (= Advanced)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description) VALUES
  ('pro', 'seo_audits', 1000, 'SEO product audits per month'),
  ('pro', 'seo_category_audits', 200, 'SEO category audits per month'),
  ('pro', 'seo_site_audits', 50, 'SEO site audits per month'),
  ('pro', 'seo_generations', 3000, 'AI SEO generations per month'),
  ('pro', 'seo_applies', -1, 'SEO optimizations applied per month (unlimited)'),
  ('pro', 'seo_languages', -1, 'Supported SEO languages (unlimited)'),
  ('pro', 'seo_bulk_limit', -1, 'Max products per bulk optimization (unlimited)'),
  ('pro', 'seo_history_days', -1, 'SEO history retention in days (unlimited)');

-- ULTRA_PRO (= if exists, same as pro but all unlimited)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description) VALUES
  ('ultra_pro', 'seo_audits', -1, 'SEO product audits (unlimited)'),
  ('ultra_pro', 'seo_category_audits', -1, 'SEO category audits (unlimited)'),
  ('ultra_pro', 'seo_site_audits', -1, 'SEO site audits (unlimited)'),
  ('ultra_pro', 'seo_generations', -1, 'AI SEO generations (unlimited)'),
  ('ultra_pro', 'seo_applies', -1, 'SEO optimizations applied (unlimited)'),
  ('ultra_pro', 'seo_languages', -1, 'Supported SEO languages (unlimited)'),
  ('ultra_pro', 'seo_bulk_limit', -1, 'Max products per bulk optimization (unlimited)'),
  ('ultra_pro', 'seo_history_days', -1, 'SEO history retention (unlimited)')
ON CONFLICT DO NOTHING;

-- Trigger for updated_at on seo_scores
CREATE OR REPLACE FUNCTION public.update_seo_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_seo_scores_updated_at
  BEFORE UPDATE ON public.seo_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_seo_scores_updated_at();
