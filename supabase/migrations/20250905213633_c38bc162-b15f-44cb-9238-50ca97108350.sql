-- === REFONTE FONDATIONS - CORRECTIVE ===

-- 1. Drop existing conflicting policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
  DROP POLICY IF EXISTS "Users can manage their own supplier feeds" ON public.supplier_feeds;
  DROP POLICY IF EXISTS "Users can manage their own supplier products" ON public.supplier_products;
  DROP POLICY IF EXISTS "Users can manage their own ingestion jobs" ON public.ingestion_jobs;
  DROP POLICY IF EXISTS "Users can manage their own store integrations" ON public.store_integrations;
  DROP POLICY IF EXISTS "Users can manage their own order routing" ON public.order_routing;
  DROP POLICY IF EXISTS "Users can view their own sync history" ON public.sync_history;
EXCEPTION WHEN undefined_table THEN
  -- Ignore if tables don't exist yet
END $$;

-- 2. Extend profiles table with role system and advanced settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'standard' CHECK (subscription_plan IN ('standard', 'pro', 'ultra')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
  "ai_import": false,
  "bulk_import": true,
  "advanced_analytics": false,
  "marketing_automation": false,
  "premium_integrations": false,
  "enterprise_features": false
}'::jsonb;

-- 3. Create final RLS policies for all tables
-- Suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_user_policy" ON public.suppliers
  FOR ALL USING (auth.uid() = user_id);

-- Supplier feeds  
ALTER TABLE public.supplier_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_feeds_user_policy" ON public.supplier_feeds
  FOR ALL USING (auth.uid() = user_id);

-- Supplier products
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_products_user_policy" ON public.supplier_products
  FOR ALL USING (auth.uid() = user_id);

-- Ingestion jobs
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingestion_jobs_user_policy" ON public.ingestion_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Store integrations
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_integrations_user_policy" ON public.store_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Order routing
ALTER TABLE public.order_routing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_routing_user_policy" ON public.order_routing
  FOR ALL USING (auth.uid() = user_id);

-- Sync history
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_history_user_policy" ON public.sync_history
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create admin policies for viewing all data
CREATE POLICY "admin_view_all_suppliers" ON public.suppliers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_view_all_supplier_products" ON public.supplier_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_view_all_ingestion_jobs" ON public.ingestion_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Create function to get current user role securely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'user') FROM public.profiles WHERE id = auth.uid();
$$;

-- 6. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role = 'admin', false) FROM public.profiles WHERE id = auth.uid();
$$;