-- Complete all lessons for all courses with comprehensive content

-- Clear existing test lessons (except first course which already has 5)
DELETE FROM academy_lessons WHERE course_id != '99027fd5-48bb-4920-a61e-5ff615dc5784';

-- Course 2: Product Research Avancé
INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, content_text, duration_minutes, order_index, is_preview) VALUES
('85e6f969-3b49-49e8-9b0e-e906db27f006', 'Introduction à la recherche de produits', 'Découvrez les fondamentaux du product research', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'La recherche de produits est la clé du succès en dropshipping. Dans cette leçon, vous apprendrez à identifier les produits gagnants.', 15, 1, true),
('85e6f969-3b49-49e8-9b0e-e906db27f006', 'Outils de recherche essentiels', 'Les meilleurs outils pour trouver des produits', 'text', null, 'Découvrez les outils indispensables : Google Trends, AliExpress, Amazon Best Sellers, Facebook Ad Library, et comment les utiliser efficacement.', 20, 2, false),
('85e6f969-3b49-49e8-9b0e-e906db27f006', 'Analyse de la concurrence', 'Comment analyser vos concurrents', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Apprenez à analyser les boutiques concurrentes pour identifier leurs produits gagnants et leurs stratégies.', 25, 3, false),
('85e6f969-3b49-49e8-9b0e-e906db27f006', 'Critères de sélection avancés', 'Les critères pour un produit gagnant', 'text', null, 'Marges de profit (3x minimum), potentiel viral, problème résolu, facteur wow, facilité de livraison, saisonnalité.', 18, 4, false),
('85e6f969-3b49-49e8-9b0e-e906db27f006', 'Quiz : Recherche de produits', 'Testez vos connaissances', 'quiz', null, null, 10, 5, false),
('85e6f969-3b49-49e8-9b0e-e906db27f006', 'Validation de niche', 'Comment valider une niche rentable', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Techniques de validation : recherches Google, tendances, groupes Facebook, Reddit, analyse des volumes de recherche.', 22, 6, false);

-- Course 3: Marketing & Publicités Facebook
INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, content_text, duration_minutes, order_index, is_preview) VALUES
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Bases de Facebook Ads', 'Introduction aux publicités Facebook', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Comprendre le Business Manager, les campagnes, ensembles de publicités et annonces.', 20, 1, true),
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Ciblage et audiences', 'Créer des audiences performantes', 'text', null, 'Audiences personnalisées, lookalikes, centres d intérêt, comportements, données démographiques. Stratégies de ciblage éprouvées.', 25, 2, false),
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Créer des annonces qui convertissent', 'Design et copywriting efficaces', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Structure des annonces gagnantes : hooks, images/vidéos, textes persuasifs, CTA puissants.', 30, 3, false),
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Budgets et enchères', 'Optimiser vos dépenses publicitaires', 'text', null, 'Stratégies de budget : CBO vs ABO, budgets de test, scaling, enchères automatiques vs manuelles.', 18, 4, false),
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Analyse et optimisation', 'Lire et améliorer vos résultats', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Métriques clés : CTR, CPC, CPM, ROAS, CPA. Comment optimiser vos campagnes en temps réel.', 28, 5, false),
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Quiz : Facebook Ads', 'Évaluez vos compétences', 'quiz', null, null, 12, 6, false),
('f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Retargeting et remarketing', 'Récupérer les visiteurs perdus', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'Stratégies de retargeting avancées : pixels, événements, séquences de remarketing.', 24, 7, false);

-- Course 4: Automatisation avec DropCraft AI
INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, content_text, duration_minutes, order_index, is_preview) VALUES
('b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Introduction à l automatisation', 'Pourquoi automatiser votre business', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Les avantages de l automatisation : gain de temps, réduction d erreurs, scalabilité.', 15, 1, true),
('b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Configuration de DropCraft AI', 'Setup complet de la plateforme', 'text', null, 'Guide étape par étape : connexion Shopify, import produits, configuration des règles d automatisation.', 22, 2, false),
('b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Gestion automatique des commandes', 'Automatiser le processus de commande', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Synchronisation automatique, tracking, notifications clients, gestion des retours.', 25, 3, false),
('b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Intelligence artificielle pour la tarification', 'Optimisation des prix par IA', 'text', null, 'Algorithmes de pricing dynamique, ajustement automatique selon la concurrence et la demande.', 20, 4, false),
('b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Automatisation marketing', 'Emails et notifications automatiques', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Séquences d emails, abandon de panier, upsells automatiques, segmentation clients.', 28, 5, false),
('b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Quiz : Automatisation', 'Testez vos connaissances', 'quiz', null, null, 10, 6, false);

-- Course 5: Scaling : De 0 à 10k$/mois
INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, content_text, duration_minutes, order_index, is_preview) VALUES
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Mindset du scaling', 'La mentalité pour scaler', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Passer d un side-hustle à un vrai business : organisation, systèmes, délégation.', 18, 1, true),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Optimiser les conversions', 'Maximiser votre taux de conversion', 'text', null, 'A/B testing, optimisation de la boutique, checkout, urgence et rareté, preuve sociale.', 25, 2, false),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Stratégies de scaling publicitaire', 'Augmenter vos budgets intelligemment', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Scaling vertical vs horizontal, duplication de campagnes, CBO scaling, testing continu.', 30, 3, false),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Diversification des canaux', 'Ne pas dépendre d une seule source', 'text', null, 'Google Ads, TikTok Ads, Instagram, influenceurs, email marketing, SEO, affiliés.', 22, 4, false),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Gestion de la croissance', 'Infrastructures pour supporter le scaling', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Service client, logistique, fournisseurs multiples, gestion des stocks, équipe.', 28, 5, false),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Finances et rentabilité', 'Gérer la trésorerie et les marges', 'text', null, 'Comptabilité, cash flow, marges optimales, réinvestissement stratégique, fiscalité.', 20, 6, false),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Quiz : Scaling avancé', 'Évaluation finale', 'quiz', null, null, 15, 7, false),
('e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Plan d action 10k/mois', 'Roadmap complète pour atteindre 10k', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'Plan étape par étape : timeline, milestones, KPIs, actions concrètes semaine par semaine.', 35, 8, false);

-- Course 6: Customer Service Excellence
INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, content_text, duration_minutes, order_index, is_preview) VALUES
('c451f690-6742-44dd-bccc-4a9b2e59a6b6', 'L importance du service client', 'Pourquoi c est votre avantage compétitif', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Impact sur les avis, taux de rétention, bouche-à-oreille, lifetime value client.', 15, 1, true),
('c451f690-6742-44dd-bccc-4a9b2e59a6b6', 'Configurer son support client', 'Outils et processus essentiels', 'text', null, 'Zendesk, Gorgias, chatbots, FAQ, temps de réponse, SLA, templates de réponses.', 20, 2, false),
('c451f690-6742-44dd-bccc-4a9b2e59a6b6', 'Gérer les réclamations', 'Transformer les clients insatisfaits', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Communication empathique, résolution de problèmes, compensation intelligente, prévention.', 25, 3, false),
('c451f690-6742-44dd-bccc-4a9b2e59a6b6', 'Automation du support', 'Automatiser sans perdre l humain', 'text', null, 'Chatbots IA, réponses automatiques, classification des tickets, escalade automatique.', 18, 4, false),
('c451f690-6742-44dd-bccc-4a9b2e59a6b6', 'Quiz : Service client', 'Testez vos compétences', 'quiz', null, null, 10, 5, false);

-- Add quizzes for new lessons
INSERT INTO academy_quizzes (lesson_id, course_id, title, description, passing_score, questions) VALUES
-- Product Research Quiz
((SELECT id FROM academy_lessons WHERE title = 'Quiz : Recherche de produits'), '85e6f969-3b49-49e8-9b0e-e906db27f006', 'Quiz : Recherche de produits', 'Testez vos connaissances en product research', 70,
'[
  {"id": "1", "question": "Quelle marge minimale est recommandée ?", "options": ["2x", "3x", "4x", "5x"], "correct_answer": 1, "explanation": "Une marge de 3x minimum permet de couvrir les coûts publicitaires"},
  {"id": "2", "question": "Quel outil analyser la concurrence ?", "options": ["Google Analytics", "Facebook Ad Library", "Instagram", "TikTok"], "correct_answer": 1, "explanation": "Facebook Ad Library permet de voir les publicités des concurrents"}
]'::jsonb),

-- Facebook Ads Quiz
((SELECT id FROM academy_lessons WHERE title = 'Quiz : Facebook Ads'), 'f084fbb7-9f4d-4d34-a20e-f3799e491bdd', 'Quiz : Facebook Ads', 'Évaluez vos compétences publicitaires', 70,
'[
  {"id": "1", "question": "Que signifie ROAS ?", "options": ["Return On Ad Spend", "Rate Of Ad Sales", "Revenue On Ad System", "Return Of All Sales"], "correct_answer": 0, "explanation": "ROAS = Return On Ad Spend, le retour sur investissement publicitaire"},
  {"id": "2", "question": "Quelle stratégie pour scaler ?", "options": ["Augmenter budget de 500%", "Augmenter progressivement 20%", "Dupliquer campagne 10x", "Changer ciblage"], "correct_answer": 1, "explanation": "L augmentation progressive évite de casser l algorithme"}
]'::jsonb),

-- Automatisation Quiz
((SELECT id FROM academy_lessons WHERE title = 'Quiz : Automatisation'), 'b464e577-3b3b-4bc3-a1c8-fb076704172a', 'Quiz : Automatisation', 'Testez votre compréhension de l automatisation', 70,
'[
  {"id": "1", "question": "Principal avantage de l automatisation ?", "options": ["Coûts réduits", "Gain de temps", "Plus de ventes", "Meilleur design"], "correct_answer": 1, "explanation": "Le gain de temps permet de se concentrer sur la croissance"},
  {"id": "2", "question": "Que automatiser en premier ?", "options": ["Marketing", "Commandes", "Service client", "Comptabilité"], "correct_answer": 1, "explanation": "L automatisation des commandes a le plus grand impact immédiat"}
]'::jsonb),

-- Scaling Quiz
((SELECT id FROM academy_lessons WHERE title = 'Quiz : Scaling avancé'), 'e63a9f52-6b2f-412d-8aee-0aad8c3adf32', 'Quiz : Scaling avancé', 'Évaluation finale du scaling', 70,
'[
  {"id": "1", "question": "Différence scaling vertical vs horizontal ?", "options": ["Budget vs Campagnes", "Produits vs Pays", "Desktop vs Mobile", "Facebook vs Google"], "correct_answer": 0, "explanation": "Vertical = augmenter budget, Horizontal = multiplier campagnes"},
  {"id": "2", "question": "Taux de conversion minimum pour scaler ?", "options": ["0.5%", "1%", "2%", "5%"], "correct_answer": 2, "explanation": "Un taux de 2% minimum assure la rentabilité au scaling"}
]'::jsonb),

-- Service Client Quiz
((SELECT id FROM academy_lessons WHERE title = 'Quiz : Service client'), 'c451f690-6742-44dd-bccc-4a9b2e59a6b6', 'Quiz : Service client', 'Testez vos compétences en support', 70,
'[
  {"id": "1", "question": "Temps de réponse idéal ?", "options": ["24h", "12h", "4h", "1h"], "correct_answer": 3, "explanation": "Répondre en moins d 1h augmente significativement la satisfaction"},
  {"id": "2", "question": "Comment gérer un client mécontent ?", "options": ["Ignorer", "Rembourser toujours", "Écouter et proposer solution", "Argumenter"], "correct_answer": 2, "explanation": "L empathie et une solution appropriée transforment l expérience"}
]'::jsonb);

-- Update course stats
UPDATE academy_courses SET 
  total_lessons = (SELECT COUNT(*) FROM academy_lessons WHERE course_id = academy_courses.id),
  duration_minutes = (SELECT COALESCE(SUM(duration_minutes), 0) FROM academy_lessons WHERE course_id = academy_courses.id);
