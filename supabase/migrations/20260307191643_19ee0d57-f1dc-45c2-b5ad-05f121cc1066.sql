
-- Competitor tracking tables
CREATE TABLE IF NOT EXISTS public.competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  products_tracked INTEGER DEFAULT 0,
  avg_price_diff NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.competitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competitors" ON public.competitor_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitor_profiles(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  our_price NUMERIC NOT NULL DEFAULT 0,
  competitor_price NUMERIC NOT NULL DEFAULT 0,
  price_diff NUMERIC DEFAULT 0,
  price_diff_percent NUMERIC DEFAULT 0,
  trend TEXT DEFAULT 'stable',
  in_stock BOOLEAN DEFAULT true,
  source_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competitor prices" ON public.competitor_prices
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.repricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  strategy TEXT NOT NULL DEFAULT 'match',
  price_offset NUMERIC DEFAULT 0,
  offset_type TEXT DEFAULT 'percentage',
  min_margin NUMERIC DEFAULT 10,
  max_discount NUMERIC DEFAULT 15,
  competitor_ids UUID[] DEFAULT '{}',
  product_filter JSONB DEFAULT '{}',
  schedule TEXT DEFAULT 'daily',
  last_executed_at TIMESTAMPTZ,
  products_affected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.repricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own repricing rules" ON public.repricing_rules
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
