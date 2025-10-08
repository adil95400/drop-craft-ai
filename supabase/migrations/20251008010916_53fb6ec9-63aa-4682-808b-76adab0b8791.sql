-- Create table for auto-detected winning products
CREATE TABLE IF NOT EXISTS public.winner_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_url text NOT NULL,
  source_platform text NOT NULL,
  virality_score integer NOT NULL DEFAULT 0,
  trending_score integer NOT NULL DEFAULT 0,
  engagement_count bigint DEFAULT 0,
  orders_count integer DEFAULT 0,
  rating numeric(3,1) DEFAULT 0,
  price numeric(10,2),
  estimated_profit_margin numeric(5,2),
  competition_level text,
  social_proof jsonb DEFAULT '{}'::jsonb,
  trend_analysis jsonb DEFAULT '{}'::jsonb,
  competitor_analysis jsonb DEFAULT '{}'::jsonb,
  detection_signals text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  detected_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_url, user_id)
);

-- Enable RLS
ALTER TABLE public.winner_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own detected products"
  ON public.winner_products
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detected products"
  ON public.winner_products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detected products"
  ON public.winner_products
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detected products"
  ON public.winner_products
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_winner_products_user_id ON public.winner_products(user_id);
CREATE INDEX idx_winner_products_virality_score ON public.winner_products(virality_score DESC);
CREATE INDEX idx_winner_products_source_platform ON public.winner_products(source_platform);
CREATE INDEX idx_winner_products_detected_at ON public.winner_products(detected_at DESC);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_winner_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating last_updated
CREATE TRIGGER update_winner_products_updated_at_trigger
  BEFORE UPDATE ON public.winner_products
  FOR EACH ROW
  EXECUTE FUNCTION update_winner_products_updated_at();
