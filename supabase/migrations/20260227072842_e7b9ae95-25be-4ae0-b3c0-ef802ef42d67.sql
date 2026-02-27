
-- Nettoyer les politiques dupliquées sur pricing_rules
-- (a à la fois ALL et CRUD individuels, ce qui est redondant)
DROP POLICY IF EXISTS "pricing_rules_delete" ON public.pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_insert" ON public.pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_select" ON public.pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_update" ON public.pricing_rules;

-- Nettoyer les politiques dupliquées sur supplier_products
DROP POLICY IF EXISTS "Owner delete supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Owner insert supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Owner select supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Owner update supplier products" ON public.supplier_products;
