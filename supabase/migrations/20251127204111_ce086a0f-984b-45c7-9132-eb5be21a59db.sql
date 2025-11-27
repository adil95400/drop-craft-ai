-- Module 2: Import 1-clic Fournisseur → Shopify
-- Drop existing tables if they exist
DROP TABLE IF EXISTS import_history CASCADE;
DROP TABLE IF EXISTS import_jobs CASCADE;
DROP TABLE IF EXISTS supplier_product_mappings CASCADE;

-- Table pour mapper produits fournisseurs → Shopify
CREATE TABLE supplier_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_product_id UUID REFERENCES supplier_products(id) ON DELETE CASCADE,
  shopify_product_id TEXT,
  shopify_variant_ids JSONB DEFAULT '[]'::jsonb,
  mapping_status TEXT DEFAULT 'pending' CHECK (mapping_status IN ('pending', 'mapped', 'syncing', 'failed')),
  sync_settings JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les jobs d'import
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('single', 'bulk', 'auto')),
  supplier_id TEXT,
  product_ids UUID[] DEFAULT ARRAY[]::UUID[],
  total_products INTEGER DEFAULT 0,
  processed_products INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  import_settings JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour historique des imports
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  import_job_id UUID REFERENCES import_jobs(id) ON DELETE CASCADE,
  supplier_product_id UUID REFERENCES supplier_products(id),
  shopify_product_id TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'skip', 'error')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  import_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE supplier_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own product mappings"
  ON supplier_product_mappings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own import jobs"
  ON import_jobs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users view their own import history"
  ON import_history FOR SELECT
  USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_supplier_product_mappings_updated_at
  BEFORE UPDATE ON supplier_product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour performance
CREATE INDEX idx_supplier_product_mappings_user ON supplier_product_mappings(user_id);
CREATE INDEX idx_supplier_product_mappings_supplier_product ON supplier_product_mappings(supplier_product_id);
CREATE INDEX idx_supplier_product_mappings_status ON supplier_product_mappings(mapping_status);
CREATE INDEX idx_import_jobs_user ON import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_history_job ON import_history(import_job_id);
CREATE INDEX idx_import_history_user ON import_history(user_id);