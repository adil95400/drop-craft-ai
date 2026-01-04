-- Table for competitor ads analysis
CREATE TABLE IF NOT EXISTS public.competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'instagram', 'google', 'pinterest')),
  ad_id TEXT,
  advertiser_name TEXT,
  ad_text TEXT,
  ad_headline TEXT,
  ad_cta TEXT,
  landing_page_url TEXT,
  image_urls TEXT[],
  video_url TEXT,
  estimated_spend_min NUMERIC,
  estimated_spend_max NUMERIC,
  estimated_reach BIGINT,
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  running_days INTEGER,
  countries TEXT[],
  age_range TEXT,
  gender_targeting TEXT,
  interests TEXT[],
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  product_category TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for saved ad collections
CREATE TABLE IF NOT EXISTS public.ad_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  ad_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table for ads in collections
CREATE TABLE IF NOT EXISTS public.ad_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.ad_collections(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.competitor_ads(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, ad_id)
);

-- Table for ad search history
CREATE TABLE IF NOT EXISTS public.ad_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  platform TEXT,
  filters JSONB,
  results_count INTEGER,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_ads
CREATE POLICY "Users can view own competitor ads"
  ON public.competitor_ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competitor ads"
  ON public.competitor_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitor ads"
  ON public.competitor_ads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitor ads"
  ON public.competitor_ads FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ad_collections
CREATE POLICY "Users can view own ad collections"
  ON public.ad_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad collections"
  ON public.ad_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad collections"
  ON public.ad_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ad collections"
  ON public.ad_collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ad_collection_items (based on collection ownership)
CREATE POLICY "Users can view items from own collections"
  ON public.ad_collection_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ad_collections 
    WHERE id = collection_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items to own collections"
  ON public.ad_collection_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ad_collections 
    WHERE id = collection_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from own collections"
  ON public.ad_collection_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ad_collections 
    WHERE id = collection_id AND user_id = auth.uid()
  ));

-- RLS Policies for ad_searches
CREATE POLICY "Users can view own ad searches"
  ON public.ad_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad searches"
  ON public.ad_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_ads_user_id ON public.competitor_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_platform ON public.competitor_ads(platform);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_engagement ON public.competitor_ads(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_ad_collections_user_id ON public.ad_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_searches_user_id ON public.ad_searches(user_id);