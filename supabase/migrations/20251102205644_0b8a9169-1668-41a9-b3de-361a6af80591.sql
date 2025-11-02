-- Insérer le fournisseur BTS Wholesaler dans premium_suppliers avec UUID généré
INSERT INTO public.premium_suppliers (
  id,
  name,
  display_name,
  country,
  description,
  logo_url,
  tier,
  quality_score,
  reliability_score,
  product_count,
  featured,
  categories,
  certifications,
  minimum_order_value,
  delivery_regions,
  avg_delivery_days,
  api_endpoint,
  support_email,
  is_active
) 
SELECT
  gen_random_uuid(),
  'BTS Wholesaler',
  'BTS Wholesaler',
  'Europe',
  'Grossiste européen B2B avec plus de 10 000 produits de mode, électronique et lifestyle. Synchronisation en temps réel via API.',
  'https://www.btswholesaler.com/assets/images/logo.png',
  'platinum'::premium_tier,
  4.5,
  4.8,
  10000,
  true,
  ARRAY['Mode', 'Électronique', 'Lifestyle', 'Accessoires', 'Beauté'],
  ARRAY['iso_9001'::quality_certification, 'ce_certified'::quality_certification],
  100,
  ARRAY['eu'::delivery_region, 'uk'::delivery_region],
  5,
  'https://www.btswholesaler.com/generatefeedbts',
  'support@btswholesaler.com',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.premium_suppliers WHERE name = 'BTS Wholesaler'
);