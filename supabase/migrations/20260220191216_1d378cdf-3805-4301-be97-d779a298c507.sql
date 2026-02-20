
-- Create product research results table
CREATE TABLE public.product_research_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  winning_score INTEGER DEFAULT 0,
  trend_score INTEGER DEFAULT 0,
  viral_score INTEGER,
  profit_margin NUMERIC(5,2),
  search_volume INTEGER,
  saturation_level TEXT,
  source_platform TEXT,
  source_url TEXT,
  raw_data JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_research_results ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own research results"
  ON public.product_research_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research results"
  ON public.product_research_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research results"
  ON public.product_research_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research results"
  ON public.product_research_results FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast user queries
CREATE INDEX idx_product_research_user_id ON public.product_research_results(user_id);
CREATE INDEX idx_product_research_winning_score ON public.product_research_results(winning_score DESC);
