-- Fix RLS policies for imported_products only
DROP POLICY IF EXISTS "Users can view their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can insert their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can update their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can delete their own imported products" ON public.imported_products;

CREATE POLICY "Users can view their own imported products"
ON public.imported_products
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imported products"
ON public.imported_products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported products"
ON public.imported_products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported products"
ON public.imported_products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);