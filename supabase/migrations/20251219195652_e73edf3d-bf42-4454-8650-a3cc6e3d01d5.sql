-- Add missing columns to activity_logs
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add name column to products (alias for title)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name TEXT GENERATED ALWAYS AS (title) STORED,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create business_intelligence_insights table
CREATE TABLE IF NOT EXISTS public.business_intelligence_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actionable_recommendations JSONB DEFAULT '[]',
  supporting_data JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_intelligence_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.business_intelligence_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all insights" ON public.business_intelligence_insights
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create user_quotas table for tracking usage
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quota_key TEXT NOT NULL,
  current_usage INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ DEFAULT date_trunc('month', now()) + INTERVAL '1 month',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quota_key, period_start)
);

ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotas" ON public.user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all quotas" ON public.user_quotas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create system_stats table for dashboard
CREATE TABLE IF NOT EXISTS public.system_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stat_date)
);

ALTER TABLE public.system_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system stats" ON public.system_stats
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add status column to active_alerts for compatibility
ALTER TABLE public.active_alerts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';