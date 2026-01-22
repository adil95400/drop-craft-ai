-- Table centrale de queue de synchronisation unifiée
CREATE TABLE IF NOT EXISTS public.unified_sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('products', 'prices', 'stock', 'orders', 'customers', 'tracking', 'reviews', 'fulfillment')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
  channels JSONB DEFAULT '[]'::jsonb,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_unified_sync_queue_user_status ON public.unified_sync_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_unified_sync_queue_scheduled ON public.unified_sync_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_unified_sync_queue_type ON public.unified_sync_queue(sync_type, status);

-- Table de configuration de synchronisation par intégration
CREATE TABLE IF NOT EXISTS public.sync_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_id UUID NOT NULL,
  platform TEXT NOT NULL,
  sync_products BOOLEAN DEFAULT true,
  sync_prices BOOLEAN DEFAULT true,
  sync_stock BOOLEAN DEFAULT true,
  sync_orders BOOLEAN DEFAULT true,
  sync_customers BOOLEAN DEFAULT true,
  sync_tracking BOOLEAN DEFAULT true,
  sync_reviews BOOLEAN DEFAULT false,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
  sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', '5min', '15min', 'hourly', 'daily')),
  conflict_resolution TEXT DEFAULT 'shopopti_priority' CHECK (conflict_resolution IN ('shopopti_priority', 'store_priority', 'newest_wins')),
  is_active BOOLEAN DEFAULT true,
  last_full_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, integration_id)
);

-- Table de logs de synchronisation unifiée
CREATE TABLE IF NOT EXISTS public.unified_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  queue_id UUID REFERENCES public.unified_sync_queue(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial', 'skipped')),
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_details JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unified_sync_logs_user ON public.unified_sync_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_sync_logs_type ON public.unified_sync_logs(sync_type, status);

-- RLS Policies
ALTER TABLE public.unified_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync queue" ON public.unified_sync_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync configurations" ON public.sync_configurations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync logs" ON public.unified_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert sync logs" ON public.unified_sync_logs
  FOR INSERT WITH CHECK (true);

-- Fonction générique pour ajouter à la queue de sync
CREATE OR REPLACE FUNCTION public.queue_unified_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sync_type TEXT;
  v_action TEXT;
  v_channels JSONB;
  v_entity_id UUID;
  v_user_id UUID;
  v_priority INTEGER := 5;
BEGIN
  -- Déterminer le type de sync selon la table
  CASE TG_TABLE_NAME
    WHEN 'products' THEN 
      v_sync_type := 'products';
      v_entity_id := NEW.id;
      v_user_id := NEW.user_id;
    WHEN 'supplier_products' THEN 
      v_sync_type := 'products';
      v_entity_id := NEW.id;
      v_user_id := NEW.user_id;
    WHEN 'orders' THEN 
      v_sync_type := 'orders';
      v_entity_id := NEW.id;
      v_user_id := NEW.user_id;
      v_priority := 3; -- Commandes haute priorité
    WHEN 'customers' THEN 
      v_sync_type := 'customers';
      v_entity_id := NEW.id;
      v_user_id := NEW.user_id;
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Déterminer l'action
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
    v_user_id := OLD.user_id;
  END IF;
  
  -- Récupérer les canaux actifs pour cet utilisateur
  SELECT jsonb_agg(jsonb_build_object('integration_id', sc.integration_id, 'platform', sc.platform))
  INTO v_channels
  FROM public.sync_configurations sc
  JOIN public.integrations i ON sc.integration_id = i.id
  WHERE sc.user_id = v_user_id 
    AND sc.is_active = true
    AND i.is_active = true
    AND (
      (v_sync_type = 'products' AND sc.sync_products = true) OR
      (v_sync_type = 'orders' AND sc.sync_orders = true) OR
      (v_sync_type = 'customers' AND sc.sync_customers = true)
    );
  
  -- Si des canaux existent, ajouter à la queue
  IF v_channels IS NOT NULL AND jsonb_array_length(v_channels) > 0 THEN
    INSERT INTO public.unified_sync_queue (
      user_id, sync_type, entity_type, entity_id, action, channels, priority,
      payload
    ) VALUES (
      v_user_id, v_sync_type, TG_TABLE_NAME, v_entity_id, v_action, v_channels, v_priority,
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger pour sync stock automatique
CREATE OR REPLACE FUNCTION public.queue_stock_sync_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_channels JSONB;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Déterminer les colonnes de stock selon la table
  IF TG_TABLE_NAME = 'products' THEN
    v_old_stock := COALESCE(OLD.stock_quantity, 0);
    v_new_stock := COALESCE(NEW.stock_quantity, 0);
  ELSIF TG_TABLE_NAME = 'supplier_products' THEN
    v_old_stock := COALESCE(OLD.stock, 0);
    v_new_stock := COALESCE(NEW.stock, 0);
  ELSE
    RETURN NEW;
  END IF;
  
  -- Si le stock n'a pas changé, ne rien faire
  IF v_old_stock = v_new_stock THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les canaux configurés pour sync stock
  SELECT jsonb_agg(jsonb_build_object('integration_id', sc.integration_id, 'platform', sc.platform))
  INTO v_channels
  FROM public.sync_configurations sc
  JOIN public.integrations i ON sc.integration_id = i.id
  WHERE sc.user_id = NEW.user_id 
    AND sc.is_active = true
    AND sc.sync_stock = true
    AND i.is_active = true;
  
  -- Ajouter à la queue de sync
  IF v_channels IS NOT NULL AND jsonb_array_length(v_channels) > 0 THEN
    INSERT INTO public.unified_sync_queue (
      user_id, sync_type, entity_type, entity_id, action, channels, priority,
      payload
    ) VALUES (
      NEW.user_id, 'stock', TG_TABLE_NAME, NEW.id, 'update', v_channels, 2, -- Stock = haute priorité
      jsonb_build_object('old_stock', v_old_stock, 'new_stock', v_new_stock, 'sku', NEW.sku)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour sync tracking automatique
CREATE OR REPLACE FUNCTION public.queue_tracking_sync_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_channels JSONB;
BEGIN
  -- Si pas de changement de tracking number, ignorer
  IF OLD.tracking_number IS NOT DISTINCT FROM NEW.tracking_number THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les canaux configurés
  SELECT jsonb_agg(jsonb_build_object('integration_id', sc.integration_id, 'platform', sc.platform))
  INTO v_channels
  FROM public.sync_configurations sc
  JOIN public.integrations i ON sc.integration_id = i.id
  WHERE sc.user_id = NEW.user_id 
    AND sc.is_active = true
    AND sc.sync_tracking = true
    AND i.is_active = true;
  
  IF v_channels IS NOT NULL AND jsonb_array_length(v_channels) > 0 THEN
    INSERT INTO public.unified_sync_queue (
      user_id, sync_type, entity_type, entity_id, action, channels, priority,
      payload
    ) VALUES (
      NEW.user_id, 'tracking', 'orders', NEW.id, 'update', v_channels, 1, -- Tracking = très haute priorité
      jsonb_build_object('tracking_number', NEW.tracking_number, 'carrier', NEW.shipping_carrier, 'order_number', NEW.order_number)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Création des triggers
DROP TRIGGER IF EXISTS trigger_queue_stock_sync_products ON public.products;
CREATE TRIGGER trigger_queue_stock_sync_products
  AFTER UPDATE OF stock_quantity ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_stock_sync_on_update();

DROP TRIGGER IF EXISTS trigger_queue_tracking_sync ON public.orders;
CREATE TRIGGER trigger_queue_tracking_sync
  AFTER UPDATE OF tracking_number ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_tracking_sync_on_update();

-- Trigger updated_at
CREATE TRIGGER update_unified_sync_queue_updated_at
  BEFORE UPDATE ON public.unified_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_configurations_updated_at
  BEFORE UPDATE ON public.sync_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();