-- Fix RLS policies for product deletion across all tables

-- Products table: Enable DELETE for users on their own products
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Users can delete their own products"
ON public.products
FOR DELETE
USING (auth.uid() = user_id);

-- Imported products table: Enable DELETE for users on their own products  
DROP POLICY IF EXISTS "Users can delete their own imported products" ON public.imported_products;
CREATE POLICY "Users can delete their own imported products"
ON public.imported_products
FOR DELETE
USING (auth.uid() = user_id);

-- Premium products: Allow deletion through connections
DROP POLICY IF EXISTS "Users can delete premium products they have access to" ON public.premium_products;
CREATE POLICY "Users can delete premium products they have access to"
ON public.premium_products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.premium_supplier_connections
    WHERE premium_supplier_connections.supplier_id = premium_products.supplier_id
    AND premium_supplier_connections.user_id = auth.uid()
    AND premium_supplier_connections.status = 'active'
  )
);

-- Ensure UPDATE policies exist for all tables
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users can update their own products"
ON public.products
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own imported products" ON public.imported_products;
CREATE POLICY "Users can update their own imported products"
ON public.imported_products
FOR UPDATE
USING (auth.uid() = user_id);