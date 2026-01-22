-- Trigger sur supplier_products pour sync produits
DROP TRIGGER IF EXISTS trigger_queue_supplier_product_sync ON public.supplier_products;
CREATE TRIGGER trigger_queue_supplier_product_sync
AFTER INSERT OR UPDATE ON public.supplier_products
FOR EACH ROW
EXECUTE FUNCTION public.queue_unified_sync();

-- Ajouter colonne platform manquante à sync_configurations si nécessaire
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sync_configurations' 
    AND column_name = 'platform'
  ) THEN
    ALTER TABLE public.sync_configurations ADD COLUMN platform TEXT;
  END IF;
END $$;

-- Mettre à jour platform depuis integrations si null
UPDATE public.sync_configurations sc
SET platform = i.platform
FROM public.integrations i
WHERE sc.integration_id = i.id AND sc.platform IS NULL;