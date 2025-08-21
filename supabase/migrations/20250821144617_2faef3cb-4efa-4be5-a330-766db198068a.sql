-- Insert real marketing campaigns data
INSERT INTO marketing_campaigns (name, description, type, status, budget_total, budget_spent, scheduled_at, started_at, target_audience, content, settings, metrics, user_id) VALUES
('Campagne Black Friday 2024', 'Campagne email pour le Black Friday avec offres exceptionnelles', 'email', 'active', 5000.00, 3200.00, '2024-11-20 08:00:00', '2024-11-21 09:00:00', 
 '{"age_range": "25-45", "interests": ["technologie", "shopping"], "geography": "France"}',
 '{"subject": "🔥 BLACK FRIDAY: -70% sur tout!", "template": "black_friday_2024", "products": ["smartphones", "écouteurs"]}',
 '{"send_time": "09:00", "timezone": "Europe/Paris", "ab_test": true}',
 '{"impressions": 45600, "clicks": 2280, "conversions": 156, "roas": 4.8, "ctr": 5.0, "conversion_rate": 6.8, "revenue": 15360}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Google Ads - Smartphones Premium', 'Campagne Google Ads ciblant les smartphones haut de gamme', 'ads', 'active', 8000.00, 5400.00, '2024-01-01 00:00:00', '2024-01-02 10:00:00',
 '{"demographics": {"age": "25-50", "income": "high"}, "interests": ["technology", "premium_brands"], "location": "France"}',
 '{"ad_groups": ["iPhone 15", "Samsung Galaxy"], "keywords": ["smartphone premium", "téléphone haut gamme"], "landing_pages": ["smartphones-premium"]}',
 '{"bid_strategy": "target_roas", "target_roas": 300, "budget_distribution": "accelerated"}',
 '{"impressions": 123000, "clicks": 3690, "conversions": 89, "roas": 3.2, "ctr": 3.0, "conversion_rate": 2.4, "revenue": 17280}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Retargeting Abandons Panier', 'Campagne de retargeting pour récupérer les paniers abandonnés', 'retargeting', 'paused', 2000.00, 890.00, '2024-01-05 00:00:00', '2024-01-06 12:00:00',
 '{"audience_type": "cart_abandoners", "exclusions": ["recent_buyers"], "lookalike": false}',
 '{"message": "Votre panier vous attend!", "discount": "10%", "urgency": true}',
 '{"frequency_cap": 3, "attribution_window": 7, "optimization": "conversions"}',
 '{"impressions": 8700, "clicks": 1578, "conversions": 67, "roas": 2.9, "ctr": 18.1, "conversion_rate": 4.2, "revenue": 2581}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Newsletter Hebdomadaire', 'Newsletter hebdomadaire avec sélection produits et conseils', 'email', 'active', 800.00, 320.00, '2024-01-01 00:00:00', '2024-01-01 18:00:00',
 '{"segment": "subscribers", "engagement_level": "all", "preferences": ["tech", "lifestyle"]}',
 '{"template": "newsletter_weekly", "sections": ["featured_products", "tips", "offers"], "personalization": true}',
 '{"send_day": "tuesday", "send_time": "18:00", "timezone": "Europe/Paris"}',
 '{"impressions": 25300, "clicks": 1721, "conversions": 67, "roas": 1.2, "ctr": 6.8, "conversion_rate": 3.9, "revenue": 384}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Campagne Instagram Influenceurs', 'Partenariats avec micro-influenceurs tech français', 'social', 'completed', 4000.00, 4000.00, '2024-01-05 00:00:00', '2024-01-06 00:00:00',
 '{"influencers": ["tech_blogger_fr", "gadget_reviewer"], "audience": "tech_enthusiasts", "content_type": "unboxing"}',
 '{"posts_count": 12, "stories_count": 24, "reels_count": 6, "hashtags": ["#techfr", "#gadgets", "#unboxing"]}',
 '{"content_approval": true, "usage_rights": "1_year", "performance_bonus": true}',
 '{"impressions": 78900, "clicks": 1578, "conversions": 67, "roas": 2.9, "ctr": 2.0, "conversion_rate": 4.2, "revenue": 11600}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('SMS Flash Sale', 'Campagne SMS pour ventes flash produits tech', 'sms', 'draft', 1500.00, 0.00, '2024-02-01 12:00:00', NULL,
 '{"segment": "high_value_customers", "opt_in_only": true, "geographic": "France"}',
 '{"message_length": "short", "cta": "FLASH30 pour -30%", "urgency": "24h_only"}',
 '{"send_frequency": "weekly", "opt_out": true, "compliance": "RGPD"}',
 '{}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b');

-- Insert marketing segments
INSERT INTO marketing_segments (name, description, criteria, contact_count, user_id) VALUES
('Clients Premium Tech', 'Segment des clients ayant acheté des produits tech premium > 500€', 
 '{"purchase_history": {"min_amount": 500, "categories": ["smartphones", "ordinateurs", "audio_premium"]}, "frequency": "repeat_buyers"}', 
 1240, '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Abandons Panier Récents', 'Utilisateurs ayant abandonné leur panier dans les 7 derniers jours',
 '{"behavior": "cart_abandonment", "timeframe": "7_days", "min_cart_value": 50}',
 890, '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Nouveaux Inscrits', 'Utilisateurs inscrits depuis moins de 30 jours',
 '{"registration_date": "last_30_days", "email_verified": true, "purchase_history": "none"}',
 2340, '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('VIP Gros Acheteurs', 'Clients avec plus de 2000€ d''achats sur 12 mois',
 '{"lifetime_value": {"min": 2000, "period": "12_months"}, "engagement": "high"}',
 156, '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Réactivation Inactifs', 'Clients inactifs depuis plus de 90 jours à réactiver',
 '{"last_purchase": "90_days_ago", "email_engagement": "low", "segment_priority": "reactivation"}',
 3400, '44795494-985c-4c0e-97bc-800a3c4faf2b');

-- Insert CRM contacts
INSERT INTO crm_contacts (name, email, phone, company, position, status, lifecycle_stage, lead_score, source, tags, custom_fields, attribution, user_id) VALUES
('Marie Dubois', 'marie.dubois@techcorp.fr', '+33 6 12 34 56 78', 'TechCorp France', 'Responsable Achats IT', 'active', 'customer', 85, 'website',
 '["tech", "b2b", "decision_maker"]', '{"budget_range": "10000-50000", "company_size": "50-200", "industry": "technology"}',
 '{"first_touch": "google_search", "last_touch": "email_campaign", "campaign": "black_friday"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Jean Martin', 'j.martin@startup-innov.com', '+33 7 89 01 23 45', 'StartupInnov', 'CTO', 'active', 'lead', 72, 'linkedin',
 '["startup", "innovation", "budget_conscious"]', '{"budget_range": "1000-10000", "company_size": "10-50", "industry": "software"}',
 '{"first_touch": "linkedin_ad", "last_touch": "demo_request", "campaign": "startup_tech"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Sophie Lefebvre', 'sophie@freelance-design.fr', '+33 6 45 67 89 12', 'Freelance Design', 'Designer Indépendante', 'active', 'prospect', 58, 'referral',
 '["creative", "freelance", "design"]', '{"budget_range": "500-2000", "company_size": "1", "industry": "design"}',
 '{"first_touch": "referral", "last_touch": "newsletter", "campaign": "creative_pros"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Pierre Moreau', 'p.moreau@bigcorp.com', '+33 1 23 45 67 89', 'BigCorp International', 'Directeur Marketing', 'active', 'opportunity', 91, 'trade_show',
 '["enterprise", "marketing", "high_volume"]', '{"budget_range": "50000-200000", "company_size": "1000+", "industry": "retail"}',
 '{"first_touch": "trade_show", "last_touch": "sales_meeting", "campaign": "enterprise_2024"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Amélie Roux', 'amelie.roux@ecommerce-plus.fr', '+33 6 78 90 12 34', 'Ecommerce Plus', 'Responsable E-commerce', 'active', 'customer', 76, 'webinar',
 '["ecommerce", "growth", "data_driven"]', '{"budget_range": "5000-25000", "company_size": "20-100", "industry": "ecommerce"}',
 '{"first_touch": "webinar", "last_touch": "product_demo", "campaign": "ecommerce_growth"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Lucas Petit', 'l.petit@agence-digitale.com', '+33 7 12 34 56 78', 'Agence Digitale Pro', 'Account Manager', 'active', 'lead', 63, 'google_ads',
 '["agency", "digital", "multi_client"]', '{"budget_range": "2000-15000", "company_size": "10-30", "industry": "marketing"}',
 '{"first_touch": "google_ads", "last_touch": "consultation_call", "campaign": "agency_partners"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('Nathalie Bernard', 'n.bernard@retail-chain.fr', '+33 1 98 76 54 32', 'Retail Chain France', 'Buying Director', 'active', 'opportunity', 88, 'cold_outreach',
 '["retail", "volume", "cost_conscious"]', '{"budget_range": "25000-100000", "company_size": "500-1000", "industry": "retail"}',
 '{"first_touch": "cold_email", "last_touch": "proposal_sent", "campaign": "retail_expansion"}',
 '44795494-985c-4c0e-97bc-800a3c4faf2b');

-- Insert additional AI optimization jobs for realistic data
INSERT INTO ai_optimization_jobs (job_type, status, progress, input_data, output_data, started_at, completed_at, user_id) VALUES
('campaign_optimization', 'completed', 100, 
 '{"campaign_id": "black_friday_2024", "optimization_type": "budget_allocation", "current_roas": 3.2}',
 '{"recommended_budget_shift": {"facebook": -800, "google_ads": +800}, "expected_roas_improvement": 23, "confidence": 89}',
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('audience_segmentation', 'running', 75,
 '{"source_data": "customer_behavior", "lookback_period": "90_days", "min_segment_size": 100}',
 '{"preliminary_segments": [{"name": "high_value_mobile", "size": 340, "avg_ltv": 1200}]}',
 NOW() - INTERVAL '30 minutes', NULL,
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('creative_performance', 'completed', 100,
 '{"campaign_type": "display_ads", "creative_variants": 12, "performance_metric": "ctr"}',
 '{"best_performing": {"creative_id": "warm_colors_variant", "ctr_improvement": 34, "confidence": 78}, "recommendations": ["use_orange_red_palette", "test_different_ctas"]}',
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('send_time_optimization', 'completed', 100,
 '{"campaign_type": "email", "historical_data": "6_months", "timezone": "Europe/Paris"}',
 '{"optimal_send_time": {"day": "tuesday", "hour": 14, "minute": 30}, "performance_lift": 67, "confidence": 85}',
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours',
 '44795494-985c-4c0e-97bc-800a3c4faf2b'),

('competitor_analysis', 'pending', 0,
 '{"competitors": ["competitor_a", "competitor_b"], "analysis_type": "ad_intelligence", "period": "last_30_days"}',
 '{}',
 NULL, NULL,
 '44795494-985c-4c0e-97bc-800a3c4faf2b');

-- Enable realtime for marketing tables
ALTER TABLE marketing_campaigns REPLICA IDENTITY FULL;
ALTER TABLE marketing_segments REPLICA IDENTITY FULL;
ALTER TABLE crm_contacts REPLICA IDENTITY FULL;
ALTER TABLE ai_optimization_jobs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE marketing_campaigns;
ALTER publication supabase_realtime ADD TABLE marketing_segments;
ALTER publication supabase_realtime ADD TABLE crm_contacts;
ALTER publication supabase_realtime ADD TABLE ai_optimization_jobs;