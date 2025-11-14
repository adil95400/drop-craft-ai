-- Phase 1: Product Research Pro - Tables pour viral products et social trends

-- Table pour les produits viraux détectés sur réseaux sociaux
CREATE TABLE IF NOT EXISTS public.viral_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'instagram', 'youtube')),
  url TEXT NOT NULL,
  viral_score INTEGER NOT NULL DEFAULT 0 CHECK (viral_score >= 0 AND viral_score <= 100),
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  price DECIMAL(10,2),
  estimated_margin DECIMAL(5,2),
  thumbnail_url TEXT,
  video_url TEXT,
  hashtags TEXT[],
  creator_username TEXT,
  creator_followers BIGINT,
  posted_at TIMESTAMPTZ,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les tendances sociales et hashtags
CREATE TABLE IF NOT EXISTS public.social_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'instagram', 'youtube')),
  trend_score INTEGER NOT NULL DEFAULT 0 CHECK (trend_score >= 0 AND trend_score <= 100),
  growth_rate DECIMAL(5,2) DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  product_count INTEGER DEFAULT 0,
  peak_date DATE,
  trend_status TEXT DEFAULT 'rising' CHECK (trend_status IN ('rising', 'peak', 'declining', 'stable')),
  seasonality TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les notes des fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  reliability_score INTEGER DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  shipping_score INTEGER DEFAULT 0 CHECK (shipping_score >= 0 AND shipping_score <= 100),
  price_score INTEGER DEFAULT 0 CHECK (price_score >= 0 AND price_score <= 100),
  communication_score INTEGER DEFAULT 0 CHECK (communication_score >= 0 AND communication_score <= 100),
  overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  total_orders INTEGER DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
  average_delivery_days INTEGER DEFAULT 0,
  return_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les logs de performance fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  delivery_time INTEGER,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  quality_issues TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  would_reorder BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les alertes fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('stock_out', 'price_increase', 'delivery_delay', 'quality_drop', 'account_closed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les fournisseurs de secours
CREATE TABLE IF NOT EXISTS public.backup_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  primary_supplier_id UUID NOT NULL,
  backup_supplier_id UUID NOT NULL,
  backup_supplier_name TEXT,
  backup_supplier_url TEXT,
  price_comparison DECIMAL(10,2),
  shipping_time_days INTEGER,
  priority INTEGER DEFAULT 1,
  auto_switch_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les dépenses (Phase 2)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('advertising', 'tools', 'suppliers', 'virtual_assistant', 'banking', 'taxes', 'other')),
  subcategory TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  attached_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_viral_products_user_id ON public.viral_products(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_products_platform ON public.viral_products(platform);
CREATE INDEX IF NOT EXISTS idx_viral_products_viral_score ON public.viral_products(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_products_analyzed_at ON public.viral_products(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_trends_hashtag ON public.social_trends(hashtag);
CREATE INDEX IF NOT EXISTS idx_social_trends_platform ON public.social_trends(platform);
CREATE INDEX IF NOT EXISTS idx_social_trends_trend_score ON public.social_trends(trend_score DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_user_id ON public.supplier_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_overall_score ON public.supplier_ratings(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_alerts_user_id ON public.supplier_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_alerts_resolved ON public.supplier_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_backup_suppliers_product_id ON public.backup_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_backup_suppliers_user_id ON public.backup_suppliers(user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Enable RLS
ALTER TABLE public.viral_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own viral products"
  ON public.viral_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own viral products"
  ON public.viral_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own viral products"
  ON public.viral_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own viral products"
  ON public.viral_products FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view social trends"
  ON public.social_trends FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage social trends"
  ON public.social_trends FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own supplier ratings"
  ON public.supplier_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own supplier ratings"
  ON public.supplier_ratings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own supplier performance logs"
  ON public.supplier_performance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own supplier performance logs"
  ON public.supplier_performance_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own supplier alerts"
  ON public.supplier_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own supplier alerts"
  ON public.supplier_alerts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own backup suppliers"
  ON public.backup_suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own backup suppliers"
  ON public.backup_suppliers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_trends_updated_at
  BEFORE UPDATE ON public.social_trends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_ratings_updated_at
  BEFORE UPDATE ON public.supplier_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backup_suppliers_updated_at
  BEFORE UPDATE ON public.backup_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();