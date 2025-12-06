-- Drop the broken trigger that expects updated_at column
DROP TRIGGER IF EXISTS update_supplier_products_updated_at ON supplier_products;

-- Also drop any function that references updated_at for this table if it exists
DROP FUNCTION IF EXISTS update_supplier_products_updated_at_column() CASCADE;