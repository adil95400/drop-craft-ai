-- Add sample store data with realistic information
INSERT INTO store_integrations (
  id, user_id, store_name, platform, store_url, connection_status,
  product_count, order_count, last_sync_at, sync_settings, created_at
) VALUES 
  (
    gen_random_uuid(),
    '44795494-985c-4c0e-97bc-800a3c4faf2b',
    'Fashion Boutique',
    'shopify',
    'fashion-boutique.myshopify.com',
    'connected',
    247,
    1523,
    NOW() - INTERVAL '2 hours',
    jsonb_build_object(
      'auto_sync', true,
      'sync_frequency', 'hourly',
      'sync_products', true,
      'sync_orders', true,
      'sync_customers', true,
      'notification_email', true,
      'webhook_enabled', true,
      'inventory_tracking', true,
      'price_sync', true,
      'stock_alerts', true,
      'low_stock_threshold', 10
    ),
    NOW() - INTERVAL '30 days'
  ),
  (
    gen_random_uuid(),
    '44795494-985c-4c0e-97bc-800a3c4faf2b',
    'TechStore Pro',
    'woocommerce',
    'techstore-pro.com',
    'connected',
    156,
    892,
    NOW() - INTERVAL '1 hour',
    jsonb_build_object(
      'auto_sync', true,
      'sync_frequency', 'daily',
      'sync_products', true,
      'sync_orders', true,
      'sync_customers', false,
      'notification_email', true,
      'webhook_enabled', false,
      'inventory_tracking', true,
      'price_sync', false,
      'stock_alerts', false,
      'low_stock_threshold', 5
    ),
    NOW() - INTERVAL '15 days'
  ),
  (
    gen_random_uuid(),
    '44795494-985c-4c0e-97bc-800a3c4faf2b',
    'Maison & Déco',
    'prestashop',
    'maison-deco.fr',
    'syncing',
    89,
    342,
    NOW() - INTERVAL '30 minutes',
    jsonb_build_object(
      'auto_sync', false,
      'sync_frequency', 'weekly',
      'sync_products', true,
      'sync_orders', true,
      'sync_customers', true,
      'notification_email', false,
      'webhook_enabled', true,
      'inventory_tracking', false,
      'price_sync', true,
      'stock_alerts', true,
      'low_stock_threshold', 15
    ),
    NOW() - INTERVAL '7 days'
  ),
  (
    gen_random_uuid(),
    '44795494-985c-4c0e-97bc-800a3c4faf2b',
    'Sports & Fitness',
    'magento',
    'sports-fitness.store',
    'error',
    312,
    1876,
    NOW() - INTERVAL '6 hours',
    jsonb_build_object(
      'auto_sync', true,
      'sync_frequency', 'hourly',
      'sync_products', true,
      'sync_orders', true,
      'sync_customers', true,
      'notification_email', true,
      'webhook_enabled', true,
      'inventory_tracking', true,
      'price_sync', true,
      'stock_alerts', true,
      'low_stock_threshold', 20
    ),
    NOW() - INTERVAL '45 days'
  )
ON CONFLICT (id) DO NOTHING;