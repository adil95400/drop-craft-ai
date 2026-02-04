-- ============================================================================
-- IMPORT SYSTEM - Add missing columns and tables v3.3
-- ============================================================================

-- 1) Add expires_at to extension_requests
ALTER TABLE public.extension_requests 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');

-- Update existing NULL values
UPDATE public.extension_requests 
SET expires_at = created_at + interval '30 days' 
WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_extension_requests_expires ON public.extension_requests(expires_at);

-- 2) Product import jobs table (if not exists)
CREATE TABLE IF NOT EXISTS public.product_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  field_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_import_jobs_user ON public.product_import_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_import_jobs_status ON public.product_import_jobs(status, created_at DESC);

-- 3) Add missing columns to imported_products
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Copy name to title if title is null
UPDATE public.imported_products 
SET title = name 
WHERE title IS NULL AND name IS NOT NULL;

ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS field_sources JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS field_confidence JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS description_text TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_imported_products_job ON public.imported_products(job_id);
CREATE INDEX IF NOT EXISTS idx_imported_products_completeness ON public.imported_products(completeness_score DESC);

-- 4) Product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  source_url TEXT,
  rating NUMERIC,
  title TEXT,
  text TEXT,
  author TEXT,
  author_verified BOOLEAN DEFAULT false,
  country TEXT,
  review_date TIMESTAMPTZ,
  helpful_count INT DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  source TEXT DEFAULT 'scrape',
  language TEXT,
  sentiment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON public.product_reviews(user_id);

-- 5) Security events table  
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_import_jobs_updated ON public.product_import_jobs;
CREATE TRIGGER trg_product_import_jobs_updated
  BEFORE UPDATE ON public.product_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.product_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Product import jobs
DROP POLICY IF EXISTS "product_import_jobs_select" ON public.product_import_jobs;
CREATE POLICY "product_import_jobs_select" ON public.product_import_jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "product_import_jobs_insert" ON public.product_import_jobs;
CREATE POLICY "product_import_jobs_insert" ON public.product_import_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "product_import_jobs_update" ON public.product_import_jobs;
CREATE POLICY "product_import_jobs_update" ON public.product_import_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Product reviews
DROP POLICY IF EXISTS "product_reviews_select" ON public.product_reviews;
CREATE POLICY "product_reviews_select" ON public.product_reviews
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "product_reviews_insert" ON public.product_reviews;
CREATE POLICY "product_reviews_insert" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security events
DROP POLICY IF EXISTS "security_events_user_select" ON public.security_events;
CREATE POLICY "security_events_user_select" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_import_records()
RETURNS TABLE(deleted_requests INT, deleted_keys INT) AS $$
DECLARE
  req_count INT;
  key_count INT;
BEGIN
  DELETE FROM public.extension_requests WHERE expires_at < now();
  GET DIAGNOSTICS req_count = ROW_COUNT;
  
  DELETE FROM public.idempotency_keys WHERE expires_at < now();
  GET DIAGNOSTICS key_count = ROW_COUNT;
  
  RETURN QUERY SELECT req_count, key_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_import_job_with_product(p_job_id UUID, p_user_id UUID)
RETURNS TABLE(job_data JSONB, product_data JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(j.*) as job_data,
    CASE WHEN p.id IS NOT NULL THEN to_jsonb(p.*) ELSE NULL END as product_data
  FROM public.product_import_jobs j
  LEFT JOIN public.imported_products p ON p.job_id = j.id
  WHERE j.id = p_job_id AND j.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;