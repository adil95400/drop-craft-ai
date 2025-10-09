-- Create ad_campaigns table for storing advertising campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'facebook', 'google', 'instagram', 'tiktok'
  campaign_type TEXT NOT NULL, -- 'awareness', 'traffic', 'conversion', 'sales'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  budget_total NUMERIC DEFAULT 0,
  budget_spent NUMERIC DEFAULT 0,
  budget_daily NUMERIC DEFAULT 0,
  target_audience JSONB DEFAULT '{}',
  ad_creative JSONB DEFAULT '{}', -- images, videos, copy
  ai_generated BOOLEAN DEFAULT false,
  ab_test_config JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}', -- impressions, clicks, conversions, ctr, cpc, roas
  external_campaign_id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ab_test_variants table for A/B testing
CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- 'A', 'B', 'C'
  ad_creative JSONB NOT NULL,
  traffic_allocation NUMERIC DEFAULT 33.33, -- percentage
  performance_data JSONB DEFAULT '{}',
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ads_platform_connections table for storing API credentials
CREATE TABLE IF NOT EXISTS public.ads_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'google', 'instagram'
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  sync_status TEXT DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, account_id)
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_platform_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_campaigns
CREATE POLICY "secure_user_access_ad_campaigns"
ON public.ad_campaigns
FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- RLS Policies for ab_test_variants
CREATE POLICY "secure_user_access_ab_test_variants"
ON public.ab_test_variants
FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- RLS Policies for ads_platform_connections
CREATE POLICY "secure_user_access_ads_platform_connections"
ON public.ads_platform_connections
FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns(user_id);
CREATE INDEX idx_ad_campaigns_platform ON public.ad_campaigns(platform);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_ab_test_variants_campaign_id ON public.ab_test_variants(campaign_id);
CREATE INDEX idx_ads_platform_connections_user_platform ON public.ads_platform_connections(user_id, platform);

-- Create trigger for updated_at
CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_test_variants_updated_at
  BEFORE UPDATE ON public.ab_test_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_platform_connections_updated_at
  BEFORE UPDATE ON public.ads_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();