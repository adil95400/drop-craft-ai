-- Create product_research_results table
CREATE TABLE IF NOT EXISTS public.product_research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT,
  winning_score INTEGER DEFAULT 0,
  trend_score INTEGER DEFAULT 0,
  viral_score INTEGER,
  profit_margin DECIMAL,
  search_volume INTEGER,
  saturation_level TEXT,
  source_platform TEXT,
  source_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_research_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own research results"
  ON public.product_research_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own research results"
  ON public.product_research_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research results"
  ON public.product_research_results
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research results"
  ON public.product_research_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_product_research_user_id ON public.product_research_results(user_id);
CREATE INDEX idx_product_research_winning_score ON public.product_research_results(winning_score DESC);
CREATE INDEX idx_product_research_created_at ON public.product_research_results(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_product_research_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_research_updated_at
  BEFORE UPDATE ON public.product_research_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_research_updated_at();