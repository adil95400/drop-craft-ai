-- Create product_feeds table for managing marketplace feeds
CREATE TABLE public.product_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  feed_url TEXT,
  generation_status TEXT DEFAULT 'pending',
  product_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feeds"
ON public.product_feeds FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feeds"
ON public.product_feeds FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeds"
ON public.product_feeds FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeds"
ON public.product_feeds FOR DELETE
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_product_feeds_updated_at
BEFORE UPDATE ON public.product_feeds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();