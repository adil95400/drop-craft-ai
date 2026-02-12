
-- Add SEO-specific quota limits per plan
-- Free plan (maps to 'basic' tier in the request)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description)
VALUES
  ('free', 'seo_audits', 20, 'Audits SEO produits par mois'),
  ('free', 'seo_generations', 50, 'Générations IA SEO par mois'),
  ('free', 'seo_applies', 10, 'Optimisations SEO appliquées par mois')
ON CONFLICT (plan_name, limit_key) DO UPDATE SET limit_value = EXCLUDED.limit_value, description = EXCLUDED.description;

-- Standard plan (maps to 'pro' tier)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description)
VALUES
  ('standard', 'seo_audits', 150, 'Audits SEO produits par mois'),
  ('standard', 'seo_generations', 400, 'Générations IA SEO par mois'),
  ('standard', 'seo_applies', 100, 'Optimisations SEO appliquées par mois')
ON CONFLICT (plan_name, limit_key) DO UPDATE SET limit_value = EXCLUDED.limit_value, description = EXCLUDED.description;

-- Pro plan (maps to 'advanced' tier)
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description)
VALUES
  ('pro', 'seo_audits', 1000, 'Audits SEO produits par mois'),
  ('pro', 'seo_generations', 3000, 'Générations IA SEO par mois'),
  ('pro', 'seo_applies', -1, 'Optimisations SEO illimitées')
ON CONFLICT (plan_name, limit_key) DO UPDATE SET limit_value = EXCLUDED.limit_value, description = EXCLUDED.description;

-- Ultra Pro plan
INSERT INTO public.plan_limits (plan_name, limit_key, limit_value, description)
VALUES
  ('ultra_pro', 'seo_audits', -1, 'Audits SEO illimités'),
  ('ultra_pro', 'seo_generations', -1, 'Générations IA SEO illimitées'),
  ('ultra_pro', 'seo_applies', -1, 'Optimisations SEO illimitées')
ON CONFLICT (plan_name, limit_key) DO UPDATE SET limit_value = EXCLUDED.limit_value, description = EXCLUDED.description;
