-- Performance Optimization: Add Critical Indexes
-- Improves query performance and reduces database bottlenecks

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id_status 
ON public.products(user_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_category_status 
ON public.products(category, status);

CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON public.products(created_at DESC);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status 
ON public.orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
ON public.orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON public.orders(created_at DESC);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id_status 
ON public.customers(user_id, status);

CREATE INDEX IF NOT EXISTS idx_customers_email 
ON public.customers(email);

-- Integrations table indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_id_active 
ON public.integrations(user_id, is_active) 
WHERE is_active = true;

-- Catalog products indexes
CREATE INDEX IF NOT EXISTS idx_catalog_products_category 
ON public.catalog_products(category, availability_status);

-- Full text search (requires pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_search 
ON public.products USING gin(name gin_trgm_ops);

-- Security monitoring indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_created 
ON public.security_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_severity 
ON public.security_events(severity, created_at DESC);

-- API performance indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_user_created 
ON public.api_logs(user_id, created_at DESC);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_created 
ON public.audit_trail(user_id, created_at DESC);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created 
ON public.activity_logs(user_id, created_at DESC);