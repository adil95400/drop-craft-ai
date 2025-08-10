-- Create reviews table for real reviews integration
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  product_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  photos TEXT[],
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, platform)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews (public readable)
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING (status = 'published');

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();