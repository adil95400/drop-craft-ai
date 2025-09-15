-- Nettoyer les données existantes si nécessaire et ajouter des données réalistes
DELETE FROM catalog_products WHERE external_id LIKE 'ext_%';

-- Ajouter des données de démonstration réalistes pour les produits
INSERT INTO catalog_products (
  external_id, name, description, price, currency, category, subcategory, brand, sku, 
  image_url, image_urls, rating, reviews_count, availability_status, delivery_time, 
  tags, is_trending, is_bestseller, supplier_name, supplier_id, cost_price, profit_margin,
  stock_quantity, sales_count, competition_score, trend_score
) VALUES 
('ext_001', 'iPhone 15 Pro Max 256GB', 'Le dernier iPhone avec puce A17 Pro, ecran Super Retina XDR de 6,7 pouces et systeme photo avance', 1199.00, 'EUR', 'Smartphones', 'Apple', 'Apple', 'IPHONE15PM256', 
 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', '{"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400"}', 4.8, 2547, 'in_stock', '24h',
 '{"iPhone", "Apple", "Smartphone", "5G", "Premium"}', true, true, 'Apple Store', 'apple_official', 899.00, 33.37, 150, 1250, 85.5, 92.3),

('ext_002', 'MacBook Air M3 13 pouces', 'MacBook Air avec puce M3, 8 Go de RAM et SSD de 256 Go. Ultra-leger et performant', 1299.00, 'EUR', 'Ordinateurs', 'Laptops', 'Apple', 'MBA13M3256', 
 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400', '{"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400"}', 4.7, 1823, 'in_stock', '48h',
 '{"MacBook", "Apple", "Laptop", "M3", "Portable"}', true, false, 'Apple Store', 'apple_official', 999.00, 30.02, 85, 780, 78.9, 88.1),

('ext_003', 'Samsung Galaxy S24 Ultra 512GB', 'Smartphone haut de gamme avec S Pen, ecran Dynamic AMOLED 2X de 6,8 pouces', 1399.00, 'EUR', 'Smartphones', 'Android', 'Samsung', 'SGS24U512', 
 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', '{"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"}', 4.6, 1654, 'in_stock', '24h',
 '{"Samsung", "Galaxy", "Android", "S Pen", "Camera"}', false, true, 'Samsung Electronics', 'samsung_official', 1050.00, 33.21, 120, 950, 82.1, 85.7),

('ext_004', 'AirPods Pro 3eme generation', 'Ecouteurs sans fil avec reduction de bruit active et audio spatial', 279.00, 'EUR', 'Audio', 'Ecouteurs', 'Apple', 'AIRPODSPRO3', 
 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400', '{"https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400"}', 4.5, 3421, 'in_stock', '24h',
 '{"AirPods", "Apple", "Wireless", "Noise Cancelling"}', true, true, 'Apple Store', 'apple_official', 189.00, 47.67, 300, 2100, 90.2, 94.5),

('ext_005', 'PlayStation 5 Digital Edition', 'Console de jeux nouvelle generation avec SSD ultra-rapide', 449.99, 'EUR', 'Gaming', 'Consoles', 'Sony', 'PS5DIGITAL', 
 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', '{"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400"}', 4.4, 2156, 'limited_stock', '72h',
 '{"PlayStation", "Sony", "Gaming", "Console", "Digital"}', true, false, 'Sony Interactive', 'sony_official', 350.00, 28.57, 45, 1680, 75.8, 91.2),

('ext_006', 'Nike Air Max 270 React', 'Chaussures de sport avec technologie React et design moderne', 150.00, 'EUR', 'Mode', 'Chaussures', 'Nike', 'AIRMAX270R', 
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', '{"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"}', 4.3, 892, 'in_stock', '48h',
 '{"Nike", "Air Max", "Sport", "Sneakers", "React"}', false, false, 'Nike Inc', 'nike_official', 85.00, 76.47, 200, 450, 68.4, 72.3),

('ext_007', 'Tesla Model Y Performance Kit', 'Kit accessoires premium pour Tesla Model Y Performance', 899.00, 'EUR', 'Automobile', 'Accessoires', 'Tesla', 'TMYPERFORMKIT', 
 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400', '{"https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400"}', 4.7, 234, 'in_stock', '5-7 jours',
 '{"Tesla", "Model Y", "Performance", "Accessoires"}', false, false, 'Tesla Motors', 'tesla_official', 650.00, 38.31, 25, 156, 71.2, 79.8),

('ext_008', 'Dell XPS 13 Plus i7 16GB', 'Ultrabook premium avec processeur Intel i7 12eme gen et ecran InfinityEdge', 1599.00, 'EUR', 'Ordinateurs', 'Laptops', 'Dell', 'XPS13PLUSI7', 
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', '{"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"}', 4.5, 567, 'in_stock', '48h',
 '{"Dell", "XPS", "Intel", "Ultrabook", "Premium"}', false, false, 'Dell Technologies', 'dell_official', 1200.00, 33.27, 60, 340, 76.5, 81.2),

('ext_009', 'Canon EOS R5 Kit 24-70mm', 'Appareil photo hybride plein format avec objectif RF 24-70mm f/2.8L', 4299.00, 'EUR', 'Photo', 'Appareils', 'Canon', 'EOSR5KIT2470', 
 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400', '{"https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400"}', 4.8, 423, 'in_stock', '48h',
 '{"Canon", "EOS R5", "Photo", "Hybride", "Professionnel"}', false, true, 'Canon Europe', 'canon_official', 3200.00, 34.34, 15, 89, 88.7, 86.9),

('ext_010', 'Dyson V15 Detect Absolute', 'Aspirateur sans fil avec detection laser de la poussiere', 749.99, 'EUR', 'Electromenager', 'Aspirateurs', 'Dyson', 'V15DETECTABS', 
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', '{"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"}', 4.6, 1234, 'in_stock', '24h',
 '{"Dyson", "V15", "Sans fil", "Laser", "Aspirateur"}', true, false, 'Dyson Ltd', 'dyson_official', 520.00, 44.23, 80, 670, 83.2, 87.4);