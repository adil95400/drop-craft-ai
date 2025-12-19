-- =============================================
-- ADDITIONAL TABLES FOR ADMIN COMPONENTS
-- =============================================

-- =============================================
-- WEBHOOK EVENTS TABLE
-- =============================================
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook events" ON public.webhook_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all webhook events" ON public.webhook_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ACTIVE ALERTS TABLE
-- =============================================
CREATE TABLE public.active_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.active_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.active_alerts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all alerts" ON public.active_alerts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SUPPLIERS TABLE
-- =============================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  status TEXT DEFAULT 'active',
  country TEXT,
  shipping_methods JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own suppliers" ON public.suppliers
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- EXTENSIONS TABLE
-- =============================================
CREATE TABLE public.extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'active',
  is_premium BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view extensions" ON public.extensions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage extensions" ON public.extensions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- EXTENSION JOBS TABLE
-- =============================================
CREATE TABLE public.extension_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  extension_id UUID REFERENCES public.extensions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.extension_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own extension jobs" ON public.extension_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all extension jobs" ON public.extension_jobs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ENTERPRISE INTEGRATIONS TABLE
-- =============================================
CREATE TABLE public.enterprise_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  sync_status TEXT DEFAULT 'idle',
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.enterprise_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own enterprise integrations" ON public.enterprise_integrations
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- VIDEO TUTORIALS TABLE
-- =============================================
CREATE TABLE public.video_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT DEFAULT 'youtube',
  youtube_id TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  category TEXT,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tutorials" ON public.video_tutorials
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tutorials" ON public.video_tutorials
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  announcement_type TEXT DEFAULT 'info',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  target_plans TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- FAQ ITEMS TABLE
-- =============================================
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active faqs" ON public.faq_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage faqs" ON public.faq_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ADMIN SET ROLE FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.admin_set_role(target_user_id UUID, new_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Remove existing roles and add new one
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, new_role);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extensions_updated_at
  BEFORE UPDATE ON public.extensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_integrations_updated_at
  BEFORE UPDATE ON public.enterprise_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_tutorials_updated_at
  BEFORE UPDATE ON public.video_tutorials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();