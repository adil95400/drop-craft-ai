-- ============================================================================
-- Migration: Add USE_NEW_IMPORT_PIPELINE feature flag and pipeline logging
-- ============================================================================

-- 1) Insert the new import pipeline feature flag (using correct column name 'key')
INSERT INTO public.feature_flags (key, name, description, is_enabled, category, rollout_percentage, metadata)
VALUES (
  'import.pipeline.v3',
  'New Import Pipeline V3',
  'Enable the new Backend-First import orchestrator with HeadlessScraper for supported platforms',
  true,
  'import',
  100,
  jsonb_build_object(
    'supported_platforms', ARRAY['amazon', 'temu'],
    'fallback_enabled', true,
    'version', '3.1'
  )
)
ON CONFLICT (key) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  rollout_percentage = EXCLUDED.rollout_percentage,
  updated_at = now();

-- 2) Create table for pipeline routing logs (A/B test monitoring)
CREATE TABLE IF NOT EXISTS public.import_pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_id UUID NOT NULL,
  
  -- Routing decision
  platform TEXT NOT NULL,
  source_url TEXT NOT NULL,
  pipeline_used TEXT NOT NULL CHECK (pipeline_used IN ('legacy', 'v3_orchestrator')),
  routing_reason TEXT,
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'success', 'partial', 'error', 'fallback')),
  
  -- Result data
  product_id UUID,
  job_id UUID,
  completeness_score INTEGER,
  extraction_method TEXT,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  fallback_triggered BOOLEAN DEFAULT false,
  fallback_success BOOLEAN,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  extension_version TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_user_date ON public.import_pipeline_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_platform ON public.import_pipeline_logs(platform, pipeline_used, status);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_request ON public.import_pipeline_logs(request_id);

-- RLS for pipeline logs
ALTER TABLE public.import_pipeline_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipeline logs"
  ON public.import_pipeline_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert pipeline logs"
  ON public.import_pipeline_logs FOR INSERT
  WITH CHECK (true);

-- 3) Create function to check if new pipeline should be used
CREATE OR REPLACE FUNCTION public.should_use_new_import_pipeline(
  p_user_id UUID,
  p_platform TEXT,
  p_feature_flag_key TEXT DEFAULT 'import.pipeline.v3'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag_enabled BOOLEAN := false;
  v_supported_platforms TEXT[];
  v_rollout_percentage INTEGER := 100;
  v_use_new_pipeline BOOLEAN := false;
  v_reason TEXT := 'feature_disabled';
  v_metadata JSONB;
BEGIN
  -- Get feature flag status
  SELECT 
    is_enabled,
    COALESCE((metadata->>'supported_platforms')::TEXT[], ARRAY['amazon', 'temu']),
    COALESCE(feature_flags.rollout_percentage, 100),
    metadata
  INTO v_flag_enabled, v_supported_platforms, v_rollout_percentage, v_metadata
  FROM feature_flags
  WHERE key = p_feature_flag_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'use_new_pipeline', false,
      'reason', 'flag_not_found',
      'platform', p_platform
    );
  END IF;
  
  -- Check conditions
  IF NOT v_flag_enabled THEN
    v_reason := 'feature_flag_disabled';
    v_use_new_pipeline := false;
  ELSIF NOT (p_platform = ANY(v_supported_platforms)) THEN
    v_reason := 'platform_not_supported';
    v_use_new_pipeline := false;
  ELSIF v_rollout_percentage < 100 THEN
    -- Simple rollout: hash user_id to get consistent assignment
    IF (('x' || substring(md5(p_user_id::text) from 1 for 8))::bit(32)::int % 100) < v_rollout_percentage THEN
      v_reason := 'rollout_included';
      v_use_new_pipeline := true;
    ELSE
      v_reason := 'rollout_excluded';
      v_use_new_pipeline := false;
    END IF;
  ELSE
    v_reason := 'platform_ab_test';
    v_use_new_pipeline := true;
  END IF;
  
  RETURN jsonb_build_object(
    'use_new_pipeline', v_use_new_pipeline,
    'reason', v_reason,
    'platform', p_platform,
    'supported_platforms', v_supported_platforms,
    'rollout_percentage', v_rollout_percentage
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.should_use_new_import_pipeline TO authenticated, service_role;

-- 4) Add realtime for pipeline logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_pipeline_logs;

-- 5) Create helper function to log pipeline execution
CREATE OR REPLACE FUNCTION public.log_import_pipeline(
  p_user_id UUID,
  p_request_id UUID,
  p_platform TEXT,
  p_source_url TEXT,
  p_pipeline_used TEXT,
  p_routing_reason TEXT,
  p_status TEXT DEFAULT 'started',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO import_pipeline_logs (
    user_id,
    request_id,
    platform,
    source_url,
    pipeline_used,
    routing_reason,
    status,
    metadata,
    extension_version
  ) VALUES (
    p_user_id,
    p_request_id,
    p_platform,
    p_source_url,
    p_pipeline_used,
    p_routing_reason,
    p_status,
    p_metadata,
    p_metadata->>'extension_version'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_import_pipeline TO authenticated, service_role;

-- 6) Create function to update pipeline log on completion
CREATE OR REPLACE FUNCTION public.complete_import_pipeline_log(
  p_log_id UUID,
  p_status TEXT,
  p_product_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_completeness_score INTEGER DEFAULT NULL,
  p_extraction_method TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_fallback_triggered BOOLEAN DEFAULT false,
  p_fallback_success BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE import_pipeline_logs
  SET
    completed_at = now(),
    duration_ms = EXTRACT(MILLISECONDS FROM (now() - started_at))::INTEGER,
    status = p_status,
    product_id = COALESCE(p_product_id, product_id),
    job_id = COALESCE(p_job_id, job_id),
    completeness_score = COALESCE(p_completeness_score, completeness_score),
    extraction_method = COALESCE(p_extraction_method, extraction_method),
    error_code = COALESCE(p_error_code, error_code),
    error_message = COALESCE(p_error_message, error_message),
    fallback_triggered = p_fallback_triggered,
    fallback_success = p_fallback_success
  WHERE id = p_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_import_pipeline_log TO authenticated, service_role;