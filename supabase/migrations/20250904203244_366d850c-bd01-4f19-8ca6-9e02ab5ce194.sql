-- Migration pour corriger les 99 warnings de sécurité RLS
-- Sécurisation complète des politiques et fonctions

-- 1. Sécuriser les fonctions restantes sans search_path
ALTER FUNCTION public.calculate_profit_margin SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column SET search_path = 'public';
ALTER FUNCTION public.update_supplier_product_count SET search_path = 'public';
ALTER FUNCTION public.prevent_sensitive_supplier_updates SET search_path = 'public';

-- 2. Corriger toutes les politiques RLS pour bloquer l'accès anonyme
-- Supprimer les anciennes politiques et les recréer avec vérification auth.uid() IS NOT NULL

-- ab_test_experiments
DROP POLICY IF EXISTS "Users can manage their own A/B test experiments" ON public.ab_test_experiments;
CREATE POLICY "Users can manage their own A/B test experiments" ON public.ab_test_experiments
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- activity_logs  
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can create their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can create their own activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- advanced_reports
DROP POLICY IF EXISTS "Users can manage their own advanced reports" ON public.advanced_reports;
CREATE POLICY "Users can manage their own advanced reports" ON public.advanced_reports
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ai_optimization_jobs
DROP POLICY IF EXISTS "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs;
CREATE POLICY "Users can manage their own AI optimization jobs" ON public.ai_optimization_jobs
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ai_tasks
DROP POLICY IF EXISTS "Users can manage their own AI tasks" ON public.ai_tasks;
CREATE POLICY "Users can manage their own AI tasks" ON public.ai_tasks
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- api_cache - Garder la politique service role mais sécuriser la politique authentifiée
DROP POLICY IF EXISTS "API cache authenticated access" ON public.api_cache;
CREATE POLICY "API cache authenticated access" ON public.api_cache
FOR SELECT USING (auth.uid() IS NOT NULL);

-- automated_campaigns
DROP POLICY IF EXISTS "Users can manage their own automated campaigns" ON public.automated_campaigns;
CREATE POLICY "Users can manage their own automated campaigns" ON public.automated_campaigns
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automated_decisions
DROP POLICY IF EXISTS "Users can manage their own automated decisions" ON public.automated_decisions;
CREATE POLICY "Users can manage their own automated decisions" ON public.automated_decisions
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_executions
DROP POLICY IF EXISTS "Users can manage their own automation executions" ON public.automation_executions;
CREATE POLICY "Users can manage their own automation executions" ON public.automation_executions
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_rules
DROP POLICY IF EXISTS "Users can manage their own automation rules" ON public.automation_rules;
CREATE POLICY "Users can manage their own automation rules" ON public.automation_rules
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- automation_workflows
DROP POLICY IF EXISTS "Users can manage their own automation workflows" ON public.automation_workflows;
CREATE POLICY "Users can manage their own automation workflows" ON public.automation_workflows
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- blog_posts
DROP POLICY IF EXISTS "Users can view their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can create their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON public.blog_posts;
CREATE POLICY "Users can view their own blog posts" ON public.blog_posts
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can create their own blog posts" ON public.blog_posts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own blog posts" ON public.blog_posts
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own blog posts" ON public.blog_posts
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- business_intelligence_insights
DROP POLICY IF EXISTS "Users can manage their own BI insights" ON public.business_intelligence_insights;
CREATE POLICY "Users can manage their own BI insights" ON public.business_intelligence_insights
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- canva_designs
DROP POLICY IF EXISTS "Users can manage their own Canva designs" ON public.canva_designs;
DROP POLICY IF EXISTS "Admins can view all Canva designs" ON public.canva_designs;
CREATE POLICY "Users can manage their own Canva designs" ON public.canva_designs
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Admins can view all Canva designs" ON public.canva_designs
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- canva_integrations
DROP POLICY IF EXISTS "Users can manage their own Canva integrations" ON public.canva_integrations;
CREATE POLICY "Users can manage their own Canva integrations" ON public.canva_integrations
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- canva_webhook_events
DROP POLICY IF EXISTS "Users can view their own webhook events" ON public.canva_webhook_events;
CREATE POLICY "Users can view their own webhook events" ON public.canva_webhook_events
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- catalog_products - Sécuriser les politiques authentifiées
DROP POLICY IF EXISTS "Authenticated users can view basic product info only" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.catalog_products;
DROP POLICY IF EXISTS "Admin users can view sensitive business data" ON public.catalog_products;
CREATE POLICY "Authenticated users can view basic product info only" ON public.catalog_products
FOR SELECT USING (auth.uid() IS NOT NULL AND availability_status = 'in_stock');
CREATE POLICY "Authenticated users can insert products" ON public.catalog_products
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update products" ON public.catalog_products
FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin users can view sensitive business data" ON public.catalog_products
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" ON public.categories
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- category_mapping_rules
DROP POLICY IF EXISTS "Users can manage their own category mapping rules" ON public.category_mapping_rules;
CREATE POLICY "Users can manage their own category mapping rules" ON public.category_mapping_rules
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- competitive_intelligence
DROP POLICY IF EXISTS "Users can manage their own competitive intelligence" ON public.competitive_intelligence;
CREATE POLICY "Users can manage their own competitive intelligence" ON public.competitive_intelligence
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- crm_contacts
DROP POLICY IF EXISTS "Users can manage their own CRM contacts" ON public.crm_contacts;
CREATE POLICY "Users can manage their own CRM contacts" ON public.crm_contacts
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- customer_behavior_analytics
DROP POLICY IF EXISTS "Users can manage their own customer behavior analytics" ON public.customer_behavior_analytics;
CREATE POLICY "Users can manage their own customer behavior analytics" ON public.customer_behavior_analytics
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- customers - Sécuriser toutes les politiques
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view only their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert only their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update only their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete only their own customers" ON public.customers;
DROP POLICY IF EXISTS "admin_bypass_select_customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can create their own customers" ON public.customers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "admin_bypass_select_customers" ON public.customers
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- deduplication_results
DROP POLICY IF EXISTS "Users can view their own deduplication results" ON public.deduplication_results;
CREATE POLICY "Users can view their own deduplication results" ON public.deduplication_results
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- dynamic_pricing
DROP POLICY IF EXISTS "Users can manage their own dynamic pricing" ON public.dynamic_pricing;
CREATE POLICY "Users can manage their own dynamic pricing" ON public.dynamic_pricing
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- enterprise_integrations
DROP POLICY IF EXISTS "Users can manage their own enterprise integrations" ON public.enterprise_integrations;
CREATE POLICY "Users can manage their own enterprise integrations" ON public.enterprise_integrations
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- enterprise_settings
DROP POLICY IF EXISTS "Users can manage their own enterprise settings" ON public.enterprise_settings;
CREATE POLICY "Users can manage their own enterprise settings" ON public.enterprise_settings
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- extension_data
DROP POLICY IF EXISTS "Users can manage their own extension data" ON public.extension_data;
CREATE POLICY "Users can manage their own extension data" ON public.extension_data
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- extension_jobs  
DROP POLICY IF EXISTS "Users can manage their own extension jobs" ON public.extension_jobs;
CREATE POLICY "Users can manage their own extension jobs" ON public.extension_jobs
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- extension_webhooks
DROP POLICY IF EXISTS "Users can manage their own extension webhooks" ON public.extension_webhooks;
CREATE POLICY "Users can manage their own extension webhooks" ON public.extension_webhooks
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- extensions
DROP POLICY IF EXISTS "Users can manage their own extensions" ON public.extensions;
CREATE POLICY "Users can manage their own extensions" ON public.extensions
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- generated_content
DROP POLICY IF EXISTS "Users can manage their own generated content" ON public.generated_content;
CREATE POLICY "Users can manage their own generated content" ON public.generated_content
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- import_batches
DROP POLICY IF EXISTS "Users can manage their own import batches" ON public.import_batches;
CREATE POLICY "Users can manage their own import batches" ON public.import_batches
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- import_connectors
DROP POLICY IF EXISTS "Users can manage their own import connectors" ON public.import_connectors;
CREATE POLICY "Users can manage their own import connectors" ON public.import_connectors
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- import_jobs
DROP POLICY IF EXISTS "Users can manage their own import jobs" ON public.import_jobs;
CREATE POLICY "Users can manage their own import jobs" ON public.import_jobs
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- imported_products
DROP POLICY IF EXISTS "Users can view their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can update their own imported products" ON public.imported_products;  
DROP POLICY IF EXISTS "Users can delete their own imported products" ON public.imported_products;
CREATE POLICY "Users can view their own imported products" ON public.imported_products
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own imported products" ON public.imported_products
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own imported products" ON public.imported_products
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Sécuriser les autres tables importantes
-- integrations
DROP POLICY IF EXISTS "secure_integrations_select" ON public.integrations;
DROP POLICY IF EXISTS "secure_integrations_update" ON public.integrations;
DROP POLICY IF EXISTS "secure_integrations_delete" ON public.integrations;
CREATE POLICY "secure_integrations_select" ON public.integrations
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "secure_integrations_update" ON public.integrations
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "secure_integrations_delete" ON public.integrations
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- inventory_levels
DROP POLICY IF EXISTS "Users can manage their inventory levels" ON public.inventory_levels;
CREATE POLICY "Users can manage their inventory levels" ON public.inventory_levels
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- marketing_campaigns
DROP POLICY IF EXISTS "Users can manage their own marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users can manage their own marketing campaigns" ON public.marketing_campaigns
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- newsletters - Politique admin seulement
DROP POLICY IF EXISTS "Admin can view newsletter emails" ON public.newsletters;
CREATE POLICY "Admin can view newsletter emails" ON public.newsletters
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- notifications
DROP POLICY IF EXISTS "secure_select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "secure_update_notifications" ON public.notifications;
DROP POLICY IF EXISTS "secure_delete_notifications" ON public.notifications;
CREATE POLICY "secure_select_notifications" ON public.notifications
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "secure_update_notifications" ON public.notifications
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "secure_delete_notifications" ON public.notifications
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- orders
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "admin_bypass_select_orders" ON public.orders;
CREATE POLICY "Users can manage their own orders" ON public.orders
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "admin_bypass_select_orders" ON public.orders
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- plans_limits - Seulement pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Plans limits are readable by authenticated users" ON public.plans_limits;
CREATE POLICY "Plans limits are readable by authenticated users" ON public.plans_limits
FOR SELECT USING (auth.uid() IS NOT NULL);

-- products
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
DROP POLICY IF EXISTS "admin_bypass_select_products" ON public.products;
CREATE POLICY "Users can manage their own products" ON public.products
FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "admin_bypass_select_products" ON public.products
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- profiles - Sécuriser toutes les politiques
DROP POLICY IF EXISTS "secure_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "secure_profiles_select" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL AND (auth.uid() = id OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
)));
CREATE POLICY "secure_profiles_update" ON public.profiles
FOR UPDATE USING (auth.uid() IS NOT NULL AND (auth.uid() = id OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
)));

-- revoked_tokens - Admin seulement
DROP POLICY IF EXISTS "Admins can manage revoked tokens" ON public.revoked_tokens;
CREATE POLICY "Admins can manage revoked tokens" ON public.revoked_tokens
FOR ALL USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- role_permissions - Seulement pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Role permissions are readable by authenticated users" ON public.role_permissions;
CREATE POLICY "Role permissions are readable by authenticated users" ON public.role_permissions
FOR SELECT USING (auth.uid() IS NOT NULL);

-- security_events - Admin seulement
DROP POLICY IF EXISTS "Admin can view security events" ON public.security_events;
CREATE POLICY "Admin can view security events" ON public.security_events
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- subscribers
DROP POLICY IF EXISTS "subscribers_select_own_data" ON public.subscribers;
CREATE POLICY "subscribers_select_own_data" ON public.subscribers
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- suppliers - Sécuriser toutes les politiques
DROP POLICY IF EXISTS "Users can view only their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select_basic_data" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update only their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_user_update_basic" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete only their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_user_delete" ON public.suppliers;
CREATE POLICY "Users can view only their own suppliers" ON public.suppliers
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update only their own suppliers" ON public.suppliers
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can delete only their own suppliers" ON public.suppliers
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- user_api_keys
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can view their own API keys" ON public.user_api_keys
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own API keys" ON public.user_api_keys
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys" ON public.user_api_keys
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- user_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.user_notifications
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- user_quotas
DROP POLICY IF EXISTS "Users can view their quotas" ON public.user_quotas;
DROP POLICY IF EXISTS "Users can view their own quotas" ON public.user_quotas;
DROP POLICY IF EXISTS "Users can update their own quotas" ON public.user_quotas;
CREATE POLICY "Users can view their own quotas" ON public.user_quotas
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own quotas" ON public.user_quotas
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- user_roles - Sécuriser les politiques
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- user_sessions - Sécuriser les politiques
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.user_sessions
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Admins can manage all sessions" ON public.user_sessions
FOR ALL USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- 3. Sécuriser les politiques de stockage
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own imports" ON storage.objects;

-- Recréer les politiques de stockage de manière sécurisée
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  auth.uid() IS NOT NULL 
  AND bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  auth.uid() IS NOT NULL 
  AND bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own imports" ON storage.objects
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND bucket_id = 'imports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own imports" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND bucket_id = 'imports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Créer une fonction pour configurer la protection des mots de passe (documentation)
CREATE OR REPLACE FUNCTION public.configure_password_protection()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Cette fonction documente les paramètres à configurer manuellement
  -- La protection des mots de passe divulgués doit être activée dans le dashboard Supabase
  
  RETURN jsonb_build_object(
    'status', 'manual_configuration_required',
    'message', 'La protection des mots de passe divulgués doit être activée manuellement',
    'instructions', jsonb_build_array(
      'Aller dans le dashboard Supabase',
      'Naviguer vers Auth > Settings',
      'Activer "Leaked Password Protection"',
      'Configurer la force minimale des mots de passe si nécessaire'
    ),
    'documentation_url', 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
  );
END;
$$;

-- Logger la completion de la migration de sécurité
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'security_migration_completed',
  'info',
  'Migration de sécurité complétée - 99 warnings RLS corrigés',
  jsonb_build_object(
    'timestamp', now(),
    'policies_updated', 'all_rls_policies',
    'functions_secured', 'search_path_fixed',
    'remaining_manual_config', 'leaked_password_protection'
  )
);