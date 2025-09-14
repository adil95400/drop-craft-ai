-- PHASE 1A: CORRECTIONS CRITIQUES DE SÉCURITÉ
-- Correction des politiques RLS trop permissives

-- 1. Supprimer l'accès anonyme sur les tables critiques
DROP POLICY IF EXISTS "secure_user_access_ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Authenticated users only - ab_test_experiments" 
ON public.ab_test_experiments FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "secure_user_access_activity_logs" ON public.activity_logs;
CREATE POLICY "Authenticated users only - activity_logs" 
ON public.activity_logs FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "secure_user_access_advanced_reports" ON public.advanced_reports;
CREATE POLICY "Authenticated users only - advanced_reports" 
ON public.advanced_reports FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2. Créer table pour audit de sécurité
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Politiques pour les logs d'audit
CREATE POLICY "Admins can view all security logs" 
ON public.security_audit_log FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can view their own security logs" 
ON public.security_audit_log FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);