-- Fix the foreign key constraint issue for imported_products

-- First, let's check if there are any existing foreign key constraints
-- and drop the problematic one if it exists
ALTER TABLE public.imported_products 
DROP CONSTRAINT IF EXISTS imported_products_import_id_fkey;

-- Now create the correct foreign key constraint
-- Make sure import_id can be NULL (for products imported without a job)
ALTER TABLE public.imported_products 
ALTER COLUMN import_id DROP NOT NULL;

-- Add the correct foreign key constraint with proper referential actions
ALTER TABLE public.imported_products 
ADD CONSTRAINT imported_products_import_id_fkey 
FOREIGN KEY (import_id) 
REFERENCES public.import_jobs(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Also ensure that user_id is properly constrained but not NULL
ALTER TABLE public.imported_products 
ALTER COLUMN user_id SET NOT NULL;