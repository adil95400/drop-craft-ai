-- Fix security vulnerability: marketplace_products table with no RLS
-- This table appears to be a legacy table that duplicates functionality of catalog_products
-- with controlled access via get_marketplace_products function

-- Check if the table is empty and can be safely removed
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM public.marketplace_products;
    
    IF row_count = 0 THEN
        -- Table is empty, safe to drop
        DROP TABLE IF EXISTS public.marketplace_products;
        
        INSERT INTO public.security_events (
            event_type, 
            severity, 
            description, 
            metadata
        ) VALUES (
            'table_dropped',
            'info',
            'Dropped empty marketplace_products table to fix RLS security vulnerability',
            '{"table": "marketplace_products", "reason": "no_rls_empty_table", "action": "security_fix"}'::jsonb
        );
    ELSE
        -- Table has data, secure it with RLS instead of dropping
        ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
        
        -- Create restrictive policy - only allow public read access to non-sensitive marketplace data
        CREATE POLICY "Public can view marketplace products" 
        ON public.marketplace_products 
        FOR SELECT 
        USING (availability_status = 'in_stock');
        
        -- No INSERT/UPDATE/DELETE policies - this should be read-only public data
        
        INSERT INTO public.security_events (
            event_type, 
            severity, 
            description, 
            metadata
        ) VALUES (
            'rls_enabled',
            'info',
            'Enabled RLS on marketplace_products table to fix security vulnerability',
            '{"table": "marketplace_products", "policies_added": 1, "action": "security_fix"}'::jsonb
        );
    END IF;
END $$;