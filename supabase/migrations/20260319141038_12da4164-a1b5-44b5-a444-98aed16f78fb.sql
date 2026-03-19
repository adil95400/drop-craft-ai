
-- Table pour les publications planifiées
CREATE TABLE IF NOT EXISTS public.scheduled_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL, -- 'marketplace', 'social', 'ads', 'feed'
  channel_id TEXT NOT NULL, -- 'shopify', 'facebook', 'instagram', 'google-shopping', etc.
  channel_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  publish_options JSONB DEFAULT '{}',
  custom_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table de suivi des publications par canal (historique)
CREATE TABLE IF NOT EXISTS public.publication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  channel_type TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'publish', -- 'publish', 'unpublish', 'update', 'sync'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  external_id TEXT,
  external_url TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_scheduled_publications_user ON public.scheduled_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_publications_status ON public.scheduled_publications(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_publication_logs_user ON public.publication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_publication_logs_product ON public.publication_logs(product_id);

-- RLS
ALTER TABLE public.scheduled_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scheduled publications" ON public.scheduled_publications
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own publication logs" ON public.publication_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime pour les logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.publication_logs;
