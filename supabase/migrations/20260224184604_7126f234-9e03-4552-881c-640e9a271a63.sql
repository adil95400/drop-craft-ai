
-- Supprimer la policy USING(true) dangereuse sur job_items (rôle public!)
DROP POLICY IF EXISTS "Service role full access on job_items" ON public.job_items;

-- Supprimer les policies dupliquées sur job_items
DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;

-- Supprimer la policy service_role redondante sur extension_auth_tokens  
DROP POLICY IF EXISTS "Service role full access extension_auth_tokens" ON public.extension_auth_tokens;
