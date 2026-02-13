
-- Fix supplier_catalog: restrict to authenticated read-only (no user_id column - shared catalog)
DROP POLICY IF EXISTS "Authenticated users can read supplier catalog" ON public.supplier_catalog;
DROP POLICY IF EXISTS "Service role can manage supplier catalog" ON public.supplier_catalog;

CREATE POLICY "Authenticated read supplier catalog"
ON public.supplier_catalog FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix CRITICAL: supplier_products RLS - restrict to owner via user_id
DROP POLICY IF EXISTS "Users can view supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Users can insert supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Users can update supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Users can delete supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated users can view supplier products" ON public.supplier_products;

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner select supplier products"
ON public.supplier_products FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owner insert supplier products"
ON public.supplier_products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update supplier products"
ON public.supplier_products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owner delete supplier products"
ON public.supplier_products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix WARN: plan_limits - restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can view plan limits" ON public.plan_limits;
DROP POLICY IF EXISTS "Public can view plan limits" ON public.plan_limits;
DROP POLICY IF EXISTS "plan_limits_select_all" ON public.plan_limits;

CREATE POLICY "Authenticated view plan limits"
ON public.plan_limits FOR SELECT
TO authenticated
USING (true);

-- Fix WARN: premium_suppliers - restrict to authenticated only  
DROP POLICY IF EXISTS "Anyone can view premium suppliers" ON public.premium_suppliers;
DROP POLICY IF EXISTS "Public can view premium suppliers" ON public.premium_suppliers;
DROP POLICY IF EXISTS "premium_suppliers_select_all" ON public.premium_suppliers;

CREATE POLICY "Authenticated view premium suppliers"
ON public.premium_suppliers FOR SELECT
TO authenticated
USING (true);
