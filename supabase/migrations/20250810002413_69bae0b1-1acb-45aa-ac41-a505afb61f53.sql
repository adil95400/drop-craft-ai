-- Insérer des données réalistes pour l'application e-commerce

-- Insérer des fournisseurs réalistes
INSERT INTO public.suppliers (id, user_id, name, contact_email, contact_phone, website, country, status, rating, api_key, api_endpoint) VALUES
('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'AliExpress Partners', 'partners@aliexpress.com', '+86-571-8502-2088', 'https://partners.aliexpress.com', 'Chine', 'active', 4.5, 'ali_key_123', 'https://api.aliexpress.com/v1/'),
('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Amazon FBA Elite', 'elite@amazonfba.com', '+1-206-266-1000', 'https://amazonfba-elite.com', 'USA', 'active', 4.8, 'amz_key_456', 'https://api.amazon.com/fba/'),
('550e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'Shopify Direct', 'direct@shopify.com', '+1-613-241-2828', 'https://shopify-direct.com', 'Canada', 'active', 4.6, 'shop_key_789', 'https://api.shopify.com/direct/'),
('550e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000000', 'DHgate Pro', 'pro@dhgate.com', '+86-10-5100-2000', 'https://dhgate-pro.com', 'Chine', 'active', 4.3, 'dh_key_012', 'https://api.dhgate.com/pro/'),
('550e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000000', 'European Wholesale', 'contact@eurowholesale.eu', '+49-30-1234-5678', 'https://european-wholesale.eu', 'Allemagne', 'active', 4.7, 'eu_key_345', 'https://api.eurowholesale.eu/v2/');

-- Insérer des produits du catalogue réalistes
INSERT INTO public.catalog_products (
  id, external_id, name, description, price, cost_price, original_price, 
  category, subcategory, brand, supplier_id, supplier_name, supplier_url,
  image_url, image_urls, sku, ean, currency, stock_quantity, rating, reviews_count, sales_count,
  availability_status, delivery_time, shipping_cost, tags, attributes, seo_data,
  profit_margin, competition_score, trend_score, is_winner, is_trending, is_bestseller
) VALUES 
-- Produits Électronique
('cat_prod_001', 'AE_12345', 'Écouteurs Bluetooth Sans Fil Pro Max', 'Écouteurs haute qualité avec réduction de bruit active, autonomie 30h, étanche IPX7', 89.99, 25.50, 149.99, 'Électronique', 'Audio', 'TechPro', '550e8400-e29b-41d4-a716-446655440001', 'AliExpress Partners', 'https://aliexpress.com/item/12345', 'https://images.unsplash.com/photo-1590658165737-15a047b5a6b8?w=500', ARRAY['https://images.unsplash.com/photo-1590658165737-15a047b5a6b8?w=500'], 'BT-PRO-MAX-001', '1234567890123', 'EUR', 150, 4.7, 1250, 890, 'in_stock', '7-15 jours', 5.99, ARRAY['bluetooth', 'sans-fil', 'audio', 'sport'], '{"couleurs": ["Noir", "Blanc", "Bleu"], "garantie": "2 ans"}', '{"title": "Écouteurs Bluetooth Pro Max - Son Haute Qualité", "description": "Découvrez nos écouteurs sans fil avec réduction de bruit"}', 253.0, 85, 92, true, true, true),

('cat_prod_002', 'AMZ_67890', 'Montre Connectée Sport Ultra', 'Smartwatch avec GPS, moniteur cardiaque, étanche 50m, écran AMOLED', 199.99, 65.00, 299.99, 'Électronique', 'Wearables', 'FitTech', '550e8400-e29b-41d4-a716-446655440002', 'Amazon FBA Elite', 'https://amazon.com/item/67890', 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500', ARRAY['https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500'], 'SW-ULTRA-002', '2345678901234', 'EUR', 75, 4.6, 890, 567, 'in_stock', '3-7 jours', 0.00, ARRAY['smartwatch', 'sport', 'gps', 'santé'], '{"tailles": ["42mm", "46mm"], "couleurs": ["Noir", "Argent"]}', '{"title": "Montre Connectée Sport Ultra - GPS & Santé", "description": "Suivez vos performances avec cette montre connectée ultra-complète"}', 208.0, 78, 88, true, true, false),

-- Produits Mode & Accessoires
('cat_prod_003', 'SH_11111', 'Sac à Dos Voyage Premium', 'Sac à dos anti-vol avec port USB, compartiment laptop 17", imperméable', 79.99, 22.00, 129.99, 'Mode & Accessoires', 'Bagagerie', 'TravelPro', '550e8400-e29b-41d4-a716-446655440003', 'Shopify Direct', 'https://shopify-direct.com/item/11111', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'], 'BP-PREM-003', '3456789012345', 'EUR', 200, 4.5, 678, 445, 'in_stock', '5-12 jours', 7.50, ARRAY['voyage', 'anti-vol', 'usb', 'imperméable'], '{"capacité": "35L", "couleurs": ["Noir", "Gris", "Bleu"]}', '{"title": "Sac à Dos Voyage Premium Anti-Vol USB", "description": "Le compagnon parfait pour vos voyages d\'affaires et loisirs"}', 264.0, 72, 85, false, true, true),

-- Produits Maison & Jardin
('cat_prod_004', 'DH_22222', 'Humidificateur d\'Air Intelligent', 'Humidificateur 6L avec contrôle app, diffuseur huiles essentielles, ultra-silencieux', 129.99, 35.00, 199.99, 'Maison & Jardin', 'Électroménager', 'AirPure', '550e8400-e29b-41d4-a716-446655440004', 'DHgate Pro', 'https://dhgate-pro.com/item/22222', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500', ARRAY['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500'], 'HUM-SMART-004', '4567890123456', 'EUR', 120, 4.4, 456, 289, 'in_stock', '8-16 jours', 12.00, ARRAY['humidificateur', 'intelligent', 'silencieux', 'aromathérapie'], '{"capacité": "6L", "autonomie": "24h", "wifi": true}', '{"title": "Humidificateur Intelligent 6L avec App", "description": "Contrôlez l\'humidité de votre maison depuis votre smartphone"}', 271.0, 68, 79, false, false, true),

-- Produits Sport & Fitness
('cat_prod_005', 'EU_33333', 'Bandes de Résistance Fitness Pro', 'Set de 5 bandes élastiques avec poignées, ancrage porte, guide exercices', 39.99, 8.50, 69.99, 'Sport & Fitness', 'Équipement', 'FitBand', '550e8400-e29b-41d4-a716-446655440005', 'European Wholesale', 'https://european-wholesale.eu/item/33333', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'], 'RB-PRO-005', '5678901234567', 'EUR', 300, 4.8, 1890, 1234, 'in_stock', '3-8 jours', 4.99, ARRAY['fitness', 'résistance', 'musculation', 'portable'], '{"résistance": "5-150 lbs", "matériau": "latex naturel"}', '{"title": "Bandes de Résistance Pro - Kit Fitness Complet", "description": "Transformez votre maison en salle de sport avec ce kit professionnel"}', 370.0, 92, 95, true, true, true),

-- Plus de produits variés...
('cat_prod_006', 'AE_44444', 'Lampe LED Bureau Architecte', 'Lampe de bureau pliable, 3 modes éclairage, contrôle tactile, économique', 45.99, 12.00, 79.99, 'Maison & Jardin', 'Éclairage', 'LightPro', '550e8400-e29b-41d4-a716-446655440001', 'AliExpress Partners', 'https://aliexpress.com/item/44444', 'https://images.unsplash.com/photo-1524234107056-1c1f48f64ab8?w=500', ARRAY['https://images.unsplash.com/photo-1524234107056-1c1f48f64ab8?w=500'], 'LED-ARCH-006', '6789012345678', 'EUR', 180, 4.3, 567, 378, 'in_stock', '6-14 jours', 6.50, ARRAY['led', 'bureau', 'pliable', 'tactile'], '{"puissance": "12W", "couleurs": ["Blanc", "Noir"]}', '{"title": "Lampe LED Bureau Architecte Pliable", "description": "Éclairage parfait pour le travail et les loisirs créatifs"}', 283.0, 75, 82, false, true, false),

('cat_prod_007', 'AMZ_55555', 'Chargeur Sans Fil Rapide 15W', 'Station de charge Qi compatible iPhone/Samsung, refroidissement actif', 34.99, 9.50, 59.99, 'Électronique', 'Accessoires', 'ChargeTech', '550e8400-e29b-41d4-a716-446655440002', 'Amazon FBA Elite', 'https://amazon.com/item/55555', 'https://images.unsplash.com/photo-1609592935234-0b0d5b261c81?w=500', ARRAY['https://images.unsplash.com/photo-1609592935234-0b0d5b261c81?w=500'], 'WC-FAST-007', '7890123456789', 'EUR', 250, 4.6, 789, 523, 'in_stock', '2-5 jours', 3.99, ARRAY['qi', 'sans-fil', 'rapide', 'universel'], '{"puissance": "15W", "compatibilité": ["iPhone", "Samsung", "Google"]}', '{"title": "Chargeur Sans Fil Rapide 15W Qi", "description": "Rechargez rapidement tous vos appareils compatibles Qi"}', 268.0, 88, 87, true, false, true),

('cat_prod_008', 'SH_66666', 'Organisateur Voiture Premium', 'Organisateur siège arrière, multi-poches, support tablette, cuir PU', 29.99, 7.80, 49.99, 'Auto & Moto', 'Accessoires', 'CarOrganize', '550e8400-e29b-41d4-a716-446655440003', 'Shopify Direct', 'https://shopify-direct.com/item/66666', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500', ARRAY['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500'], 'CO-PREM-008', '8901234567890', 'EUR', 150, 4.4, 345, 289, 'in_stock', '4-10 jours', 5.50, ARRAY['voiture', 'organisateur', 'cuir', 'tablette'], '{"matériau": "Cuir PU", "couleurs": ["Noir", "Marron"]}', '{"title": "Organisateur Voiture Premium Cuir", "description": "Gardez votre voiture organisée avec style et fonctionnalité"}', 284.0, 71, 78, false, false, false);

-- Insérer des clients réalistes
INSERT INTO public.customers (id, user_id, name, email, phone, status, total_orders, total_spent, address) VALUES
('cust_001', '00000000-0000-0000-0000-000000000000', 'Marie Dubois', 'marie.dubois@gmail.com', '+33 6 12 34 56 78', 'active', 15, 1249.85, '{"street": "25 Rue de Rivoli", "city": "Paris", "postal_code": "75001", "country": "France"}'),
('cust_002', '00000000-0000-0000-0000-000000000000', 'Jean Martin', 'jean.martin@outlook.fr', '+33 6 98 76 54 32', 'active', 8, 567.40, '{"street": "12 Avenue des Champs", "city": "Lyon", "postal_code": "69001", "country": "France"}'),
('cust_003', '00000000-0000-0000-0000-000000000000', 'Sophie Leroy', 'sophie.leroy@yahoo.fr', '+33 7 11 22 33 44', 'active', 22, 2150.30, '{"street": "8 Boulevard Saint-Michel", "city": "Marseille", "postal_code": "13001", "country": "France"}'),
('cust_004', '00000000-0000-0000-0000-000000000000', 'Pierre Moreau', 'pierre.moreau@free.fr', '+33 6 55 66 77 88', 'active', 5, 289.99, '{"street": "15 Rue du Commerce", "city": "Toulouse", "postal_code": "31000", "country": "France"}'),
('cust_005', '00000000-0000-0000-0000-000000000000', 'Camille Bernard', 'camille.bernard@gmail.com', '+33 7 99 88 77 66', 'active', 12, 890.45, '{"street": "7 Place Bellecour", "city": "Nice", "postal_code": "06000", "country": "France"}');

-- Insérer des commandes réalistes
INSERT INTO public.orders (id, user_id, customer_id, order_number, status, total_amount, currency, created_at, updated_at, tracking_number, notes, shipping_address, billing_address) VALUES
('order_001', '00000000-0000-0000-0000-000000000000', 'cust_001', 'CMD-2024-001', 'delivered', 179.98, 'EUR', '2024-01-10 10:30:00+00', '2024-01-15 14:20:00+00', 'FR123456789', 'Livraison express demandée', '{"street": "25 Rue de Rivoli", "city": "Paris", "postal_code": "75001", "country": "France"}', '{"street": "25 Rue de Rivoli", "city": "Paris", "postal_code": "75001", "country": "France"}'),
('order_002', '00000000-0000-0000-0000-000000000000', 'cust_002', 'CMD-2024-002', 'shipped', 89.99, 'EUR', '2024-01-12 14:15:00+00', '2024-01-13 09:45:00+00', 'FR987654321', 'Emballage cadeau', '{"street": "12 Avenue des Champs", "city": "Lyon", "postal_code": "69001", "country": "France"}', '{"street": "12 Avenue des Champs", "city": "Lyon", "postal_code": "69001", "country": "France"}'),
('order_003', '00000000-0000-0000-0000-000000000000', 'cust_003', 'CMD-2024-003', 'processing', 259.97, 'EUR', '2024-01-14 16:45:00+00', '2024-01-14 16:45:00+00', NULL, 'Commande prioritaire', '{"street": "8 Boulevard Saint-Michel", "city": "Marseille", "postal_code": "13001", "country": "France"}', '{"street": "8 Boulevard Saint-Michel", "city": "Marseille", "postal_code": "13001", "country": "France"}'),
('order_004', '00000000-0000-0000-0000-000000000000', 'cust_004', 'CMD-2024-004', 'pending', 129.99, 'EUR', '2024-01-15 11:20:00+00', '2024-01-15 11:20:00+00', NULL, 'Première commande', '{"street": "15 Rue du Commerce", "city": "Toulouse", "postal_code": "31000", "country": "France"}', '{"street": "15 Rue du Commerce", "city": "Toulouse", "postal_code": "31000", "country": "France"}'),
('order_005', '00000000-0000-0000-0000-000000000000', 'cust_005', 'CMD-2024-005', 'delivered', 69.98, 'EUR', '2024-01-08 09:10:00+00', '2024-01-12 15:30:00+00', 'FR555666777', 'Client fidèle', '{"street": "7 Place Bellecour", "city": "Nice", "postal_code": "06000", "country": "France"}', '{"street": "7 Place Bellecour", "city": "Nice", "postal_code": "06000", "country": "France"}');

-- Insérer des articles de commande
INSERT INTO public.order_items (id, order_id, product_name, product_sku, quantity, unit_price, total_price) VALUES
('item_001', 'order_001', 'Écouteurs Bluetooth Sans Fil Pro Max', 'BT-PRO-MAX-001', 2, 89.99, 179.98),
('item_002', 'order_002', 'Écouteurs Bluetooth Sans Fil Pro Max', 'BT-PRO-MAX-001', 1, 89.99, 89.99),
('item_003', 'order_003', 'Montre Connectée Sport Ultra', 'SW-ULTRA-002', 1, 199.99, 199.99),
('item_004', 'order_003', 'Sac à Dos Voyage Premium', 'BP-PREM-003', 1, 79.99, 79.99),
('item_005', 'order_004', 'Humidificateur d\'Air Intelligent', 'HUM-SMART-004', 1, 129.99, 129.99),
('item_006', 'order_005', 'Bandes de Résistance Fitness Pro', 'RB-PRO-005', 1, 39.99, 39.99),
('item_007', 'order_005', 'Chargeur Sans Fil Rapide 15W', 'WC-FAST-007', 1, 34.99, 34.99);

-- Ajouter quelques favoris d'utilisateurs
INSERT INTO public.user_favorites (id, user_id, catalog_product_id) VALUES
('fav_001', '00000000-0000-0000-0000-000000000000', 'cat_prod_001'),
('fav_002', '00000000-0000-0000-0000-000000000000', 'cat_prod_005'),
('fav_003', '00000000-0000-0000-0000-000000000000', 'cat_prod_007');