-- Modifier la contrainte de clé étrangère pour permettre la suppression des produits
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- Supprimer les données de démonstration
DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE 'Produit%' OR title LIKE '%Premium%' OR title LIKE '%Nike%' OR title LIKE '%Adidas%'
);

DELETE FROM products WHERE title LIKE 'Produit%' OR title LIKE '%Premium%' OR title LIKE '%Nike%' OR title LIKE '%Adidas%';