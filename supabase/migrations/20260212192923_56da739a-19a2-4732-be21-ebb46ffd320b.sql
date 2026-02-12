
-- Update existing SEO quotas to match new structure
-- BASIC (free): 20 audits, 50 gen, 10 applies
UPDATE plan_limits SET limit_value = 20, description = 'Audits SEO produits par mois (Basic)' WHERE plan_name = 'free' AND limit_key = 'seo_audits';
UPDATE plan_limits SET limit_value = 50, description = 'Générations IA SEO par mois (Basic)' WHERE plan_name = 'free' AND limit_key = 'seo_generations';
UPDATE plan_limits SET limit_value = 10, description = 'Optimisations SEO appliquées par mois (Basic)' WHERE plan_name = 'free' AND limit_key = 'seo_applies';

-- PRO (standard): 150 audits, 400 gen, 100 applies
UPDATE plan_limits SET limit_value = 150, description = 'Audits SEO produits par mois (Pro)' WHERE plan_name = 'standard' AND limit_key = 'seo_audits';
UPDATE plan_limits SET limit_value = 400, description = 'Générations IA SEO par mois (Pro)' WHERE plan_name = 'standard' AND limit_key = 'seo_generations';
UPDATE plan_limits SET limit_value = 100, description = 'Optimisations SEO appliquées par mois (Pro)' WHERE plan_name = 'standard' AND limit_key = 'seo_applies';

-- ADVANCED (pro): 1000 audits, 3000 gen, unlimited applies
UPDATE plan_limits SET limit_value = 1000, description = 'Audits SEO produits par mois (Advanced)' WHERE plan_name = 'pro' AND limit_key = 'seo_audits';
UPDATE plan_limits SET limit_value = 3000, description = 'Générations IA SEO par mois (Advanced)' WHERE plan_name = 'pro' AND limit_key = 'seo_generations';
UPDATE plan_limits SET limit_value = -1, description = 'Optimisations SEO illimitées (Advanced)' WHERE plan_name = 'pro' AND limit_key = 'seo_applies';

-- ULTRA PRO: all unlimited (already set)

-- Add new SEO quota keys: category audits, site audits, languages, bulk limit
INSERT INTO plan_limits (plan_name, limit_key, limit_value, description) VALUES
  -- Category audits
  ('free', 'seo_category_audits', 5, 'Audits SEO catégories par mois (Basic)'),
  ('standard', 'seo_category_audits', 30, 'Audits SEO catégories par mois (Pro)'),
  ('pro', 'seo_category_audits', 200, 'Audits SEO catégories par mois (Advanced)'),
  ('ultra_pro', 'seo_category_audits', -1, 'Audits SEO catégories illimités'),
  -- Site audits
  ('free', 'seo_site_audits', 0, 'Audit site non inclus (Basic)'),
  ('standard', 'seo_site_audits', 10, 'Audits site partiels par mois (Pro)'),
  ('pro', 'seo_site_audits', 50, 'Audits site complets par mois (Advanced)'),
  ('ultra_pro', 'seo_site_audits', -1, 'Audits site illimités'),
  -- Languages
  ('free', 'seo_languages', 1, '1 langue SEO (Basic)'),
  ('standard', 'seo_languages', 3, '3 langues SEO (Pro)'),
  ('pro', 'seo_languages', -1, 'Langues SEO illimitées (Advanced)'),
  ('ultra_pro', 'seo_languages', -1, 'Langues SEO illimitées'),
  -- Bulk limit
  ('free', 'seo_bulk_limit', 0, 'Bulk non inclus (Basic)'),
  ('standard', 'seo_bulk_limit', 50, 'Bulk jusqu''à 50 produits (Pro)'),
  ('pro', 'seo_bulk_limit', -1, 'Bulk illimité (Advanced)'),
  ('ultra_pro', 'seo_bulk_limit', -1, 'Bulk illimité'),
  -- SEO history retention days
  ('free', 'seo_history_days', 0, 'Pas d''historique avancé (Basic)'),
  ('standard', 'seo_history_days', 90, 'Historique SEO 90 jours (Pro)'),
  ('pro', 'seo_history_days', -1, 'Historique SEO illimité (Advanced)'),
  ('ultra_pro', 'seo_history_days', -1, 'Historique SEO illimité')
ON CONFLICT DO NOTHING;
