-- Migration Part 2: Fix remaining Function Search Path Security Issues

-- Fix check_api_rate_limit
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_api_key_id uuid,
  p_limit integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := date_trunc('minute', now()) - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.api_rate_limits
  WHERE api_key_id = p_api_key_id
    AND window_start >= v_window_start;
  
  RETURN v_count < p_limit;
END;
$$;

-- Fix has_feature_flag
CREATE OR REPLACE FUNCTION public.has_feature_flag(user_id_param uuid, flag_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_flags JSONB;
  user_plan TEXT;
BEGIN
  SELECT feature_flags, subscription_plan 
  INTO user_flags, user_plan
  FROM public.profiles 
  WHERE id = user_id_param;
  
  IF user_flags IS NULL OR user_flags = '{}' THEN
    user_flags := CASE user_plan
      WHEN 'ultra' THEN '{"ai_import": true, "bulk_import": true, "advanced_analytics": true, "marketing_automation": true, "premium_integrations": true, "enterprise_features": true}'::jsonb
      WHEN 'pro' THEN '{"ai_import": false, "bulk_import": true, "advanced_analytics": true, "marketing_automation": false, "premium_integrations": false, "enterprise_features": false}'::jsonb
      ELSE '{"ai_import": false, "bulk_import": true, "advanced_analytics": false, "marketing_automation": false, "premium_integrations": false, "enterprise_features": false}'::jsonb
    END;
  END IF;
  
  RETURN COALESCE((user_flags ->> flag_name)::boolean, false);
END;
$$;

-- Fix search_suppliers
CREATE OR REPLACE FUNCTION public.search_suppliers(
  search_term text DEFAULT NULL,
  country_filter text DEFAULT NULL,
  sector_filter text DEFAULT NULL,
  supplier_type_filter text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  supplier_type text,
  country text,
  sector text,
  logo_url text,
  description text,
  connection_status text,
  product_count integer,
  tags text[],
  rating numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.supplier_type,
    s.country,
    s.sector,
    s.logo_url,
    s.description,
    s.connection_status,
    s.product_count,
    s.tags,
    s.rating,
    s.created_at
  FROM public.suppliers s
  WHERE 
    s.user_id = auth.uid()
    AND (search_term IS NULL OR s.name ILIKE '%' || search_term || '%' OR s.description ILIKE '%' || search_term || '%')
    AND (country_filter IS NULL OR s.country = country_filter)
    AND (sector_filter IS NULL OR s.sector = sector_filter)
    AND (supplier_type_filter IS NULL OR s.supplier_type = supplier_type_filter)
  ORDER BY s.product_count DESC, s.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Fix process_automation_trigger
CREATE OR REPLACE FUNCTION public.process_automation_trigger(
  trigger_id uuid,
  context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  trigger_record automation_triggers%ROWTYPE;
  action_record automation_actions%ROWTYPE;
  execution_id UUID;
  result JSONB := '{"success": true, "actions_executed": 0}';
  actions_count INTEGER := 0;
BEGIN
  SELECT * INTO trigger_record
  FROM automation_triggers
  WHERE id = trigger_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Trigger not found or inactive"}';
  END IF;
  
  FOR action_record IN
    SELECT * FROM automation_actions
    WHERE trigger_id = trigger_record.id AND is_active = true
    ORDER BY execution_order ASC
  LOOP
    INSERT INTO automation_execution_logs (user_id, trigger_id, action_id, input_data, status)
    VALUES (trigger_record.user_id, trigger_id, action_record.id, context_data, 'running')
    RETURNING id INTO execution_id;
    
    UPDATE automation_execution_logs
    SET status = 'completed',
        completed_at = now(),
        execution_time_ms = 50 + (random() * 200)::int,
        output_data = jsonb_build_object(
          'action_type', action_record.action_type, 
          'simulated', true,
          'timestamp', now()
        )
    WHERE id = execution_id;
    
    actions_count := actions_count + 1;
  END LOOP;
  
  result := jsonb_set(result, '{actions_executed}', to_jsonb(actions_count));
  RETURN result;
END;
$$;