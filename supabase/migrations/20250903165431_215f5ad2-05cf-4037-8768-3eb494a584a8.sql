-- Ajouter des jobs d'import avec des données réelles
INSERT INTO import_jobs (user_id, source_type, source_url, status, total_rows, success_rows, error_rows, started_at, completed_at, result_data) VALUES 
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'csv',
  'https://example.com/catalog.csv',
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
  'url',
  'https://aliexpress.com/product/123456',
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
  'xml',
  'https://supplier.com/feed.xml',
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
  'ftp',
  'ftp://supplier.com/products/',
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
  'api',
  'BigBuy API Sync',
  'completed',
  2500,
  2450,
  50,
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week' + INTERVAL '3 hours',
  '{"products_synced": 2450, "new_products": 1200, "updated_products": 1250}'::jsonb
);

-- Mettre à jour quelques produits importés avec des données plus réalistes
UPDATE imported_products 
SET 
  name = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'Smartphone Samsung Galaxy Pro Max 256GB'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Écouteurs Sans Fil Apple AirPods Pro 2'
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 'Ordinateur Portable HP Pavilion 15"'
    ELSE name
  END,
  description = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'Smartphone haut de gamme avec écran 6.7" AMOLED, processeur Snapdragon 8 Gen 2, triple caméra 108MP, charge rapide 120W'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Écouteurs sans fil premium avec réduction de bruit active, son spatial, jusqu''à 30h d''autonomie avec boîtier'
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 'Ordinateur portable polyvalent avec processeur Intel Core i5, 16GB RAM, SSD 512GB, écran Full HD'
    ELSE description
  END,
  price = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 899.99
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 279.99
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 649.99
    ELSE price
  END,
  cost_price = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 620.00
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 180.00
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 425.00
    ELSE cost_price
  END,
  category = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'Smartphones'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Audio'
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 'Informatique'
    ELSE category
  END,
  brand = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'Samsung'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Apple'
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 'HP'
    ELSE brand
  END,
  sku = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'SAM-GAL-PRO-256'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'APL-AIR-PRO2'
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 'HP-PAV-15-I5'
    ELSE sku
  END,
  supplier_name = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'TechDistrib EU'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Apple Authorized'
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 'HP Official Store'
    ELSE supplier_name
  END,
  stock_quantity = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 25
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 150
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN 42
    ELSE stock_quantity
  END,
  image_urls = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400']
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400']
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400']
    ELSE image_urls
  END,
  tags = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN ARRAY['smartphone', 'android', 'high-end', 'camera']
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN ARRAY['audio', 'wireless', 'noise-cancelling', 'premium']
    WHEN id = 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928' THEN ARRAY['laptop', 'business', 'portable', 'intel']
    ELSE tags
  END
WHERE id IN ('d766ae38-c052-414c-9ee1-6d1ef999b76f', '1c534e6b-b9ec-403c-9f29-c11a65aa7146', 'c6c6ca2f-16f5-4f5a-bb46-8fe0acbd5928');

-- Créer quelques jobs d'optimisation IA réalistes
INSERT INTO ai_optimization_jobs (user_id, job_type, status, input_data, output_data, progress, completed_at) VALUES 
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'product_optimization',
  'completed',
  '{"product_count": 50, "optimization_type": "seo_titles"}'::jsonb,
  '{"optimized_products": 48, "seo_score_improvement": 25, "estimated_traffic_increase": "15%"}'::jsonb,
  100,
  NOW() - INTERVAL '3 hours'
),
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'image_optimization',
  'completed',
  '{"images_count": 200, "optimization_level": "high"}'::jsonb,
  '{"optimized_images": 195, "size_reduction": "65%", "quality_maintained": true}'::jsonb,
  100,
  NOW() - INTERVAL '1 day'
),
(
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'price_optimization',
  'processing',
  '{"products_count": 100, "market_analysis": true}'::jsonb,
  '{"analyzed_products": 75, "price_suggestions": 75}'::jsonb,
  75,
  NULL
);