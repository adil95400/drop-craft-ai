-- Create imported_products table for tracking imported products with enhanced metadata
CREATE TABLE IF NOT EXISTS public.imported_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_product_id TEXT,
  source_platform TEXT NOT NULL, -- 'aliexpress', 'amazon', 'bigbuy', etc.
  name TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL,
  import_price DECIMAL,
  suggested_price DECIMAL,
  currency TEXT DEFAULT 'EUR',
  sku TEXT,
  category TEXT,
  subcategory TEXT,
  tags TEXT[],
  image_urls TEXT[],
  supplier_info JSONB DEFAULT '{}',
  seo_optimized BOOLEAN DEFAULT false,
  translation_status TEXT DEFAULT 'original', -- 'original', 'translated', 'optimized'
  ai_score DECIMAL DEFAULT 0, -- AI winning potential score
  competition_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  trend_score DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'imported'
  import_job_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scheduled_imports table for automated import scheduling
CREATE TABLE IF NOT EXISTS public.scheduled_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  next_execution TIMESTAMP WITH TIME ZONE NOT NULL,
  last_execution TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  filter_config JSONB DEFAULT '{}', -- filters for categories, price ranges, etc.
  optimization_settings JSONB DEFAULT '{}', -- AI optimization preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ai_optimization_jobs table for tracking AI processing
CREATE TABLE IF NOT EXISTS public.ai_optimization_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL, -- 'image_optimization', 'translation', 'price_optimization', 'seo_enhancement'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  input_data JSONB NOT NULL,
  output_data JSONB DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_optimization_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for imported_products
CREATE POLICY "Users can manage their own imported products" ON public.imported_products
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for scheduled_imports
CREATE POLICY "Users can manage their own scheduled imports" ON public.scheduled_imports
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for ai_optimization_jobs
CREATE POLICY "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_imported_products_updated_at
  BEFORE UPDATE ON public.imported_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_imports_updated_at
  BEFORE UPDATE ON public.scheduled_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();