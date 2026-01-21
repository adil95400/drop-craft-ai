-- Add unique constraint on customers (user_id, email) for upsert operations
ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_email_unique UNIQUE (user_id, email);

-- Add external_id and external_platform columns to orders for Shopify sync
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_platform text;

-- Add unique constraint for external order ID per user
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_external_id_unique ON public.orders (user_id, external_id) WHERE external_id IS NOT NULL;

-- Add customer_name and customer_email columns if they don't exist (for display)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;