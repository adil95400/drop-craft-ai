
-- =================================================================
-- VAGUE 1: Sécurisation RLS — Credentials & Tokens
-- =================================================================

-- ---------------------------------------------------------------
-- 1. extension_auth_tokens: Supprimer la policy USING(true) dangereuse
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access" ON public.extension_auth_tokens;

-- La policy "Service role full access extension_auth_tokens" vérifie jwt role = service_role
-- ce qui est redondant (service_role bypass RLS), mais pas dangereux. On la garde pour clarté.

-- Supprimer la policy ALL trop large, remplacer par des policies granulaires
DROP POLICY IF EXISTS "Users can manage own extension tokens" ON public.extension_auth_tokens;

-- Users can only SELECT and DELETE their own tokens (pas UPDATE/INSERT depuis le client)
CREATE POLICY "Users can select own tokens"
  ON public.extension_auth_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON public.extension_auth_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 2. api_keys: Remplacer ALL par des policies granulaires
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own api keys" ON public.api_keys;

CREATE POLICY "Users can select own api keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON public.api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE policy: keys should be revoked and re-created, not updated
-- (except is_active which admins manage)

-- ---------------------------------------------------------------
-- 3. supplier_credentials: Remplacer ALL par granulaire + WITH CHECK
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage credentials" ON public.supplier_credentials;

CREATE POLICY "Users can select own credentials"
  ON public.supplier_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.supplier_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.supplier_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON public.supplier_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 4. supplier_credentials_vault: Remplacer ALL par granulaire + WITH CHECK
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own supplier credentials" ON public.supplier_credentials_vault;

CREATE POLICY "Users can select own vault credentials"
  ON public.supplier_credentials_vault FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault credentials"
  ON public.supplier_credentials_vault FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault credentials"
  ON public.supplier_credentials_vault FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault credentials"
  ON public.supplier_credentials_vault FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 5. store_integrations: Remplacer ALL par granulaire + WITH CHECK
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own store integrations" ON public.store_integrations;

CREATE POLICY "Users can select own store integrations"
  ON public.store_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own store integrations"
  ON public.store_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own store integrations"
  ON public.store_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own store integrations"
  ON public.store_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 6. integrations: Remplacer ALL par granulaire + WITH CHECK
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.integrations;

CREATE POLICY "Users can select own integrations"
  ON public.integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON public.integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON public.integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON public.integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 7. marketplace_connections: Supprimer ALL redondant + renforcer
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage own marketplace connections" ON public.marketplace_connections;
-- Les policies granulaires SELECT/INSERT/UPDATE/DELETE existent déjà, on les garde.

-- ---------------------------------------------------------------
-- 8. orders: Remplacer ALL par granulaire + WITH CHECK
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;

CREATE POLICY "Users can select own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
