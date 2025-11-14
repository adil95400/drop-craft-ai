-- Nettoyer les produits avec supplier_name NULL (assigner un fournisseur par défaut)
UPDATE imported_products
SET supplier_name = 'Import manuel',
    updated_at = now()
WHERE supplier_name IS NULL;

-- Créer une vue pour surveiller les importations Shopify
CREATE OR REPLACE VIEW shopify_import_stats AS
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE status = 'active') as active_products,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_products,
  MAX(updated_at) as last_import,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as imported_today
FROM imported_products
WHERE supplier_name = 'Shopify';

-- Configurer le cron job pour la synchronisation automatique Shopify toutes les heures
SELECT cron.schedule(
  'auto-sync-shopify-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/shopify-auto-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb
  ) as request_id;
  $$
);