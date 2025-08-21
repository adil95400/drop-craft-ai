-- Insérer des données de test réalistes pour les campagnes marketing
INSERT INTO marketing_campaigns (user_id, name, description, type, status, budget_total, budget_spent, scheduled_at, started_at, target_audience, content, settings, metrics) VALUES
('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Black Friday 2024 - Offres Exclusives', 'Campagne email pour les offres Black Friday avec remises jusqu''à 70%', 'email', 'active', 2500.00, 1847.30, '2024-11-25 09:00:00+00', '2024-11-25 09:00:00+00', 
 '{"segment": "active_customers", "filters": {"last_purchase": "6_months", "total_spent": ">100"}, "size": 15200}',
 '{"subject": "🔥 Black Friday: -70% sur TOUT | Dernières heures !", "template": "black_friday_2024", "cta": "Profiter des offres"}',
 '{"frequency": "one_time", "timezone": "Europe/Paris", "ab_test": true, "optimization": true}',
 '{"sent": 15200, "opens": 3772, "clicks": 943, "conversions": 234, "open_rate": 24.8, "click_rate": 6.2, "conversion_rate": 1.54, "revenue": 28750.50}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Retargeting iPhone 15 Pro', 'Campagne retargeting pour les visiteurs ayant consulté les iPhone', 'ads', 'active', 5000.00, 3245.80, '2024-11-20 08:00:00+00', '2024-11-20 08:00:00+00',
 '{"segment": "product_viewers", "filters": {"product_category": "smartphones", "viewed_product": "iphone_15", "time_frame": "14_days"}, "size": 42100}',
 '{"headline": "iPhone 15 Pro en Stock 📱", "description": "Profitez de nos prix exceptionnels sur l''iPhone 15 Pro. Stock limité!", "image": "iphone_15_pro.jpg", "cta": "Commander maintenant"}',
 '{"platforms": ["facebook", "google"], "bid_strategy": "target_cpa", "target_cpa": 25, "audience_expansion": true}',
 '{"impressions": 123450, "clicks": 3421, "conversions": 156, "ctr": 2.77, "cpc": 0.95, "roas": 2.9, "revenue": 24680.40}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Newsletter Hebdomadaire', 'Newsletter hebdomadaire avec les nouveautés et conseils', 'email', 'active', 500.00, 320.15, '2024-11-18 10:00:00+00', '2024-11-18 10:00:00+00',
 '{"segment": "newsletter_subscribers", "filters": {"subscribed": true, "active": true}, "size": 25300}',
 '{"subject": "📧 Votre sélection hebdo + conseils pro", "template": "newsletter_weekly", "sections": ["new_products", "tips", "offers"]}',
 '{"frequency": "weekly", "day": "monday", "time": "10:00", "personalization": true}',
 '{"sent": 25300, "opens": 6834, "clicks": 1721, "conversions": 67, "open_rate": 27.0, "click_rate": 6.8, "conversion_rate": 0.26, "revenue": 5980.30}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Remarketing Paniers Abandonnés', 'Campagne de récupération des paniers abandonnés', 'retargeting', 'paused', 1200.00, 890.45, '2024-11-15 14:00:00+00', '2024-11-15 14:00:00+00',
 '{"segment": "cart_abandoners", "filters": {"cart_value": ">50", "abandoned_hours": ">2", "max_days": 7}, "size": 8700}',
 '{"subject": "Oubli dans votre panier? 🛒 + 10% de remise", "reminder_sequence": ["2h", "24h", "72h"], "discount": "10%"}',
 '{"max_sends": 3, "stop_on_purchase": true, "exclude_recent_buyers": true}',
 '{"sent": 8700, "opens": 2088, "clicks": 1053, "conversions": 89, "open_rate": 24.0, "click_rate": 12.1, "conversion_rate": 1.02, "revenue": 12450.75}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Social Media Boost Q4', 'Campagne de boost sur les réseaux sociaux pour Q4', 'social', 'completed', 1500.00, 1245.60, '2024-10-01 12:00:00+00', '2024-10-01 12:00:00+00',
 '{"segment": "social_followers", "filters": {"platform": ["facebook", "instagram"], "engagement": "high"}, "size": 67890}',
 '{"posts": 24, "stories": 12, "reels": 8, "boosted_posts": 15, "themes": ["product_showcase", "behind_scenes", "user_generated"]}',
 '{"duration": "30_days", "daily_budget": 50, "optimization": "engagement", "target_age": "25-45"}',
 '{"impressions": 345600, "clicks": 8900, "likes": 2340, "shares": 567, "comments": 890, "engagement_rate": 5.2, "reach": 78900, "conversions": 45}');

-- Insérer des segments marketing réalistes
INSERT INTO marketing_segments (user_id, name, description, criteria, contact_count, last_updated) VALUES
('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Clients VIP', 'Clients ayant dépensé plus de 1000€ dans les 12 derniers mois', 
 '{"filters": {"total_spent": {"operator": ">", "value": 1000}, "timeframe": "12_months", "order_frequency": {"operator": ">=", "value": 3}}}', 
 567, now()),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Clients Actifs', 'Clients ayant effectué un achat dans les 6 derniers mois',
 '{"filters": {"last_purchase": {"operator": "<=", "value": "6_months"}, "status": "active"}}',
 3847, now()),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Paniers Abandonnés', 'Visiteurs ayant abandonné leur panier dans les 7 derniers jours',
 '{"filters": {"cart_status": "abandoned", "cart_value": {"operator": ">", "value": 50}, "days_since": {"operator": "<=", "value": 7}}}',
 1923, now()),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Prospects Newsletter', 'Abonnés newsletter n''ayant jamais acheté',
 '{"filters": {"newsletter_subscriber": true, "total_orders": {"operator": "=", "value": 0}, "subscription_date": {"operator": ">=", "value": "30_days"}}}',
 12456, now()),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Clients Inactifs', 'Clients n''ayant pas acheté depuis plus de 6 mois',
 '{"filters": {"last_purchase": {"operator": ">", "value": "6_months"}, "total_spent": {"operator": ">", "value": 100}}}',
 2145, now());

-- Insérer des contacts CRM réalistes
INSERT INTO crm_contacts (user_id, name, email, phone, company, position, status, lifecycle_stage, source, lead_score, tags, custom_fields, attribution) VALUES
('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Marie Dupont', 'marie.dupont@example.com', '+33123456789', 'Tech Solutions', 'Directrice Marketing', 'active', 'customer', 'website', 85,
 ARRAY['vip', 'high_value', 'tech'], 
 '{"preferred_contact": "email", "budget_range": "5000-10000", "decision_maker": true}',
 '{"first_touch": "google_ads", "last_touch": "email_campaign", "campaign": "black_friday_2024"}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Jean Martin', 'jean.martin@company.fr', '+33198765432', 'Startup Innovante', 'CEO', 'active', 'qualified_lead', 'linkedin', 92,
 ARRAY['decision_maker', 'startup', 'high_intent'],
 '{"company_size": "10-50", "industry": "software", "timeline": "immediate"}',
 '{"first_touch": "linkedin_post", "last_touch": "demo_request", "utm_source": "linkedin"}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Sophie Laurent', 'sophie.l@boutique.com', '+33187654321', 'Boutique Mode', 'Propriétaire', 'active', 'opportunity', 'referral', 78,
 ARRAY['retail', 'fashion', 'premium'],
 '{"store_count": 3, "annual_revenue": "500k-1m", "main_challenge": "inventory"}',
 '{"first_touch": "referral", "referrer": "marie_dupont", "last_touch": "phone_call"}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Pierre Dubois', 'p.dubois@ecommerce.fr', '+33176543210', 'E-commerce Plus', 'Directeur E-commerce', 'nurturing', 'marketing_qualified_lead', 'webinar', 65,
 ARRAY['ecommerce', 'mid_market', 'evaluation'],
 '{"employees": "50-100", "platforms": ["shopify", "woocommerce"], "monthly_orders": "500-1000"}',
 '{"first_touch": "webinar", "webinar_topic": "scaling_ecommerce", "last_touch": "email_sequence"}'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Alice Moreau', 'alice@retail.com', '+33165432109', 'Retail Connect', 'Head of Digital', 'active', 'customer', 'content', 88,
 ARRAY['enterprise', 'retail', 'digital_transformation'],
 '{"contract_value": 15000, "renewal_date": "2025-06-01", "satisfaction_score": 9}',
 '{"first_touch": "blog_post", "content_title": "retail_automation", "last_touch": "account_review"}}');

-- Insérer des tâches d'optimisation IA réalistes
INSERT INTO ai_optimization_jobs (user_id, job_type, status, input_data, output_data, progress, started_at, completed_at) VALUES
('44795494-985c-4c0e-97bc-800a3c4faf2b', 'seo_optimization', 'completed', 
 '{"product_ids": [1,2,3], "target_keywords": ["iphone 15 pro", "smartphone premium"], "language": "fr"}',
 '{"optimized_titles": 3, "meta_descriptions": 3, "keywords_added": 45, "seo_score_improvement": 23}',
 100, '2024-11-20 14:30:00+00', '2024-11-20 14:35:00+00'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'price_optimization', 'completed',
 '{"products": 25, "market_data": true, "competitor_analysis": true}',
 '{"price_suggestions": 25, "profit_increase": "12.5%", "competitive_position": "optimal"}',
 100, '2024-11-19 09:15:00+00', '2024-11-19 09:22:00+00'),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'content_generation', 'processing',
 '{"campaign_type": "email", "target_audience": "vip_customers", "tone": "premium"}',
 '{}',
 75, '2024-11-21 11:45:00+00', null),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'audience_segmentation', 'completed',
 '{"customer_data": 5420, "behavioral_data": true, "purchase_history": true}',
 '{"segments_created": 8, "improvement_prediction": "34%", "recommendations": 12}',
 100, '2024-11-18 16:20:00+00', '2024-11-18 16:28:00+00');

-- Insérer des workflows d'automatisation marketing
INSERT INTO automation_workflows (user_id, name, description, trigger_type, trigger_config, steps, status, execution_count, success_count, failure_count) VALUES
('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Séquence Bienvenue Nouveaux Clients', 'Séquence d''emails automatique pour accueillir les nouveaux clients', 'user_action',
 '{"event": "user_registered", "conditions": {"source": "website", "plan": "any"}}',
 '[
   {"type": "wait", "duration": "1_hour", "name": "Attente initiale"},
   {"type": "send_email", "template": "welcome_email_1", "subject": "Bienvenue chez nous! 🎉", "delay": "0"},
   {"type": "wait", "duration": "3_days", "name": "Attente engagement"},
   {"type": "condition", "check": "email_opened", "true_path": [{"type": "send_email", "template": "tips_email", "subject": "Vos premiers conseils d''expert"}], "false_path": [{"type": "send_email", "template": "re_engagement", "subject": "On a quelque chose pour vous..."}]},
   {"type": "wait", "duration": "7_days", "name": "Attente conversion"},
   {"type": "send_email", "template": "first_purchase_incentive", "subject": "Votre réduction exclusive de 15% 💎"}
 ]',
 'active', 89, 76, 13),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Récupération Panier Abandonné', 'Séquence automatique pour récupérer les paniers abandonnés', 'ecommerce_event',
 '{"event": "cart_abandoned", "conditions": {"cart_value": ">50", "time_elapsed": ">2_hours"}}',
 '[
   {"type": "wait", "duration": "2_hours", "name": "Attente abandon confirmé"},
   {"type": "send_email", "template": "cart_reminder_1", "subject": "Oubli dans votre panier? 🛒", "discount": "5%"},
   {"type": "wait", "duration": "24_hours", "name": "Attente première relance"},
   {"type": "condition", "check": "purchase_completed", "true_path": [{"type": "end"}], "false_path": [{"type": "send_email", "template": "cart_reminder_2", "subject": "Dernière chance: -10% sur votre panier", "discount": "10%"}]},
   {"type": "wait", "duration": "72_hours", "name": "Attente finale"},
   {"type": "send_email", "template": "cart_final_reminder", "subject": "Nous gardons vos articles 24h de plus", "urgency": true}
 ]',
 'active', 234, 187, 47),

('44795494-985c-4c0e-97bc-800a3c4faf2b', 'Upgrade Clients VIP Automatique', 'Promotion automatique des clients en statut VIP basée sur leurs achats', 'data_trigger',
 '{"event": "customer_milestone", "conditions": {"total_spent": ">1000", "timeframe": "3_months", "order_count": ">=3"}}',
 '[
   {"type": "update_customer_status", "status": "vip", "name": "Promotion VIP"},
   {"type": "send_email", "template": "vip_welcome", "subject": "Bienvenue dans notre club VIP! 👑"},
   {"type": "create_task", "task_type": "assign_account_manager", "priority": "high"},
   {"type": "add_to_segment", "segment": "vip_customers"}
 ]',
 'active', 23, 23, 0);