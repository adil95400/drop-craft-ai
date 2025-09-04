-- Phase 1: Ajout de données réelles avec structures correctes

-- 1. Ajouter des commandes réalistes avec différents statuts
INSERT INTO public.orders (order_number, customer_id, total_amount, currency, status, created_at)
SELECT 
  'ORDER-' || (1000 + row_number() OVER()),
  c.id,
  (random() * 300 + 25)::numeric(10,2),
  'EUR',
  (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled'])[ceil(random() * 5)],
  now() - (random() * 90 || ' days')::interval
FROM customers c, generate_series(1, 30) -- 30 nouvelles commandes
WHERE c.id IN (SELECT id FROM customers LIMIT 8);

-- 2. Améliorer les données clients avec plus de détails
UPDATE public.customers 
SET 
  total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customers.id AND status = 'delivered'),
  total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id),
  address = jsonb_build_object(
    'street', (ARRAY['123 rue de la Paix', '45 avenue des Champs', '78 boulevard Saint-Michel', '12 place Vendôme'])[ceil(random() * 4)],
    'city', (ARRAY['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'])[ceil(random() * 5)],
    'postal_code', (10000 + random() * 89999)::int::text,
    'country', 'France'
  ),
  phone = '+33' || (600000000 + random() * 99999999)::int::text
WHERE id IN (SELECT id FROM customers);

-- 3. Créer des avis clients réalistes (avec la structure correcte)
INSERT INTO public.reviews (external_id, platform, product_id, customer_name, customer_email, rating, title, content, created_at)
SELECT 
  'REV-' || gen_random_uuid(),
  'web',
  p.sku,
  c.name,
  c.email,
  (3 + random() * 2)::int, -- Notes entre 3 et 5
  (ARRAY['Excellent produit!', 'Très satisfait', 'Bon rapport qualité-prix', 'Je recommande', 'Parfait'])[ceil(random() * 5)],
  (ARRAY[
    'Excellent produit, très satisfait de mon achat!',
    'Bonne qualité pour le prix, livraison rapide.',
    'Fonctionne comme prévu, je le recommande.',
    'Très bon rapport qualité-prix, je rachèterai.',
    'Parfait, exactement ce que je cherchais.',
    'Bon produit mais livraison un peu lente.',
    'Très content de cet achat!',
    'Produit de qualité, bien emballé.',
    'Conforme aux attentes, bon service.',
    'Je recommande ce produit à tous!'
  ])[ceil(random() * 10)],
  now() - (random() * 60 || ' days')::interval
FROM products p
CROSS JOIN customers c
WHERE random() < 0.2 -- 20% de chance de créer un avis
LIMIT 50;

-- 4. Ajouter des événements d'activité pour le suivi
INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, description, metadata, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1), -- Premier utilisateur
  (ARRAY['product_viewed', 'order_created', 'customer_added', 'integration_connected'])[ceil(random() * 4)],
  (ARRAY['product', 'order', 'customer', 'integration'])[ceil(random() * 4)],
  gen_random_uuid()::text,
  (ARRAY[
    'Produit consulté par un client',
    'Nouvelle commande créée',
    'Nouveau client enregistré',
    'Intégration connectée avec succès'
  ])[ceil(random() * 4)],
  jsonb_build_object(
    'ip_address', '192.168.' || (1 + random() * 254)::int || '.' || (1 + random() * 254)::int,
    'user_agent', 'Mozilla/5.0 (compatible; ShopoptiBot/1.0)',
    'timestamp', now() - (random() * 30 || ' days')::interval
  ),
  now() - (random() * 30 || ' days')::interval
FROM generate_series(1, 100);

-- 5. Créer des intégrations de test
INSERT INTO public.integrations (user_id, platform_type, platform_name, platform_url, shop_domain, is_active, connection_status, created_at)
VALUES 
((SELECT id FROM auth.users LIMIT 1), 'shopify', 'Shopify Store', 'https://mystore.myshopify.com', 'mystore.myshopify.com', true, 'connected', now() - interval '5 days'),
((SELECT id FROM auth.users LIMIT 1), 'woocommerce', 'WooCommerce Site', 'https://mystore.com', 'mystore.com', true, 'connected', now() - interval '3 days'),
((SELECT id FROM auth.users LIMIT 1), 'aliexpress', 'AliExpress Dropshipping', 'https://aliexpress.com', null, false, 'disconnected', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- 6. Créer des fournisseurs réalistes
INSERT INTO public.suppliers (user_id, name, website, country, status, rating, created_at)
VALUES 
((SELECT id FROM auth.users LIMIT 1), 'BigBuy Europe', 'https://bigbuy.eu', 'Spain', 'active', 4.5, now() - interval '10 days'),
((SELECT id FROM auth.users LIMIT 1), 'AliExpress Suppliers', 'https://aliexpress.com', 'China', 'active', 4.2, now() - interval '8 days'),
((SELECT id FROM auth.users LIMIT 1), 'Local French Supplier', 'https://fournisseur-france.fr', 'France', 'active', 4.8, now() - interval '5 days'),
((SELECT id FROM auth.users LIMIT 1), 'European Wholesale', 'https://euro-wholesale.com', 'Germany', 'inactive', 3.9, now() - interval '15 days')
ON CONFLICT DO NOTHING;

-- 7. Mettre à jour les métriques des produits importés
UPDATE public.imported_products 
SET 
  status = (ARRAY['draft', 'published', 'out_of_stock'])[ceil(random() * 3)],
  review_status = (ARRAY['pending', 'approved', 'rejected'])[ceil(random() * 3)],
  stock_quantity = (random() * 100)::int,
  ai_score = (70 + random() * 30)::numeric(4,2),
  data_completeness_score = (80 + random() * 20)::numeric(4,2),
  import_quality_score = (75 + random() * 25)::numeric(4,2),
  published_at = CASE WHEN status = 'published' THEN now() - (random() * 30 || ' days')::interval ELSE NULL END,
  reviewed_at = CASE WHEN review_status != 'pending' THEN now() - (random() * 20 || ' days')::interval ELSE NULL END
WHERE id IN (SELECT id FROM imported_products LIMIT 20);