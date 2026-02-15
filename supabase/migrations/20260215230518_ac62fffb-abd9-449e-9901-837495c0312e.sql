
-- =====================================================
-- Sprint 1 : DB Schema Source of Truth – Migration (v2)
-- =====================================================

-- 1. PRODUCTS: Unify redundant columns
UPDATE public.products SET title = name WHERE (title IS NULL OR title = '') AND name IS NOT NULL AND name != '';
UPDATE public.products 
SET images = jsonb_build_array(jsonb_build_object('url', COALESCE(primary_image_url, image_url), 'alt_text', ''))
WHERE (images IS NULL OR images = '[]'::jsonb) 
AND COALESCE(primary_image_url, image_url) IS NOT NULL;

-- 2. PROFILES: Unify subscription_plan → plan  
UPDATE public.profiles SET plan = subscription_plan WHERE (plan IS NULL OR plan = 'standard') AND subscription_plan IS NOT NULL AND subscription_plan != 'free';

-- 3. JOBS: Remove duplicate RLS policies
DROP POLICY IF EXISTS "jobs_select" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete" ON public.jobs;

-- 4. PROFILES: Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;

-- 5. PLAN_LIMITS: Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated view plan limits" ON public.plan_limits;

-- 6. Create SUBSCRIPTIONS table (Stripe billing tracking)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Add updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_user_status ON public.products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_key ON public.quota_usage(user_id, quota_key);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
