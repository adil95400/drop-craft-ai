-- Ajouter la colonne scheduled_at manquante à import_jobs
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- Ajouter la colonne source_type manquante à import_jobs
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

-- Ajouter la colonne source_url manquante à import_jobs
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT NULL;

-- Ajouter la colonne user_id à shopify_products via store_integration_id
-- D'abord, créer une vue pour accéder aux produits Shopify avec user_id
CREATE OR REPLACE VIEW public.shopify_products_with_user AS
SELECT 
  sp.*,
  i.user_id
FROM public.shopify_products sp
LEFT JOIN public.integrations i ON sp.store_integration_id = i.id;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_import_jobs_scheduled_at ON public.import_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status_scheduled ON public.import_jobs(status, scheduled_at);

-- Corriger les permissions RLS pour customers
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
CREATE POLICY "Users can insert their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
CREATE POLICY "Users can delete their own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Corriger les permissions RLS pour integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
CREATE POLICY "Users can view their own integrations" 
ON public.integrations 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.integrations;
CREATE POLICY "Users can insert their own integrations" 
ON public.integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
CREATE POLICY "Users can update their own integrations" 
ON public.integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
CREATE POLICY "Users can delete their own integrations" 
ON public.integrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- S'assurer que security_events a les bonnes politiques RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own security events" ON public.security_events;
CREATE POLICY "Users can view their own security events" 
ON public.security_events 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert security events" ON public.security_events;
CREATE POLICY "Users can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);