-- Ajouter une policy pour le service role sur supplier_products
CREATE POLICY "Service role full access supplier_products"
ON public.supplier_products
FOR ALL
USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text))
WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- Ajouter une policy service role sur extension_auth_tokens pour permettre la validation
CREATE POLICY "Service role full access extension_auth_tokens"
ON public.extension_auth_tokens
FOR ALL
USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text))
WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));