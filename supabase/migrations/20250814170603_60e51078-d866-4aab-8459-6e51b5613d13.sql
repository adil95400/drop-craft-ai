-- Fix the remaining security issue: policies are still using 'public' role instead of 'authenticated'
-- This allows anonymous access which defeats the security purpose

-- Drop all current policies and recreate them with proper role restrictions
DROP POLICY IF EXISTS "Authenticated users can view basic product info only" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.catalog_products;

-- Create properly secured policies that ONLY allow authenticated users
CREATE POLICY "Authenticated users can view basic product info only" 
ON public.catalog_products 
FOR SELECT 
TO authenticated
USING (availability_status = 'in_stock');

CREATE POLICY "Authenticated users can insert products" 
ON public.catalog_products 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON public.catalog_products 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Also ensure the view has proper access control by adding RLS
ALTER VIEW public.safe_marketplace_products SET (security_invoker = true);

-- Log this additional security fix
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'catalog_policies_hardened',
    'critical',
    'Fixed role-based access control - removed public role access, restricted to authenticated users only',
    '{"table": "catalog_products", "change": "restricted_to_authenticated_role", "removed_anonymous_access": true, "action": "security_fix"}'::jsonb
);