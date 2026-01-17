-- Add view_count column to products and supplier_products tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.supplier_products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;