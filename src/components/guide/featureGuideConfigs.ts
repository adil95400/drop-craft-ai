/**
 * Configurations avancées de guides pour chaque fonctionnalité
 * Avec vidéos, captures d'écran, FAQ et guides détaillés
 */
import type { AdvancedGuideProps } from './AdvancedFeatureGuide'

type GuideConfig = Omit<AdvancedGuideProps, 'className' | 'defaultOpen'>

export const ADVANCED_GUIDES: Record<string, GuideConfig> = {
  sourcing: {
    featureName: 'Sourcing Produits',
    description: 'Trouvez et importez les meilleurs produits depuis 6+ plateformes fournisseurs',
    level: 'beginner',
    keyFeatures: ['Multi-plateformes', 'Calcul de marge auto', 'Import en 1 clic', 'Score produit IA'],
    steps: [
      {
        title: 'Rechercher un produit',
        description: 'Utilisez la barre de recherche pour trouver des produits par mot-clé',
        detailedInstructions: [
          'Saisissez un mot-clé dans la barre de recherche en haut',
          'Utilisez des termes spécifiques pour de meilleurs résultats (ex: "montre connectée sport" plutôt que "montre")',
          'Combinez avec les filtres de plateforme pour cibler un fournisseur spécifique'
        ]
      },
      {
        title: 'Analyser les marges',
        description: 'Comparez prix coût, prix de vente conseillé et marge nette estimée',
        detailedInstructions: [
          'Chaque fiche produit affiche le prix fournisseur et le prix de vente suggéré',
          'La marge est calculée automatiquement en pourcentage',
          'Visez une marge minimum de 30% pour couvrir les frais marketing'
        ]
      },
      {
        title: 'Importer le produit',
        description: 'Cliquez sur "Importer" pour ajouter le produit à votre catalogue en brouillon',
        detailedInstructions: [
          'Cliquez sur le bouton bleu "Importer" sur la fiche produit',
          'Le produit est ajouté automatiquement dans votre section "À traiter"',
          'Vous pourrez ensuite éditer titre, description et prix avant publication'
        ]
      },
      {
        title: 'Sauvegarder en favoris',
        description: 'Marquez les produits intéressants pour les retrouver facilement',
        detailedInstructions: [
          'Cliquez sur l\'icône cœur pour ajouter un produit à vos favoris',
          'Retrouvez tous vos favoris dans l\'onglet "Favoris"',
          'Comparez vos favoris avant de décider lesquels importer'
        ]
      }
    ],
    tips: [
      { text: 'Les produits avec un taux de marge > 40% sont idéaux pour le dropshipping — ils absorbent les coûts marketing', type: 'pro' },
      { text: 'Vérifiez les délais de livraison du fournisseur avant d\'importer — les clients attendent 7-14 jours max', type: 'warning' },
      { text: 'Utilisez l\'onglet "Best-sellers" pour découvrir les produits les plus demandés par catégorie', type: 'info' }
    ],
    videos: [
      { title: 'Démarrage rapide : votre premier produit', description: 'Apprenez à trouver et importer un produit gagnant en 3 minutes', youtubeId: 'dQw4w9WgXcQ', duration: '3:24' },
      { title: 'Stratégie de sélection produit', description: 'Les critères essentiels pour choisir un produit rentable', youtubeId: 'dQw4w9WgXcQ', duration: '8:12' }
    ],
    faqs: [
      { question: 'Combien de produits puis-je importer ?', answer: 'Le nombre dépend de votre plan. Le plan Standard permet jusqu\'à 200 produits, le Pro 500 et l\'Ultra Pro 1000+.' },
      { question: 'Les stocks sont-ils synchronisés automatiquement ?', answer: 'Oui, la synchronisation est automatique pour les fournisseurs connectés. Vous pouvez aussi configurer des alertes stock bas dans les paramètres.' },
      { question: 'Puis-je modifier les prix après import ?', answer: 'Absolument. Après import, le produit est en brouillon et vous pouvez modifier tous les champs avant publication.' }
    ],
    academyPath: '/academy'
  },

  catalog: {
    featureName: 'Gestion du Catalogue',
    description: 'Gérez vos produits importés, optimisez-les avec l\'IA et publiez-les sur vos canaux',
    level: 'intermediate',
    keyFeatures: ['Priorisation IA', 'Score de santé', 'Édition en masse', 'Multi-canal'],
    steps: [
      {
        title: 'Consulter le backlog',
        description: 'L\'IA priorise automatiquement les actions à effectuer sur vos produits',
        detailedInstructions: [
          'Le panneau IA affiche les produits nécessitant une action triés par impact estimé',
          'Les actions critiques (stock vide, prix manquant) sont affichées en premier',
          'Chaque action montre l\'impact estimé sur vos ventes en euros'
        ]
      },
      {
        title: 'Optimiser les fiches produit',
        description: 'Complétez titres, descriptions, images et attributs pour un score > 80%',
        detailedInstructions: [
          'Ouvrez un produit pour voir son score de santé détaillé',
          'Le score se décompose en 6 critères : nom, description, images, SKU, catégorie, prix',
          'Utilisez les actions IA rapides pour optimiser automatiquement les textes'
        ]
      },
      {
        title: 'Traiter les brouillons',
        description: 'Gérez les produits récemment importés dans l\'onglet Brouillons',
        detailedInstructions: [
          'L\'onglet "Brouillons" affiche tous les produits non encore publiés',
          'Vous pouvez éditer, optimiser et publier en lot',
          'Les brouillons expirent après 30 jours sans action'
        ]
      },
      {
        title: 'Publier sur vos canaux',
        description: 'Envoyez les produits validés vers Shopify, WooCommerce ou d\'autres plateformes'
      }
    ],
    tips: [
      { text: 'Un score de santé > 80% augmente les conversions de 25% en moyenne', type: 'pro' },
      { text: 'Traitez les actions "Critiques" en priorité pour éviter les ventes perdues', type: 'warning' },
      { text: 'L\'IA peut réécrire toutes vos descriptions produit en lot — utilisez le mode batch', type: 'info' }
    ],
    videos: [
      { title: 'Maîtriser le backlog intelligent', description: 'Comment l\'IA priorise vos actions produit', youtubeId: 'dQw4w9WgXcQ', duration: '5:30' },
      { title: 'Édition en masse avec l\'IA', description: 'Optimisez des dizaines de fiches en quelques clics', youtubeId: 'dQw4w9WgXcQ', duration: '6:45' }
    ],
    faqs: [
      { question: 'Comment est calculé le score de santé ?', answer: 'Le score agrège 6 critères pondérés : nom (≥10 car.), description (≥50 car.), images, SKU, catégorie et prix > 0.' },
      { question: 'Puis-je annuler une publication ?', answer: 'Oui, depuis la fiche produit vous pouvez dépublier un produit pour le repasser en brouillon.' }
    ],
    academyPath: '/academy'
  },

  crm: {
    featureName: 'CRM & Pipeline',
    description: 'Gérez vos contacts, suivez votre pipeline de ventes et segmentez vos audiences',
    level: 'intermediate',
    keyFeatures: ['Pipeline Kanban', 'Lead Scoring IA', 'Segmentation', 'Suivi d\'activité'],
    steps: [
      {
        title: 'Vue Pipeline Kanban',
        description: 'Visualisez vos deals à travers les étapes du tunnel de conversion',
        detailedInstructions: [
          'Le pipeline Kanban affiche vos prospects par étape : Nouveau → Contacté → Qualifié → Proposition → Négociation → Gagné',
          'Glissez-déposez les cartes entre colonnes pour changer le statut',
          'Cliquez sur une carte pour voir le détail et l\'historique du contact'
        ]
      },
      {
        title: 'Gérer vos leads',
        description: 'Importez, créez et suivez vos contacts prospects',
        detailedInstructions: [
          'L\'onglet Leads affiche tous vos contacts avec filtres et recherche',
          'Importez des contacts via CSV ou ajoutez-les manuellement',
          'Assignez des tags et scores pour prioriser vos actions'
        ]
      },
      {
        title: 'Lead Scoring IA',
        description: 'L\'IA évalue automatiquement le potentiel de chaque lead',
        detailedInstructions: [
          'Chaque lead reçoit un score de 0 à 100 basé sur son comportement',
          'Les critères incluent : ouvertures d\'emails, visites site, montant panier, récurrence',
          'Les leads avec un score > 70 ont 3x plus de chances de convertir'
        ]
      },
      {
        title: 'Analyser les performances',
        description: 'Suivez vos taux de conversion et revenu par étape du pipeline'
      }
    ],
    tips: [
      { text: 'Le Lead Scoring permet de concentrer vos efforts sur les 20% de leads qui génèrent 80% du CA', type: 'pro' },
      { text: 'Relancez les leads inactifs > 7 jours — au-delà de 14 jours, les chances de conversion chutent de 60%', type: 'warning' },
      { text: 'Utilisez les segments pour envoyer des offres personnalisées à chaque groupe de clients', type: 'info' }
    ],
    videos: [
      { title: 'Pipeline de ventes efficace', description: 'Configurez votre pipeline Kanban pour maximiser les conversions', youtubeId: 'dQw4w9WgXcQ', duration: '7:20' }
    ],
    faqs: [
      { question: 'Puis-je connecter mon CRM existant ?', answer: 'Oui, vous pouvez importer vos contacts via CSV. L\'intégration API avec les CRM tiers (HubSpot, Salesforce) sera disponible prochainement.' },
      { question: 'Le scoring est-il automatique ?', answer: 'Oui, le score est recalculé automatiquement après chaque interaction du lead (email ouvert, page visitée, etc.).' }
    ],
    academyPath: '/academy'
  },

  seo: {
    featureName: 'SEO Manager',
    description: 'Optimisez votre référencement avec audit technique, suivi de mots-clés et génération IA',
    level: 'advanced',
    keyFeatures: ['Audit SEO complet', 'Rank Tracking', 'Content IA', 'Analyse technique'],
    steps: [
      {
        title: 'Lancer un audit SEO',
        description: 'Analysez n\'importe quelle URL pour obtenir un score détaillé et des recommandations',
        detailedInstructions: [
          'Cliquez sur "Analyser URL" en haut à droite',
          'Saisissez l\'URL complète de la page à analyser (avec https://)',
          'L\'audit évalue : méta-tags, titres, images, performance, mobile, structured data',
          'Le score global de 0 à 100 synthétise tous les critères'
        ]
      },
      {
        title: 'Suivre vos mots-clés',
        description: 'Ajoutez des mots-clés stratégiques et suivez vos positions Google',
        detailedInstructions: [
          'Cliquez sur "Ajouter mot-clé" pour commencer le tracking',
          'Renseignez le mot-clé, l\'URL cible et le volume de recherche estimé',
          'Les positions sont mises à jour quotidiennement',
          'Activez/désactivez le suivi pour chaque mot-clé individuellement'
        ]
      },
      {
        title: 'Générer du contenu SEO',
        description: 'Utilisez l\'IA pour créer des titres et méta-descriptions optimisés',
        detailedInstructions: [
          'L\'onglet "Générateur" propose des outils de création de contenu IA',
          'Générez des méta-descriptions, titres de pages et textes alternatifs d\'images',
          'Le contenu respecte les bonnes pratiques : longueur, mots-clés, appels à l\'action'
        ]
      },
      {
        title: 'Résoudre les problèmes techniques',
        description: 'Consultez l\'onglet Technique pour les vérifications essentielles'
      }
    ],
    tips: [
      { text: 'Visez un score SEO > 85 sur toutes vos pages produit — c\'est le seuil de compétitivité', type: 'pro' },
      { text: 'Les 3 premiers résultats Google captent 75% des clics — chaque position gagnée compte', type: 'info' },
      { text: 'N\'oubliez pas le sitemap XML : mettez-le à jour après chaque ajout de produit', type: 'warning' }
    ],
    videos: [
      { title: 'SEO pour e-commerce : les bases', description: 'Les fondamentaux du référencement pour votre boutique', youtubeId: 'dQw4w9WgXcQ', duration: '10:30' },
      { title: 'Optimisation des fiches produit', description: 'Comment rédiger des titres et descriptions qui rankent', youtubeId: 'dQw4w9WgXcQ', duration: '7:15' }
    ],
    faqs: [
      { question: 'L\'audit SEO consomme-t-il des crédits ?', answer: 'Les audits basiques sont illimités. Les audits IA avancés avec suggestions de réécriture consomment des crédits IA.' },
      { question: 'À quelle fréquence vérifier les positions ?', answer: 'Les positions sont suivies quotidiennement. Nous recommandons un check hebdomadaire pour détecter les tendances.' }
    ],
    academyPath: '/academy'
  },

  ads: {
    featureName: 'AI Ads Manager',
    description: 'Gérez et optimisez vos campagnes publicitaires avec l\'intelligence artificielle',
    level: 'intermediate',
    keyFeatures: ['Création IA', 'A/B Testing', 'Multi-plateformes', 'ROAS en temps réel'],
    steps: [
      {
        title: 'Créer une campagne',
        description: 'Cliquez sur "Nouvelle Campagne" pour lancer votre première publicité',
        detailedInstructions: [
          'Choisissez la plateforme : Facebook, Google Ads, TikTok ou Instagram',
          'Définissez l\'objectif : trafic, conversions, notoriété',
          'L\'IA suggère un budget optimal basé sur votre niche et votre audience cible',
          'Configurez le ciblage démographique et les centres d\'intérêt'
        ]
      },
      {
        title: 'Générer des créatifs IA',
        description: 'Le studio créatif IA génère images, textes et vidéos pour vos ads',
        detailedInstructions: [
          'Accédez à l\'onglet "Créatifs IA" pour le studio de génération',
          'Choisissez le type : image, texte publicitaire ou clip vidéo',
          'L\'IA analyse vos produits pour proposer des visuels adaptés',
          'Testez plusieurs variantes avec l\'A/B testing intégré'
        ]
      },
      {
        title: 'Configurer l\'A/B Testing',
        description: 'Testez automatiquement plusieurs versions pour optimiser les résultats'
      },
      {
        title: 'Analyser les performances',
        description: 'Suivez ROAS, CTR, CPC et conversions dans le dashboard dédié'
      }
    ],
    tips: [
      { text: 'L\'IA optimise automatiquement le budget entre les créatifs les plus performants', type: 'pro' },
      { text: 'Commencez avec un petit budget (5-10€/jour) pour tester avant d\'augmenter', type: 'info' },
      { text: 'Un ROAS < 2x signifie que vous perdez de l\'argent — pausez et optimisez', type: 'warning' }
    ],
    videos: [
      { title: 'Lancer votre première campagne', description: 'De zéro à votre première vente via Facebook Ads', youtubeId: 'dQw4w9WgXcQ', duration: '12:00' }
    ],
    faqs: [
      { question: 'Quelles plateformes publicitaires sont supportées ?', answer: 'Facebook/Instagram Ads, Google Ads et TikTok Ads. D\'autres plateformes sont en cours d\'intégration.' },
      { question: 'L\'IA optimise-t-elle automatiquement ?', answer: 'Oui, lorsque l\'optimisation IA est activée, le système ajuste les enchères et redistribue le budget en temps réel.' }
    ],
    academyPath: '/academy'
  },

  analytics: {
    featureName: 'Analytics Avancés',
    description: 'Rapports personnalisés, KPIs en temps réel et gestion d\'équipe',
    level: 'advanced',
    keyFeatures: ['Rapports custom', 'KPIs temps réel', 'Export PDF/CSV', 'Collaboration'],
    steps: [
      {
        title: 'Créer un rapport personnalisé',
        description: 'Construisez des rapports sur mesure avec les métriques qui comptent',
        detailedInstructions: [
          'Cliquez sur "Générer un rapport" pour accéder au builder',
          'Sélectionnez les métriques : CA, commandes, marge, trafic, conversions...',
          'Choisissez la période et la granularité (jour, semaine, mois)',
          'Ajoutez des filtres : par produit, canal, pays, campagne',
          'Sauvegardez le template pour le réutiliser'
        ]
      },
      {
        title: 'Configurer les KPIs',
        description: 'Définissez vos indicateurs clés et suivez-les en temps réel',
        detailedInstructions: [
          'L\'onglet KPIs affiche vos métriques les plus importantes en temps réel',
          'Configurez des seuils d\'alerte pour être notifié en cas d\'anomalie',
          'Comparez vos KPIs avec les périodes précédentes'
        ]
      },
      {
        title: 'Gérer votre équipe',
        description: 'Invitez des collaborateurs et assignez des rôles'
      },
      {
        title: 'Exporter les données',
        description: 'Exportez en PDF ou CSV pour vos rapports clients ou investisseurs'
      }
    ],
    tips: [
      { text: 'Planifiez l\'envoi automatique de rapports hebdomadaires par email à votre équipe', type: 'pro' },
      { text: 'Comparez toujours vos KPIs avec la période N-1 pour détecter les tendances', type: 'info' }
    ],
    videos: [
      { title: 'Dashboard Analytics : vue d\'ensemble', description: 'Naviguez dans vos données comme un pro', youtubeId: 'dQw4w9WgXcQ', duration: '6:40' }
    ],
    faqs: [
      { question: 'Puis-je partager mes rapports ?', answer: 'Oui, les rapports peuvent être exportés en PDF ou partagés avec les membres de votre équipe via un lien sécurisé.' }
    ],
    academyPath: '/academy'
  },

  automation: {
    featureName: 'Automatisation',
    description: 'Créez des workflows automatisés pour gagner du temps sur les tâches répétitives',
    level: 'intermediate',
    keyFeatures: ['Workflows visuels', 'Templates prêts', 'Sandbox de test', 'Logs détaillés'],
    steps: [
      {
        title: 'Choisir un template',
        description: 'Partez d\'un workflow pré-configuré ou créez le vôtre de zéro',
        detailedInstructions: [
          'L\'onglet "Templates" propose des workflows prêts à l\'emploi',
          'Les plus populaires : panier abandonné, restock alert, relance client, welcome email',
          'Cliquez sur un template pour le personnaliser à vos besoins'
        ]
      },
      {
        title: 'Configurer le déclencheur',
        description: 'Choisissez l\'événement qui lance le workflow : commande, stock, timer...',
        detailedInstructions: [
          'Types de déclencheurs : planifié (cron), événementiel (commande reçue), webhook externe',
          'Configurez les conditions : ex. "seulement si montant > 50€"',
          'Définissez la fréquence : à chaque occurrence, maximum 1x/jour, etc.'
        ]
      },
      {
        title: 'Tester dans le Sandbox',
        description: 'Exécutez le workflow en mode test avant de l\'activer en production'
      },
      {
        title: 'Activer et surveiller',
        description: 'Activez le workflow et consultez les logs d\'exécution en temps réel'
      }
    ],
    tips: [
      { text: 'Les emails de panier abandonné récupèrent en moyenne 15% des ventes perdues', type: 'pro' },
      { text: 'Testez TOUJOURS dans le Sandbox avant d\'activer un workflow en production', type: 'warning' },
      { text: 'Commencez par les 3 workflows essentiels : bienvenue, abandon panier, post-achat', type: 'info' }
    ],
    videos: [
      { title: 'Créer votre premier workflow', description: 'De la création au déploiement en 5 minutes', youtubeId: 'dQw4w9WgXcQ', duration: '5:15' }
    ],
    faqs: [
      { question: 'Les workflows fonctionnent-ils 24/7 ?', answer: 'Oui, une fois activés, les workflows s\'exécutent automatiquement en arrière-plan, même quand vous n\'êtes pas connecté.' },
      { question: 'Que se passe-t-il si un workflow échoue ?', answer: 'Le système tente 3 retries automatiques. En cas d\'échec persistant, vous recevez une notification et les logs détaillent l\'erreur.' }
    ],
    academyPath: '/academy'
  },

  fulfillment: {
    featureName: 'Règles de Fulfillment',
    description: 'Automatisez l\'attribution des fournisseurs et le traitement des commandes',
    level: 'intermediate',
    keyFeatures: ['Règles conditionnelles', 'Priorité fournisseurs', 'Auto-routing', 'Suivi temps réel'],
    steps: [
      {
        title: 'Créer une règle',
        description: 'Définissez les conditions qui déclenchent une action automatique',
        detailedInstructions: [
          'Cliquez sur "Ajouter une règle" pour créer une nouvelle règle',
          'Configurez les conditions : produit, pays, montant, stock...',
          'Définissez l\'action : assigner un fournisseur, changer le statut, envoyer une notification',
          'Attribuez une priorité pour gérer les conflits entre règles'
        ]
      },
      {
        title: 'Configurer les priorités',
        description: 'Ordonnez vos règles par priorité pour gérer les cas de conflit'
      },
      {
        title: 'Tester les règles',
        description: 'Simulez une commande pour vérifier que vos règles fonctionnent correctement'
      },
      {
        title: 'Activer/Désactiver',
        description: 'Activez ou pausez vos règles individuellement via le switch'
      }
    ],
    tips: [
      { text: 'Configurez un fournisseur de secours pour chaque produit en cas de rupture du principal', type: 'warning' },
      { text: 'Les règles de routing intelligent réduisent les délais de livraison de 30% en moyenne', type: 'pro' }
    ],
    videos: [
      { title: 'Automatiser le fulfillment', description: 'Configurez des règles pour ne plus jamais router manuellement', youtubeId: 'dQw4w9WgXcQ', duration: '8:30' }
    ],
    faqs: [
      { question: 'Les règles s\'appliquent-elles aux commandes existantes ?', answer: 'Non, les règles ne s\'appliquent qu\'aux nouvelles commandes. Pour les commandes existantes, utilisez les actions manuelles.' }
    ],
    academyPath: '/academy'
  },

  feeds: {
    featureName: 'Feeds Multi-canaux',
    description: 'Publiez votre catalogue sur Google Shopping, Meta, TikTok et autres marketplace',
    level: 'advanced',
    keyFeatures: ['Google Shopping', 'Meta Catalog', 'TikTok Shop', 'Synchro auto'],
    steps: [
      {
        title: 'Créer un feed',
        description: 'Sélectionnez la plateforme cible et les produits à inclure',
        detailedInstructions: [
          'Cliquez sur "Créer un feed" et choisissez la plateforme (Google, Meta, TikTok...)',
          'Sélectionnez les produits à inclure : tous, par catégorie ou sélection manuelle',
          'L\'IA optimise automatiquement les titres et descriptions pour chaque canal'
        ]
      },
      {
        title: 'Mapper les champs',
        description: 'Associez vos attributs produit aux champs requis par la plateforme',
        detailedInstructions: [
          'Chaque plateforme exige des champs spécifiques (GTIN, marque, état, etc.)',
          'Le mapper intelligent pré-remplit les correspondances les plus probables',
          'Vérifiez et corrigez les mappings manuellement si nécessaire'
        ]
      },
      {
        title: 'Planifier la synchronisation',
        description: 'Configurez la fréquence de mise à jour du feed'
      },
      {
        title: 'Valider et publier',
        description: 'Vérifiez la conformité du feed avant soumission'
      }
    ],
    tips: [
      { text: 'Google Shopping requiert des GTINs valides — sans eux, vos produits seront rejetés', type: 'warning' },
      { text: 'Les titres optimisés par canal améliorent le Quality Score de 30% et réduisent le CPC', type: 'pro' }
    ],
    videos: [
      { title: 'Google Shopping : guide complet', description: 'De la création du feed à la première vente', youtubeId: 'dQw4w9WgXcQ', duration: '15:00' }
    ],
    faqs: [
      { question: 'Quels formats de feed sont supportés ?', answer: 'XML, CSV, JSON et les APIs natives Google Merchant Center, Meta Commerce Manager et TikTok Shop.' },
      { question: 'Puis-je avoir des prix différents par canal ?', answer: 'Oui, vous pouvez configurer des règles de prix spécifiques par feed/canal de vente.' }
    ],
    academyPath: '/academy'
  },

  academy: {
    featureName: 'ShopOpti Academy',
    description: 'Formations complètes, quiz interactifs et certifications pour maîtriser le dropshipping',
    level: 'beginner',
    keyFeatures: ['Cours vidéo', 'Quiz interactifs', 'Certifications', 'Parcours guidés'],
    steps: [
      {
        title: 'Choisir un parcours',
        description: 'Sélectionnez un parcours adapté à votre niveau',
        detailedInstructions: [
          'Les parcours sont organisés par niveau : Débutant, Intermédiaire, Expert',
          'Chaque parcours contient 5-10 modules avec vidéos et exercices',
          'Commencez par le parcours "Démarrage Rapide" si vous débutez'
        ]
      },
      {
        title: 'Suivre les leçons',
        description: 'Regardez les vidéos et complétez les exercices pratiques'
      },
      {
        title: 'Passer les quiz',
        description: 'Validez chaque module avec un quiz de 10 questions (score minimum : 70%)'
      },
      {
        title: 'Obtenir la certification',
        description: 'Recevez un certificat officiel ShopOpti à partager sur LinkedIn'
      }
    ],
    tips: [
      { text: 'Les utilisateurs certifiés ont en moyenne 2x plus de ventes que les non-certifiés', type: 'pro' },
      { text: 'Consacrez 30 min/jour à la formation — la régularité bat l\'intensité', type: 'info' }
    ],
    videos: [
      { title: 'Bienvenue à l\'Academy', description: 'Présentation de la plateforme et du parcours pédagogique', youtubeId: 'dQw4w9WgXcQ', duration: '4:00' }
    ],
    faqs: [
      { question: 'Les cours sont-ils inclus dans mon abonnement ?', answer: 'Oui, tous les cours de base sont inclus. Les masterclass avancées sont réservées aux plans Pro et Ultra Pro.' },
      { question: 'Les certifications expirent-elles ?', answer: 'Non, une fois obtenue, votre certification est valide à vie et peut être partagée sur LinkedIn.' }
    ],
    academyPath: '/academy'
  }
}
