-- Create product_translations table for multilingual product content
CREATE TABLE IF NOT EXISTS public.product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ja', 'zh', 'ar')),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  attributes JSONB DEFAULT '{}'::jsonb,
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'ai_generated', 'human_reviewed', 'published')),
  translation_quality_score NUMERIC DEFAULT 0,
  ai_translation_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, locale)
);

-- Create indexes
CREATE INDEX idx_product_translations_user_id ON public.product_translations(user_id);
CREATE INDEX idx_product_translations_product_id ON public.product_translations(product_id);
CREATE INDEX idx_product_translations_locale ON public.product_translations(locale);
CREATE INDEX idx_product_translations_status ON public.product_translations(translation_status);

-- Enable RLS
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own product translations"
  ON public.product_translations
  FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create currencies table
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  currency_code TEXT NOT NULL CHECK (LENGTH(currency_code) = 3),
  currency_name TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  decimal_places INTEGER DEFAULT 2,
  rounding_method TEXT DEFAULT 'round' CHECK (rounding_method IN ('round', 'floor', 'ceil')),
  display_format TEXT DEFAULT '{symbol}{amount}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, currency_code)
);

CREATE INDEX idx_currencies_user_id ON public.currencies(user_id);
CREATE INDEX idx_currencies_code ON public.currencies(currency_code);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own currencies"
  ON public.currencies
  FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create currency_rates table for exchange rates
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  source TEXT DEFAULT 'manual',
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, from_currency, to_currency)
);

CREATE INDEX idx_currency_rates_user_id ON public.currency_rates(user_id);
CREATE INDEX idx_currency_rates_currencies ON public.currency_rates(from_currency, to_currency);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own currency rates"
  ON public.currency_rates
  FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create geo_targeting_rules table
CREATE TABLE IF NOT EXISTS public.geo_targeting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  locales TEXT[] DEFAULT ARRAY[]::TEXT[],
  default_currency TEXT,
  default_locale TEXT,
  pricing_adjustments JSONB DEFAULT '{}'::jsonb,
  shipping_rules JSONB DEFAULT '{}'::jsonb,
  content_variations JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_geo_targeting_user_id ON public.geo_targeting_rules(user_id);
CREATE INDEX idx_geo_targeting_countries ON public.geo_targeting_rules USING gin(countries);
CREATE INDEX idx_geo_targeting_active ON public.geo_targeting_rules(is_active);

ALTER TABLE public.geo_targeting_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own geo targeting rules"
  ON public.geo_targeting_rules
  FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create locale_settings table for user locale preferences
CREATE TABLE IF NOT EXISTS public.locale_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  default_locale TEXT DEFAULT 'fr',
  supported_locales TEXT[] DEFAULT ARRAY['fr', 'en']::TEXT[],
  default_currency TEXT DEFAULT 'EUR',
  supported_currencies TEXT[] DEFAULT ARRAY['EUR', 'USD']::TEXT[],
  auto_translate BOOLEAN DEFAULT true,
  auto_detect_locale BOOLEAN DEFAULT true,
  auto_detect_currency BOOLEAN DEFAULT true,
  translation_provider TEXT DEFAULT 'lovable_ai' CHECK (translation_provider IN ('lovable_ai', 'openai', 'deepl', 'google')),
  currency_rate_provider TEXT DEFAULT 'manual' CHECK (currency_rate_provider IN ('manual', 'ecb', 'openexchangerates')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_locale_settings_user_id ON public.locale_settings(user_id);

ALTER TABLE public.locale_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own locale settings"
  ON public.locale_settings
  FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create translation_jobs table to track bulk translation jobs
CREATE TABLE IF NOT EXISTS public.translation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_name TEXT NOT NULL,
  source_locale TEXT NOT NULL,
  target_locales TEXT[] NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'category', 'page', 'custom')),
  entity_ids UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  translation_provider TEXT DEFAULT 'lovable_ai',
  cost NUMERIC DEFAULT 0,
  error_message TEXT,
  results JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_translation_jobs_user_id ON public.translation_jobs(user_id);
CREATE INDEX idx_translation_jobs_status ON public.translation_jobs(status);

ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own translation jobs"
  ON public.translation_jobs
  FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_translations_updated_at BEFORE UPDATE ON public.product_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON public.currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_targeting_rules_updated_at BEFORE UPDATE ON public.geo_targeting_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locale_settings_updated_at BEFORE UPDATE ON public.locale_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_translation_jobs_updated_at BEFORE UPDATE ON public.translation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();