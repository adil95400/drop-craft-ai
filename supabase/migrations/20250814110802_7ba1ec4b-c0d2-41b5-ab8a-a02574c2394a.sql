-- Supprimer les produits de test générés automatiquement
DELETE FROM imported_products 
WHERE supplier_product_id LIKE 'aliexpress_%' 
AND name LIKE '% - Variant %' 
AND description IN ('Smartphone haute performance pour gaming', 'Écouteurs bluetooth de qualité supérieure');