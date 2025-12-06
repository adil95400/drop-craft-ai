-- Update BTS Wholesaler avec des vraies données
UPDATE suppliers 
SET 
  description = 'Grossiste et dropshipper européen spécialisé en cosmétiques et parfumerie. Plus de 17,000 références de 600 marques.',
  website = 'https://www.btswholesaler.com',
  country = 'ES',
  rating = 4.5,
  product_count = 17000,
  total_products = 17000,
  sector = 'Cosmetics & Beauty',
  tags = ARRAY['Cosmetics', 'Perfumery', 'Beauty', 'Dropshipping'],
  delivery_time_days = 3
WHERE id = '34997271-66ee-492a-ac16-f5bf8eb0c37a';

-- Insérer des produits fournisseur (sans colonnes générées)
INSERT INTO supplier_products (
  supplier_id, user_id, external_sku, name, description, 
  price, currency, stock_quantity, category, brand,
  image_urls, attributes, created_at
) VALUES
(
  '34997271-66ee-492a-ac16-f5bf8eb0c37a',
  '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
  'BTS-DIOR-001',
  'Parfum Dior Sauvage EDT 100ml',
  'Eau de toilette masculine emblématique de Dior.',
  85.00, 'EUR', 250, 'Parfums', 'Dior',
  ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400'],
  '{"volume": "100ml"}'::jsonb, now()
),
(
  '34997271-66ee-492a-ac16-f5bf8eb0c37a',
  '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
  'BTS-LANC-002',
  'Crème Lancôme Génifique 50ml',
  'Soin anti-âge activateur de jeunesse.',
  95.00, 'EUR', 180, 'Soins Visage', 'Lancôme',
  ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'],
  '{"volume": "50ml"}'::jsonb, now()
),
(
  '34997271-66ee-492a-ac16-f5bf8eb0c37a',
  '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
  'BTS-YSL-003',
  'Mascara YSL Volume Effet Faux Cils',
  'Mascara iconique pour des cils spectaculaires.',
  35.00, 'EUR', 320, 'Maquillage', 'YSL',
  ARRAY['https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400'],
  '{"color": "Noir"}'::jsonb, now()
),
(
  '34997271-66ee-492a-ac16-f5bf8eb0c37a',
  '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
  'BTS-CHAN-004',
  'Rouge à Lèvres Chanel Rouge Coco',
  'Rouge à lèvres hydratant intense.',
  45.00, 'EUR', 200, 'Maquillage', 'Chanel',
  ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'],
  '{"finish": "Satiné"}'::jsonb, now()
),
(
  '34997271-66ee-492a-ac16-f5bf8eb0c37a',
  '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
  'BTS-GUER-005',
  'Coffret Guerlain Aqua Allegoria',
  'Collection de 3 eaux de toilette fraîches.',
  120.00, 'EUR', 85, 'Coffrets', 'Guerlain',
  ARRAY['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400'],
  '{"volume": "3x30ml"}'::jsonb, now()
);