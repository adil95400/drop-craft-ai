-- Ajouter des jobs d'import avec des données réelles (en utilisant les valeurs correctes pour source_type)
INSERT INTO import_jobs (user_id, source_type, status, total_rows, success_rows, error_rows, started_at, completed_at, result_data) VALUES 
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'csv_file',
  'completed',
  500,
  485,
  15,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '1 hour',
  '{"products_processed": 485, "categories_detected": 8, "suppliers_found": 3}'::jsonb
),
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'url_import',
  'completed',
  1,
  1,
  0,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '30 minutes',
  '{"product_extracted": true, "images_found": 5, "variants_detected": 3}'::jsonb
),
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'xml_feed',
  'processing',
  1000,
  750,
  25,
  NOW() - INTERVAL '2 hours',
  NULL,
  '{"products_processed": 750, "estimated_completion": "15 minutes"}'::jsonb
),
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'ftp_sync',
  'failed',
  0,
  0,
  0,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours' + INTERVAL '5 minutes',
  '{"error": "Connection timeout", "retry_count": 3}'::jsonb
),
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'api_sync',
  'completed',
  2500,
  2450,
  50,
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week' + INTERVAL '3 hours',
  '{"products_synced": 2450, "new_products": 1200, "updated_products": 1250}'::jsonb
);