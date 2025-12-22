-- Indexes pour optimisation des requêtes fréquentes

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(user_id, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_user_status ON products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_user_category ON products(user_id, category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_email ON customers(user_id, email);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Import jobs indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_status ON import_jobs(user_id, status);

-- Automation execution logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_status ON automation_execution_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed ON automation_execution_logs(user_id, executed_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_platform ON integrations(user_id, platform);