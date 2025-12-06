-- Supprimer le doublon par SKU (garder le plus récent)
DELETE FROM products 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY sku ORDER BY created_at DESC) as rn
    FROM products 
    WHERE sku = '314956'
  ) sub WHERE rn > 1
);