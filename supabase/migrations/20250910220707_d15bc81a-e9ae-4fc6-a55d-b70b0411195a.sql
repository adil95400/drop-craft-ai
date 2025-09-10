-- Create table for imported reviews from Chrome extension
CREATE TABLE IF NOT EXISTS public.imported_reviews (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  author TEXT,
  date TEXT,
  verified BOOLEAN DEFAULT false,
  url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE,
  country TEXT,
  source TEXT DEFAULT 'chrome_extension',
  extension_version TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_imported_reviews_platform ON public.imported_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_imported_reviews_rating ON public.imported_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_imported_reviews_synced_at ON public.imported_reviews(synced_at);
CREATE INDEX IF NOT EXISTS idx_imported_reviews_created_at ON public.imported_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_imported_reviews_source ON public.imported_reviews(source);

-- Create table for sync statistics
CREATE TABLE IF NOT EXISTS public.sync_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  type TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  total_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, type)
);

-- Create function to help with table creation from edge function
CREATE OR REPLACE FUNCTION public.create_imported_reviews_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- This function exists to allow edge function to check table existence
  -- The table is already created above, so this is just a placeholder
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on imported_reviews (if needed for user-specific data in the future)
ALTER TABLE public.imported_reviews ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (reviews are generally public)
-- In production, you might want to restrict this based on your needs
CREATE POLICY "Allow all operations on imported_reviews" 
ON public.imported_reviews 
FOR ALL 
USING (true);

-- Enable RLS on sync_statistics
ALTER TABLE public.sync_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on sync_statistics" 
ON public.sync_statistics 
FOR ALL 
USING (true);