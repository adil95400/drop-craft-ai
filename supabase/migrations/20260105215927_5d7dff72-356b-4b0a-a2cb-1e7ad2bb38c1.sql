-- PPC Feed Link System Tables
-- Liaison entre feeds produits et campagnes PPC

CREATE TABLE public.ppc_feed_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  feed_id UUID REFERENCES public.campaign_product_feeds(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads', 'microsoft_ads', 'tiktok_ads', 'pinterest_ads')),
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  products_synced INTEGER DEFAULT 0,
  sync_errors JSONB,
  field_mappings JSONB DEFAULT '{}',
  filters JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance tracking par lien
CREATE TABLE public.ppc_link_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.ppc_feed_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  roas DECIMAL(8,4),
  ctr DECIMAL(8,4),
  cpc DECIMAL(8,4),
  products_active INTEGER DEFAULT 0,
  products_converting INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(link_id, date)
);

-- Sync logs
CREATE TABLE public.ppc_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.ppc_feed_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sync_type TEXT DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  products_processed INTEGER DEFAULT 0,
  products_added INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_removed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ppc_feed_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_link_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ppc_feed_links
CREATE POLICY "Users can view their own ppc links"
  ON public.ppc_feed_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ppc links"
  ON public.ppc_feed_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ppc links"
  ON public.ppc_feed_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ppc links"
  ON public.ppc_feed_links FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ppc_link_performance
CREATE POLICY "Users can view their own performance"
  ON public.ppc_link_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance"
  ON public.ppc_link_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ppc_sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON public.ppc_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON public.ppc_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);