
-- ============================================================
-- PHASE 3: Drop unreferenced SEO tables (all empty, no code refs)
-- ============================================================
DROP TABLE IF EXISTS public.seo_metadata CASCADE;
DROP TABLE IF EXISTS public.seo_page_analysis CASCADE;
DROP TABLE IF EXISTS public.seo_competitor_analysis CASCADE;
DROP TABLE IF EXISTS public.seo_optimization_history CASCADE;
DROP TABLE IF EXISTS public.seo_backlinks CASCADE;
DROP TABLE IF EXISTS public.seo_reports CASCADE;
DROP TABLE IF EXISTS public.seo_scores CASCADE;

-- ============================================================
-- PHASE 4: Drop unreferenced Import tables (all empty, no code refs)
-- ============================================================
DROP TABLE IF EXISTS public.import_history CASCADE;
DROP TABLE IF EXISTS public.import_uploads CASCADE;
DROP TABLE IF EXISTS public.import_pipeline_logs CASCADE;

-- ============================================================
-- PHASE 5: Drop unreferenced misc tables (all empty, no code refs)
-- ============================================================
DROP TABLE IF EXISTS public.request_replay_log CASCADE;
DROP TABLE IF EXISTS public.gateway_logs CASCADE;
DROP TABLE IF EXISTS public.idempotency_keys CASCADE;
