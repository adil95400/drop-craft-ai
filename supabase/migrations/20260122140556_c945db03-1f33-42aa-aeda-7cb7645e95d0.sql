-- Créer les triggers pour la synchronisation automatique

-- Trigger sur products pour sync stock
DROP TRIGGER IF EXISTS trigger_queue_stock_sync_products ON public.products;
CREATE TRIGGER trigger_queue_stock_sync_products
AFTER UPDATE OF stock_quantity ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.queue_stock_sync_on_update();

-- Trigger sur products pour sync produits (création/modification)
DROP TRIGGER IF EXISTS trigger_queue_product_sync ON public.products;
CREATE TRIGGER trigger_queue_product_sync
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.queue_unified_sync();

-- Trigger sur orders pour sync commandes
DROP TRIGGER IF EXISTS trigger_queue_order_sync ON public.orders;
CREATE TRIGGER trigger_queue_order_sync
AFTER INSERT OR UPDATE OF status, fulfillment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.queue_unified_sync();

-- Trigger sur orders pour sync tracking
DROP TRIGGER IF EXISTS trigger_queue_tracking_sync ON public.orders;
CREATE TRIGGER trigger_queue_tracking_sync
AFTER UPDATE OF tracking_number ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.queue_tracking_sync_on_update();

-- Trigger sur customers pour sync clients
DROP TRIGGER IF EXISTS trigger_queue_customer_sync ON public.customers;
CREATE TRIGGER trigger_queue_customer_sync
AFTER INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.queue_unified_sync();

-- Index pour améliorer les performances de la queue
CREATE INDEX IF NOT EXISTS idx_unified_sync_queue_pending 
ON public.unified_sync_queue (status, scheduled_at, priority) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_unified_sync_queue_user 
ON public.unified_sync_queue (user_id, sync_type);

-- Index pour les logs
CREATE INDEX IF NOT EXISTS idx_unified_sync_logs_user_date 
ON public.unified_sync_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_sync_logs_status 
ON public.unified_sync_logs (status, sync_type);