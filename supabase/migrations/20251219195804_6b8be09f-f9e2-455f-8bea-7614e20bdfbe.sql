-- Add more missing tables

-- Advanced Reports table
CREATE TABLE IF NOT EXISTS public.advanced_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_data JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  schedule TEXT,
  last_generated_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.advanced_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reports" ON public.advanced_reports FOR ALL USING (auth.uid() = user_id);

-- API Analytics table
CREATE TABLE IF NOT EXISTS public.api_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  endpoint TEXT,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view api analytics" ON public.api_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Imported Products table (for analytics)
CREATE TABLE IF NOT EXISTS public.imported_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  source_platform TEXT,
  source_url TEXT,
  import_job_id UUID REFERENCES public.import_jobs(id) ON DELETE SET NULL,
  category TEXT,
  price DECIMAL(10,2),
  status TEXT DEFAULT 'imported',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own imported products" ON public.imported_products FOR ALL USING (auth.uid() = user_id);

-- Add address column to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;

-- Add confidence_score and impact_score to business_intelligence_insights
ALTER TABLE public.business_intelligence_insights 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS impact_score DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add updated_at to import_jobs
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();