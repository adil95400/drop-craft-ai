-- Table pour stocker les données d'extension (produits scrapés, imports, etc.)
CREATE TABLE public.extension_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL DEFAULT 'product_scrape',
  data JSONB,
  source_url TEXT,
  status TEXT DEFAULT 'pending',
  imported_product_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les analytics de l'extension
CREATE TABLE public.extension_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for extension_data
CREATE POLICY "Users can view their own extension data" 
  ON public.extension_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extension data" 
  ON public.extension_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extension data" 
  ON public.extension_data FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extension data" 
  ON public.extension_data FOR DELETE 
  USING (auth.uid() = user_id);

-- Service role can manage all extension data
CREATE POLICY "Service role full access extension_data"
  ON public.extension_data
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for extension_analytics
CREATE POLICY "Users can view their own extension analytics" 
  ON public.extension_analytics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extension analytics" 
  ON public.extension_analytics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all analytics
CREATE POLICY "Service role full access extension_analytics"
  ON public.extension_analytics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
CREATE INDEX idx_extension_data_user_id ON public.extension_data(user_id);
CREATE INDEX idx_extension_data_status ON public.extension_data(status);
CREATE INDEX idx_extension_analytics_user_id ON public.extension_analytics(user_id);
CREATE INDEX idx_extension_analytics_created ON public.extension_analytics(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_extension_data_updated_at
  BEFORE UPDATE ON public.extension_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();