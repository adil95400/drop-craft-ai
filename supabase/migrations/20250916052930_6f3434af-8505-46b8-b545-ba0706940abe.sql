-- Fix the suppliers data with valid constraint values and complete the data setup
-- First, let's add realistic suppliers with correct supplier_type values
INSERT INTO suppliers (user_id, name, website, country, status, rating, contact_email, contact_phone, product_count, supplier_type, sector, logo_url, description, tags, connection_status) VALUES
-- Using valid supplier_type values
(gen_random_uuid(), 'TechSource Global', 'https://techsource-global.com', 'China', 'active', 4.8, 'contact@techsource-global.com', '+86 138 0013 8000', 245, 'wholesale', 'Electronics', 'https://images.unsplash.com/photo-1560174038-da43ac74f24b?w=100', 'Leading electronics manufacturer specializing in consumer devices and components', ARRAY['electronics', 'wholesale', 'tech'], 'connected'),
(gen_random_uuid(), 'Euro Fashion Ltd', 'https://eurofashion.co.uk', 'United Kingdom', 'active', 4.5, 'sales@eurofashion.co.uk', '+44 20 7946 0958', 189, 'dropship', 'Fashion', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100', 'Premium fashion distributor with focus on European brands', ARRAY['fashion', 'clothing', 'dropship'], 'connected'),
(gen_random_uuid(), 'Maison Beauté', 'https://maison-beaute.fr', 'France', 'active', 4.7, 'info@maison-beaute.fr', '+33 1 42 36 48 90', 156, 'wholesale', 'Beauty', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100', 'Luxury French beauty brand with organic focus', ARRAY['beauty', 'cosmetics', 'luxury'], 'connected'),
(gen_random_uuid(), 'Nordic Home Solutions', 'https://nordichome.se', 'Sweden', 'active', 4.6, 'hello@nordichome.se', '+46 8 545 01800', 203, 'wholesale', 'Home & Garden', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100', 'Scandinavian home and garden products with sustainable approach', ARRAY['home', 'garden', 'sustainable'], 'connected'),
(gen_random_uuid(), 'SportMax International', 'https://sportmax-intl.com', 'Germany', 'active', 4.4, 'trade@sportmax-intl.com', '+49 30 2592 3000', 178, 'dropship', 'Sports', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100', 'International sports equipment distributor covering Europe and Americas', ARRAY['sports', 'fitness', 'equipment'], 'connected'),
(gen_random_uuid(), 'Artisan Craft Co', 'https://artisancraft.it', 'Italy', 'active', 4.9, 'orders@artisancraft.it', '+39 06 4890 1234', 87, 'wholesale', 'Arts & Crafts', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100', 'Handcrafted Italian products with traditional techniques', ARRAY['handmade', 'crafts', 'artisan'], 'connected');

-- Add customers - this should work since we had the structure before
INSERT INTO customers (user_id, name, email, phone, status, total_spent, total_orders, address, country) VALUES
(gen_random_uuid(), 'Sophie Martinez', 'sophie.martinez@email.com', '+33 6 12 34 56 78', 'active', 2847.50, 12, '{"street": "15 Avenue des Champs-Élysées", "city": "Paris", "postal_code": "75008", "country": "France"}', 'France'),
(gen_random_uuid(), 'James Wilson', 'james.wilson@email.co.uk', '+44 7911 123456', 'active', 1923.80, 8, '{"street": "42 Baker Street", "city": "London", "postal_code": "NW1 6XE", "country": "United Kingdom"}', 'United Kingdom'),
(gen_random_uuid(), 'Maria Rossi', 'maria.rossi@email.it', '+39 320 123 4567', 'active', 3456.20, 15, '{"street": "Via Roma 123", "city": "Milano", "postal_code": "20121", "country": "Italy"}', 'Italy'),
(gen_random_uuid(), 'Erik Andersson', 'erik.andersson@email.se', '+46 70 123 4567', 'active', 1567.90, 6, '{"street": "Storgatan 45", "city": "Stockholm", "postal_code": "11455", "country": "Sweden"}', 'Sweden'),
(gen_random_uuid(), 'Lucas Mueller', 'lucas.mueller@email.de', '+49 170 123 4567', 'active', 2234.75, 10, '{"street": "Hauptstraße 78", "city": "Berlin", "postal_code": "10117", "country": "Germany"}', 'Germany');

-- Add orders with realistic data
INSERT INTO orders (user_id, customer_id, order_number, status, total_amount, currency, order_date, delivery_date, shipping_address, billing_address, items) VALUES
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0001', 'delivered', 456.80, 'EUR', '2024-01-15', '2024-01-18', '{"street": "15 Avenue des Champs-Élysées", "city": "Paris", "postal_code": "75008", "country": "France"}', '{"street": "15 Avenue des Champs-Élysées", "city": "Paris", "postal_code": "75008", "country": "France"}', '[{"product_name": "Wireless Headphones Premium", "quantity": 2, "price": 89.90, "sku": "WH-PREM-001"}]'),
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0002', 'shipped', 234.50, 'EUR', '2024-01-20', '2024-01-25', '{"street": "42 Baker Street", "city": "London", "postal_code": "NW1 6XE", "country": "United Kingdom"}', '{"street": "42 Baker Street", "city": "London", "postal_code": "NW1 6XE", "country": "United Kingdom"}', '[{"product_name": "Smart Watch Sport", "quantity": 1, "price": 234.50, "sku": "SW-SPORT-001"}]'),
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0003', 'processing', 567.20, 'EUR', '2024-01-22', NULL, '{"street": "Via Roma 123", "city": "Milano", "postal_code": "20121", "country": "Italy"}', '{"street": "Via Roma 123", "city": "Milano", "postal_code": "20121", "country": "Italy"}', '[{"product_name": "Designer Handbag", "quantity": 1, "price": 345.00, "sku": "HB-DSGN-001"}]');

-- Add automation triggers and actions
INSERT INTO automation_triggers (user_id, name, description, trigger_type, conditions, is_active) VALUES
(gen_random_uuid(), 'Order Confirmation Workflow', 'Triggered when a new order is placed', 'order_created', '{"event": "order_placed", "conditions": {"status": "confirmed"}}', true),
(gen_random_uuid(), 'Low Stock Alert', 'Alerts when product inventory is low', 'inventory_low', '{"event": "stock_check", "conditions": {"stock_level": "< 10"}}', true),
(gen_random_uuid(), 'VIP Customer Detection', 'Identifies high-value customers', 'customer_behavior', '{"event": "purchase_analysis", "conditions": {"total_spent": "> 1000"}}', true);

-- Add automation actions for the triggers
INSERT INTO automation_actions (user_id, trigger_id, action_type, action_config, execution_order, is_active) VALUES
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Order Confirmation Workflow' LIMIT 1), 'send_email', '{"template": "order_confirmation", "recipient": "customer"}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Low Stock Alert' LIMIT 1), 'send_notification', '{"type": "low_stock_alert", "recipient": "admin"}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'VIP Customer Detection' LIMIT 1), 'update_customer_tag', '{"tag": "VIP", "benefits": ["free_shipping"]}', 1, true);

-- Add activity logs for realistic system usage
INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, metadata, severity, source) VALUES
(gen_random_uuid(), 'user_login', 'User logged in successfully', 'user', gen_random_uuid()::text, '{"ip": "78.194.167.89", "location": "Paris, France"}', 'info', 'auth'),
(gen_random_uuid(), 'product_imported', 'Successfully imported 245 products', 'import', gen_random_uuid()::text, '{"supplier": "TechSource Global", "products_count": 245}', 'info', 'import'),
(gen_random_uuid(), 'order_created', 'New order created for €456.80', 'order', gen_random_uuid()::text, '{"order_number": "ORD-2024-0001", "amount": 456.80}', 'info', 'sales'),
(gen_random_uuid(), 'automation_executed', 'Order confirmation workflow executed', 'automation', gen_random_uuid()::text, '{"trigger": "order_created", "actions_completed": 3}', 'info', 'automation');

-- Update catalog products with realistic metrics
UPDATE catalog_products SET 
  sales_count = FLOOR(RANDOM() * 1000) + 10,
  reviews_count = FLOOR(RANDOM() * 500) + 5,
  rating = ROUND((RANDOM() * 2 + 3)::numeric, 1),
  stock_quantity = FLOOR(RANDOM() * 200) + 5,
  is_trending = RANDOM() > 0.8,
  is_bestseller = RANDOM() > 0.9
WHERE id IN (SELECT id FROM catalog_products ORDER BY RANDOM() LIMIT 500);

SELECT 'Realistic data successfully created!' as result;