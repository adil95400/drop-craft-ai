-- Fonction trigger pour marquer les produits comme obsolètes lors de modifications
CREATE OR REPLACE FUNCTION public.mark_published_product_outdated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Si le produit est déjà publié et qu'on modifie des champs importants
  IF NEW.published_product_id IS NOT NULL AND OLD.sync_status = 'synced' THEN
    -- Vérifier si des champs importants ont changé
    IF (NEW.name IS DISTINCT FROM OLD.name) OR
       (NEW.description IS DISTINCT FROM OLD.description) OR
       (NEW.price IS DISTINCT FROM OLD.price) OR
       (NEW.cost_price IS DISTINCT FROM OLD.cost_price) OR
       (NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity) OR
       (NEW.status IS DISTINCT FROM OLD.status) OR
       (NEW.image_urls IS DISTINCT FROM OLD.image_urls) OR
       (NEW.category IS DISTINCT FROM OLD.category) OR
       (NEW.sku IS DISTINCT FROM OLD.sku) THEN
      
      -- Marquer comme obsolète
      NEW.sync_status := 'outdated';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_mark_published_outdated ON imported_products;
CREATE TRIGGER trigger_mark_published_outdated
  BEFORE UPDATE ON imported_products
  FOR EACH ROW
  EXECUTE FUNCTION mark_published_product_outdated();

-- Fonction pour synchroniser automatiquement le stock
CREATE OR REPLACE FUNCTION public.auto_sync_product_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Synchroniser le stock des produits publiés
  UPDATE products p
  SET 
    stock_quantity = ip.stock_quantity,
    updated_at = now()
  FROM imported_products ip
  WHERE p.id = ip.published_product_id
    AND ip.published_product_id IS NOT NULL
    AND ip.sync_status = 'synced'
    AND p.stock_quantity IS DISTINCT FROM ip.stock_quantity;
    
  -- Mettre à jour last_synced_at
  UPDATE imported_products
  SET last_synced_at = now()
  WHERE published_product_id IN (
    SELECT id FROM products WHERE updated_at = now()
  );
END;
$$;

COMMENT ON FUNCTION public.mark_published_product_outdated() IS 'Marque automatiquement un produit publié comme obsolète lors de modifications importantes';
COMMENT ON FUNCTION public.auto_sync_product_stock() IS 'Synchronise automatiquement le stock entre imported_products et products';