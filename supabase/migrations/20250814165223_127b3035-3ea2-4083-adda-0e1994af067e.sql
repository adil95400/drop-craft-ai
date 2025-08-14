-- Fix security vulnerability: marketplace_products view exposes sensitive data
-- Drop the insecure view since we have the secure get_marketplace_products() function

DROP VIEW IF EXISTS public.marketplace_products;

-- Log this security fix
INSERT INTO public.security_events (
    event_type, 
    severity, 
    description, 
    metadata
) VALUES (
    'view_dropped',
    'info',
    'Dropped insecure marketplace_products view that exposed sensitive catalog data',
    '{"view": "marketplace_products", "reason": "exposes_sensitive_data", "replacement": "get_marketplace_products_function", "action": "security_fix"}'::jsonb
);