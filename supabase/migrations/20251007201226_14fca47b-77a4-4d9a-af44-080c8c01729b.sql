-- PHASE 1B: Correction des warnings RLS et fonctions
-- =====================================================

-- 1. Supprimer toutes les anciennes policies problématiques et les remplacer par des versions sécurisées

-- ab_test_experiments
DROP POLICY IF EXISTS "Strict authenticated users only - ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Strict authenticated users only - ab_test_experiments"
ON public.ab_test_experiments
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- active_alerts
DROP POLICY IF EXISTS "Users can manage their active alerts" ON public.active_alerts;
CREATE POLICY "Users can manage their active alerts"
ON public.active_alerts
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- activity_logs
DROP POLICY IF EXISTS "Strict authenticated users only - activity_logs" ON public.activity_logs;
CREATE POLICY "Strict authenticated users only - activity_logs"
ON public.activity_logs
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- advanced_reports
DROP POLICY IF EXISTS "Strict authenticated users only - advanced_reports" ON public.advanced_reports;
CREATE POLICY "Strict authenticated users only - advanced_reports"
ON public.advanced_reports
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ai_optimization_jobs
DROP POLICY IF EXISTS "secure_user_access_ai_optimization_jobs" ON public.ai_optimization_jobs;
CREATE POLICY "secure_user_access_ai_optimization_jobs"
ON public.ai_optimization_jobs
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ai_tasks
DROP POLICY IF EXISTS "secure_user_access_ai_tasks" ON public.ai_tasks;
CREATE POLICY "secure_user_access_ai_tasks"
ON public.ai_tasks
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- alert_rules
DROP POLICY IF EXISTS "Users can manage their alert rules" ON public.alert_rules;
CREATE POLICY "Users can manage their alert rules"
ON public.alert_rules
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- api_cache (service role only - already secure but update for consistency)
DROP POLICY IF EXISTS "Service role only - api_cache" ON public.api_cache;
CREATE POLICY "Service role only - api_cache"
ON public.api_cache
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- automated_campaigns
DROP POLICY IF EXISTS "secure_user_access_automated_campaigns" ON public.automated_campaigns;
CREATE POLICY "secure_user_access_automated_campaigns"
ON public.automated_campaigns
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automated_decisions
DROP POLICY IF EXISTS "secure_user_access_automated_decisions" ON public.automated_decisions;
CREATE POLICY "secure_user_access_automated_decisions"
ON public.automated_decisions
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_actions
DROP POLICY IF EXISTS "Users can manage their automation actions" ON public.automation_actions;
CREATE POLICY "Users can manage their automation actions"
ON public.automation_actions
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_execution_logs
DROP POLICY IF EXISTS "Users can view their automation executions" ON public.automation_execution_logs;
CREATE POLICY "Users can view their automation executions"
ON public.automation_execution_logs
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_executions
DROP POLICY IF EXISTS "secure_user_access_automation_executions" ON public.automation_executions;
CREATE POLICY "secure_user_access_automation_executions"
ON public.automation_executions
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_rules
DROP POLICY IF EXISTS "secure_user_access_automation_rules" ON public.automation_rules;
CREATE POLICY "secure_user_access_automation_rules"
ON public.automation_rules
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_triggers
DROP POLICY IF EXISTS "Users can manage their automation triggers" ON public.automation_triggers;
CREATE POLICY "Users can manage their automation triggers"
ON public.automation_triggers
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_workflows
DROP POLICY IF EXISTS "secure_user_access_automation_workflows" ON public.automation_workflows;
CREATE POLICY "secure_user_access_automation_workflows"
ON public.automation_workflows
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- blog_posts
DROP POLICY IF EXISTS "secure_user_access_blog_posts" ON public.blog_posts;
CREATE POLICY "secure_user_access_blog_posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- business_intelligence_insights
DROP POLICY IF EXISTS "secure_user_access_business_intelligence_insights" ON public.business_intelligence_insights;
CREATE POLICY "secure_user_access_business_intelligence_insights"
ON public.business_intelligence_insights
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- canva_designs
DROP POLICY IF EXISTS "secure_user_access_canva_designs" ON public.canva_designs;
CREATE POLICY "secure_user_access_canva_designs"
ON public.canva_designs
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- canva_integrations
DROP POLICY IF EXISTS "secure_user_access_canva_integrations" ON public.canva_integrations;
CREATE POLICY "secure_user_access_canva_integrations"
ON public.canva_integrations
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- canva_webhook_events
DROP POLICY IF EXISTS "secure_user_access_canva_webhook_events" ON public.canva_webhook_events;
CREATE POLICY "secure_user_access_canva_webhook_events"
ON public.canva_webhook_events
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- categories
DROP POLICY IF EXISTS "secure_user_access_categories" ON public.categories;
CREATE POLICY "secure_user_access_categories"
ON public.categories
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- category_mapping_rules
DROP POLICY IF EXISTS "secure_user_access_category_mapping_rules" ON public.category_mapping_rules;
CREATE POLICY "secure_user_access_category_mapping_rules"
ON public.category_mapping_rules
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- competitive_intelligence
DROP POLICY IF EXISTS "secure_user_access_competitive_intelligence" ON public.competitive_intelligence;
CREATE POLICY "secure_user_access_competitive_intelligence"
ON public.competitive_intelligence
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- crm_contacts
DROP POLICY IF EXISTS "secure_user_access_crm_contacts" ON public.crm_contacts;
CREATE POLICY "secure_user_access_crm_contacts"
ON public.crm_contacts
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- customer_behavior_analytics
DROP POLICY IF EXISTS "secure_user_access_customer_behavior_analytics" ON public.customer_behavior_analytics;
CREATE POLICY "secure_user_access_customer_behavior_analytics"
ON public.customer_behavior_analytics
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- customers
DROP POLICY IF EXISTS "secure_user_access_customers" ON public.customers;
CREATE POLICY "secure_user_access_customers"
ON public.customers
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- deduplication_results
DROP POLICY IF EXISTS "secure_user_access_deduplication_results" ON public.deduplication_results;
CREATE POLICY "secure_user_access_deduplication_results"
ON public.deduplication_results
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- dynamic_pricing
DROP POLICY IF EXISTS "secure_user_access_dynamic_pricing" ON public.dynamic_pricing;
CREATE POLICY "secure_user_access_dynamic_pricing"
ON public.dynamic_pricing
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- enterprise_integrations
DROP POLICY IF EXISTS "secure_user_access_enterprise_integrations" ON public.enterprise_integrations;
CREATE POLICY "secure_user_access_enterprise_integrations"
ON public.enterprise_integrations
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- enterprise_settings
DROP POLICY IF EXISTS "secure_user_access_enterprise_settings" ON public.enterprise_settings;
CREATE POLICY "secure_user_access_enterprise_settings"
ON public.enterprise_settings
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- extension_data
DROP POLICY IF EXISTS "secure_user_access_extension_data" ON public.extension_data;
CREATE POLICY "secure_user_access_extension_data"
ON public.extension_data
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- extension_jobs
DROP POLICY IF EXISTS "secure_user_access_extension_jobs" ON public.extension_jobs;
CREATE POLICY "secure_user_access_extension_jobs"
ON public.extension_jobs
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2. Corriger les fonctions sans search_path (continué dans la prochaine section)
-- Note: Les fonctions critiques (has_role, get_user_primary_role, admin_set_role, is_user_admin) 
-- ont déjà été corrigées dans la migration précédente