-- Create extensions management tables
CREATE TABLE IF NOT EXISTS public.extension_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  category TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  developer_verified BOOLEAN DEFAULT false,
  version TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  icon_url TEXT,
  screenshots TEXT[],
  features TEXT[],
  permissions TEXT[],
  compatibility TEXT[],
  size_mb DECIMAL(5,2),
  trending BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'suspended')),
  manifest JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  extension_id UUID NOT NULL REFERENCES public.extension_marketplace(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'uninstalled')),
  version TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, extension_id)
);

CREATE TABLE IF NOT EXISTS public.extension_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  extension_id UUID NOT NULL REFERENCES public.extension_marketplace(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.extension_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for extension_marketplace (public read)
CREATE POLICY "Extensions are viewable by everyone" 
ON public.extension_marketplace 
FOR SELECT 
USING (status = 'published');

-- Create policies for user_extensions (user-specific)
CREATE POLICY "Users can view their own extensions" 
ON public.user_extensions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can install extensions" 
ON public.user_extensions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extensions" 
ON public.user_extensions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extensions" 
ON public.user_extensions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for extension_jobs (user-specific)
CREATE POLICY "Users can view their own extension jobs" 
ON public.extension_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create extension jobs" 
ON public.extension_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extension jobs" 
ON public.extension_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_extension_marketplace_updated_at
    BEFORE UPDATE ON public.extension_marketplace
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_extensions_updated_at
    BEFORE UPDATE ON public.user_extensions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extension_jobs_updated_at
    BEFORE UPDATE ON public.extension_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample extensions data
INSERT INTO public.extension_marketplace (name, slug, description, short_description, category, developer_name, developer_verified, version, rating, reviews_count, downloads_count, price, features, permissions, compatibility, size_mb, trending, featured, status) VALUES
('AI Product Descriptions', 'ai-product-descriptions', 'Generate compelling product descriptions using advanced AI. Supports multiple languages and SEO optimization.', 'AI-powered product descriptions with SEO', 'AI', 'OpenAI Partners', true, '2.1.4', 4.9, 1250, 15000, 29.99, ARRAY['Multi-language support', 'SEO optimization', 'Bulk generation', 'Custom prompts'], ARRAY['Product data access', 'API calls'], ARRAY['Shopify', 'WooCommerce', 'Magento'], 2.1, true, true, 'published'),

('Smart Inventory Manager', 'smart-inventory', 'Advanced inventory management with predictive analytics and automated reordering.', 'Predictive inventory management', 'Analytics', 'DataFlow Solutions', true, '1.8.2', 4.7, 890, 12000, 0, ARRAY['Predictive analytics', 'Auto-reordering', 'Multi-warehouse', 'Real-time sync'], ARRAY['Inventory access', 'Order data'], ARRAY['All platforms'], 3.5, false, false, 'published'),

('Social Proof Widgets', 'social-proof-widget', 'Display real-time social proof notifications to boost conversions and build trust.', 'Real-time social proof notifications', 'Marketing', 'ConvertLabs', false, '3.2.1', 4.5, 2100, 25000, 19.99, ARRAY['Real-time notifications', 'Customizable design', 'A/B testing', 'Analytics'], ARRAY['Customer data', 'Order history'], ARRAY['Shopify', 'WooCommerce'], 1.8, true, false, 'published'),

('Advanced Security Suite', 'advanced-security', 'Comprehensive security solution with fraud detection, DDoS protection, and vulnerability scanning.', 'Complete security protection suite', 'Security', 'SecureShield Inc.', true, '4.0.1', 4.8, 750, 8500, 49.99, ARRAY['Fraud detection', 'DDoS protection', 'Vulnerability scan', '2FA integration'], ARRAY['System access', 'Network monitoring'], ARRAY['Enterprise only'], 8.2, false, true, 'published'),

('Performance Optimizer Pro', 'performance-optimizer', 'Comprehensive performance optimization with image compression, caching, and CDN integration.', 'Complete performance optimization suite', 'Productivity', 'SpeedBoost Tech', true, '2.8.1', 4.9, 1890, 22000, 0, ARRAY['Image compression', 'Smart caching', 'CDN integration', 'Core Web Vitals'], ARRAY['Site performance', 'File access'], ARRAY['All platforms'], 3.2, true, true, 'published');