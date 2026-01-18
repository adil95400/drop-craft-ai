-- Drop and recreate tables to fix partial creation
DROP TABLE IF EXISTS public.supplier_sync_schedules CASCADE;
DROP TABLE IF EXISTS public.supplier_credentials CASCADE;
DROP TABLE IF EXISTS public.supplier_analytics CASCADE;
DROP TABLE IF EXISTS public.supplier_notifications CASCADE;
DROP TABLE IF EXISTS public.supplier_sync_logs CASCADE;
DROP TABLE IF EXISTS public.supplier_sync_jobs CASCADE;

-- Table pour les sync jobs des fournisseurs
CREATE TABLE public.supplier_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_type TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'full_sync',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  products_processed INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les logs de synchronisation
CREATE TABLE public.supplier_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID REFERENCES public.supplier_sync_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  log_level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les notifications fournisseurs
CREATE TABLE public.supplier_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les analytics fournisseurs
CREATE TABLE public.supplier_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  products_synced INTEGER DEFAULT 0,
  products_active INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  avg_margin DECIMAL(5,2) DEFAULT 0,
  sync_success_rate DECIMAL(5,2) DEFAULT 100,
  api_calls INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, supplier_id, analytics_date)
);

-- Table pour les credentials fournisseurs
CREATE TABLE public.supplier_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_type TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  validation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

-- Table pour le scheduling des syncs
CREATE TABLE public.supplier_sync_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'products',
  frequency TEXT NOT NULL DEFAULT 'daily',
  cron_expression TEXT,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, supplier_id, sync_type)
);

-- Enable RLS
ALTER TABLE public.supplier_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_sync_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage sync jobs" ON public.supplier_sync_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view sync logs" ON public.supplier_sync_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage notifications" ON public.supplier_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view analytics" ON public.supplier_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage credentials" ON public.supplier_credentials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage schedules" ON public.supplier_sync_schedules FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sync_jobs_user_status ON public.supplier_sync_jobs(user_id, status);
CREATE INDEX idx_notifications_user_unread ON public.supplier_notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_analytics_user_date ON public.supplier_analytics(user_id, analytics_date DESC);