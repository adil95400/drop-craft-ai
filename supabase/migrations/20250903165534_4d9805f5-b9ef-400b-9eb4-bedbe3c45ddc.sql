-- Mettre à jour les produits importés avec de vraies données
UPDATE imported_products 
SET 
  name = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'Smartphone Samsung Galaxy Pro Max 256GB'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Écouteurs Sans Fil Apple AirPods Pro 2'
    ELSE 'Produit Technologique Premium'
  END,
  description = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 'Smartphone haut de gamme avec écran 6.7" AMOLED, processeur Snapdragon 8 Gen 2, triple caméra 108MP, charge rapide 120W'
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 'Écouteurs sans fil premium avec réduction de bruit active, son spatial, jusqu''à 30h d''autonomie avec boîtier'
    ELSE 'Description complète du produit avec spécifications techniques détaillées'
  END,
  price = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 899.99
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 279.99
    ELSE ROUND((RANDOM() * 500 + 50)::numeric, 2)
  END,
  cost_price = CASE 
    WHEN id = 'd766ae38-c052-414c-9ee1-6d1ef999b76f' THEN 620.00
    WHEN id = '1c534e6b-b9ec-403c-9f29-c11a65aa7146' THEN 180.00
    ELSE ROUND((RANDOM() * 300 + 30)::numeric, 2)
  END,
  category = CASE 
    WHEN RANDOM() < 0.3 THEN 'Smartphones'
    WHEN RANDOM() < 0.6 THEN 'Audio'
    ELSE 'Informatique'
  END,
  brand = CASE 
    WHEN RANDOM() < 0.2 THEN 'Samsung'
    WHEN RANDOM() < 0.4 THEN 'Apple'
    WHEN RANDOM() < 0.6 THEN 'HP'
    WHEN RANDOM() < 0.8 THEN 'Xiaomi'
    ELSE 'Anker'
  END,
  sku = 'SKU-' || UPPER(substring(id::text, 1, 8)),
  supplier_name = CASE 
    WHEN RANDOM() < 0.25 THEN 'TechDistrib EU'
    WHEN RANDOM() < 0.5 THEN 'Apple Authorized'
    WHEN RANDOM() < 0.75 THEN 'HP Official Store'
    ELSE 'BigBuy Wholesale'
  END,
  stock_quantity = FLOOR(RANDOM() * 200 + 10)::integer,
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400'
  ],
  tags = CASE 
    WHEN RANDOM() < 0.5 THEN ARRAY['premium', 'bestseller', 'high-tech']
    ELSE ARRAY['quality', 'reliable', 'popular']
  END
WHERE user_id = '44795494-985c-4c0e-97bc-800a3c4faf2b'
AND id IN (
  SELECT id FROM imported_products 
  WHERE user_id = '44795494-985c-4c0e-97bc-800a3c4faf2b' 
  LIMIT 20
);