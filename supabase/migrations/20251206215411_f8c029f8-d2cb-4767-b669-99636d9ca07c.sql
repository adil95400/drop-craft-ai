-- Supprimer les produits sans nom (probablement des imports corrompus)
DELETE FROM products WHERE name IS NULL OR name = '';

-- Créer un index pour améliorer les performances de requête
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_imported_products_user_id ON imported_products(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_user_id ON supplier_products(user_id);