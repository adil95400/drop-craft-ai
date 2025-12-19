-- =============================================
-- CORE SCHEMA FOR DROPSHIPPING APPLICATION
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  subscription_plan TEXT DEFAULT 'free',
  admin_mode TEXT DEFAULT 'viewer',
  onboarding_completed BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. USER ROLES TABLE (for admin access)
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. PRODUCTS TABLE
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2) DEFAULT 0,
  category TEXT,
  brand TEXT,
  supplier TEXT,
  supplier_url TEXT,
  supplier_product_id TEXT,
  status TEXT DEFAULT 'draft',
  stock_quantity INTEGER DEFAULT 0,
  weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'kg',
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  shopify_product_id TEXT,
  google_product_id TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_sku ON public.products(sku);

-- =============================================
-- 4. CUSTOMERS TABLE
-- =============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'FR',
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_email ON public.customers(email);

-- =============================================
-- 5. ORDERS TABLE
-- =============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  subtotal DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  shipping_address JSONB,
  billing_address JSONB,
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  notes TEXT,
  shopify_order_id TEXT,
  supplier_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);

-- =============================================
-- 6. ORDER ITEMS TABLE
-- =============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_title TEXT,
  qty INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage order items through orders" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- =============================================
-- 7. INTEGRATIONS TABLE
-- =============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  platform_name TEXT,
  connection_status TEXT DEFAULT 'disconnected',
  is_active BOOLEAN DEFAULT false,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  store_url TEXT,
  store_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  webhook_url TEXT,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations" ON public.integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_platform ON public.integrations(platform);

-- =============================================
-- 8. IMPORT JOBS TABLE
-- =============================================
CREATE TABLE public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  source_url TEXT,
  source_platform TEXT,
  total_products INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own import jobs" ON public.import_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all import jobs" ON public.import_jobs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 9. ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.activity_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 10. SECURITY EVENTS TABLE
-- =============================================
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security events" ON public.security_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 11. API LOGS TABLE
-- =============================================
CREATE TABLE public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api logs" ON public.api_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert api logs" ON public.api_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 12. PLAN LIMITS TABLE
-- =============================================
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_name, limit_key)
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan limits" ON public.plan_limits
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage plan limits" ON public.plan_limits
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default plan limits
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description) VALUES
  ('free', 'max_products', 50, 'Maximum products allowed'),
  ('free', 'max_orders_per_month', 100, 'Maximum orders per month'),
  ('free', 'max_integrations', 1, 'Maximum integrations'),
  ('starter', 'max_products', 500, 'Maximum products allowed'),
  ('starter', 'max_orders_per_month', 1000, 'Maximum orders per month'),
  ('starter', 'max_integrations', 3, 'Maximum integrations'),
  ('pro', 'max_products', 5000, 'Maximum products allowed'),
  ('pro', 'max_orders_per_month', 10000, 'Maximum orders per month'),
  ('pro', 'max_integrations', 10, 'Maximum integrations'),
  ('enterprise', 'max_products', -1, 'Unlimited products'),
  ('enterprise', 'max_orders_per_month', -1, 'Unlimited orders'),
  ('enterprise', 'max_integrations', -1, 'Unlimited integrations');

-- =============================================
-- 13. TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 14. AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Also create a default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 15. RPC FUNCTIONS FOR ADMIN
-- =============================================
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(target_user_id UUID, new_plan TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE public.profiles
  SET subscription_plan = new_plan, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.unlock_stuck_import_jobs()
RETURNS INTEGER AS $$
DECLARE
  unlocked_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE public.import_jobs
  SET status = 'failed', 
      completed_at = now(),
      error_log = error_log || '[{"error": "Job unlocked by admin"}]'::jsonb
  WHERE status = 'processing' 
    AND started_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS unlocked_count = ROW_COUNT;
  RETURN unlocked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;