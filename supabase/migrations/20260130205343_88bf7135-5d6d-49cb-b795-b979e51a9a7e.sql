-- Phase 3: Ajouter le support des notes d'import pour les produits brouillons
ALTER TABLE public.imported_products 
ADD COLUMN IF NOT EXISTS import_notes TEXT DEFAULT NULL;

-- Index pour filtrer les brouillons rapidement
CREATE INDEX IF NOT EXISTS idx_imported_products_status_draft 
ON public.imported_products(user_id, status) 
WHERE status = 'draft';

COMMENT ON COLUMN public.imported_products.import_notes IS 'Notes générées lors de l''import atomique expliquant les données manquantes';