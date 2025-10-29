-- Ajouter des leçons de test pour les cours existants
-- On va ajouter des leçons pour le premier cours (Dropshipping : Démarrer de Zéro)

DO $$
DECLARE
  course_id_var UUID;
BEGIN
  -- Récupérer l'ID du premier cours
  SELECT id INTO course_id_var FROM academy_courses WHERE slug = 'dropshipping-debutant' LIMIT 1;
  
  IF course_id_var IS NOT NULL THEN
    -- Leçon 1: Introduction vidéo
    INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, duration_minutes, order_index, is_preview, content_text)
    VALUES (
      course_id_var,
      'Introduction au Dropshipping',
      'Découvrez ce qu''est le dropshipping et comment ça fonctionne',
      'video',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      15,
      1,
      true,
      '# Introduction au Dropshipping

Le dropshipping est un modèle de commerce électronique où vous vendez des produits sans gérer de stock.

## Comment ça marche ?

1. **Client passe commande** sur votre boutique
2. **Vous transférez** la commande au fournisseur
3. **Fournisseur expédie** directement au client
4. **Vous gardez** la différence de prix

## Avantages

- 💰 Pas d''investissement initial en stock
- 🚀 Démarrage rapide
- 🌍 Travaillez de n''importe où
- 📈 Scalable facilement

## Points d''attention

- Marges plus faibles
- Dépendance aux fournisseurs
- Concurrence importante'
    );

    -- Leçon 2: Choisir sa niche
    INSERT INTO academy_lessons (course_id, title, description, content_type, duration_minutes, order_index, is_preview, content_text)
    VALUES (
      course_id_var,
      'Choisir sa Niche Rentable',
      'Apprenez à sélectionner une niche profitable pour votre boutique',
      'text',
      20,
      2,
      true,
      '# Choisir sa Niche Rentable

Le choix de la niche est **CRUCIAL** pour votre succès en dropshipping.

## Critères d''une bonne niche

### 1. Passion + Profit
- Choisissez un domaine qui vous intéresse
- Vérifiez qu''il y a de la demande
- Assurez-vous de pouvoir générer du profit

### 2. Volume de recherche
- Utilisez Google Trends
- Vérifiez les volumes de recherche mensuels
- Analysez la saisonnalité

### 3. Concurrence modérée
- ❌ Trop de concurrence = difficile de percer
- ❌ Pas de concurrence = pas de marché
- ✅ Concurrence moyenne = opportunité

## Exemples de niches rentables

1. **Animaux de compagnie** 🐕
   - Accessoires pour chiens/chats
   - Produits de toilettage
   - Jouets interactifs

2. **Fitness & Bien-être** 💪
   - Équipement d''entraînement
   - Vêtements de sport
   - Suppléments

3. **Maison & Décoration** 🏠
   - Articles de cuisine innovants
   - Décoration murale
   - Organisation

## Exercice pratique

1. Listez 5 niches qui vous intéressent
2. Recherchez le volume Google Trends
3. Analysez 3 concurrents par niche
4. Sélectionnez votre niche finale'
    );

    -- Leçon 3: Trouver des fournisseurs
    INSERT INTO academy_lessons (course_id, title, description, content_type, video_url, duration_minutes, order_index, content_text)
    VALUES (
      course_id_var,
      'Trouver des Fournisseurs Fiables',
      'Découvrez où trouver les meilleurs fournisseurs dropshipping',
      'video',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      18,
      3,
      '# Trouver des Fournisseurs Fiables

Les fournisseurs sont le cœur de votre business dropshipping.

## Top Plateformes de Fournisseurs

### 1. AliExpress
- ✅ Énorme catalogue
- ✅ Prix compétitifs
- ❌ Délais de livraison longs

### 2. CJ Dropshipping
- ✅ Meilleure qualité
- ✅ Livraison plus rapide
- ✅ Agent personnel

### 3. Spocket
- ✅ Fournisseurs US/EU
- ✅ Livraison rapide
- ❌ Prix plus élevés

## Critères de sélection

1. **Temps de livraison** : < 15 jours idéalement
2. **Taux de satisfaction** : > 95%
3. **Communication** : Réponse rapide
4. **Qualité produits** : Commander des échantillons

## Red Flags 🚩

- Pas de photos produits réelles
- Prix trop bas (qualité douteuse)
- Mauvais avis clients
- Communication difficile'
    );

    -- Leçon 4: Quiz
    INSERT INTO academy_lessons (course_id, title, description, content_type, duration_minutes, order_index, content_text)
    VALUES (
      course_id_var,
      'Quiz : Les Bases du Dropshipping',
      'Testez vos connaissances sur le dropshipping',
      'quiz',
      5,
      4,
      'Quiz interactif pour valider votre compréhension des bases du dropshipping.'
    );

    -- Ajouter un quiz pour la leçon 4
    INSERT INTO academy_quizzes (lesson_id, course_id, title, description, passing_score, questions)
    VALUES (
      (SELECT id FROM academy_lessons WHERE course_id = course_id_var AND order_index = 4 LIMIT 1),
      course_id_var,
      'Quiz : Les Bases du Dropshipping',
      'Testez vos connaissances',
      70,
      '[
        {
          "id": "q1",
          "question": "Qu''est-ce que le dropshipping ?",
          "options": [
            "Un modèle où vous gérez votre propre stock",
            "Un modèle où le fournisseur expédie directement au client",
            "Un type de marketplace",
            "Une plateforme e-commerce"
          ],
          "correct_answer": 1,
          "explanation": "Le dropshipping est un modèle où le fournisseur expédie directement au client final, sans que vous ayez à gérer de stock."
        },
        {
          "id": "q2",
          "question": "Quel est le principal avantage du dropshipping ?",
          "options": [
            "Marges très élevées",
            "Pas d''investissement initial en stock",
            "Livraison instantanée",
            "Aucune concurrence"
          ],
          "correct_answer": 1,
          "explanation": "Le principal avantage est de pouvoir démarrer sans investissement initial en stock."
        },
        {
          "id": "q3",
          "question": "Quel délai de livraison est idéal ?",
          "options": [
            "30+ jours",
            "20-30 jours",
            "Moins de 15 jours",
            "Le délai n''importe pas"
          ],
          "correct_answer": 2,
          "explanation": "Un délai de moins de 15 jours est idéal pour satisfaire vos clients."
        },
        {
          "id": "q4",
          "question": "Quelle plateforme offre les délais les plus rapides ?",
          "options": [
            "AliExpress",
            "Amazon",
            "Spocket (fournisseurs US/EU)",
            "eBay"
          ],
          "correct_answer": 2,
          "explanation": "Spocket travaille avec des fournisseurs US et EU, offrant des délais beaucoup plus rapides."
        },
        {
          "id": "q5",
          "question": "Que faut-il faire avant de choisir un fournisseur ?",
          "options": [
            "Rien, commencer à vendre directement",
            "Commander des échantillons",
            "Copier la concurrence",
            "Attendre les retours clients"
          ],
          "correct_answer": 1,
          "explanation": "Il est crucial de commander des échantillons pour vérifier la qualité avant de vendre."
        }
      ]'::jsonb
    );

    -- Leçon 5: Créer sa boutique
    INSERT INTO academy_lessons (course_id, title, description, content_type, duration_minutes, order_index, content_text)
    VALUES (
      course_id_var,
      'Créer sa Boutique Shopify',
      'Guide complet pour créer votre boutique en ligne',
      'text',
      25,
      5,
      '# Créer sa Boutique Shopify

Shopify est la plateforme #1 pour le dropshipping.

## Étapes de création

### 1. Inscription
- Allez sur shopify.com
- Essai gratuit 14 jours
- Pas de carte bancaire requise

### 2. Choisir un thème
- **Gratuits** : Dawn, Sense, Studio
- **Payants** : Debutify, Booster Theme
- Privilégiez la **vitesse** et le **mobile**

### 3. Configuration essentielle

#### Pages obligatoires
- ✅ Accueil
- ✅ Produits
- ✅ À propos
- ✅ Contact
- ✅ Politique de remboursement
- ✅ CGV
- ✅ Politique de confidentialité

#### Apps indispensables
1. **Oberlo/DSers** : Import produits
2. **Loox** : Avis clients avec photos
3. **Klaviyo** : Email marketing
4. **PageFly** : Builder de pages

### 4. Nom de domaine
- Choisissez un nom **court** et **mémorable**
- Vérifiez disponibilité sur Namecheap
- Connectez-le à Shopify

## Checklist avant lancement

- [ ] Logo professionnel
- [ ] 10-20 produits minimum
- [ ] Descriptions détaillées
- [ ] Images HD
- [ ] Prix compétitifs
- [ ] Méthodes de paiement configurées
- [ ] Politique de livraison claire
- [ ] Email de bienvenue automatique'
    );

  END IF;
END $$;