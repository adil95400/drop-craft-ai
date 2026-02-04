-- Product Reviews Table for Extension Imports
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Core review data
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Anonymous',
  review_date DATE,
  country TEXT,
  
  -- Additional metadata
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,
  images TEXT[] DEFAULT '{}',
  
  -- Source tracking
  source_url TEXT,
  source_platform TEXT,
  external_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint for deduplication
  CONSTRAINT unique_external_review UNIQUE(user_id, product_id, external_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reviews"
  ON public.product_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;

-- Add review_import_jobs table for async tracking
CREATE TABLE IF NOT EXISTS public.review_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  platform TEXT,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scraping', 'processing', 'completed', 'error', 'reviews_unavailable')),
  
  -- Progress tracking
  progress_percent INTEGER DEFAULT 0,
  reviews_found INTEGER DEFAULT 0,
  reviews_imported INTEGER DEFAULT 0,
  
  -- Configuration
  limit_requested INTEGER DEFAULT 50,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_import_jobs_user_id ON public.review_import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_import_jobs_product_id ON public.review_import_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_review_import_jobs_status ON public.review_import_jobs(status);

-- Enable RLS
ALTER TABLE public.review_import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own review jobs"
  ON public.review_import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review jobs"
  ON public.review_import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review jobs"
  ON public.review_import_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_review_import_jobs_updated_at
  BEFORE UPDATE ON public.review_import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_import_jobs;