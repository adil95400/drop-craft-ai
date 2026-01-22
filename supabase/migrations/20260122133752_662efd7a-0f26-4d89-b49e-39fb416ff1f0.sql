-- Fonction pour ajouter à la queue de sync automatiquement (corrigée)
CREATE OR REPLACE FUNCTION public.queue_price_sync_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_channels JSONB;
  v_old_price DECIMAL(10,2);
  v_new_price DECIMAL(10,2);
BEGIN
  -- Déterminer les colonnes de prix selon la table
  IF TG_TABLE_NAME = 'products' THEN
    v_old_price := OLD.price;
    v_new_price := NEW.price;
  ELSIF TG_TABLE_NAME = 'supplier_products' THEN
    v_old_price := OLD.selling_price;
    v_new_price := NEW.selling_price;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Si le prix n'a pas changé, ne rien faire
  IF v_old_price IS NOT DISTINCT FROM v_new_price THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les channels liés à ce produit
  SELECT jsonb_agg(channel_id) INTO v_channels
  FROM public.product_channel_mappings
  WHERE product_id = NEW.id AND user_id = NEW.user_id AND sync_status != 'error';
  
  -- Si des channels existent, ajouter à la queue
  IF v_channels IS NOT NULL AND jsonb_array_length(v_channels) > 0 THEN
    INSERT INTO public.price_sync_queue (
      user_id, product_id, product_source_table,
      old_price, new_price, currency,
      trigger_source, channels_to_sync
    ) VALUES (
      NEW.user_id, NEW.id, TG_TABLE_NAME,
      v_old_price, v_new_price, COALESCE(NEW.currency, 'EUR'),
      'repricing', v_channels
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger sur products
DROP TRIGGER IF EXISTS trigger_queue_price_sync_products ON public.products;
CREATE TRIGGER trigger_queue_price_sync_products
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_price_sync_on_update();

-- Trigger sur supplier_products
DROP TRIGGER IF EXISTS trigger_queue_price_sync_supplier ON public.supplier_products;
CREATE TRIGGER trigger_queue_price_sync_supplier
  AFTER UPDATE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_price_sync_on_update();