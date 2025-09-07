-- Create plans_limits table for managing quota limits per plan
CREATE TABLE public.plans_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan plan_type NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT -1, -- -1 means unlimited
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan, limit_key)
);

-- Create user_quotas table for tracking user usage
CREATE TABLE public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quota_key TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quota_key)
);

-- Enable RLS
ALTER TABLE public.plans_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans_limits (read-only for users, admin can manage)
CREATE POLICY "Anyone can view plan limits" ON public.plans_limits
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage plan limits" ON public.plans_limits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
  );

-- RLS policies for user_quotas
CREATE POLICY "Users can view their own quotas" ON public.user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON public.user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert quotas" ON public.user_quotas
  FOR INSERT WITH CHECK (true);

-- Insert default plan limits
INSERT INTO public.plans_limits (plan, limit_key, limit_value) VALUES
-- Free plan limits
('free', 'products', 100),
('free', 'suppliers', 3),
('free', 'monthly_imports', 500),
('free', 'integrations', 2),
('free', 'ai_generations', 50),
('free', 'storage_mb', 100),

-- Pro plan limits  
('pro', 'products', 5000),
('pro', 'suppliers', 25),
('pro', 'monthly_imports', 10000),
('pro', 'integrations', 10),
('pro', 'ai_generations', 1000),
('pro', 'storage_mb', 5000),

-- Ultra Pro plan limits (unlimited = -1)
('ultra_pro', 'products', -1),
('ultra_pro', 'suppliers', -1),
('ultra_pro', 'monthly_imports', -1),
('ultra_pro', 'integrations', -1),
('ultra_pro', 'ai_generations', -1),
('ultra_pro', 'storage_mb', 50000);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_plans_limits_updated_at
  BEFORE UPDATE ON public.plans_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON public.user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();