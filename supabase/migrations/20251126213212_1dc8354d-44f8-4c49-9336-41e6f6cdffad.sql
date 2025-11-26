-- ============================================
-- SHOPOPTI SUPPLIER MODULE - COMPLETE OPTIMIZATION
-- Amélioration complète du module fournisseur
-- ============================================

-- 1. Table pour catalogue produits unifié avec enrichissement
CREATE TABLE IF NOT EXISTS supplier_products_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Fournisseur source
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_name TEXT,
  supplier_product_id TEXT,
  
  -- Informations produit
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  
  -- Prix et stock
  cost_price DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  suggested_price DECIMAL(10,2), -- Prix suggéré par l'IA
  stock_quantity INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock', -- in_stock, low_stock, out_of_stock
  
  -- Images et médias
  images JSONB DEFAULT '[]'::jsonb,
  main_image_url TEXT,
  
  -- Catégorisation
  category TEXT,
  tags TEXT[],
  
  -- Métriques de performance
  view_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  profit_margin DECIMAL(5,2),
  
  -- Métadonnées
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending, syncing, synced, error
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Recommandations IA
  ai_score DECIMAL(3,2), -- Score de 0 à 1 pour recommandation
  ai_insights JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Index pour performance
  CONSTRAINT unique_supplier_product UNIQUE(supplier_id, supplier_product_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_unified_user ON supplier_products_unified(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_unified_supplier ON supplier_products_unified(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_unified_stock ON supplier_products_unified(stock_status);
CREATE INDEX IF NOT EXISTS idx_supplier_products_unified_sync ON supplier_products_unified(sync_status);
CREATE INDEX IF NOT EXISTS idx_supplier_products_unified_ai_score ON supplier_products_unified(ai_score DESC);

-- 2. Table pour gestion multi-fournisseurs d'un même produit
CREATE TABLE IF NOT EXISTS product_supplier_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL, -- Référence au produit dans le catalogue principal
  
  -- Fournisseurs disponibles (ordre de priorité)
  primary_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  backup_suppliers JSONB DEFAULT '[]'::jsonb, -- [{supplier_id, priority, price, stock}]
  
  -- Configuration de basculement automatique
  auto_switch_enabled BOOLEAN DEFAULT true,
  switch_threshold INTEGER DEFAULT 5, -- Bascule si stock < threshold
  
  -- Historique
  last_switch_at TIMESTAMPTZ,
  switch_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_user ON product_supplier_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_product ON product_supplier_mapping(product_id);

-- 3. Table pour notifications fournisseurs
CREATE TABLE IF NOT EXISTS supplier_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type et priorité
  notification_type TEXT NOT NULL, -- stock_alert, price_change, sync_error, order_update, new_products
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Entités liées
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID,
  order_id UUID,
  
  -- Statut
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Actions possibles
  action_url TEXT,
  action_label TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_notifications_user ON supplier_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_type ON supplier_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_priority ON supplier_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_created ON supplier_notifications(created_at DESC);

-- 4. Table pour imports CSV/XML/FTP
CREATE TABLE IF NOT EXISTS supplier_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- Configuration de l'import
  import_type TEXT NOT NULL, -- csv, xml, ftp
  import_config JSONB NOT NULL, -- url, credentials, mapping, etc.
  
  -- Planification
  schedule TEXT, -- cron expression ou 'manual'
  next_run_at TIMESTAMPTZ,
  
  -- Statut de l'import
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- Résultats
  total_products INTEGER DEFAULT 0,
  imported_products INTEGER DEFAULT 0,
  updated_products INTEGER DEFAULT 0,
  failed_products INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_import_jobs_user ON supplier_import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_import_jobs_supplier ON supplier_import_jobs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_import_jobs_status ON supplier_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_supplier_import_jobs_schedule ON supplier_import_jobs(next_run_at);

-- 5. Table pour recommandations IA
CREATE TABLE IF NOT EXISTS supplier_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de recommandation
  recommendation_type TEXT NOT NULL, -- product_to_import, price_adjustment, supplier_switch, stock_alert
  
  -- Cible
  target_entity_type TEXT, -- product, supplier, order
  target_entity_id UUID,
  
  -- Recommandation
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0-1
  
  -- Actions suggérées
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  estimated_impact JSONB, -- {revenue: 100, profit: 50, time_saved: 120}
  
  -- Statut
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, expired
  is_active BOOLEAN DEFAULT true,
  
  -- Métadonnées
  reasoning JSONB, -- Explication de l'IA
  expires_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_ai_recommendations_user ON supplier_ai_recommendations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_ai_recommendations_type ON supplier_ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_supplier_ai_recommendations_score ON supplier_ai_recommendations(confidence_score DESC);

-- 6. Vue pour catalogue unifié avec informations enrichies
CREATE OR REPLACE VIEW supplier_catalog_enriched AS
SELECT 
  sp.id,
  sp.user_id,
  sp.supplier_id,
  sp.supplier_name,
  sp.title,
  sp.description,
  sp.cost_price,
  sp.retail_price,
  sp.suggested_price,
  sp.stock_quantity,
  sp.stock_status,
  sp.images,
  sp.category,
  sp.ai_score,
  sp.profit_margin,
  
  -- Métriques de performance
  sp.view_count,
  sp.conversion_rate,
  
  -- Informations fournisseur
  s.status as supplier_status,
  s.rating as supplier_rating,
  
  -- Disponibilité multi-fournisseurs
  (SELECT COUNT(*) FROM product_supplier_mapping psm WHERE psm.product_id = sp.id) as alternative_suppliers_count,
  
  sp.last_synced_at,
  sp.sync_status,
  sp.created_at,
  sp.updated_at
FROM supplier_products_unified sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.is_active = true;

-- 7. Fonctions utilitaires

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_supplier_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_supplier_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO supplier_notifications (
    user_id,
    notification_type,
    title,
    message,
    priority,
    supplier_id,
    data
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_supplier_id,
    p_data
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le score AI d'un produit
CREATE OR REPLACE FUNCTION calculate_product_ai_score(
  p_product_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL(3,2) := 0;
  v_product RECORD;
BEGIN
  SELECT * INTO v_product FROM supplier_products_unified WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Score basé sur plusieurs facteurs
  -- 1. Marge bénéficiaire (0-0.3)
  IF v_product.profit_margin > 40 THEN
    v_score := v_score + 0.3;
  ELSIF v_product.profit_margin > 25 THEN
    v_score := v_score + 0.2;
  ELSIF v_product.profit_margin > 15 THEN
    v_score := v_score + 0.1;
  END IF;
  
  -- 2. Stock disponible (0-0.2)
  IF v_product.stock_quantity > 100 THEN
    v_score := v_score + 0.2;
  ELSIF v_product.stock_quantity > 20 THEN
    v_score := v_score + 0.15;
  ELSIF v_product.stock_quantity > 0 THEN
    v_score := v_score + 0.1;
  END IF;
  
  -- 3. Taux de conversion (0-0.3)
  IF v_product.conversion_rate > 5 THEN
    v_score := v_score + 0.3;
  ELSIF v_product.conversion_rate > 2 THEN
    v_score := v_score + 0.2;
  ELSIF v_product.conversion_rate > 0 THEN
    v_score := v_score + 0.1;
  END IF;
  
  -- 4. Fraîcheur des données (0-0.2)
  IF v_product.last_synced_at > now() - interval '1 day' THEN
    v_score := v_score + 0.2;
  ELSIF v_product.last_synced_at > now() - interval '7 days' THEN
    v_score := v_score + 0.1;
  END IF;
  
  RETURN LEAST(v_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_products_unified_updated_at
  BEFORE UPDATE ON supplier_products_unified
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_supplier_mapping_updated_at
  BEFORE UPDATE ON product_supplier_mapping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_import_jobs_updated_at
  BEFORE UPDATE ON supplier_import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS Policies

-- supplier_products_unified
ALTER TABLE supplier_products_unified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own supplier products"
  ON supplier_products_unified FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplier products"
  ON supplier_products_unified FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier products"
  ON supplier_products_unified FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplier products"
  ON supplier_products_unified FOR DELETE
  USING (auth.uid() = user_id);

-- product_supplier_mapping
ALTER TABLE product_supplier_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own product supplier mappings"
  ON product_supplier_mapping FOR ALL
  USING (auth.uid() = user_id);

-- supplier_notifications
ALTER TABLE supplier_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON supplier_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON supplier_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- supplier_import_jobs
ALTER TABLE supplier_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import jobs"
  ON supplier_import_jobs FOR ALL
  USING (auth.uid() = user_id);

-- supplier_ai_recommendations
ALTER TABLE supplier_ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI recommendations"
  ON supplier_ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI recommendations"
  ON supplier_ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);