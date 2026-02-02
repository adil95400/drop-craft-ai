-- Plan limits configuration table (if not exists)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_name, limit_key)
);

-- Quota usage tracking table (if not exists)
CREATE TABLE IF NOT EXISTS public.quota_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_key TEXT NOT NULL,
  current_usage INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quota_key)
);

-- Enable RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan_limits (read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can read plan limits" ON public.plan_limits;
CREATE POLICY "Anyone can read plan limits" 
ON public.plan_limits 
FOR SELECT 
USING (true);

-- RLS policies for quota_usage (users can only see and update their own)
DROP POLICY IF EXISTS "Users can view their own quota usage" ON public.quota_usage;
CREATE POLICY "Users can view their own quota usage" 
ON public.quota_usage 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quota usage" ON public.quota_usage;
CREATE POLICY "Users can insert their own quota usage" 
ON public.quota_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quota usage" ON public.quota_usage;
CREATE POLICY "Users can update their own quota usage" 
ON public.quota_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default plan limits
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description) VALUES
-- Free plan
('free', 'products', 50, 'Nombre maximum de produits'),
('free', 'imports_monthly', 20, 'Imports mensuels'),
('free', 'ai_generations', 5, 'Générations IA mensuelles'),
('free', 'stores', 1, 'Nombre de boutiques'),
('free', 'suppliers', 3, 'Nombre de fournisseurs'),
('free', 'workflows', 1, 'Workflows automatisés'),
('free', 'storage_mb', 100, 'Stockage en Mo'),
-- Standard plan
('standard', 'products', 500, 'Nombre maximum de produits'),
('standard', 'imports_monthly', 200, 'Imports mensuels'),
('standard', 'ai_generations', 50, 'Générations IA mensuelles'),
('standard', 'stores', 3, 'Nombre de boutiques'),
('standard', 'suppliers', 10, 'Nombre de fournisseurs'),
('standard', 'workflows', 5, 'Workflows automatisés'),
('standard', 'storage_mb', 1000, 'Stockage en Mo'),
-- Pro plan
('pro', 'products', 5000, 'Nombre maximum de produits'),
('pro', 'imports_monthly', 1000, 'Imports mensuels'),
('pro', 'ai_generations', 500, 'Générations IA mensuelles'),
('pro', 'stores', 10, 'Nombre de boutiques'),
('pro', 'suppliers', 50, 'Nombre de fournisseurs'),
('pro', 'workflows', 20, 'Workflows automatisés'),
('pro', 'storage_mb', 10000, 'Stockage en Mo'),
-- Ultra Pro plan (unlimited = -1)
('ultra_pro', 'products', -1, 'Nombre maximum de produits'),
('ultra_pro', 'imports_monthly', -1, 'Imports mensuels'),
('ultra_pro', 'ai_generations', -1, 'Générations IA mensuelles'),
('ultra_pro', 'stores', -1, 'Nombre de boutiques'),
('ultra_pro', 'suppliers', -1, 'Nombre de fournisseurs'),
('ultra_pro', 'workflows', -1, 'Workflows automatisés'),
('ultra_pro', 'storage_mb', -1, 'Stockage en Mo')
ON CONFLICT (plan_name, limit_key) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  description = EXCLUDED.description,
  updated_at = now();

-- Function to check quota
CREATE OR REPLACE FUNCTION public.check_user_quota(
  p_user_id UUID,
  p_quota_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_current INTEGER;
  v_can_proceed BOOLEAN;
BEGIN
  -- Get user's plan
  SELECT subscription_plan INTO v_plan
  FROM profiles
  WHERE id = p_user_id;
  
  v_plan := COALESCE(v_plan, 'free');
  
  -- Get limit for this plan and quota key
  SELECT limit_value INTO v_limit
  FROM plan_limits
  WHERE plan_name = v_plan AND limit_key = p_quota_key;
  
  IF v_limit IS NULL THEN
    v_limit := 0;
  END IF;
  
  -- Get current usage
  SELECT current_usage INTO v_current
  FROM quota_usage
  WHERE user_id = p_user_id AND quota_key = p_quota_key;
  
  v_current := COALESCE(v_current, 0);
  
  -- Check if can proceed (-1 means unlimited)
  v_can_proceed := v_limit = -1 OR (v_current + p_increment) <= v_limit;
  
  RETURN jsonb_build_object(
    'can_proceed', v_can_proceed,
    'current_usage', v_current,
    'limit', v_limit,
    'plan', v_plan,
    'remaining', CASE WHEN v_limit = -1 THEN -1 ELSE v_limit - v_current END,
    'percentage', CASE WHEN v_limit = -1 THEN 0 ELSE ROUND((v_current::NUMERIC / v_limit) * 100, 1) END
  );
END;
$$;

-- Function to increment quota
CREATE OR REPLACE FUNCTION public.increment_user_quota(
  p_user_id UUID,
  p_quota_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check JSONB;
  v_new_usage INTEGER;
BEGIN
  -- First check if allowed
  v_check := check_user_quota(p_user_id, p_quota_key, p_increment);
  
  IF NOT (v_check->>'can_proceed')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quota exceeded',
      'quota', v_check
    );
  END IF;
  
  -- Increment or insert
  INSERT INTO quota_usage (user_id, quota_key, current_usage, period_start, period_end)
  VALUES (
    p_user_id, 
    p_quota_key, 
    p_increment,
    now(),
    now() + interval '30 days'
  )
  ON CONFLICT (user_id, quota_key) DO UPDATE SET
    current_usage = quota_usage.current_usage + p_increment,
    updated_at = now()
  RETURNING current_usage INTO v_new_usage;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_usage', v_new_usage,
    'quota', check_user_quota(p_user_id, p_quota_key, 0)
  );
END;
$$;