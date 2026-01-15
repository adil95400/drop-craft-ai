-- Create imported_reviews table for storing product reviews
CREATE TABLE public.imported_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  imported_product_id UUID REFERENCES public.imported_products(id) ON DELETE CASCADE,
  product_sku TEXT,
  product_name TEXT,
  customer_name TEXT NOT NULL DEFAULT 'Anonyme',
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  review_date TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  images TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own reviews" 
ON public.imported_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews" 
ON public.imported_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.imported_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.imported_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_imported_reviews_updated_at
BEFORE UPDATE ON public.imported_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_imported_reviews_user_id ON public.imported_reviews(user_id);
CREATE INDEX idx_imported_reviews_product_id ON public.imported_reviews(product_id);
CREATE INDEX idx_imported_reviews_imported_product_id ON public.imported_reviews(imported_product_id);
CREATE INDEX idx_imported_reviews_source ON public.imported_reviews(source);