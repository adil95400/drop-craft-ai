
-- ============================================================
-- SEO Module V1 — Extend existing tables for API V1 compatibility
-- ============================================================

-- Add missing columns to seo_audits for V1 API compatibility
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'url';
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS target_id TEXT;
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'full';
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE public.seo_audits ADD COLUMN IF NOT EXISTS score INTEGER;

-- Add missing columns to seo_ai_generations for V1 API compatibility (rename-compatible)
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'product';
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS target_id TEXT;
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS actions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE public.seo_ai_generations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add indexes for V1 API queries
CREATE INDEX IF NOT EXISTS idx_seo_audits_user_v1 ON public.seo_audits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audits_target_v1 ON public.seo_audits(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_seo_ai_gen_user_v1 ON public.seo_ai_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_ai_gen_target_v1 ON public.seo_ai_generations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_audit ON public.seo_issues(audit_id);
