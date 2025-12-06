-- Supprimer d'abord les références dans sourcing_history
DELETE FROM sourcing_history WHERE catalog_product_id IS NOT NULL;

-- Puis supprimer catalog_products
DELETE FROM catalog_products;