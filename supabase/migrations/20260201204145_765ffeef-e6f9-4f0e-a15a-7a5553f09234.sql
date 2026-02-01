-- =============================================
-- P2: Feature Flags Governance System
-- Centralized, auditable, plan-gated feature flags
-- =============================================

-- Feature flag definitions (admin-managed)
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Flag state
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  
  -- Plan gating
  min_plan TEXT NOT NULL DEFAULT 'free' CHECK (min_plan IN ('free', 'starter', 'pro', 'enterprise', 'ultra_pro')),
  
  -- Rollout configuration
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  -- Targeting
  allowed_user_ids UUID[] DEFAULT '{}',
  blocked_user_ids UUID[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- User-specific flag overrides
CREATE TABLE public.feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES public.feature_flags(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(flag_id, user_id)
);

-- Audit trail for all flag changes
CREATE TABLE public.feature_flag_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES public.feature_flags(id) ON DELETE SET NULL,
  flag_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'override_added', 'override_removed', 'evaluated')),
  actor_id UUID REFERENCES auth.users(id),
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flag evaluation cache (for performance)
CREATE TABLE public.feature_flag_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flag_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context JSONB DEFAULT '{}',
  UNIQUE(user_id, flag_key)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_evaluations ENABLE ROW LEVEL SECURITY;

-- Feature flags: Public flags readable by all, admin-only write
CREATE POLICY "Public flags readable by authenticated users"
ON public.feature_flags FOR SELECT TO authenticated
USING (is_public = true);

CREATE POLICY "Admins can manage all flags"
ON public.feature_flags FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Overrides: Users can see their own, admins can manage all
CREATE POLICY "Users can view their own overrides"
ON public.feature_flag_overrides FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all overrides"
ON public.feature_flag_overrides FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit log: Admins only
CREATE POLICY "Admins can view audit log"
ON public.feature_flag_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.feature_flag_audit_log FOR INSERT TO authenticated
WITH CHECK (true);

-- Evaluations: Users own their evaluations
CREATE POLICY "Users manage their own evaluations"
ON public.feature_flag_evaluations FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function: Evaluate feature flag for user
CREATE OR REPLACE FUNCTION public.evaluate_feature_flag(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_context JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag RECORD;
  v_override RECORD;
  v_user_plan TEXT;
  v_plan_hierarchy JSONB;
  v_result BOOLEAN;
BEGIN
  -- Plan hierarchy for comparison
  v_plan_hierarchy := '{"free": 0, "starter": 1, "pro": 2, "enterprise": 3, "ultra_pro": 4}'::JSONB;
  
  -- Get the flag
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = p_flag_key;
  
  -- Flag doesn't exist
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if expired
  IF v_flag.expires_at IS NOT NULL AND v_flag.expires_at < now() THEN
    RETURN false;
  END IF;
  
  -- Check if globally disabled
  IF NOT v_flag.is_enabled THEN
    RETURN false;
  END IF;
  
  -- Check for user-specific override
  SELECT * INTO v_override 
  FROM public.feature_flag_overrides 
  WHERE flag_id = v_flag.id AND user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now());
  
  IF FOUND THEN
    RETURN v_override.is_enabled;
  END IF;
  
  -- Check blocked users
  IF p_user_id = ANY(v_flag.blocked_user_ids) THEN
    RETURN false;
  END IF;
  
  -- Check allowed users (bypass plan check)
  IF p_user_id = ANY(v_flag.allowed_user_ids) THEN
    v_result := true;
  ELSE
    -- Get user's plan
    SELECT COALESCE(subscription_plan, 'free') INTO v_user_plan
    FROM public.profiles WHERE user_id = p_user_id;
    
    -- Check plan requirement
    IF (v_plan_hierarchy->>v_user_plan)::INT < (v_plan_hierarchy->>v_flag.min_plan)::INT THEN
      RETURN false;
    END IF;
    
    -- Apply rollout percentage
    IF v_flag.rollout_percentage < 100 THEN
      -- Deterministic hash for consistent rollout
      IF (abs(hashtext(p_user_id::TEXT || v_flag.key)) % 100) >= v_flag.rollout_percentage THEN
        RETURN false;
      END IF;
    END IF;
    
    v_result := true;
  END IF;
  
  -- Cache the evaluation
  INSERT INTO public.feature_flag_evaluations (user_id, flag_key, is_enabled, context)
  VALUES (p_user_id, p_flag_key, v_result, p_context)
  ON CONFLICT (user_id, flag_key) 
  DO UPDATE SET is_enabled = v_result, evaluated_at = now(), context = p_context;
  
  RETURN v_result;
END;
$$;

-- Function: Get all flags for user (batch evaluation)
CREATE OR REPLACE FUNCTION public.get_user_feature_flags(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(flag_key TEXT, is_enabled BOOLEAN, category TEXT, metadata JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.key,
    public.evaluate_feature_flag(f.key, p_user_id),
    f.category,
    f.metadata
  FROM public.feature_flags f
  WHERE f.is_enabled = true
    AND (f.expires_at IS NULL OR f.expires_at > now());
END;
$$;

-- Trigger for audit logging
CREATE OR REPLACE FUNCTION public.audit_feature_flag_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.feature_flag_audit_log (flag_id, flag_key, action, actor_id, new_value)
    VALUES (NEW.id, NEW.key, 'created', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.feature_flag_audit_log (flag_id, flag_key, action, actor_id, old_value, new_value)
    VALUES (NEW.id, NEW.key, 'updated', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.feature_flag_audit_log (flag_id, flag_key, action, actor_id, old_value)
    VALUES (OLD.id, OLD.key, 'deleted', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER tr_feature_flags_audit
AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.audit_feature_flag_changes();

-- Update timestamp trigger
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live flag updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;

-- Indexes
CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_feature_flags_category ON public.feature_flags(category);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_feature_flag_overrides_user ON public.feature_flag_overrides(user_id);
CREATE INDEX idx_feature_flag_evaluations_user ON public.feature_flag_evaluations(user_id);
CREATE INDEX idx_feature_flag_audit_created ON public.feature_flag_audit_log(created_at DESC);

-- Insert default feature flags
INSERT INTO public.feature_flags (key, name, description, category, is_enabled, is_public, min_plan) VALUES
  ('products.import.basic', 'Basic Product Import', 'Import single products from suppliers', 'products', true, true, 'free'),
  ('products.import.bulk', 'Bulk Product Import', 'Import multiple products at once', 'products', true, true, 'pro'),
  ('products.import.ai', 'AI-Powered Import', 'AI optimization during import', 'products', true, true, 'pro'),
  ('products.import.scheduled', 'Scheduled Imports', 'Schedule automatic imports', 'products', true, true, 'enterprise'),
  ('analytics.basic', 'Basic Analytics', 'View basic sales metrics', 'analytics', true, true, 'free'),
  ('analytics.advanced', 'Advanced Analytics', 'Advanced charts and insights', 'analytics', true, true, 'pro'),
  ('analytics.predictive', 'Predictive Analytics', 'AI-powered predictions', 'analytics', true, true, 'enterprise'),
  ('automation.rules', 'Automation Rules', 'Create simple automation rules', 'automation', true, true, 'starter'),
  ('automation.workflows', 'Workflow Builder', 'Visual workflow builder', 'automation', true, true, 'pro'),
  ('automation.advanced', 'Advanced Automation', 'Complex multi-step automations', 'automation', true, true, 'enterprise'),
  ('integrations.basic', 'Basic Integrations', 'Connect to basic platforms', 'integrations', true, true, 'free'),
  ('integrations.premium', 'Premium Integrations', 'Premium platform integrations', 'integrations', true, true, 'pro'),
  ('api.access', 'API Access', 'Access to REST API', 'api', true, true, 'starter'),
  ('api.webhooks', 'Webhooks', 'Receive webhook notifications', 'api', true, true, 'pro'),
  ('extension.basic', 'Extension Basic Features', 'Core extension functionality', 'extension', true, true, 'free'),
  ('extension.premium', 'Extension Premium Features', 'Premium extension features', 'extension', true, true, 'pro');
