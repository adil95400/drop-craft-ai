
-- Notification Center tables
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, alert
  category TEXT DEFAULT 'general', -- general, order, stock, price, sync, system
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  categories JSONB DEFAULT '{"order": true, "stock": true, "price": true, "sync": true, "system": true}'::jsonb,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  digest_frequency TEXT DEFAULT 'instant', -- instant, hourly, daily, weekly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advanced Analytics tables
CREATE TABLE public.analytics_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]'::jsonb,
  widgets JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dashboard_id UUID REFERENCES public.analytics_dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL, -- chart, metric, table, map, funnel
  title TEXT NOT NULL,
  data_source TEXT NOT NULL, -- orders, products, customers, revenue, traffic
  config JSONB DEFAULT '{}'::jsonb,
  position JSONB DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb,
  refresh_interval_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL, -- daily, weekly, monthly
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  comparisons JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_type, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their dashboards" ON public.analytics_dashboards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their widgets" ON public.analytics_widgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their snapshots" ON public.analytics_snapshots FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notifications_user ON public.user_notifications(user_id);
CREATE INDEX idx_notifications_read ON public.user_notifications(is_read);
CREATE INDEX idx_notifications_created ON public.user_notifications(created_at DESC);
CREATE INDEX idx_dashboards_user ON public.analytics_dashboards(user_id);
CREATE INDEX idx_widgets_dashboard ON public.analytics_widgets(dashboard_id);
CREATE INDEX idx_snapshots_user_date ON public.analytics_snapshots(user_id, snapshot_date);
