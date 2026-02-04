-- Fix the should_use_new_import_pipeline function to correctly parse JSONB arrays
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
  v_rollout_percentage INTEGER := 100;
  v_use_new_pipeline BOOLEAN := false;
  v_reason TEXT := 'feature_disabled';
  v_metadata JSONB;
  v_supported_platforms JSONB;
  v_platform_supported BOOLEAN := false;
BEGIN
  -- Get feature flag status
  SELECT 
    is_enabled,
    COALESCE(feature_flags.rollout_percentage, 100),
    COALESCE(metadata->'supported_platforms', '["amazon", "temu"]'::jsonb),
    metadata
  INTO v_flag_enabled, v_rollout_percentage, v_supported_platforms, v_metadata
  FROM feature_flags
  WHERE key = p_feature_flag_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'use_new_pipeline', false,
      'reason', 'flag_not_found',
      'platform', p_platform
    );
  END IF;
  
  -- Check if platform is in supported list (JSONB array contains check)
  v_platform_supported := v_supported_platforms ? p_platform;
  
  -- Check conditions
  IF NOT v_flag_enabled THEN
    v_reason := 'feature_flag_disabled';
    v_use_new_pipeline := false;
  ELSIF NOT v_platform_supported THEN
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