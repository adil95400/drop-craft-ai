-- Seed real CRM contacts data (corrected SQL)
INSERT INTO crm_contacts (name, email, phone, company, position, tags, status, lifecycle_stage, source, lead_score, attribution, custom_fields) VALUES
  ('Sophie Martin', 'sophie.martin@example.com', '+33 1 23 45 67 89', 'TechCorp', 'Marketing Manager', '["tech", "b2b"]', 'active', 'marketing_qualified_lead', 'website', 75, '{"first_touch": "google_ads", "utm_source": "google"}', '{"industry": "technology", "employees": "50-200"}'),
  ('Pierre Dubois', 'pierre.dubois@startup.fr', '+33 6 98 76 54 32', 'InnovateNow', 'CEO', '["startup", "innovation"]', 'active', 'sales_qualified_lead', 'referral', 92, '{"first_touch": "referral", "referrer": "existing_customer"}', '{"industry": "fintech", "employees": "10-50"}'),
  ('Marie Leroy', 'marie.leroy@commerce.com', '+33 4 11 22 33 44', 'E-Commerce Plus', 'CTO', '["ecommerce", "tech"]', 'lead', 'lead', 'linkedin', 45, '{"first_touch": "linkedin", "campaign": "tech_leaders"}', '{"industry": "ecommerce", "employees": "200+"}'),
  ('Jean Moreau', 'jean.moreau@retail.fr', '+33 2 55 66 77 88', 'Retail Solutions', 'Director', '["retail", "b2b"]', 'active', 'opportunity', 'event', 88, '{"first_touch": "tradeshow", "event": "retail_expo_2024"}', '{"industry": "retail", "employees": "500+"}'),
  ('Camille Petit', 'camille.petit@agency.com', '+33 5 44 33 22 11', 'Digital Agency Pro', 'Account Manager', '["agency", "marketing"]', 'customer', 'customer', 'website', 95, '{"first_touch": "organic", "converted_at": "2024-01-15"}', '{"industry": "marketing", "employees": "20-50"}');

-- Seed real marketing campaigns data
INSERT INTO marketing_campaigns (name, type, status, content, settings, metrics, budget_total, scheduled_at) VALUES
  ('Welcome Email Series', 'email', 'running', '{"subject": "Bienvenue chez SupplierHub!", "template": "welcome_series"}', '{"frequency": "weekly", "segment": "new_users"}', '{"sent": 1250, "delivered": 1200, "opened": 300, "clicked": 45, "converted": 12}', 500.00, NOW() - INTERVAL '7 days'),
  ('Product Launch Campaign', 'email', 'completed', '{"subject": "Decouvrez nos nouvelles fonctionnalites", "template": "product_launch"}', '{"target": "active_users", "ab_test": true}', '{"sent": 2500, "delivered": 2400, "opened": 720, "clicked": 156, "converted": 38}', 1200.00, NOW() - INTERVAL '14 days'),
  ('Abandoned Cart Recovery', 'email', 'running', '{"subject": "Vous avez oublie quelque chose...", "template": "cart_recovery"}', '{"trigger": "cart_abandoned_24h", "discount": "10%"}', '{"sent": 450, "delivered": 430, "opened": 180, "clicked": 65, "converted": 22}', 200.00, NOW() - INTERVAL '3 days'),
  ('LinkedIn Lead Generation', 'social', 'running', '{"message": "Optimisez votre sourcing produit avec SupplierHub", "cta": "Decouvrir"}', '{"platform": "linkedin", "targeting": "b2b_managers"}', '{"sent": 800, "delivered": 750, "opened": 225, "clicked": 89, "converted": 15}', 800.00, NOW() - INTERVAL '5 days'),
  ('Retargeting Campaign', 'display', 'scheduled', '{"banner": "retargeting_banner_v2", "landing_page": "features"}', '{"platforms": ["google", "facebook"], "frequency_cap": 3}', '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "converted": 0}', 1500.00, NOW() + INTERVAL '2 days');

-- Seed real marketing segments data  
INSERT INTO marketing_segments (name, description, criteria, contact_count) VALUES
  ('High Value Leads', 'Contacts avec un score de lead eleve et actifs recemment', '{"min_lead_score": 70, "last_activity_after": "2024-01-01", "status": "active"}', 147),
  ('E-commerce Prospects', 'Contacts du secteur e-commerce en phase de prospection', '{"tags": ["ecommerce"], "lifecycle_stage": "lead", "source": "website"}', 89),
  ('Enterprise Customers', 'Grandes entreprises deja clientes ou en negociation', '{"custom_fields.employees": "200+", "lifecycle_stage": ["opportunity", "customer"]}', 56),
  ('Tech Startups', 'Startups technologiques en croissance', '{"tags": ["startup", "tech"], "custom_fields.employees": "10-50"}', 134),
  ('Recently Inactive', 'Contacts actifs sans interaction recente', '{"status": "active", "last_activity_before": "2024-01-01"}', 203);

-- Add real supplier data
INSERT INTO suppliers (name, website, country, status, rating, user_id) VALUES
  ('Cdiscount Pro', 'https://pro.cdiscount.com', 'France', 'active', 4.5, (SELECT auth.uid())),
  ('Eprolo Dropshipping', 'https://eprolo.com', 'China', 'active', 4.2, (SELECT auth.uid())),
  ('VidaXL Wholesale', 'https://vidaxl.com', 'Netherlands', 'active', 4.7, (SELECT auth.uid())),
  ('Syncee Marketplace', 'https://syncee.com', 'Hungary', 'active', 4.3, (SELECT auth.uid())),
  ('Printful POD', 'https://printful.com', 'Latvia', 'active', 4.8, (SELECT auth.uid()));

-- Add sample imported products from suppliers
INSERT INTO imported_products (name, sku, description, price, cost_price, currency, stock_quantity, category, brand, image_urls, supplier_name, status, user_id) VALUES
  ('Casque Bluetooth Premium', 'CDIS-001', 'Casque audio sans fil haute qualite', 79.99, 35.50, 'EUR', 150, 'Electronique', 'AudioTech', '["https://picsum.photos/400/400?random=1001"]', 'Cdiscount Pro', 'published', (SELECT auth.uid())),
  ('Smartphone Stand Adjustable', 'EPR-002', 'Support telephone reglable et pliable', 24.99, 8.75, 'EUR', 500, 'Accessoires', 'EproTech', '["https://picsum.photos/400/400?random=1002"]', 'Eprolo Dropshipping', 'published', (SELECT auth.uid())),
  ('Table de Jardin Teck', 'VXL-003', 'Table exterieure en bois de teck massif', 299.99, 145.00, 'EUR', 25, 'Mobilier', 'VidaXL', '["https://picsum.photos/400/400?random=1003"]', 'VidaXL Wholesale', 'draft', (SELECT auth.uid())),
  ('Custom T-Shirt Design', 'PRT-004', 'T-shirt personnalise impression numerique', 19.99, 7.50, 'EUR', 999, 'Vetements', 'Printful', '["https://picsum.photos/400/400?random=1004"]', 'Printful POD', 'published', (SELECT auth.uid())),
  ('LED Desk Lamp Smart', 'SYN-005', 'Lampe de bureau connectee avec USB', 45.99, 22.30, 'EUR', 80, 'Eclairage', 'SmartHome', '["https://picsum.photos/400/400?random=1005"]', 'Syncee Marketplace', 'published', (SELECT auth.uid()));