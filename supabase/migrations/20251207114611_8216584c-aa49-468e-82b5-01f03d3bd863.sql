-- Create product_enrichment table for storing raw marketplace data
CREATE TABLE IF NOT EXISTS public.product_enrichment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('amazon', 'aliexpress', 'cdiscount', 'ebay', 'alibaba', 'temu', 'wish')),
  source_url TEXT,
  source_product_id TEXT,
  matched_via TEXT CHECK (matched_via IN ('ean', 'gtin', 'upc', 'title_brand', 'manual')),
  
  -- Raw data from marketplace
  raw_title TEXT,
  raw_description TEXT,
  raw_images JSONB DEFAULT '[]',
  raw_attributes JSONB DEFAULT '{}',
  raw_variants JSONB DEFAULT '[]',
  raw_price DECIMAL(12,2),
  raw_currency TEXT DEFAULT 'EUR',
  raw_reviews_count INTEGER,
  raw_rating DECIMAL(3,2),
  raw_shipping_info JSONB DEFAULT '{}',
  
  -- AI-generated optimized content
  ai_output JSONB DEFAULT '{}',
  -- Structure: { optimized_title, optimized_description, bullets, seo_tags, suggested_images, attributes_normalized }
  
  -- Status tracking
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'fetching', 'processing', 'success', 'failed', 'applied')),
  error_message TEXT,
  fetch_attempts INTEGER DEFAULT 0,
  last_fetch_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  
  -- Unique constraint per product per source
  UNIQUE(product_id, source)
);

-- Add enrichment fields to products table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ean') THEN
    ALTER TABLE public.products ADD COLUMN ean TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'upc') THEN
    ALTER TABLE public.products ADD COLUMN upc TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'gtin') THEN
    ALTER TABLE public.products ADD COLUMN gtin TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'enrichment_enabled') THEN
    ALTER TABLE public.products ADD COLUMN enrichment_enabled BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'enrichment_status') THEN
    ALTER TABLE public.products ADD COLUMN enrichment_status TEXT DEFAULT 'none' CHECK (enrichment_status IN ('none', 'pending', 'in_progress', 'success', 'failed'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'last_enriched_at') THEN
    ALTER TABLE public.products ADD COLUMN last_enriched_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create enrichment queue for bulk processing
CREATE TABLE IF NOT EXISTS public.enrichment_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5,
  sources TEXT[] DEFAULT ARRAY['amazon', 'aliexpress'],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_enrichment_product_id ON public.product_enrichment(product_id);
CREATE INDEX IF NOT EXISTS idx_product_enrichment_status ON public.product_enrichment(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_product_enrichment_user_id ON public.product_enrichment(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON public.enrichment_queue(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_user_id ON public.enrichment_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_products_ean ON public.products(ean) WHERE ean IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_gtin ON public.products(gtin) WHERE gtin IS NOT NULL;

-- Enable RLS
ALTER TABLE public.product_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_enrichment
CREATE POLICY "Users can view their own enrichments" ON public.product_enrichment
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrichments" ON public.product_enrichment
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrichments" ON public.product_enrichment
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrichments" ON public.product_enrichment
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for enrichment_queue
CREATE POLICY "Users can view their own queue" ON public.enrichment_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own queue" ON public.enrichment_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue" ON public.enrichment_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own queue" ON public.enrichment_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_product_enrichment_timestamp ON public.product_enrichment;
CREATE TRIGGER update_product_enrichment_timestamp
  BEFORE UPDATE ON public.product_enrichment
  FOR EACH ROW EXECUTE FUNCTION update_product_enrichment_updated_at();