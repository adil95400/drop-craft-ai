-- Ajouter une contrainte unique pour permettre l'upsert sur imported_products
-- Cela permet de synchroniser et mettre à jour les produits existants

-- D'abord, supprimer les doublons existants s'il y en a
DELETE FROM imported_products a
USING imported_products b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.supplier_product_id = b.supplier_product_id
  AND a.supplier_product_id IS NOT NULL;

-- Créer la contrainte unique sur user_id + supplier_product_id
ALTER TABLE imported_products 
ADD CONSTRAINT imported_products_user_supplier_product_unique 
UNIQUE (user_id, supplier_product_id);