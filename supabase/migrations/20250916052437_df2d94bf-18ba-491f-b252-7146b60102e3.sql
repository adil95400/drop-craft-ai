-- Complete the comprehensive application data setup
-- This will create realistic, functional data for all major tables

-- First, let's add realistic suppliers with proper data
INSERT INTO suppliers (user_id, name, website, country, status, rating, contact_email, contact_phone, product_count, supplier_type, sector, logo_url, description, tags, connection_status) VALUES
-- Generate UUIDs for demo users - in production these would be real user IDs
(gen_random_uuid(), 'TechSource Global', 'https://techsource-global.com', 'China', 'active', 4.8, 'contact@techsource-global.com', '+86 138 0013 8000', 245, 'manufacturer', 'Electronics', 'https://images.unsplash.com/photo-1560174038-da43ac74f24b?w=100', 'Leading electronics manufacturer specializing in consumer devices and components', ARRAY['electronics', 'wholesale', 'manufacturer'], 'connected'),
(gen_random_uuid(), 'Euro Fashion Ltd', 'https://eurofashion.co.uk', 'United Kingdom', 'active', 4.5, 'sales@eurofashion.co.uk', '+44 20 7946 0958', 189, 'distributor', 'Fashion', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100', 'Premium fashion distributor with focus on European brands', ARRAY['fashion', 'clothing', 'distributor'], 'connected'),
(gen_random_uuid(), 'Maison Beauté', 'https://maison-beaute.fr', 'France', 'active', 4.7, 'info@maison-beaute.fr', '+33 1 42 36 48 90', 156, 'brand', 'Beauty', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100', 'Luxury French beauty brand with organic focus', ARRAY['beauty', 'cosmetics', 'luxury'], 'connected'),
(gen_random_uuid(), 'Nordic Home Solutions', 'https://nordichome.se', 'Sweden', 'active', 4.6, 'hello@nordichome.se', '+46 8 545 01800', 203, 'manufacturer', 'Home & Garden', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100', 'Scandinavian home and garden products with sustainable approach', ARRAY['home', 'garden', 'sustainable'], 'connected'),
(gen_random_uuid(), 'SportMax International', 'https://sportmax-intl.com', 'Germany', 'active', 4.4, 'trade@sportmax-intl.com', '+49 30 2592 3000', 178, 'distributor', 'Sports', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100', 'International sports equipment distributor covering Europe and Americas', ARRAY['sports', 'fitness', 'equipment'], 'connected'),
(gen_random_uuid(), 'Artisan Craft Co', 'https://artisancraft.it', 'Italy', 'active', 4.9, 'orders@artisancraft.it', '+39 06 4890 1234', 87, 'artisan', 'Arts & Crafts', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100', 'Handcrafted Italian products with traditional techniques', ARRAY['handmade', 'crafts', 'artisan'], 'connected');

-- Add realistic customers with proper purchase history
INSERT INTO customers (user_id, name, email, phone, status, total_spent, total_orders, address, country) VALUES
(gen_random_uuid(), 'Sophie Martinez', 'sophie.martinez@email.com', '+33 6 12 34 56 78', 'active', 2847.50, 12, '{"street": "15 Avenue des Champs-Élysées", "city": "Paris", "postal_code": "75008", "country": "France"}', 'France'),
(gen_random_uuid(), 'James Wilson', 'james.wilson@email.co.uk', '+44 7911 123456', 'active', 1923.80, 8, '{"street": "42 Baker Street", "city": "London", "postal_code": "NW1 6XE", "country": "United Kingdom"}', 'United Kingdom'),
(gen_random_uuid(), 'Maria Rossi', 'maria.rossi@email.it', '+39 320 123 4567', 'active', 3456.20, 15, '{"street": "Via Roma 123", "city": "Milano", "postal_code": "20121", "country": "Italy"}', 'Italy'),
(gen_random_uuid(), 'Erik Andersson', 'erik.andersson@email.se', '+46 70 123 4567', 'active', 1567.90, 6, '{"street": "Storgatan 45", "city": "Stockholm", "postal_code": "11455", "country": "Sweden"}', 'Sweden'),
(gen_random_uuid(), 'Lucas Mueller', 'lucas.mueller@email.de', '+49 170 123 4567', 'active', 2234.75, 10, '{"street": "Hauptstraße 78", "city": "Berlin", "postal_code": "10117", "country": "Germany"}', 'Germany'),
(gen_random_uuid(), 'Ana Rodriguez', 'ana.rodriguez@email.es', '+34 612 345 678', 'active', 1845.60, 9, '{"street": "Calle Mayor 56", "city": "Madrid", "postal_code": "28013", "country": "Spain"}', 'Spain'),
(gen_random_uuid(), 'Pieter van Berg', 'pieter.vanberg@email.nl', '+31 6 12345678', 'active', 987.40, 4, '{"street": "Prinsengracht 234", "city": "Amsterdam", "postal_code": "1016 HH", "country": "Netherlands"}', 'Netherlands');

-- Add realistic orders with proper status distribution
INSERT INTO orders (user_id, customer_id, order_number, status, total_amount, currency, order_date, delivery_date, shipping_address, billing_address, items) VALUES
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0001', 'delivered', 456.80, 'EUR', '2024-01-15', '2024-01-18', '{"street": "15 Avenue des Champs-Élysées", "city": "Paris", "postal_code": "75008", "country": "France"}', '{"street": "15 Avenue des Champs-Élysées", "city": "Paris", "postal_code": "75008", "country": "France"}', '[{"product_name": "Wireless Headphones Premium", "quantity": 2, "price": 89.90, "sku": "WH-PREM-001"}, {"product_name": "Phone Case Leather", "quantity": 1, "price": 34.90, "sku": "PC-LEATH-001"}]'),
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0002', 'shipped', 234.50, 'EUR', '2024-01-20', '2024-01-25', '{"street": "42 Baker Street", "city": "London", "postal_code": "NW1 6XE", "country": "United Kingdom"}', '{"street": "42 Baker Street", "city": "London", "postal_code": "NW1 6XE", "country": "United Kingdom"}', '[{"product_name": "Smart Watch Sport", "quantity": 1, "price": 234.50, "sku": "SW-SPORT-001"}]'),
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0003', 'processing', 567.20, 'EUR', '2024-01-22', NULL, '{"street": "Via Roma 123", "city": "Milano", "postal_code": "20121", "country": "Italy"}', '{"street": "Via Roma 123", "city": "Milano", "postal_code": "20121", "country": "Italy"}', '[{"product_name": "Designer Handbag", "quantity": 1, "price": 345.00, "sku": "HB-DSGN-001"}, {"product_name": "Silk Scarf", "quantity": 2, "price": 111.10, "sku": "SC-SILK-001"}]'),
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0004', 'pending', 123.45, 'EUR', '2024-01-25', NULL, '{"street": "Storgatan 45", "city": "Stockholm", "postal_code": "11455", "country": "Sweden"}', '{"street": "Storgatan 45", "city": "Stockholm", "postal_code": "11455", "country": "Sweden"}', '[{"product_name": "Nordic Lamp", "quantity": 1, "price": 123.45, "sku": "NL-LAMP-001"}]'),
(gen_random_uuid(), (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1), 'ORD-2024-0005', 'delivered', 789.30, 'EUR', '2024-01-28', '2024-02-02', '{"street": "Hauptstraße 78", "city": "Berlin", "postal_code": "10117", "country": "Germany"}', '{"street": "Hauptstraße 78", "city": "Berlin", "postal_code": "10117", "country": "Germany"}', '[{"product_name": "Professional Camera", "quantity": 1, "price": 689.00, "sku": "CAM-PRO-001"}, {"product_name": "Camera Bag", "quantity": 1, "price": 100.30, "sku": "CB-PRO-001"}]');

-- Add comprehensive automation triggers for realistic workflows
INSERT INTO automation_triggers (user_id, name, description, trigger_type, conditions, is_active) VALUES
(gen_random_uuid(), 'Order Confirmation Workflow', 'Triggered when a new order is placed to send confirmation emails and update inventory', 'order_created', '{"event": "order_placed", "conditions": {"status": "confirmed"}}', true),
(gen_random_uuid(), 'Abandoned Cart Recovery', 'Triggers recovery sequence for carts abandoned for more than 2 hours', 'cart_abandoned', '{"event": "cart_inactive", "duration_hours": 2, "conditions": {"items_count": ">= 1"}}', true),
(gen_random_uuid(), 'Low Stock Alert', 'Alerts when product inventory falls below threshold', 'inventory_low', '{"event": "stock_check", "conditions": {"stock_level": "< 10"}}', true),
(gen_random_uuid(), 'VIP Customer Detection', 'Identifies and tags high-value customers based on purchase history', 'customer_behavior', '{"event": "purchase_analysis", "conditions": {"total_spent": "> 1000", "orders_count": "> 5"}}', true),
(gen_random_uuid(), 'Price Change Notification', 'Notifies when competitor prices change significantly', 'price_monitoring', '{"event": "price_updated", "conditions": {"change_percentage": "> 10"}}', true),
(gen_random_uuid(), 'Seasonal Campaign Trigger', 'Automatically launches seasonal marketing campaigns', 'scheduled_event', '{"event": "date_reached", "schedule": "monthly", "conditions": {"campaign_type": "seasonal"}}', true);

-- Add corresponding automation actions for each trigger
INSERT INTO automation_actions (user_id, trigger_id, action_type, action_config, execution_order, is_active) VALUES
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Order Confirmation Workflow' LIMIT 1), 'send_email', '{"template": "order_confirmation", "recipient": "customer", "delay_minutes": 0}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Order Confirmation Workflow' LIMIT 1), 'update_inventory', '{"action": "decrement_stock", "source": "order_items"}', 2, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Order Confirmation Workflow' LIMIT 1), 'create_notification', '{"type": "order_received", "target": "admin", "priority": "normal"}', 3, true),

(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Abandoned Cart Recovery' LIMIT 1), 'send_email', '{"template": "cart_recovery_1", "recipient": "customer", "delay_hours": 2}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Abandoned Cart Recovery' LIMIT 1), 'send_email', '{"template": "cart_recovery_2", "recipient": "customer", "delay_hours": 24, "discount": 10}', 2, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Abandoned Cart Recovery' LIMIT 1), 'send_email', '{"template": "cart_recovery_final", "recipient": "customer", "delay_hours": 72, "discount": 15}', 3, true),

(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Low Stock Alert' LIMIT 1), 'send_notification', '{"type": "low_stock_alert", "recipient": "inventory_manager", "urgency": "high"}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Low Stock Alert' LIMIT 1), 'create_purchase_order', '{"action": "auto_reorder", "quantity": "economic_order_quantity", "supplier": "preferred"}', 2, true),

(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'VIP Customer Detection' LIMIT 1), 'update_customer_tag', '{"tag": "VIP", "priority": "high", "benefits": ["free_shipping", "priority_support"]}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'VIP Customer Detection' LIMIT 1), 'send_email', '{"template": "vip_welcome", "recipient": "customer", "personalization": true}', 2, true),

(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Price Change Notification' LIMIT 1), 'send_notification', '{"type": "price_alert", "recipient": "pricing_manager", "include_competitor_data": true}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Price Change Notification' LIMIT 1), 'create_task', '{"task_type": "review_pricing", "assigned_to": "pricing_team", "priority": "medium"}', 2, true),

(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Seasonal Campaign Trigger' LIMIT 1), 'create_campaign', '{"campaign_type": "seasonal", "auto_launch": true, "target_audience": "all_customers"}', 1, true),
(gen_random_uuid(), (SELECT id FROM automation_triggers WHERE name = 'Seasonal Campaign Trigger' LIMIT 1), 'send_email', '{"template": "seasonal_promotion", "recipient": "subscribers", "personalization": true}', 2, true);

-- Add realistic activity logs to show system usage
INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, metadata, severity, source) VALUES
(gen_random_uuid(), 'user_login', 'User successfully logged in from Paris, France', 'user', gen_random_uuid()::text, '{"ip": "78.194.167.89", "user_agent": "Mozilla/5.0 Chrome/120.0.0.0", "location": "Paris, France"}', 'info', 'auth'),
(gen_random_uuid(), 'product_imported', 'Successfully imported 245 products from TechSource Global', 'import', gen_random_uuid()::text, '{"supplier": "TechSource Global", "products_count": 245, "success_rate": 98.5}', 'info', 'import'),
(gen_random_uuid(), 'order_created', 'New order ORD-2024-0001 created for €456.80', 'order', gen_random_uuid()::text, '{"order_number": "ORD-2024-0001", "amount": 456.80, "currency": "EUR", "customer": "Sophie Martinez"}', 'info', 'sales'),
(gen_random_uuid(), 'automation_executed', 'Order confirmation workflow executed successfully', 'automation', gen_random_uuid()::text, '{"trigger": "order_created", "actions_completed": 3, "execution_time": 2.4}', 'info', 'automation'),
(gen_random_uuid(), 'price_updated', 'Dynamic pricing updated 15 products based on competitor analysis', 'pricing', gen_random_uuid()::text, '{"products_updated": 15, "avg_price_change": 3.2, "algorithm": "ai_competitive"}', 'info', 'pricing'),
(gen_random_uuid(), 'integration_synced', 'Shopify store sync completed - 89 products updated', 'integration', gen_random_uuid()::text, '{"platform": "shopify", "products_synced": 89, "sync_duration": 45.2}', 'info', 'integration'),
(gen_random_uuid(), 'customer_upgraded', 'Customer Maria Rossi upgraded to VIP status', 'customer', gen_random_uuid()::text, '{"customer": "Maria Rossi", "previous_status": "regular", "new_status": "VIP", "trigger": "spending_threshold"}', 'info', 'crm'),
(gen_random_uuid(), 'security_event', 'Multiple failed login attempts detected', 'security', gen_random_uuid()::text, '{"attempts": 5, "ip": "45.123.45.67", "blocked": true, "duration": "1 hour"}', 'warning', 'security'),
(gen_random_uuid(), 'report_generated', 'Monthly sales report generated and sent to stakeholders', 'report', gen_random_uuid()::text, '{"report_type": "monthly_sales", "period": "2024-01", "recipients": 4}', 'info', 'reporting'),
(gen_random_uuid(), 'backup_completed', 'Automated database backup completed successfully', 'system', gen_random_uuid()::text, '{"backup_size": "2.4GB", "duration": 125, "destination": "secure_cloud"}', 'info', 'system');

-- Create some execution logs to show automation activity
INSERT INTO automation_execution_logs (user_id, trigger_id, action_id, input_data, output_data, status, execution_time_ms, started_at, completed_at) VALUES
(gen_random_uuid(), (SELECT id FROM automation_triggers ORDER BY RANDOM() LIMIT 1), (SELECT id FROM automation_actions ORDER BY RANDOM() LIMIT 1), '{"order_id": "ORD-2024-0001", "customer_email": "sophie.martinez@email.com"}', '{"email_sent": true, "delivery_status": "delivered", "open_rate": true}', 'completed', 245, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '245 milliseconds'),
(gen_random_uuid(), (SELECT id FROM automation_triggers ORDER BY RANDOM() LIMIT 1), (SELECT id FROM automation_actions ORDER BY RANDOM() LIMIT 1), '{"product_id": "PROD-12345", "stock_level": 8}', '{"notification_sent": true, "reorder_created": true, "supplier_notified": true}', 'completed', 167, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '167 milliseconds'),
(gen_random_uuid(), (SELECT id FROM automation_triggers ORDER BY RANDOM() LIMIT 1), (SELECT id FROM automation_actions ORDER BY RANDOM() LIMIT 1), '{"customer_id": "CUST-789", "total_spent": 2847.50, "order_count": 12}', '{"tag_applied": true, "vip_email_sent": true, "benefits_activated": true}', 'completed', 334, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes' + INTERVAL '334 milliseconds'),
(gen_random_uuid(), (SELECT id FROM automation_triggers ORDER BY RANDOM() LIMIT 1), (SELECT id FROM automation_actions ORDER BY RANDOM() LIMIT 1), '{"cart_id": "CART-456", "abandoned_at": "2024-01-25T14:30:00Z"}', '{"recovery_email_sent": true, "discount_applied": 10, "click_tracking": true}', 'completed', 198, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes' + INTERVAL '198 milliseconds');

-- Add some basic integrations to show connectivity
INSERT INTO integrations (user_id, platform_type, platform_name, platform_url, shop_domain, is_active, connection_status, sync_frequency, store_config, sync_settings) VALUES
(gen_random_uuid(), 'shopify', 'Mon Boutique Shopify', 'https://mon-boutique.myshopify.com', 'mon-boutique.myshopify.com', true, 'connected', 'hourly', '{"store_name": "Mon Boutique", "currency": "EUR", "timezone": "Europe/Paris"}', '{"auto_sync": true, "sync_products": true, "sync_orders": true, "sync_customers": false}'),
(gen_random_uuid(), 'woocommerce', 'E-commerce Pro', 'https://ecommerce-pro.com', 'ecommerce-pro.com', true, 'connected', 'daily', '{"store_name": "E-commerce Pro", "currency": "EUR", "timezone": "Europe/London"}', '{"auto_sync": true, "sync_products": true, "sync_orders": true, "sync_inventory": true}'),
(gen_random_uuid(), 'amazon', 'Amazon Seller Account', 'https://sellercentral.amazon.fr', 'seller.amazon.fr', false, 'pending', 'manual', '{"marketplace": "amazon.fr", "seller_id": "AXXXXXXXXX", "currency": "EUR"}', '{"auto_sync": false, "sync_products": false, "sync_orders": false}'),
(gen_random_uuid(), 'ebay', 'eBay Store Premium', 'https://stores.ebay.fr/premium-store', 'premium-store.ebay.fr', true, 'connected', 'daily', '{"store_name": "Premium Store", "category": "Electronics", "currency": "EUR"}', '{"auto_sync": true, "sync_products": true, "sync_orders": true, "auto_relist": true}');

-- Update catalog_products with more realistic data
UPDATE catalog_products SET 
  sales_count = FLOOR(RANDOM() * 1000) + 10,
  reviews_count = FLOOR(RANDOM() * 500) + 5,
  rating = ROUND((RANDOM() * 2 + 3)::numeric, 1), -- Rating between 3.0 and 5.0
  stock_quantity = FLOOR(RANDOM() * 200) + 5,
  cost_price = price * (0.4 + RANDOM() * 0.3), -- Cost is 40-70% of selling price
  profit_margin = ROUND(((price - (price * (0.4 + RANDOM() * 0.3))) / (price * (0.4 + RANDOM() * 0.3)) * 100)::numeric, 2),
  competition_score = ROUND((RANDOM() * 10)::numeric, 1),
  trend_score = ROUND((RANDOM() * 10)::numeric, 1),
  is_trending = RANDOM() > 0.8,
  is_bestseller = RANDOM() > 0.9,
  is_winner = RANDOM() > 0.95
WHERE id IN (SELECT id FROM catalog_products ORDER BY RANDOM() LIMIT 1000);

-- Success confirmation
SELECT 'Comprehensive realistic data successfully created!' as result;