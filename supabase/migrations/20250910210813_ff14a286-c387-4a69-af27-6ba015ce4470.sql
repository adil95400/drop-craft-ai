-- Create marketplace extensions table
CREATE TABLE public.marketplace_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  developer_id UUID NOT NULL,
  developer_name TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'suspended')),
  featured BOOLEAN DEFAULT false,
  trending BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  icon_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  manifest_data JSONB DEFAULT '{}',
  files_data JSONB DEFAULT '{}',
  changelog TEXT,
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create extension reviews table
CREATE TABLE public.extension_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id UUID NOT NULL REFERENCES public.marketplace_extensions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  review TEXT,
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create extension purchases table  
CREATE TABLE public.extension_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id UUID NOT NULL REFERENCES public.marketplace_extensions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  commission_rate DECIMAL(5,2) DEFAULT 30.0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  developer_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user extensions table (installed extensions)
CREATE TABLE public.user_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  extension_id UUID NOT NULL REFERENCES public.marketplace_extensions(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'uninstalled')),
  configuration JSONB DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  auto_update BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create developer profiles table
CREATE TABLE public.developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  developer_name TEXT NOT NULL,
  company_name TEXT,
  website TEXT,
  bio TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  extensions_count INTEGER DEFAULT 0,
  payout_email TEXT,
  tax_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.marketplace_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketplace_extensions
CREATE POLICY "Anyone can view published extensions" ON public.marketplace_extensions
  FOR SELECT USING (status = 'published');

CREATE POLICY "Developers can manage their own extensions" ON public.marketplace_extensions
  FOR ALL USING (developer_id = auth.uid());

-- Create RLS policies for extension_reviews  
CREATE POLICY "Anyone can view reviews" ON public.extension_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for purchased extensions" ON public.extension_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.extension_purchases 
      WHERE user_id = auth.uid() AND extension_id = extension_reviews.extension_id AND status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews" ON public.extension_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for extension_purchases
CREATE POLICY "Users can view their own purchases" ON public.extension_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases" ON public.extension_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_extensions
CREATE POLICY "Users can manage their installed extensions" ON public.user_extensions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for developer_profiles
CREATE POLICY "Anyone can view developer profiles" ON public.developer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own developer profile" ON public.developer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_marketplace_extensions_status ON public.marketplace_extensions(status);
CREATE INDEX idx_marketplace_extensions_category ON public.marketplace_extensions(category);
CREATE INDEX idx_marketplace_extensions_featured ON public.marketplace_extensions(featured);
CREATE INDEX idx_marketplace_extensions_trending ON public.marketplace_extensions(trending);
CREATE INDEX idx_extension_reviews_extension_id ON public.extension_reviews(extension_id);
CREATE INDEX idx_extension_purchases_user_id ON public.extension_purchases(user_id);
CREATE INDEX idx_user_extensions_user_id ON public.user_extensions(user_id);

-- Insert sample data
INSERT INTO public.marketplace_extensions (
  name, description, short_description, developer_id, developer_name, category, tags, price, status, featured, trending, verified, downloads_count, rating, reviews_count, version
) VALUES 
  ('AI Product Optimizer', 'Optimise automatiquement vos descriptions produits avec l''IA pour améliorer vos ventes et votre SEO', 'Optimisation IA des descriptions produits', auth.uid(), 'OpenAI Labs', 'ai', '{"AI", "SEO", "Optimisation"}', 29.99, 'published', true, true, true, 15600, 4.9, 312, '2.1.0'),
  ('Social Proof Master', 'Affichez des notifications de vente en temps réel pour créer un sentiment d''urgence et augmenter les conversions', 'Notifications de vente temps réel', auth.uid(), 'ConvertPro', 'marketing', '{"Marketing", "Conversion", "Social Proof"}', 19.99, 'published', true, true, false, 8900, 4.6, 178, '1.8.5'),
  ('Analytics Dashboard Pro', 'Tableau de bord analytics avancé avec prédictions IA et insights automatisés pour votre e-commerce', 'Analytics avancé avec IA', auth.uid(), 'DataViz Inc', 'analytics', '{"Analytics", "IA", "Dashboard"}', 0, 'published', true, false, true, 12400, 4.7, 245, '3.0.1'),
  ('Smart Inventory Manager', 'Gestion intelligente des stocks avec prédictions de demande et alertes automatiques', 'Gestion intelligente des stocks', auth.uid(), 'StockGenius', 'productivity', '{"Inventaire", "Prédiction", "Automatisation"}', 24.99, 'published', false, true, false, 5600, 4.5, 89, '1.4.2'),
  ('Email Template Builder', 'Créateur d''emails drag & drop professionnel avec templates responsive et A/B testing', 'Créateur d''emails drag & drop', auth.uid(), 'MailCraft', 'marketing', '{"Email", "Templates", "A/B Testing"}', 14.99, 'published', false, true, false, 3400, 4.4, 67, '2.2.0');

-- Insert developer profiles
INSERT INTO public.developer_profiles (
  user_id, developer_name, company_name, website, bio, verified, total_revenue, total_downloads, average_rating, total_reviews, extensions_count
) VALUES (
  auth.uid(), 'Drop Craft Developer', 'Drop Craft AI', 'https://dropcraft.ai', 'Développeur principal chez Drop Craft AI, spécialisé dans les extensions e-commerce et l''intelligence artificielle.', true, 12450, 45600, 4.7, 891, 5
);

-- Create triggers for updating stats
CREATE OR REPLACE FUNCTION update_extension_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update marketplace_extensions stats when reviews are added/updated
  IF TG_TABLE_NAME = 'extension_reviews' THEN
    UPDATE public.marketplace_extensions 
    SET 
      rating = (
        SELECT ROUND(AVG(rating)::numeric, 2) 
        FROM public.extension_reviews 
        WHERE extension_id = COALESCE(NEW.extension_id, OLD.extension_id)
      ),
      reviews_count = (
        SELECT COUNT(*) 
        FROM public.extension_reviews 
        WHERE extension_id = COALESCE(NEW.extension_id, OLD.extension_id)
      )
    WHERE id = COALESCE(NEW.extension_id, OLD.extension_id);
  END IF;
  
  -- Update developer stats
  UPDATE public.developer_profiles 
  SET 
    total_revenue = (
      SELECT COALESCE(SUM(developer_amount), 0) 
      FROM public.extension_purchases p
      JOIN public.marketplace_extensions e ON p.extension_id = e.id
      WHERE e.developer_id = developer_profiles.user_id AND p.status = 'completed'
    ),
    total_downloads = (
      SELECT COALESCE(SUM(downloads_count), 0) 
      FROM public.marketplace_extensions 
      WHERE developer_id = developer_profiles.user_id
    ),
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) 
      FROM public.marketplace_extensions 
      WHERE developer_id = developer_profiles.user_id AND rating > 0
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.extension_reviews r
      JOIN public.marketplace_extensions e ON r.extension_id = e.id
      WHERE e.developer_id = developer_profiles.user_id
    ),
    extensions_count = (
      SELECT COUNT(*) 
      FROM public.marketplace_extensions 
      WHERE developer_id = developer_profiles.user_id AND status = 'published'
    )
  WHERE user_id IN (
    SELECT DISTINCT developer_id 
    FROM public.marketplace_extensions 
    WHERE id = COALESCE(NEW.extension_id, OLD.extension_id, NEW.id, OLD.id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_extension_stats_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.extension_reviews
  FOR EACH ROW EXECUTE FUNCTION update_extension_stats();

CREATE TRIGGER update_extension_stats_on_purchase  
  AFTER INSERT OR UPDATE ON public.extension_purchases
  FOR EACH ROW EXECUTE FUNCTION update_extension_stats();

CREATE TRIGGER update_extension_stats_on_extension
  AFTER INSERT OR UPDATE ON public.marketplace_extensions
  FOR EACH ROW EXECUTE FUNCTION update_extension_stats();