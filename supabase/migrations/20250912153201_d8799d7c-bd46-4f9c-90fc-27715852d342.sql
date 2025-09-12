-- Add sample store data with only supported platforms
INSERT INTO store_integrations (
  user_id, store_name, platform, store_url, connection_status,
  product_count, order_count, last_sync_at, sync_settings, created_at
) VALUES 
  (
    '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
    'Fashion Boutique Paris',
    'shopify',
    'fashion-boutique-paris.myshopify.com',
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
    '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
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
    '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
    'Maison & Déco',
    'prestashop',
    'maison-deco.fr',
    'error',
    89,
    342,
    NOW() - INTERVAL '6 hours',
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
  )
ON CONFLICT (id) DO NOTHING;