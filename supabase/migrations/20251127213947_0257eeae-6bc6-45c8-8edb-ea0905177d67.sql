-- Nettoyer les indexes et tables potentiellement existantes
DROP INDEX IF EXISTS idx_price_alerts_user CASCADE;
DROP INDEX IF EXISTS idx_price_alerts_active CASCADE;
DROP INDEX IF EXISTS idx_price_history_user CASCADE;
DROP INDEX IF EXISTS idx_price_history_url CASCADE;
DROP INDEX IF EXISTS idx_price_history_recorded CASCADE;

-- Recréer les tables proprement
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;

-- Add price_history table for Module F (Competitive Intelligence)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  product_name TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  competitor_name TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_history_user_v2 ON price_history(user_id);
CREATE INDEX idx_price_history_url_v2 ON price_history(product_url);
CREATE INDEX idx_price_history_recorded_v2 ON price_history(recorded_at);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price history" ON price_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own price history" ON price_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add price_alerts table for Module F
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  product_name TEXT,
  target_price DECIMAL(10,2) NOT NULL,
  alert_condition TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_alerts_user_v2 ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active_v2 ON price_alerts(is_active);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price alerts" ON price_alerts
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_price_alerts_updated_at BEFORE UPDATE ON price_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add store_previews table for Module E (Store Builder)
CREATE TABLE IF NOT EXISTS store_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES generated_stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preview_url TEXT NOT NULL,
  preview_html TEXT,
  preview_screenshot_url TEXT,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_previews_store ON store_previews(store_id);
CREATE INDEX IF NOT EXISTS idx_store_previews_user ON store_previews(user_id);

ALTER TABLE store_previews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own store previews" ON store_previews;
DROP POLICY IF EXISTS "Users can create own store previews" ON store_previews;

CREATE POLICY "Users can view own store previews" ON store_previews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own store previews" ON store_previews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add pdf_exports table for Module G (Invoices)
CREATE TABLE IF NOT EXISTS pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoice_history(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_kb INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdf_exports_user ON pdf_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_exports_invoice ON pdf_exports(invoice_id);

ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own PDF exports" ON pdf_exports;
DROP POLICY IF EXISTS "Users can create own PDF exports" ON pdf_exports;

CREATE POLICY "Users can view own PDF exports" ON pdf_exports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own PDF exports" ON pdf_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add mockup_variants table for Module H (POD)
CREATE TABLE IF NOT EXISTS mockup_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mockup_id UUID NOT NULL REFERENCES pod_mockups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_sku TEXT NOT NULL,
  color TEXT,
  size TEXT,
  mockup_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mockup_variants_mockup ON mockup_variants(mockup_id);
CREATE INDEX IF NOT EXISTS idx_mockup_variants_user ON mockup_variants(user_id);

ALTER TABLE mockup_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own mockup variants" ON mockup_variants;

CREATE POLICY "Users can manage own mockup variants" ON mockup_variants
  FOR ALL USING (auth.uid() = user_id);