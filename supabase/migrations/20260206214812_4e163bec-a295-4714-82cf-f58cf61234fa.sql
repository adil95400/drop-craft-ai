
-- ============================================================
-- SEO Module — 7 tables with RLS
-- ============================================================

-- A) seo_audits
CREATE TABLE public.seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NULL,
  mode TEXT NOT NULL CHECK (mode IN ('single_url','sitemap','crawl')),
  base_url TEXT NOT NULL,
  sitemap_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','canceled')),
  requested_by UUID NULL,
  max_urls INT NOT NULL DEFAULT 200,
  max_depth INT NULL,
  rate_limit_rps NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  respect_robots BOOLEAN NOT NULL DEFAULT true,
  include_query_params BOOLEAN NOT NULL DEFAULT false,
  page_type_filters JSONB NOT NULL DEFAULT '[]',
  url_patterns_include JSONB NOT NULL DEFAULT '[]',
  url_patterns_exclude JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NULL,
  finished_at TIMESTAMPTZ NULL,
  error_message TEXT NULL,
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_audits_user_created ON public.seo_audits (user_id, created_at DESC);
CREATE INDEX idx_seo_audits_status ON public.seo_audits (status);
CREATE INDEX idx_seo_audits_store ON public.seo_audits (store_id);

ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_audits" ON public.seo_audits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- B) seo_audit_pages
CREATE TABLE public.seo_audit_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.seo_audits(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  page_type TEXT NULL,
  http_status INT NULL,
  final_url TEXT NULL,
  redirect_chain JSONB NOT NULL DEFAULT '[]',
  title TEXT NULL,
  title_length INT NULL,
  meta_description TEXT NULL,
  meta_description_length INT NULL,
  h1 TEXT NULL,
  h1_count INT NULL,
  canonical_url TEXT NULL,
  robots_meta TEXT NULL,
  og_present BOOLEAN NULL,
  twitter_cards_present BOOLEAN NULL,
  word_count INT NULL,
  images_count INT NULL,
  images_missing_alt_count INT NULL,
  internal_links_out INT NULL,
  load_time_ms INT NULL,
  structured_data_types JSONB NOT NULL DEFAULT '[]',
  score INT NOT NULL DEFAULT 0,
  issues_summary JSONB NOT NULL DEFAULT '{}',
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audit_id, normalized_url)
);

CREATE INDEX idx_seo_audit_pages_audit ON public.seo_audit_pages (audit_id);
CREATE INDEX idx_seo_audit_pages_score ON public.seo_audit_pages (audit_id, score DESC);
CREATE INDEX idx_seo_audit_pages_type ON public.seo_audit_pages (audit_id, page_type);

ALTER TABLE public.seo_audit_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_audit_pages" ON public.seo_audit_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.seo_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.seo_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
  );

-- C) seo_issues
CREATE TABLE public.seo_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.seo_audits(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.seo_audit_pages(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical','major','minor','info')),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  recommendation TEXT NULL,
  is_fixable BOOLEAN NOT NULL DEFAULT false,
  fix_actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_issues_audit_severity ON public.seo_issues (audit_id, severity);
CREATE INDEX idx_seo_issues_page ON public.seo_issues (page_id);
CREATE INDEX idx_seo_issues_audit_code ON public.seo_issues (audit_id, code);

ALTER TABLE public.seo_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_issues" ON public.seo_issues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.seo_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.seo_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
  );

-- D) seo_keywords
CREATE TABLE public.seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NULL,
  keyword TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  country TEXT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id, keyword, language)
);

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_keywords" ON public.seo_keywords
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- E) seo_keyword_snapshots
CREATE TABLE public.seo_keyword_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_engine TEXT NOT NULL DEFAULT 'google',
  position INT NULL,
  search_volume INT NULL,
  difficulty INT NULL,
  cpc NUMERIC(10,2) NULL,
  url TEXT NULL,
  source TEXT NULL,
  raw JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_seo_keyword_snapshots_kw_date ON public.seo_keyword_snapshots (keyword_id, captured_at DESC);

ALTER TABLE public.seo_keyword_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_keyword_snapshots" ON public.seo_keyword_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.seo_keywords k WHERE k.id = keyword_id AND k.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.seo_keywords k WHERE k.id = keyword_id AND k.user_id = auth.uid())
  );

-- F) seo_ai_generations
CREATE TABLE public.seo_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  audit_id UUID NULL REFERENCES public.seo_audits(id) ON DELETE SET NULL,
  page_id UUID NULL REFERENCES public.seo_audit_pages(id) ON DELETE SET NULL,
  url TEXT NULL,
  type TEXT NOT NULL CHECK (type IN ('meta_description','title','h1','alt_text','faq')),
  language TEXT NOT NULL DEFAULT 'fr',
  tone TEXT NOT NULL DEFAULT 'professional',
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  tokens_used INT NULL,
  cost_usd NUMERIC(10,4) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_ai_gen_user ON public.seo_ai_generations (user_id, created_at DESC);
CREATE INDEX idx_seo_ai_gen_audit ON public.seo_ai_generations (audit_id);
CREATE INDEX idx_seo_ai_gen_page ON public.seo_ai_generations (page_id);

ALTER TABLE public.seo_ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_ai_generations" ON public.seo_ai_generations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- G) seo_fix_applies
CREATE TABLE public.seo_fix_applies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NULL,
  page_id UUID NULL REFERENCES public.seo_audit_pages(id) ON DELETE SET NULL,
  product_id UUID NULL,
  action TEXT NOT NULL CHECK (action IN ('APPLY_TITLE','APPLY_META','APPLY_H1','APPLY_ALT','APPLY_CANONICAL')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  job_id UUID NULL,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_fix_applies_user ON public.seo_fix_applies (user_id, created_at DESC);
CREATE INDEX idx_seo_fix_applies_status ON public.seo_fix_applies (status);

ALTER TABLE public.seo_fix_applies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seo_fix_applies" ON public.seo_fix_applies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at for seo_audits
CREATE TRIGGER update_seo_audits_updated_at
  BEFORE UPDATE ON public.seo_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
