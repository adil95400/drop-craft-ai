
-- =============================================
-- RLS Hardening Sprint S3
-- Corrections des politiques manquantes
-- =============================================

-- 1. api_keys: Ajouter UPDATE policy (manquante)
CREATE POLICY "Users can update own api keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. extension_auth_tokens: Ajouter INSERT et UPDATE policies
-- INSERT via SECURITY DEFINER functions, mais la politique sécurise les accès directs
CREATE POLICY "Users can insert own tokens"
  ON public.extension_auth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON public.extension_auth_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Supprimer la policy SELECT dupliquée sur extension_auth_tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON public.extension_auth_tokens;

-- 4. audit_logs: Ajouter DELETE restriction (personne ne peut supprimer sauf admin via function)
CREATE POLICY "No direct delete on audit logs"
  ON public.audit_logs FOR DELETE
  USING (false);

-- 5. audit_logs: Ajouter UPDATE restriction  
CREATE POLICY "No direct update on audit logs"
  ON public.audit_logs FOR UPDATE
  USING (false);

-- 6. webhook_events: Vérifier et renforcer
-- Ajouter UPDATE policy si manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'webhook_events' AND cmd = 'UPDATE' AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own webhook events" ON public.webhook_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
