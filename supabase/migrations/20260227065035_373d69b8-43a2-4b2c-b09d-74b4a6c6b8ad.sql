
-- =============================================
-- SECURITY HARDENING MIGRATION
-- =============================================

-- 1. Translation cache: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read translation cache" ON public.translation_cache;
CREATE POLICY "Authenticated users can read translation cache"
  ON public.translation_cache FOR SELECT
  TO authenticated
  USING (true);

-- 2. Profiles UPDATE: add WITH CHECK to prevent user_id tampering
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Contact submissions: add rate limiting via trigger
CREATE OR REPLACE FUNCTION public.rate_limit_contact_submissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Max 5 submissions per IP per hour
  IF (SELECT COUNT(*) FROM public.contact_submissions 
      WHERE ip_address = NEW.ip_address 
      AND created_at > NOW() - INTERVAL '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded for contact form submissions';
  END IF;
  
  -- Max 3 submissions per email per hour
  IF (SELECT COUNT(*) FROM public.contact_submissions 
      WHERE email = NEW.email 
      AND created_at > NOW() - INTERVAL '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded for this email address';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rate_limit_contact_form ON public.contact_submissions;
CREATE TRIGGER rate_limit_contact_form
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_contact_submissions();

-- 4. Tighten role usage: switch {public} to {authenticated} on sensitive tables
-- Customers
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own customers" ON public.customers;
CREATE POLICY "Users can create own customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
CREATE POLICY "Users can update own customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Extension auth tokens: ensure all use authenticated role
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.extension_auth_tokens;
CREATE POLICY "Users can insert own tokens"
  ON public.extension_auth_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON public.extension_auth_tokens;
CREATE POLICY "Users can update own tokens"
  ON public.extension_auth_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Marketplace connections: switch to authenticated
DROP POLICY IF EXISTS "Users can view their own connections" ON public.marketplace_connections;
CREATE POLICY "Users can view their own connections"
  ON public.marketplace_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own connections" ON public.marketplace_connections;
CREATE POLICY "Users can create their own connections"
  ON public.marketplace_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own connections" ON public.marketplace_connections;
CREATE POLICY "Users can update their own connections"
  ON public.marketplace_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own connections" ON public.marketplace_connections;
CREATE POLICY "Users can delete their own connections"
  ON public.marketplace_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Subscriptions: switch to authenticated + add WITH CHECK on update
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles: ensure INSERT uses authenticated role
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- API keys UPDATE: switch to authenticated
DROP POLICY IF EXISTS "Users can update own api keys" ON public.api_keys;
CREATE POLICY "Users can update own api keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Webhook events: remove overly permissive user UPDATE policy
DROP POLICY IF EXISTS "Users can update own webhook events" ON public.webhook_events;
