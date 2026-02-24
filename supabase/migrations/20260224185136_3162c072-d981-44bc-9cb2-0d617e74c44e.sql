
-- =============================================
-- WAVE 3: Add WITH CHECK to all FOR ALL policies missing it
-- Also fix service_role policies on {public} for extension tables
-- =============================================

-- ===== PART A: Fix service_role policies on {public} =====
DROP POLICY IF EXISTS "Service role full access extension_analytics" ON public.extension_analytics;
DROP POLICY IF EXISTS "Service role full access extension_data" ON public.extension_data;

-- ===== PART B: User-owned tables - Drop and recreate with WITH CHECK =====

-- ab_test_experiments
DROP POLICY IF EXISTS "Users can manage own ab_test_experiments" ON public.ab_test_experiments;
CREATE POLICY "Users can manage own ab_test_experiments" ON public.ab_test_experiments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ab_test_variants
DROP POLICY IF EXISTS "Users can manage own ab tests" ON public.ab_test_variants;
CREATE POLICY "Users can manage own ab tests" ON public.ab_test_variants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- advanced_reports
DROP POLICY IF EXISTS "Users can manage own reports" ON public.advanced_reports;
CREATE POLICY "Users can manage own reports" ON public.advanced_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_auto_action_configs
DROP POLICY IF EXISTS "Users can manage own AI configs" ON public.ai_auto_action_configs;
CREATE POLICY "Users can manage own AI configs" ON public.ai_auto_action_configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_auto_action_logs
DROP POLICY IF EXISTS "Users can manage own AI logs" ON public.ai_auto_action_logs;
CREATE POLICY "Users can manage own AI logs" ON public.ai_auto_action_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_content_batches
DROP POLICY IF EXISTS "Users can manage their content batches" ON public.ai_content_batches;
CREATE POLICY "Users can manage their content batches" ON public.ai_content_batches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_content_templates
DROP POLICY IF EXISTS "Users can manage their AI templates" ON public.ai_content_templates;
CREATE POLICY "Users can manage their AI templates" ON public.ai_content_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_generated_content
DROP POLICY IF EXISTS "Users can manage their generated content" ON public.ai_generated_content;
CREATE POLICY "Users can manage their generated content" ON public.ai_generated_content FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- alert_configurations
DROP POLICY IF EXISTS "Users can manage their alert configs" ON public.alert_configurations;
CREATE POLICY "Users can manage their alert configs" ON public.alert_configurations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- alert_preferences
DROP POLICY IF EXISTS "Users can manage their alert preferences" ON public.alert_preferences;
CREATE POLICY "Users can manage their alert preferences" ON public.alert_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_dashboards
DROP POLICY IF EXISTS "Users can manage their dashboards" ON public.analytics_dashboards;
CREATE POLICY "Users can manage their dashboards" ON public.analytics_dashboards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_snapshots
DROP POLICY IF EXISTS "Users can manage their snapshots" ON public.analytics_snapshots;
CREATE POLICY "Users can manage their snapshots" ON public.analytics_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_widgets
DROP POLICY IF EXISTS "Users can manage their widgets" ON public.analytics_widgets;
CREATE POLICY "Users can manage their widgets" ON public.analytics_widgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- automated_campaigns
DROP POLICY IF EXISTS "Users can manage own automated_campaigns" ON public.automated_campaigns;
CREATE POLICY "Users can manage own automated_campaigns" ON public.automated_campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- automation_actions
DROP POLICY IF EXISTS "Users can manage own actions" ON public.automation_actions;
CREATE POLICY "Users can manage own actions" ON public.automation_actions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- automation_triggers
DROP POLICY IF EXISTS "Users can manage own triggers" ON public.automation_triggers;
CREATE POLICY "Users can manage own triggers" ON public.automation_triggers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- automation_workflows
DROP POLICY IF EXISTS "Users can manage own workflows" ON public.automation_workflows;
CREATE POLICY "Users can manage own workflows" ON public.automation_workflows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- campaign_ab_tests
DROP POLICY IF EXISTS "Users can manage their AB tests" ON public.campaign_ab_tests;
CREATE POLICY "Users can manage their AB tests" ON public.campaign_ab_tests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- campaign_creatives
DROP POLICY IF EXISTS "Users manage own creatives" ON public.campaign_creatives;
CREATE POLICY "Users manage own creatives" ON public.campaign_creatives FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- campaign_performance
DROP POLICY IF EXISTS "Users view own campaign performance" ON public.campaign_performance;
CREATE POLICY "Users view own campaign performance" ON public.campaign_performance FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- campaign_product_feeds
DROP POLICY IF EXISTS "Users manage own product feeds" ON public.campaign_product_feeds;
CREATE POLICY "Users manage own product feeds" ON public.campaign_product_feeds FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- channel_product_mappings
DROP POLICY IF EXISTS "Users can manage their channel mappings" ON public.channel_product_mappings;
CREATE POLICY "Users can manage their channel mappings" ON public.channel_product_mappings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- channel_sync_logs
DROP POLICY IF EXISTS "Users can view their sync logs" ON public.channel_sync_logs;
CREATE POLICY "Users can view their sync logs" ON public.channel_sync_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content_ab_tests
DROP POLICY IF EXISTS "Users can manage their own ab tests" ON public.content_ab_tests;
CREATE POLICY "Users can manage their own ab tests" ON public.content_ab_tests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content_optimizations
DROP POLICY IF EXISTS "Users can manage own content_optimizations" ON public.content_optimizations;
CREATE POLICY "Users can manage own content_optimizations" ON public.content_optimizations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content_team_members
DROP POLICY IF EXISTS "Owners can manage team" ON public.content_team_members;
CREATE POLICY "Owners can manage team" ON public.content_team_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content_translations
DROP POLICY IF EXISTS "Users can manage their own translations" ON public.content_translations;
CREATE POLICY "Users can manage their own translations" ON public.content_translations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content_versions
DROP POLICY IF EXISTS "Users can manage their own versions" ON public.content_versions;
CREATE POLICY "Users can manage their own versions" ON public.content_versions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content_workflows
DROP POLICY IF EXISTS "Users can manage their own workflows" ON public.content_workflows;
CREATE POLICY "Users can manage their own workflows" ON public.content_workflows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- conversion_events
DROP POLICY IF EXISTS "Users can manage own conversion_events" ON public.conversion_events;
CREATE POLICY "Users can manage own conversion_events" ON public.conversion_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- customer_rfm_scores
DROP POLICY IF EXISTS "Users can manage RFM scores" ON public.customer_rfm_scores;
CREATE POLICY "Users can manage RFM scores" ON public.customer_rfm_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- customer_segment_members
DROP POLICY IF EXISTS "Users can manage segment members" ON public.customer_segment_members;
CREATE POLICY "Users can manage segment members" ON public.customer_segment_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- customer_segments (has both FOR ALL and granular - drop FOR ALL)
DROP POLICY IF EXISTS "Users can manage their segments" ON public.customer_segments;

-- deliverability_stats
DROP POLICY IF EXISTS "Users can view their deliverability stats" ON public.deliverability_stats;
CREATE POLICY "Users can view their deliverability stats" ON public.deliverability_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- demand_forecasts
DROP POLICY IF EXISTS "Users manage own forecasts" ON public.demand_forecasts;
CREATE POLICY "Users manage own forecasts" ON public.demand_forecasts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- dynamic_ad_campaigns
DROP POLICY IF EXISTS "Users manage own dynamic campaigns" ON public.dynamic_ad_campaigns;
CREATE POLICY "Users manage own dynamic campaigns" ON public.dynamic_ad_campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- email_campaigns
DROP POLICY IF EXISTS "Users can manage their email campaigns" ON public.email_campaigns;
CREATE POLICY "Users can manage their email campaigns" ON public.email_campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- email_sending_logs
DROP POLICY IF EXISTS "Users can view their sending logs" ON public.email_sending_logs;
CREATE POLICY "Users can view their sending logs" ON public.email_sending_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- email_templates
DROP POLICY IF EXISTS "Users can manage their email templates" ON public.email_templates;
CREATE POLICY "Users can manage their email templates" ON public.email_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- email_unsubscribes
DROP POLICY IF EXISTS "Users can manage their unsubscribes" ON public.email_unsubscribes;
CREATE POLICY "Users can manage their unsubscribes" ON public.email_unsubscribes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- enterprise_integrations
DROP POLICY IF EXISTS "Users can manage own enterprise integrations" ON public.enterprise_integrations;
CREATE POLICY "Users can manage own enterprise integrations" ON public.enterprise_integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- field_mappings
DROP POLICY IF EXISTS "Users can manage own field mappings" ON public.field_mappings;
CREATE POLICY "Users can manage own field mappings" ON public.field_mappings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fulfillment_carriers
DROP POLICY IF EXISTS "Users can manage own carriers" ON public.fulfillment_carriers;
CREATE POLICY "Users can manage own carriers" ON public.fulfillment_carriers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fulfillment_shipments
DROP POLICY IF EXISTS "Users can manage own shipments" ON public.fulfillment_shipments;
CREATE POLICY "Users can manage own shipments" ON public.fulfillment_shipments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fulfilment_rules
DROP POLICY IF EXISTS "Users can manage own fulfilment rules" ON public.fulfilment_rules;
CREATE POLICY "Users can manage own fulfilment rules" ON public.fulfilment_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- imported_products
DROP POLICY IF EXISTS "Users can manage own imported products" ON public.imported_products;
CREATE POLICY "Users can manage own imported products" ON public.imported_products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- invoice_history
DROP POLICY IF EXISTS "Users can manage own invoice_history" ON public.invoice_history;
CREATE POLICY "Users can manage own invoice_history" ON public.invoice_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- invoice_templates
DROP POLICY IF EXISTS "Users can manage own invoice_templates" ON public.invoice_templates;
CREATE POLICY "Users can manage own invoice_templates" ON public.invoice_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- landing_pages
DROP POLICY IF EXISTS "Users can manage their own pages" ON public.landing_pages;
CREATE POLICY "Users can manage their own pages" ON public.landing_pages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- marketing_campaigns
DROP POLICY IF EXISTS "Users can manage own marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users can manage own marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- marketing_segments
DROP POLICY IF EXISTS "Users can manage own marketing_segments" ON public.marketing_segments;
CREATE POLICY "Users can manage own marketing_segments" ON public.marketing_segments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- marketplace_product_mappings
DROP POLICY IF EXISTS "Users manage own product mappings" ON public.marketplace_product_mappings;
CREATE POLICY "Users manage own product mappings" ON public.marketplace_product_mappings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- media_folders
DROP POLICY IF EXISTS "Users can manage their own folders" ON public.media_folders;
CREATE POLICY "Users can manage their own folders" ON public.media_folders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notification_preferences
DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- page_components
DROP POLICY IF EXISTS "Users can manage their own components" ON public.page_components;
CREATE POLICY "Users can manage their own components" ON public.page_components FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- platform_metrics
DROP POLICY IF EXISTS "Users can manage own platform_metrics" ON public.platform_metrics;
CREATE POLICY "Users can manage own platform_metrics" ON public.platform_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- platform_sync_configs
DROP POLICY IF EXISTS "Users can manage own platform_sync_configs" ON public.platform_sync_configs;
CREATE POLICY "Users can manage own platform_sync_configs" ON public.platform_sync_configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- platform_sync_logs
DROP POLICY IF EXISTS "Users can manage own platform_sync_logs" ON public.platform_sync_logs;
CREATE POLICY "Users can manage own platform_sync_logs" ON public.platform_sync_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- premium_supplier_connections
DROP POLICY IF EXISTS "Users can manage own premium connections" ON public.premium_supplier_connections;
CREATE POLICY "Users can manage own premium connections" ON public.premium_supplier_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- product_opportunities
DROP POLICY IF EXISTS "Users manage own opportunities" ON public.product_opportunities;
CREATE POLICY "Users manage own opportunities" ON public.product_opportunities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- product_review_stats
DROP POLICY IF EXISTS "Users can manage their own review stats" ON public.product_review_stats;
CREATE POLICY "Users can manage their own review stats" ON public.product_review_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- product_scores
DROP POLICY IF EXISTS "Users can manage their own product scores" ON public.product_scores;
CREATE POLICY "Users can manage their own product scores" ON public.product_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- product_supplier_mapping
DROP POLICY IF EXISTS "Users can manage own product supplier mapping" ON public.product_supplier_mapping;
CREATE POLICY "Users can manage own product supplier mapping" ON public.product_supplier_mapping FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- push_subscriptions
DROP POLICY IF EXISTS "Users can manage their push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- return_automation_rules
DROP POLICY IF EXISTS "Users can manage their return automation rules" ON public.return_automation_rules;
CREATE POLICY "Users can manage their return automation rules" ON public.return_automation_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- return_labels
DROP POLICY IF EXISTS "Users can manage their return labels" ON public.return_labels;
CREATE POLICY "Users can manage their return labels" ON public.return_labels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sales_channels
DROP POLICY IF EXISTS "Users can manage their sales channels" ON public.sales_channels;
CREATE POLICY "Users can manage their sales channels" ON public.sales_channels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saved_catalog_filters
DROP POLICY IF EXISTS "Users can manage their own saved filters" ON public.saved_catalog_filters;
CREATE POLICY "Users can manage their own saved filters" ON public.saved_catalog_filters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saved_product_views
DROP POLICY IF EXISTS "Users can manage own views" ON public.saved_product_views;
CREATE POLICY "Users can manage own views" ON public.saved_product_views FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- scheduled_tasks
DROP POLICY IF EXISTS "Users can manage own scheduled tasks" ON public.scheduled_tasks;
CREATE POLICY "Users can manage own scheduled tasks" ON public.scheduled_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- scoring_batches
DROP POLICY IF EXISTS "Users can manage their own scoring batches" ON public.scoring_batches;
CREATE POLICY "Users can manage their own scoring batches" ON public.scoring_batches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- scoring_rules
DROP POLICY IF EXISTS "Users can manage their own scoring rules" ON public.scoring_rules;
CREATE POLICY "Users can manage their own scoring rules" ON public.scoring_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- smart_alerts
DROP POLICY IF EXISTS "Users manage own smart alerts" ON public.smart_alerts;
CREATE POLICY "Users manage own smart alerts" ON public.smart_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- social_accounts
DROP POLICY IF EXISTS "Users can manage their own social accounts" ON public.social_accounts;
CREATE POLICY "Users can manage their own social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- social_posts
DROP POLICY IF EXISTS "Users can manage their own social posts" ON public.social_posts;
CREATE POLICY "Users can manage their own social posts" ON public.social_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- stock_alerts
DROP POLICY IF EXISTS "Users can manage own stock alerts" ON public.stock_alerts;
CREATE POLICY "Users can manage own stock alerts" ON public.stock_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- stock_levels
DROP POLICY IF EXISTS "Users can manage own stock levels" ON public.stock_levels;
CREATE POLICY "Users can manage own stock levels" ON public.stock_levels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- stock_movements
DROP POLICY IF EXISTS "Users can manage own stock movements" ON public.stock_movements;
CREATE POLICY "Users can manage own stock movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_analytics
DROP POLICY IF EXISTS "Users view analytics" ON public.supplier_analytics;
CREATE POLICY "Users view analytics" ON public.supplier_analytics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_notifications
DROP POLICY IF EXISTS "Users manage notifications" ON public.supplier_notifications;
CREATE POLICY "Users manage notifications" ON public.supplier_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_pricing_rules
DROP POLICY IF EXISTS "Users can manage own supplier pricing rules" ON public.supplier_pricing_rules;
CREATE POLICY "Users can manage own supplier pricing rules" ON public.supplier_pricing_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_scores
DROP POLICY IF EXISTS "Users manage own supplier scores" ON public.supplier_scores;
CREATE POLICY "Users manage own supplier scores" ON public.supplier_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_sync_jobs
DROP POLICY IF EXISTS "Users manage sync jobs" ON public.supplier_sync_jobs;
CREATE POLICY "Users manage sync jobs" ON public.supplier_sync_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_sync_logs
DROP POLICY IF EXISTS "Users view sync logs" ON public.supplier_sync_logs;
CREATE POLICY "Users view sync logs" ON public.supplier_sync_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supplier_sync_schedules
DROP POLICY IF EXISTS "Users manage schedules" ON public.supplier_sync_schedules;
CREATE POLICY "Users manage schedules" ON public.supplier_sync_schedules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- suppliers
DROP POLICY IF EXISTS "Users can manage own suppliers" ON public.suppliers;
CREATE POLICY "Users can manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- supported_languages
DROP POLICY IF EXISTS "Users can manage their own languages" ON public.supported_languages;
CREATE POLICY "Users can manage their own languages" ON public.supported_languages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sync_configurations
DROP POLICY IF EXISTS "Users can manage own sync configurations" ON public.sync_configurations;
CREATE POLICY "Users can manage own sync configurations" ON public.sync_configurations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sync_conflicts
DROP POLICY IF EXISTS "Users manage own sync conflicts" ON public.sync_conflicts;
CREATE POLICY "Users manage own sync conflicts" ON public.sync_conflicts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sync_logs
DROP POLICY IF EXISTS "Users can manage own sync_logs" ON public.sync_logs;
CREATE POLICY "Users can manage own sync_logs" ON public.sync_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sync_queue
DROP POLICY IF EXISTS "Users manage own sync queue" ON public.sync_queue;
CREATE POLICY "Users manage own sync queue" ON public.sync_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- unified_sync_queue
DROP POLICY IF EXISTS "Users can manage own sync queue" ON public.unified_sync_queue;
CREATE POLICY "Users can manage own sync queue" ON public.unified_sync_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_notifications
DROP POLICY IF EXISTS "Users can manage their notifications" ON public.user_notifications;
CREATE POLICY "Users can manage their notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- warehouses
DROP POLICY IF EXISTS "Users can manage own warehouses" ON public.warehouses;
CREATE POLICY "Users can manage own warehouses" ON public.warehouses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- webhook_subscriptions
DROP POLICY IF EXISTS "Users can manage own webhook subscriptions" ON public.webhook_subscriptions;
CREATE POLICY "Users can manage own webhook subscriptions" ON public.webhook_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- workflow_executions
DROP POLICY IF EXISTS "Users can view their executions" ON public.workflow_executions;
CREATE POLICY "Users can view their executions" ON public.workflow_executions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- workflow_templates
DROP POLICY IF EXISTS "Users can manage their workflows" ON public.workflow_templates;
CREATE POLICY "Users can manage their workflows" ON public.workflow_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== PART C: Admin-only tables - Add WITH CHECK =====

-- active_alerts
DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.active_alerts;
CREATE POLICY "Admins can manage all alerts" ON public.active_alerts FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- analytics_insights
DROP POLICY IF EXISTS "Admins can manage all analytics insights" ON public.analytics_insights;
CREATE POLICY "Admins can manage all analytics insights" ON public.analytics_insights FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- business_intelligence_insights
DROP POLICY IF EXISTS "Admins can manage all insights" ON public.business_intelligence_insights;
CREATE POLICY "Admins can manage all insights" ON public.business_intelligence_insights FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- extensions
DROP POLICY IF EXISTS "Admins can manage extensions" ON public.extensions;
CREATE POLICY "Admins can manage extensions" ON public.extensions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- faq_items
DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faq_items;
CREATE POLICY "Admins can manage faqs" ON public.faq_items FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plan_limits
DROP POLICY IF EXISTS "Admins can manage plan limits" ON public.plan_limits;
CREATE POLICY "Admins can manage plan limits" ON public.plan_limits FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- premium_suppliers
DROP POLICY IF EXISTS "Admins can manage premium suppliers" ON public.premium_suppliers;
CREATE POLICY "Admins can manage premium suppliers" ON public.premium_suppliers FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- security_events
DROP POLICY IF EXISTS "Admins can manage security events" ON public.security_events;
CREATE POLICY "Admins can manage security events" ON public.security_events FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_quotas
DROP POLICY IF EXISTS "Admins can manage all quotas" ON public.user_quotas;
CREATE POLICY "Admins can manage all quotas" ON public.user_quotas FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- video_tutorials
DROP POLICY IF EXISTS "Admins can manage tutorials" ON public.video_tutorials;
CREATE POLICY "Admins can manage tutorials" ON public.video_tutorials FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== PART D: Subquery-based policies - Add WITH CHECK =====

-- campaign_recipients
DROP POLICY IF EXISTS "Users can view campaign recipients" ON public.campaign_recipients;
CREATE POLICY "Users can manage campaign recipients" ON public.campaign_recipients FOR ALL
  USING (campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid()));

-- campaign_stats
DROP POLICY IF EXISTS "Users can view campaign stats" ON public.campaign_stats;
CREATE POLICY "Users can manage campaign stats" ON public.campaign_stats FOR ALL
  USING (campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid()));

-- order_items
DROP POLICY IF EXISTS "Users can manage order items through orders" ON public.order_items;
CREATE POLICY "Users can manage order items through orders" ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- store_team_access
DROP POLICY IF EXISTS "Store owners can manage access" ON public.store_team_access;
CREATE POLICY "Store owners can manage access" ON public.store_team_access FOR ALL
  USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_team_access.store_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_team_access.store_id AND s.user_id = auth.uid()));
