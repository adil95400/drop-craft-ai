-- Create realistic seed data for all tables
-- First, let's seed suppliers with real data
INSERT INTO suppliers (
  user_id,
  name,
  website,
  country,
  status,
  rating,
  contact_email,
  contact_phone,
  product_count,
  supplier_type,
  sector,
  logo_url,
  description,
  connection_status,
  tags,
  created_at
) VALUES
-- Existing user suppliers (using a placeholder user_id that will be replaced)
('00000000-0000-0000-0000-000000000001', 'AliExpress Global', 'https://aliexpress.com', 'China', 'active', 4.2, 'business@aliexpress.com', '+86-571-85022088', 150000, 'marketplace', 'electronics', 'https://ae01.alicdn.com/kf/S0ab15b1c9b0b4e6b8f6f7b8c5d4a3f2e.jpg', 'Leading global marketplace for electronics and consumer goods', 'connected', '{"global", "electronics", "wholesale"}', now() - interval '30 days'),

('00000000-0000-0000-0000-000000000001', 'Amazon Business', 'https://business.amazon.com', 'USA', 'active', 4.5, 'partner@amazon.com', '+1-206-266-1000', 95000, 'marketplace', 'general', 'https://m.media-amazon.com/images/G/01/B2B/b2b-logo._CB1565786845_.png', 'B2B marketplace with millions of products', 'connected', '{"amazon", "b2b", "logistics"}', now() - interval '25 days'),

('00000000-0000-0000-0000-000000000001', 'Fnac Marketplace', 'https://marketplace.fnac.com', 'France', 'active', 4.1, 'partenaires@fnac.com', '+33-1-55-21-55-55', 25000, 'marketplace', 'media', 'https://static.fnac-static.com/multimedia/Images/FR/logo_fnac.png', 'French cultural and tech products marketplace', 'connected', '{"france", "culture", "tech"}', now() - interval '20 days'),

('00000000-0000-0000-0000-000000000001', 'Zalando Partners', 'https://partner.zalando.com', 'Germany', 'active', 4.3, 'partners@zalando.com', '+49-30-2759-46-00', 35000, 'marketplace', 'fashion', 'https://img01.ztat.net/brand/zalando-logo.svg', 'Leading European fashion marketplace', 'connected', '{"fashion", "europe", "clothing"}', now() - interval '18 days'),

('00000000-0000-0000-0000-000000000001', 'eBay Business', 'https://business.ebay.com', 'USA', 'active', 4.0, 'business@ebay.com', '+1-408-376-7400', 45000, 'marketplace', 'auctions', 'https://ir.ebaystatic.com/cr/v/c1/ebay-logo-1-1200x630-margin.png', 'Global auction and marketplace platform', 'connected', '{"auctions", "global", "collectibles"}', now() - interval '15 days'),

('00000000-0000-0000-0000-000000000001', 'Shopify Suppliers Hub', 'https://suppliers.shopify.com', 'Canada', 'active', 4.4, 'suppliers@shopify.com', '+1-888-746-7439', 18000, 'platform', 'ecommerce', 'https://cdn.shopify.com/shopifycloud/brochure/assets/logo-shopify-black-16a1d47b.svg', 'Curated supplier network for Shopify merchants', 'connected', '{"shopify", "ecommerce", "dropshipping"}', now() - interval '12 days'),

('00000000-0000-0000-0000-000000000001', 'WooCommerce Connect', 'https://woocommerce.com/connect', 'USA', 'active', 4.2, 'connect@woocommerce.com', '+1-877-273-3049', 22000, 'platform', 'ecommerce', 'https://woocommerce.com/wp-content/themes/woocommerce/images/logo-woocommerce.svg', 'WordPress ecommerce integration platform', 'connected', '{"wordpress", "ecommerce", "plugins"}', now() - interval '10 days'),

('00000000-0000-0000-0000-000000000001', 'Rakuten Business', 'https://business.rakuten.com', 'Japan', 'active', 4.1, 'business@rakuten.com', '+81-3-4523-4000', 38000, 'marketplace', 'general', 'https://corp.rakuten.co.jp/about/philosophy/brand/logo/img/logo_001.png', 'Japanese e-commerce and internet services', 'connected', '{"japan", "marketplace", "services"}', now() - interval '8 days'),

('00000000-0000-0000-0000-000000000001', 'Cdiscount Pro', 'https://pro.cdiscount.com', 'France', 'active', 3.9, 'pro@cdiscount.com', '+33-5-57-78-78-78', 28000, 'marketplace', 'general', 'https://i2.cdscdn.com/resources/logo/logo-cdiscount-marketplace.png', 'French marketplace for all product categories', 'connected', '{"france", "marketplace", "discount"}', now() - interval '6 days'),

('00000000-0000-0000-0000-000000000001', 'Etsy Manufacturing', 'https://manufacturing.etsy.com', 'USA', 'active', 4.3, 'manufacturing@etsy.com', '+1-718-855-7955', 12000, 'marketplace', 'handmade', 'https://i.etsystatic.com/site-assets/logos/etsy_logo_lgx2.png', 'Handmade and vintage marketplace suppliers', 'connected', '{"handmade", "vintage", "artisan"}', now() - interval '4 days');

-- Now seed customers with realistic data
INSERT INTO customers (
  user_id,
  name,
  email,
  phone,
  status,
  total_spent,
  total_orders,
  address,
  country,
  created_at
) VALUES
('00000000-0000-0000-0000-000000000001', 'Marie Dubois', 'marie.dubois@email.fr', '+33-6-12-34-56-78', 'active', 2580.50, 12, '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', 'France', now() - interval '45 days'),

('00000000-0000-0000-0000-000000000001', 'Jean Martin', 'jean.martin@gmail.com', '+33-6-87-65-43-21', 'active', 1950.00, 8, '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69002", "country": "France"}', 'France', now() - interval '38 days'),

('00000000-0000-0000-0000-000000000001', 'Sophie Bernard', 'sophie.bernard@outlook.fr', '+33-6-11-22-33-44', 'active', 3420.75, 15, '{"street": "789 Boulevard Saint-Germain", "city": "Marseille", "postal_code": "13001", "country": "France"}', 'France', now() - interval '32 days'),

('00000000-0000-0000-0000-000000000001', 'Pierre Leroy', 'pierre.leroy@yahoo.fr', '+33-6-55-44-33-22', 'active', 890.25, 4, '{"street": "321 Rue Victor Hugo", "city": "Toulouse", "postal_code": "31000", "country": "France"}', 'France', now() - interval '28 days'),

('00000000-0000-0000-0000-000000000001', 'Isabelle Moreau', 'isabelle.moreau@gmail.com', '+33-6-99-88-77-66', 'active', 1680.00, 7, '{"street": "654 Place de la République", "city": "Nice", "postal_code": "06000", "country": "France"}', 'France', now() - interval '25 days'),

('00000000-0000-0000-0000-000000000001', 'Thomas Petit', 'thomas.petit@hotmail.fr', '+33-6-77-66-55-44', 'inactive', 450.00, 2, '{"street": "987 Cours Mirabeau", "city": "Nantes", "postal_code": "44000", "country": "France"}', 'France', now() - interval '60 days'),

('00000000-0000-0000-0000-000000000001', 'Claire Roux', 'claire.roux@email.fr', '+33-6-33-22-11-00', 'active', 2150.90, 9, '{"street": "147 Rue de la Liberté", "city": "Strasbourg", "postal_code": "67000", "country": "France"}', 'France', now() - interval '20 days'),

('00000000-0000-0000-0000-000000000001', 'Laurent Fournier', 'laurent.fournier@gmail.com', '+33-6-44-55-66-77', 'active', 3850.40, 18, '{"street": "258 Avenue de la Gare", "city": "Bordeaux", "postal_code": "33000", "country": "France"}', 'France', now() - interval '42 days'),

('00000000-0000-0000-0000-000000000001', 'Nathalie Girard', 'nathalie.girard@outlook.fr', '+33-6-88-99-00-11', 'active', 1275.60, 6, '{"street": "369 Boulevard Voltaire", "city": "Lille", "postal_code": "59000", "country": "France"}', 'France', now() - interval '15 days'),

('00000000-0000-0000-0000-000000000001', 'Michel Bonnet', 'michel.bonnet@yahoo.fr', '+33-6-22-33-44-55', 'active', 720.30, 3, '{"street": "741 Rue Jean Jaurès", "city": "Rennes", "postal_code": "35000", "country": "France"}', 'France', now() - interval '35 days');

-- Seed orders with realistic progression
INSERT INTO orders (
  user_id,
  customer_id,
  order_number,
  status,
  total_amount,
  currency,
  order_date,
  delivery_date,
  shipping_address,
  billing_address,
  items
) VALUES
-- Orders for Marie Dubois
('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'marie.dubois@email.fr'), 'ORD-2024-001', 'delivered', 285.50, 'EUR', now() - interval '40 days', now() - interval '37 days', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '[{"product_name": "iPhone 15 Case", "quantity": 2, "price": 45.50}, {"product_name": "Wireless Charger", "quantity": 1, "price": 194.50}]'),

('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'marie.dubois@email.fr'), 'ORD-2024-002', 'delivered', 420.00, 'EUR', now() - interval '35 days', now() - interval '32 days', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '[{"product_name": "Bluetooth Headphones", "quantity": 1, "price": 420.00}]'),

-- Orders for Jean Martin  
('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'jean.martin@gmail.com'), 'ORD-2024-003', 'shipped', 180.75, 'EUR', now() - interval '3 days', NULL, '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69002", "country": "France"}', '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69002", "country": "France"}', '[{"product_name": "Smart Watch Band", "quantity": 3, "price": 60.25}]'),

('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'jean.martin@gmail.com'), 'ORD-2024-004', 'processing', 95.50, 'EUR', now() - interval '1 day', NULL, '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69002", "country": "France"}', '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69002", "country": "France"}', '[{"product_name": "Phone Stand", "quantity": 2, "price": 47.75}]'),

-- Orders for Sophie Bernard
('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'sophie.bernard@outlook.fr'), 'ORD-2024-005', 'delivered', 680.25, 'EUR', now() - interval '25 days', now() - interval '22 days', '{"street": "789 Boulevard Saint-Germain", "city": "Marseille", "postal_code": "13001", "country": "France"}', '{"street": "789 Boulevard Saint-Germain", "city": "Marseille", "postal_code": "13001", "country": "France"}', '[{"product_name": "Laptop Stand", "quantity": 1, "price": 680.25}]'),

-- Orders for Laurent Fournier (high-value customer)
('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'laurent.fournier@gmail.com'), 'ORD-2024-006', 'delivered', 1250.00, 'EUR', now() - interval '30 days', now() - interval '27 days', '{"street": "258 Avenue de la Gare", "city": "Bordeaux", "postal_code": "33000", "country": "France"}', '{"street": "258 Avenue de la Gare", "city": "Bordeaux", "postal_code": "33000", "country": "France"}', '[{"product_name": "4K Monitor", "quantity": 2, "price": 625.00}]'),

('00000000-0000-0000-0000-000000000001', (SELECT id FROM customers WHERE email = 'laurent.fournier@gmail.com'), 'ORD-2024-007', 'cancelled', 350.00, 'EUR', now() - interval '15 days', NULL, '{"street": "258 Avenue de la Gare", "city": "Bordeaux", "postal_code": "33000", "country": "France"}', '{"street": "258 Avenue de la Gare", "city": "Bordeaux", "postal_code": "33000", "country": "France"}', '[{"product_name": "Gaming Mouse", "quantity": 1, "price": 350.00}]');

-- Update supplier product counts to match reality
UPDATE suppliers SET product_count = 
  CASE 
    WHEN name = 'AliExpress Global' THEN 1250
    WHEN name = 'Amazon Business' THEN 890
    WHEN name = 'Fnac Marketplace' THEN 425
    WHEN name = 'Zalando Partners' THEN 680
    WHEN name = 'eBay Business' THEN 520
    WHEN name = 'Shopify Suppliers Hub' THEN 340
    WHEN name = 'WooCommerce Connect' THEN 280
    WHEN name = 'Rakuten Business' THEN 195
    WHEN name = 'Cdiscount Pro' THEN 165
    WHEN name = 'Etsy Manufacturing' THEN 132
    ELSE product_count
  END;

-- Create realistic automation triggers and actions
INSERT INTO automation_triggers (
  user_id,
  name,
  description,
  trigger_type,
  conditions,
  is_active
) VALUES
('00000000-0000-0000-0000-000000000001', 'Stock Critique', 'Déclenché quand le stock d''un produit descend sous le seuil', 'inventory_low', '{"threshold": 5}', true),
('00000000-0000-0000-0000-000000000001', 'Nouvelle Commande', 'Déclenché à chaque nouvelle commande', 'order_created', '{}', true),
('00000000-0000-0000-0000-000000000001', 'Client Inactif', 'Déclenché pour les clients sans achat depuis 30 jours', 'customer_inactive', '{"days": 30}', true),
('00000000-0000-0000-0000-000000000001', 'Commande Livrée', 'Déclenché quand une commande est marquée comme livrée', 'order_delivered', '{}', true),
('00000000-0000-0000-0000-000000000001', 'Prix Concurrent', 'Déclenché quand un concurrent change ses prix', 'competitor_price_change', '{"threshold_percentage": 10}', true);

-- Add corresponding automation actions for each trigger
INSERT INTO automation_actions (
  user_id,
  trigger_id,
  action_type,
  action_config,
  execution_order,
  is_active
) VALUES
-- Actions for Stock Critique
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Stock Critique'), 'send_notification', '{"type": "email", "template": "low_stock_alert"}', 1, true),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Stock Critique'), 'update_product_status', '{"status": "low_stock"}', 2, true),

-- Actions for Nouvelle Commande
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Nouvelle Commande'), 'send_notification', '{"type": "sms", "template": "order_confirmation"}', 1, true),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Nouvelle Commande'), 'update_inventory', '{"action": "decrease_stock"}', 2, true),

-- Actions for Client Inactif
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Client Inactif'), 'send_email', '{"template": "reactivation_campaign", "discount": 15}', 1, true),

-- Actions for Commande Livrée
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Commande Livrée'), 'send_email', '{"template": "delivery_confirmation"}', 1, true),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM automation_triggers WHERE name = 'Commande Livrée'), 'request_review', '{"delay_hours": 24}', 2, true);

-- Create some execution logs to show activity
INSERT INTO automation_execution_logs (
  user_id,
  trigger_id,
  action_id,
  input_data,
  output_data,
  status,
  execution_time_ms,
  started_at,
  completed_at
) VALUES
('00000000-0000-0000-0000-000000000001', 
 (SELECT id FROM automation_triggers WHERE name = 'Nouvelle Commande'), 
 (SELECT id FROM automation_actions WHERE action_type = 'send_notification' AND trigger_id = (SELECT id FROM automation_triggers WHERE name = 'Nouvelle Commande')),
 '{"order_id": "ORD-2024-007", "customer_email": "laurent.fournier@gmail.com"}',
 '{"notification_sent": true, "delivery_id": "ntf_123456"}',
 'completed',
 125,
 now() - interval '2 hours',
 now() - interval '2 hours' + interval '125 milliseconds');

-- Add realistic activity logs
INSERT INTO activity_logs (
  user_id,
  action,
  description,
  entity_type,
  entity_id,
  metadata,
  severity,
  source
) VALUES
('00000000-0000-0000-0000-000000000001', 'order_created', 'Nouvelle commande créée', 'order', 'ORD-2024-007', '{"amount": 95.50, "customer": "Jean Martin"}', 'info', 'web'),
('00000000-0000-0000-0000-000000000001', 'product_updated', 'Prix du produit mis à jour', 'product', 'prod_123', '{"old_price": 45.00, "new_price": 47.75}', 'info', 'api'),
('00000000-0000-0000-0000-000000000001', 'supplier_sync', 'Synchronisation fournisseur complétée', 'supplier', 'sup_ali', '{"products_updated": 125, "errors": 0}', 'info', 'automation'),
('00000000-0000-0000-0000-000000000001', 'customer_registered', 'Nouveau client enregistré', 'customer', (SELECT id::text FROM customers WHERE email = 'nathalie.girard@outlook.fr'), '{"source": "website", "country": "France"}', 'info', 'web'),
('00000000-0000-0000-0000-000000000001', 'login', 'Connexion utilisateur', 'user', '00000000-0000-0000-0000-000000000001', '{"ip": "192.168.1.100", "device": "desktop"}', 'info', 'auth');