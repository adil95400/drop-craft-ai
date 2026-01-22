-- Corriger la fonction queue_stock_sync_on_update pour supplier_products
CREATE OR REPLACE FUNCTION public.queue_stock_sync_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_channels JSONB;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Les deux tables utilisent stock_quantity
  v_old_stock := COALESCE(OLD.stock_quantity, 0);
  v_new_stock := COALESCE(NEW.stock_quantity, 0);
  
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
      NEW.user_id, 'stock', TG_TABLE_NAME, NEW.id, 'update', v_channels, 2,
      jsonb_build_object('old_stock', v_old_stock, 'new_stock', v_new_stock, 'sku', NEW.sku)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Maintenant ajouter le trigger sur supplier_products
DROP TRIGGER IF EXISTS trigger_queue_stock_sync_supplier ON public.supplier_products;
CREATE TRIGGER trigger_queue_stock_sync_supplier
AFTER UPDATE OF stock_quantity ON public.supplier_products
FOR EACH ROW
EXECUTE FUNCTION public.queue_stock_sync_on_update();