
-- =============================================
-- WAVE 2: Fix misplaced "Service role" policies on {public}
-- and add WITH CHECK where missing on critical tables
-- =============================================

-- 1. supplier_products: Remove public-role service check (dangerous)
DROP POLICY IF EXISTS "Service role full access supplier_products" ON public.supplier_products;

-- 2. auto_order_queue: Fix service role check on public
DROP POLICY IF EXISTS "Service role can manage all queue items" ON public.auto_order_queue;
-- Add proper user policy
CREATE POLICY "Users can manage own queue items"
  ON public.auto_order_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Add service_role policy  
CREATE POLICY "Service role full access auto_order_queue"
  ON public.auto_order_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. rate_limit_tracking: Remove public-role service check (redundant, already has service_role policy)
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limit_tracking;

-- 4. product_sources: Fix FOR ALL without WITH CHECK
DROP POLICY IF EXISTS "Users can manage their product sources" ON public.product_sources;
CREATE POLICY "Users can manage their product sources"
  ON public.product_sources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. stock_sync_jobs: Split FOR ALL into granular (users should only read, not modify)
DROP POLICY IF EXISTS "Users can view their sync jobs" ON public.stock_sync_jobs;
CREATE POLICY "Users can view their sync jobs"
  ON public.stock_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- 6. stock_sync_logs: Same fix
DROP POLICY IF EXISTS "Users can view their sync logs" ON public.stock_sync_logs;
CREATE POLICY "Users can view their sync logs"
  ON public.stock_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 7. user_settings: Add WITH CHECK
DROP POLICY IF EXISTS "Users can manage their settings" ON public.user_settings;
CREATE POLICY "Users can manage their settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. webhook_events: Admin ALL without WITH CHECK - fix
DROP POLICY IF EXISTS "Admins can view all webhook events" ON public.webhook_events;
CREATE POLICY "Admins can manage all webhook events"
  ON public.webhook_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
