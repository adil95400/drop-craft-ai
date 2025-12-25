-- Create platform_metrics table for analytics
CREATE TABLE public.platform_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_revenue NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_fees NUMERIC DEFAULT 0,
  views INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create platform_sync_configs table
CREATE TABLE public.platform_sync_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  sync_type TEXT DEFAULT 'all',
  sync_frequency TEXT DEFAULT '1hour',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create platform_sync_logs table
CREATE TABLE public.platform_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_optimizations table
CREATE TABLE public.content_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  optimization_type TEXT NOT NULL,
  original_content JSONB DEFAULT '{}',
  optimized_content JSONB DEFAULT '{}',
  optimization_score INTEGER DEFAULT 0,
  suggestions JSONB DEFAULT '[]',
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_optimizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own platform_metrics"
  ON public.platform_metrics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own platform_sync_configs"
  ON public.platform_sync_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own platform_sync_logs"
  ON public.platform_sync_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content_optimizations"
  ON public.content_optimizations FOR ALL
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_platform_metrics_updated_at
  BEFORE UPDATE ON public.platform_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_sync_configs_updated_at
  BEFORE UPDATE ON public.platform_sync_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_optimizations_updated_at
  BEFORE UPDATE ON public.content_optimizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();