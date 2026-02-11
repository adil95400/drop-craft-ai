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
  },

  // ===== LOT 3: 20 modules supplémentaires =====

  emailMarketing: {
    featureName: 'Email Marketing',
    description: 'Créez et automatisez vos campagnes email pour convertir et fidéliser vos clients',
    level: 'intermediate',
    keyFeatures: ['Campagnes email', 'Templates', 'Segmentation', 'Analytics'],
    steps: [
      {
        title: 'Créer une campagne',
        description: 'Lancez votre première campagne email en quelques clics',
        detailedInstructions: [
          'Cliquez sur "Nouvelle campagne" en haut à droite',
          'Donnez un nom explicite à votre campagne (ex: "Promo été 2025")',
          'Choisissez le type : email, SMS ou réseaux sociaux',
          'La campagne est créée en brouillon, prête à être configurée'
        ]
      },
      {
        title: 'Choisir un template',
        description: 'Utilisez l\'onglet Templates pour sélectionner un modèle d\'email professionnel',
        detailedInstructions: [
          'Accédez à l\'onglet "Templates" pour voir les modèles disponibles',
          'Chaque template est optimisé pour un usage : bienvenue, promotion, relance...',
          'Personnalisez le contenu avec votre branding et vos offres'
        ]
      },
      {
        title: 'Segmenter votre audience',
        description: 'Ciblez les bons clients pour maximiser l\'impact de vos emails'
      },
      {
        title: 'Analyser les résultats',
        description: 'Suivez taux d\'ouverture, clics et conversions dans l\'onglet Analytics'
      }
    ],
    tips: [
      { text: 'Un objet d\'email de 6-10 mots obtient le meilleur taux d\'ouverture', type: 'pro' },
      { text: 'Envoyez vos emails entre 10h et 14h pour maximiser l\'engagement', type: 'info' },
      { text: 'Ne dépassez pas 2 emails/semaine par contact pour éviter les désabonnements', type: 'warning' }
    ],
    videos: [
      { title: 'Email Marketing : les bases', description: 'Créez des campagnes qui convertissent', youtubeId: 'dQw4w9WgXcQ', duration: '8:45' }
    ],
    faqs: [
      { question: 'Combien d\'emails puis-je envoyer ?', answer: 'Le volume dépend de votre plan. Le plan Standard inclut 5 000 emails/mois, le Pro 25 000 et l\'Ultra Pro est illimité.' },
      { question: 'Puis-je importer ma liste de contacts ?', answer: 'Oui, importez vos contacts via CSV dans la section CRM. Ils seront automatiquement disponibles pour vos campagnes.' }
    ],
    academyPath: '/academy'
  },

  competitorAnalysis: {
    featureName: 'Analyse Concurrentielle',
    description: 'Surveillez vos concurrents, comparez les prix et identifiez les opportunités marché',
    level: 'advanced',
    keyFeatures: ['Analyse IA', 'Suivi des prix', 'Benchmarking', 'Alertes'],
    steps: [
      {
        title: 'Analyser un concurrent',
        description: 'Entrez l\'URL d\'un site concurrent pour lancer l\'analyse IA',
        detailedInstructions: [
          'Dans l\'onglet "Analyse", entrez l\'URL complète du site concurrent',
          'L\'IA scanne le catalogue, la stratégie pricing et le positionnement',
          'Les résultats incluent : nombre de produits, gamme de prix, catégories fortes'
        ]
      },
      {
        title: 'Comparer les prix',
        description: 'Utilisez le tracker de prix pour suivre les écarts avec la concurrence',
        detailedInstructions: [
          'L\'onglet "Prix" affiche une comparaison de vos prix vs la concurrence',
          'Les produits où vous êtes trop cher sont signalés en rouge',
          'Les opportunités de marge supplémentaire sont en vert'
        ]
      },
      {
        title: 'Consulter les résultats',
        description: 'L\'onglet Résultats affiche l\'historique de vos analyses concurrentielles'
      }
    ],
    tips: [
      { text: 'Analysez vos 3 principaux concurrents chaque mois pour rester compétitif', type: 'pro' },
      { text: 'Les alertes prix vous notifient en temps réel quand un concurrent change ses tarifs', type: 'info' },
      { text: 'Ne vous alignez pas systématiquement sur le prix le plus bas — la valeur perçue compte', type: 'warning' }
    ],
    videos: [
      { title: 'Veille concurrentielle efficace', description: 'Transformez l\'analyse en avantage stratégique', youtubeId: 'dQw4w9WgXcQ', duration: '9:30' }
    ],
    faqs: [
      { question: 'L\'analyse est-elle automatique ?', answer: 'Vous pouvez planifier des analyses automatiques hebdomadaires ou mensuelles sur vos concurrents enregistrés.' }
    ],
    academyPath: '/academy'
  },

  abTesting: {
    featureName: 'A/B Testing Marketing',
    description: 'Testez vos créatifs, emails et pages pour optimiser vos conversions avec des données statistiques',
    level: 'advanced',
    keyFeatures: ['Tests statistiques', 'Multi-variantes', 'Significance auto', 'Rapports'],
    steps: [
      {
        title: 'Créer un test',
        description: 'Définissez vos variantes A et B avec les éléments à tester',
        detailedInstructions: [
          'Cliquez sur "Nouveau test" pour démarrer',
          'Choisissez le type : email, page produit, publicité ou prix',
          'Définissez la variante A (contrôle) et la variante B (challenger)',
          'Configurez la répartition du trafic (50/50 recommandé pour démarrer)'
        ]
      },
      {
        title: 'Lancer le test',
        description: 'Activez le test et laissez-le collecter suffisamment de données'
      },
      {
        title: 'Analyser les résultats',
        description: 'Le système calcule automatiquement la significativité statistique'
      },
      {
        title: 'Appliquer le gagnant',
        description: 'Déployez la variante gagnante sur l\'ensemble de votre audience'
      }
    ],
    tips: [
      { text: 'Attendez au moins 1 000 impressions par variante avant de conclure un test', type: 'warning' },
      { text: 'Ne testez qu\'un seul élément à la fois pour des résultats exploitables', type: 'pro' },
      { text: 'Les tests A/B sur les titres produit peuvent améliorer le CTR de 15-30%', type: 'info' }
    ],
    videos: [
      { title: 'A/B Testing pour débutants', description: 'Les bases de l\'optimisation par les données', youtubeId: 'dQw4w9WgXcQ', duration: '7:00' }
    ],
    faqs: [
      { question: 'Qu\'est-ce que la significativité statistique ?', answer: 'C\'est la probabilité que le résultat ne soit pas dû au hasard. Visez 95% minimum avant de déclarer un gagnant.' }
    ],
    academyPath: '/academy'
  },

  shipping: {
    featureName: 'Gestion des Expéditions',
    description: 'Gérez vos transporteurs, tarifs par zone et suivez vos colis en temps réel',
    level: 'intermediate',
    keyFeatures: ['Multi-transporteurs', 'Zones tarifaires', 'Tracking temps réel', 'Règles auto'],
    steps: [
      {
        title: 'Ajouter un transporteur',
        description: 'Configurez vos transporteurs avec leurs tarifs et services',
        detailedInstructions: [
          'Cliquez sur "Nouveau Transporteur" en haut à droite',
          'Sélectionnez le transporteur (Colissimo, DHL, UPS, FedEx...)',
          'Renseignez vos identifiants API pour le tracking automatique',
          'Définissez les services disponibles (standard, express, point relais)'
        ]
      },
      {
        title: 'Configurer les zones',
        description: 'Définissez vos tarifs par zone géographique',
        detailedInstructions: [
          'L\'onglet "Zones" liste les zones préconfigurées',
          'Modifiez les tarifs pour chaque zone selon vos accords transporteur',
          'Ajoutez des zones personnalisées si nécessaire'
        ]
      },
      {
        title: 'Créer des règles d\'expédition',
        description: 'Automatisez le choix du transporteur selon des critères définis'
      },
      {
        title: 'Suivre les colis',
        description: 'L\'onglet Suivi affiche tous vos colis avec statut en temps réel'
      }
    ],
    tips: [
      { text: 'Proposez la livraison gratuite au-delà d\'un seuil — ça augmente le panier moyen de 30%', type: 'pro' },
      { text: 'Activez les notifications de tracking automatiques pour réduire les demandes SAV', type: 'info' },
      { text: 'Vérifiez les dimensions/poids de vos produits pour éviter les surcoûts transporteur', type: 'warning' }
    ],
    videos: [
      { title: 'Optimiser vos expéditions', description: 'Réduisez vos coûts et améliorez l\'expérience client', youtubeId: 'dQw4w9WgXcQ', duration: '10:15' }
    ],
    faqs: [
      { question: 'Quels transporteurs sont supportés ?', answer: 'Colissimo, Chronopost, DHL, UPS, FedEx, DPD, Mondial Relay et Point Relais. D\'autres sont ajoutés régulièrement.' },
      { question: 'Le tracking est-il automatique ?', answer: 'Oui, une fois l\'API du transporteur configurée, le suivi se met à jour automatiquement.' }
    ],
    academyPath: '/academy'
  },

  customers: {
    featureName: 'Gestion Clients',
    description: 'Centralisez vos données clients, segmentez vos audiences et suivez le cycle de vie',
    level: 'intermediate',
    keyFeatures: ['Profils enrichis', 'Segmentation', 'Historique achats', 'Scoring'],
    steps: [
      {
        title: 'Importer vos clients',
        description: 'Centralisez tous vos contacts dans une base unique',
        detailedInstructions: [
          'Importez via CSV ou connectez vos boutiques pour une synchronisation automatique',
          'Les doublons sont détectés et fusionnés automatiquement',
          'Chaque profil est enrichi avec l\'historique d\'achats et comportement'
        ]
      },
      {
        title: 'Segmenter vos audiences',
        description: 'Créez des segments dynamiques basés sur le comportement d\'achat'
      },
      {
        title: 'Analyser les métriques',
        description: 'LTV, fréquence d\'achat, panier moyen par segment'
      }
    ],
    tips: [
      { text: 'Les 20% de clients les plus fidèles génèrent 80% du CA — identifiez-les et chouchoutez-les', type: 'pro' },
      { text: 'Un client existant coûte 5x moins à convertir qu\'un nouveau prospect', type: 'info' }
    ],
    videos: [
      { title: 'Maîtriser la gestion client', description: 'De l\'import à la segmentation avancée', youtubeId: 'dQw4w9WgXcQ', duration: '8:00' }
    ],
    faqs: [
      { question: 'Les données sont-elles RGPD compliant ?', answer: 'Oui, toutes les données sont stockées de manière sécurisée et vous pouvez supprimer les profils à tout moment.' }
    ],
    academyPath: '/academy'
  },

  loyalty: {
    featureName: 'Programme de Fidélité',
    description: 'Récompensez vos clients avec un système de points, niveaux et récompenses exclusives',
    level: 'intermediate',
    keyFeatures: ['Points automatiques', 'Niveaux VIP', 'Récompenses', 'Gamification'],
    steps: [
      {
        title: 'Créer les niveaux',
        description: 'Définissez vos paliers de fidélité (Bronze, Argent, Or, Platine)',
        detailedInstructions: [
          'Cliquez sur "Nouveau niveau" dans l\'onglet Niveaux',
          'Définissez le nom, le seuil de points minimum et la réduction associée',
          'Ajoutez des avantages exclusifs par niveau (livraison gratuite, accès anticipé...)'
        ]
      },
      {
        title: 'Configurer les récompenses',
        description: 'Créez un catalogue de récompenses échangeables contre des points',
        detailedInstructions: [
          'Cliquez sur "Nouvelle récompense" pour ajouter une récompense',
          'Définissez le coût en points et le stock disponible',
          'Types populaires : bons de réduction, produits gratuits, livraison offerte'
        ]
      },
      {
        title: 'Activer l\'attribution automatique',
        description: 'Les points sont attribués automatiquement à chaque achat'
      },
      {
        title: 'Suivre les membres',
        description: 'L\'onglet Membres affiche les inscrits, leurs points et leur niveau'
      }
    ],
    tips: [
      { text: 'Un programme de fidélité augmente la rétention de 25-30% en moyenne', type: 'pro' },
      { text: 'Proposez des récompenses accessibles dès 100 points pour encourager l\'engagement initial', type: 'info' },
      { text: 'Envoyez des notifications quand un client est proche du niveau supérieur — ça stimule l\'achat', type: 'warning' }
    ],
    videos: [
      { title: 'Lancer un programme de fidélité', description: 'De la configuration au premier échange de points', youtubeId: 'dQw4w9WgXcQ', duration: '6:30' }
    ],
    faqs: [
      { question: 'Les points expirent-ils ?', answer: 'Par défaut non, mais vous pouvez configurer une expiration dans les paramètres du programme.' }
    ],
    academyPath: '/academy'
  },

  affiliate: {
    featureName: 'Marketing d\'Affiliation',
    description: 'Créez un réseau d\'affiliés pour générer des ventes via des partenaires rémunérés',
    level: 'advanced',
    keyFeatures: ['Liens de tracking', 'Commissions paliers', 'Dashboard affilié', 'Paiements auto'],
    steps: [
      {
        title: 'Inviter des affiliés',
        description: 'Recrutez des partenaires et créez leurs comptes affiliés',
        detailedInstructions: [
          'Cliquez sur "Inviter un affilié" pour envoyer une invitation',
          'L\'affilié reçoit un email avec son tableau de bord personnalisé',
          'Il peut générer des liens de tracking et suivre ses performances'
        ]
      },
      {
        title: 'Configurer les commissions',
        description: 'Définissez la structure de rémunération de vos affiliés',
        detailedInstructions: [
          'L\'onglet "Commissions" permet de définir le taux par défaut (ex: 10%)',
          'Configurez des paliers progressifs pour motiver les top performers',
          'Le cookie de tracking a une durée de 30 jours par défaut'
        ]
      },
      {
        title: 'Gérer les liens',
        description: 'Créez des liens produit-spécifiques ou des liens généraux'
      },
      {
        title: 'Suivre les performances',
        description: 'Analysez le CA généré, les clics et le taux de conversion par affilié'
      }
    ],
    tips: [
      { text: 'Les micro-influenceurs (1K-10K followers) ont souvent un meilleur ROI que les gros comptes', type: 'pro' },
      { text: 'Fournissez des créatifs prêts à l\'emploi à vos affiliés pour faciliter la promotion', type: 'info' },
      { text: 'Vérifiez régulièrement les sources de trafic pour détecter la fraude aux clics', type: 'warning' }
    ],
    videos: [
      { title: 'Programme d\'affiliation rentable', description: 'Structurez un réseau d\'affiliés qui génère des ventes', youtubeId: 'dQw4w9WgXcQ', duration: '11:00' }
    ],
    faqs: [
      { question: 'Comment sont payés les affiliés ?', answer: 'Les commissions sont calculées automatiquement. Vous pouvez déclencher les paiements manuellement ou les planifier mensuellement.' }
    ],
    academyPath: '/academy'
  },

  channels: {
    featureName: 'Boutiques & Canaux',
    description: 'Connectez et gérez toutes vos boutiques et marketplaces depuis un hub centralisé',
    level: 'beginner',
    keyFeatures: ['Multi-boutiques', 'Synchro auto', 'Health monitoring', 'Flux d\'activité'],
    steps: [
      {
        title: 'Connecter une boutique',
        description: 'Ajoutez votre première boutique Shopify, WooCommerce ou autre',
        detailedInstructions: [
          'Cliquez sur la carte de la plateforme souhaitée dans la section "Ajouter"',
          'Renseignez l\'URL de votre boutique et les identifiants API',
          'La connexion est testée automatiquement et vos produits commencent à se synchroniser'
        ]
      },
      {
        title: 'Connecter une marketplace',
        description: 'Ajoutez Amazon, eBay, Google Shopping ou d\'autres marketplaces',
        detailedInstructions: [
          'Les marketplaces sont dans la section dédiée du hub',
          'Chaque marketplace nécessite des identifiants API spécifiques',
          'Certaines marketplaces requièrent une validation de compte préalable'
        ]
      },
      {
        title: 'Configurer la synchronisation',
        description: 'Activez la synchro automatique des produits et commandes'
      },
      {
        title: 'Surveiller la santé',
        description: 'Le dashboard santé affiche le statut de chaque connexion en temps réel'
      }
    ],
    tips: [
      { text: 'Activez la synchro automatique pour ne jamais avoir de décalage de stock entre vos canaux', type: 'pro' },
      { text: 'Vérifiez le statut de vos connexions chaque matin — une déconnexion peut causer des surventes', type: 'warning' },
      { text: 'Commencez par 1-2 canaux puis ajoutez les suivants progressivement', type: 'info' }
    ],
    videos: [
      { title: 'Connecter votre première boutique', description: 'Guide pas à pas pour Shopify et WooCommerce', youtubeId: 'dQw4w9WgXcQ', duration: '6:00' }
    ],
    faqs: [
      { question: 'Combien de boutiques puis-je connecter ?', answer: 'Cela dépend de votre plan : Standard = 2, Pro = 5, Ultra Pro = illimité.' },
      { question: 'La synchronisation est-elle bidirectionnelle ?', answer: 'Oui, les produits et commandes sont synchronisés dans les deux sens en temps réel.' }
    ],
    academyPath: '/academy'
  },

  priceMonitor: {
    featureName: 'Moniteur Prix & Stock',
    description: 'Surveillez les prix et stocks fournisseurs en temps réel avec alertes automatiques',
    level: 'intermediate',
    keyFeatures: ['Alertes prix', 'Suivi stock', 'Seuils personnalisés', 'Historique'],
    steps: [
      {
        title: 'Ajouter un moniteur',
        description: 'Sélectionnez un produit et configurez les seuils d\'alerte',
        detailedInstructions: [
          'Cliquez sur "Ajouter un moniteur" en haut à droite',
          'Sélectionnez le produit à surveiller dans votre catalogue',
          'Définissez le seuil d\'alerte en pourcentage (ex: alerte si prix change de +/- 5%)',
          'Activez ou désactivez le moniteur à tout moment'
        ]
      },
      {
        title: 'Configurer les alertes',
        description: 'Définissez comment vous souhaitez être notifié des changements'
      },
      {
        title: 'Lancer une vérification',
        description: 'Cliquez sur "Vérifier tout" pour une analyse immédiate de tous vos moniteurs'
      },
      {
        title: 'Traiter les alertes',
        description: 'Consultez les alertes et ajustez vos prix en conséquence'
      }
    ],
    tips: [
      { text: 'Un seuil de 5% est optimal pour la plupart des produits — assez sensible sans bruit', type: 'pro' },
      { text: 'Surveillez en priorité vos 20 best-sellers — ce sont eux qui impactent le plus votre CA', type: 'info' },
      { text: 'Réagissez sous 24h aux alertes critiques pour ne pas perdre de ventes', type: 'warning' }
    ],
    videos: [
      { title: 'Monitoring prix automatisé', description: 'Ne manquez plus jamais un changement de prix fournisseur', youtubeId: 'dQw4w9WgXcQ', duration: '5:45' }
    ],
    faqs: [
      { question: 'À quelle fréquence les prix sont-ils vérifiés ?', answer: 'Par défaut toutes les 24h. Les plans Pro et Ultra Pro permettent une vérification toutes les 6h ou 1h.' }
    ],
    academyPath: '/academy'
  },

  whiteLabel: {
    featureName: 'White-Label',
    description: 'Personnalisez ShopOpti avec votre propre marque, couleurs et domaine',
    level: 'advanced',
    keyFeatures: ['Branding custom', 'Domaine personnalisé', 'Emails brandés', 'Logo & favicon'],
    steps: [
      {
        title: 'Configurer votre marque',
        description: 'Renseignez le nom de votre marque et votre domaine personnalisé',
        detailedInstructions: [
          'Entrez le nom de votre marque dans le champ dédié',
          'Configurez un domaine personnalisé (ex: app.votremarque.com)',
          'Le domaine nécessite une configuration DNS (guide disponible)'
        ]
      },
      {
        title: 'Personnaliser les couleurs',
        description: 'Choisissez vos couleurs primaire et secondaire',
        detailedInstructions: [
          'Utilisez le sélecteur de couleur ou entrez un code HEX',
          'La couleur primaire est utilisée pour les boutons et accents',
          'La couleur secondaire complète votre palette visuelle'
        ]
      },
      {
        title: 'Uploader logo et favicon',
        description: 'Ajoutez votre logo (400x100px) et favicon (32x32px)'
      },
      {
        title: 'Activer les options',
        description: 'Activez les emails brandés et masquez le badge ShopOpti'
      }
    ],
    tips: [
      { text: 'Le White-Label est idéal pour les agences qui gèrent les boutiques de leurs clients', type: 'pro' },
      { text: 'Utilisez un logo SVG pour une qualité optimale sur tous les écrans', type: 'info' },
      { text: 'Testez le rendu sur mobile après avoir changé les couleurs', type: 'warning' }
    ],
    videos: [
      { title: 'White-Label : votre marque', description: 'Transformez ShopOpti en votre propre plateforme', youtubeId: 'dQw4w9WgXcQ', duration: '4:30' }
    ],
    faqs: [
      { question: 'Le White-Label est-il inclus dans mon plan ?', answer: 'Le White-Label est réservé au plan Ultra Pro. Il inclut le domaine personnalisé, les emails brandés et le retrait du badge.' }
    ],
    academyPath: '/academy'
  },

  publishing: {
    featureName: 'Publication Produits',
    description: 'Publiez et synchronisez vos produits vers votre catalogue principal et vos canaux de vente',
    level: 'beginner',
    keyFeatures: ['Publication en lot', 'Synchro statut', 'Détection erreurs', 'Filtres avancés'],
    steps: [
      {
        title: 'Filtrer les produits',
        description: 'Utilisez les filtres pour identifier les produits à publier',
        detailedInstructions: [
          'Filtrez par statut : non publiés, obsolètes, en erreur',
          'Recherchez par nom ou SKU dans la barre de recherche',
          'Les produits non publiés sont ceux récemment importés ou modifiés'
        ]
      },
      {
        title: 'Sélectionner les produits',
        description: 'Cochez les produits ou utilisez "Sélectionner tout"'
      },
      {
        title: 'Publier en lot',
        description: 'Cliquez sur "Publier la sélection" pour envoyer les produits'
      },
      {
        title: 'Vérifier la synchronisation',
        description: 'Le statut passe à "Synchronisé" une fois la publication réussie'
      }
    ],
    tips: [
      { text: 'Vérifiez que vos produits ont un score de santé > 70% avant publication pour éviter les rejets', type: 'warning' },
      { text: 'La publication en lot peut traiter jusqu\'à 500 produits simultanément', type: 'info' }
    ],
    videos: [
      { title: 'Publier vos produits', description: 'Du brouillon à la mise en ligne en 2 minutes', youtubeId: 'dQw4w9WgXcQ', duration: '3:30' }
    ],
    faqs: [
      { question: 'Puis-je dépublier un produit ?', answer: 'Oui, depuis la fiche produit ou en lot, vous pouvez retirer un produit de la publication.' }
    ],
    academyPath: '/academy'
  },

  inventoryPredictor: {
    featureName: 'Smart Inventory Predictor',
    description: 'Prédisez vos besoins en stock avec l\'IA : alertes, suggestions de réapprovisionnement et tendances',
    level: 'advanced',
    keyFeatures: ['Prédictions IA', 'Alertes stock', 'Réappro auto', 'Analyse tendances'],
    steps: [
      {
        title: 'Consulter le stock',
        description: 'L\'onglet Stock affiche une vue d\'ensemble de votre inventaire actuel',
        detailedInstructions: [
          'Les produits sont triés par niveau de stock : critique, faible, normal, excédentaire',
          'Les produits à zéro stock sont mis en évidence en rouge',
          'Le taux de rotation est calculé automatiquement'
        ]
      },
      {
        title: 'Voir les prédictions',
        description: 'L\'IA prédit quand chaque produit sera en rupture',
        detailedInstructions: [
          'Les prédictions sont basées sur l\'historique de ventes et les tendances saisonnières',
          'Un score de confiance indique la fiabilité de chaque prédiction',
          'Les prédictions se mettent à jour quotidiennement'
        ]
      },
      {
        title: 'Configurer les alertes',
        description: 'Définissez des seuils pour être notifié avant une rupture'
      },
      {
        title: 'Suivre les suggestions',
        description: 'L\'IA suggère les quantités optimales de réapprovisionnement'
      }
    ],
    tips: [
      { text: 'Commandar en avance réduit les ruptures de 80% et les coûts de livraison urgente', type: 'pro' },
      { text: 'Tenez compte de la saisonnalité : les prédictions sont plus fiables sur 3+ mois d\'historique', type: 'info' },
      { text: 'Les produits avec un taux de rotation < 30 jours nécessitent une surveillance accrue', type: 'warning' }
    ],
    videos: [
      { title: 'Prédictions stock IA', description: 'Ne tombez plus jamais en rupture de stock', youtubeId: 'dQw4w9WgXcQ', duration: '7:45' }
    ],
    faqs: [
      { question: 'Les prédictions sont-elles fiables ?', answer: 'La fiabilité dépend de l\'historique disponible. Avec 3+ mois de données, la précision dépasse 85%.' }
    ],
    academyPath: '/academy'
  },

  predictiveAnalytics: {
    featureName: 'Analytics Prédictive',
    description: 'Anticipez vos ventes, optimisez vos prix et détectez les tendances avec l\'IA',
    level: 'advanced',
    keyFeatures: ['Prévisions ventes', 'Tendances IA', 'Alertes stock', 'Prix optimaux'],
    steps: [
      {
        title: 'Consulter les prévisions',
        description: 'Les cartes 30 et 90 jours affichent vos prévisions de revenus et commandes',
        detailedInstructions: [
          'Le score de confiance indique la fiabilité de la prévision',
          'Les prévisions sont recalculées chaque nuit avec les dernières données',
          'Comparez avec les périodes précédentes pour valider la tendance'
        ]
      },
      {
        title: 'Analyser les recommandations',
        description: 'L\'IA propose des actions : restockage, ajustement prix, opportunités'
      },
      {
        title: 'Suivre les tendances',
        description: 'Identifiez les produits en hausse ou en baisse pour adapter votre stratégie'
      },
      {
        title: 'Optimiser les prix',
        description: 'L\'analyse d\'élasticité suggère les prix optimaux pour maximiser le profit'
      }
    ],
    tips: [
      { text: 'Les prévisions à 30 jours sont plus fiables que celles à 90 jours — privilégiez-les pour les décisions opérationnelles', type: 'pro' },
      { text: 'Un score de confiance < 60% signifie que les données sont insuffisantes — attendez plus d\'historique', type: 'warning' }
    ],
    videos: [
      { title: 'Analytics prédictive pour e-commerce', description: 'Prenez des décisions data-driven', youtubeId: 'dQw4w9WgXcQ', duration: '9:00' }
    ],
    faqs: [
      { question: 'De combien de données l\'IA a-t-elle besoin ?', answer: 'Au minimum 30 jours de ventes. La qualité des prédictions s\'améliore significativement après 90 jours.' }
    ],
    academyPath: '/academy'
  },

  internationalization: {
    featureName: 'Internationalisation',
    description: 'Étendez votre activité à l\'international : multi-langues, multi-devises et conformité locale',
    level: 'advanced',
    keyFeatures: ['Multi-langues', 'Multi-devises', 'Taxes locales', 'Traduction IA'],
    steps: [
      {
        title: 'Ajouter des marchés',
        description: 'Configurez les pays et régions où vous souhaitez vendre',
        detailedInstructions: [
          'Sélectionnez les pays cibles dans la configuration',
          'Chaque marché hérite de vos produits mais peut avoir des prix spécifiques',
          'Les taxes et droits de douane sont configurés par marché'
        ]
      },
      {
        title: 'Configurer les devises',
        description: 'Activez les devises locales avec conversion automatique ou prix fixes'
      },
      {
        title: 'Traduire le catalogue',
        description: 'L\'IA traduit automatiquement vos fiches produit dans chaque langue'
      },
      {
        title: 'Configurer la conformité',
        description: 'Taxes, RGPD, mentions légales par pays'
      }
    ],
    tips: [
      { text: 'Commencez par les marchés francophones (FR, BE, CH, CA) avant de vous étendre', type: 'info' },
      { text: 'La traduction IA + relecture humaine donne les meilleurs résultats en conversion', type: 'pro' },
      { text: 'Vérifiez les réglementations produit par pays — certains articles sont interdits localement', type: 'warning' }
    ],
    videos: [
      { title: 'Vendre à l\'international', description: 'Guide complet de l\'expansion internationale', youtubeId: 'dQw4w9WgXcQ', duration: '12:00' }
    ],
    faqs: [
      { question: 'La traduction IA est-elle de qualité ?', answer: 'Oui, nos modèles sont spécialisés e-commerce. Nous recommandons une relecture pour les marchés stratégiques.' }
    ],
    academyPath: '/academy'
  },

  productsCatalog: {
    featureName: 'Catalogue Produits',
    description: 'Votre hub central pour gérer, analyser et optimiser tous vos produits avec l\'IA',
    level: 'beginner',
    keyFeatures: ['Vue unifiée', 'Audit qualité IA', 'Règles automatiques', 'Multi-vues'],
    steps: [
      {
        title: 'Explorer le catalogue',
        description: 'Parcourez tous vos produits avec les différents modes de vue',
        detailedInstructions: [
          'Utilisez le sélecteur de vue en haut : Liste, Grille, Audit ou Compact',
          'La vue Audit affiche le score de santé de chaque produit',
          'Filtrez par statut, catégorie ou niveau de qualité'
        ]
      },
      {
        title: 'Utiliser le Command Center',
        description: 'Le panneau IA identifie automatiquement les actions prioritaires',
        detailedInstructions: [
          'Le Command Center affiche les actions recommandées par l\'IA',
          'Cliquez sur une action pour filtrer les produits concernés',
          'Les actions sont triées par impact estimé sur votre CA'
        ]
      },
      {
        title: 'Appliquer des règles',
        description: 'L\'onglet Règles permet d\'automatiser la gestion de vos produits'
      },
      {
        title: 'Actions en masse',
        description: 'Sélectionnez des produits pour modifier, exporter ou supprimer en lot'
      }
    ],
    tips: [
      { text: 'Le tri IA priorise les produits qui nécessitent votre attention en premier', type: 'pro' },
      { text: 'Utilisez les smart filters pour ne voir que les produits à risque ou à optimiser', type: 'info' },
      { text: 'Exportez régulièrement votre catalogue pour avoir une sauvegarde', type: 'warning' }
    ],
    videos: [
      { title: 'Maîtriser le catalogue', description: 'Toutes les fonctionnalités du hub produits expliquées', youtubeId: 'dQw4w9WgXcQ', duration: '10:00' }
    ],
    faqs: [
      { question: 'Comment est calculé le score de santé ?', answer: 'Le score agrège 6 critères pondérés : titre (≥10 car.), description (≥50 car.), images, SKU, catégorie et prix > 0.' },
      { question: 'Puis-je automatiser des actions ?', answer: 'Oui, l\'onglet Règles permet de créer des automatisations : ex. "Si stock < 5, alerter et masquer le produit".' }
    ],
    academyPath: '/academy'
  },

  advancedAnalytics: {
    featureName: 'Analytics Avancés',
    description: 'Rapports personnalisés, KPIs temps réel et collaboration d\'équipe',
    level: 'advanced',
    keyFeatures: ['Rapports custom', 'KPIs temps réel', 'Export PDF/CSV', 'Collaboration'],
    steps: [
      {
        title: 'Créer un rapport',
        description: 'Construisez des rapports sur mesure avec les métriques qui comptent',
        detailedInstructions: [
          'Cliquez sur "Générer un rapport" dans le dashboard',
          'Sélectionnez les métriques : CA, commandes, marge, trafic, conversions',
          'Choisissez la période et les filtres souhaités',
          'Sauvegardez le template pour le réutiliser'
        ]
      },
      {
        title: 'Configurer les KPIs',
        description: 'Définissez vos indicateurs clés avec des seuils d\'alerte'
      },
      {
        title: 'Collaborer en équipe',
        description: 'Partagez des rapports et invitez des collaborateurs'
      },
      {
        title: 'Exporter les données',
        description: 'Exportez en PDF ou CSV pour vos rapports externes'
      }
    ],
    tips: [
      { text: 'Planifiez des rapports hebdomadaires automatiques pour votre équipe', type: 'pro' },
      { text: 'Comparez toujours avec la période N-1 pour détecter les tendances', type: 'info' }
    ],
    videos: [
      { title: 'Dashboard Analytics avancé', description: 'Naviguez dans vos données comme un pro', youtubeId: 'dQw4w9WgXcQ', duration: '6:40' }
    ],
    faqs: [
      { question: 'Puis-je partager mes rapports ?', answer: 'Oui, via export PDF ou lien sécurisé pour les membres de votre équipe.' }
    ],
    academyPath: '/academy'
  },

  categoryMapping: {
    featureName: 'Mapping de Catégories',
    description: 'Associez vos catégories produit aux taxonomies des marketplaces pour une conformité maximale',
    level: 'advanced',
    keyFeatures: ['Mapping IA', 'Google Taxonomy', 'Multi-marketplace', 'Validation auto'],
    steps: [
      {
        title: 'Importer vos catégories',
        description: 'Le système détecte automatiquement vos catégories produit existantes'
      },
      {
        title: 'Mapper vers les taxonomies',
        description: 'L\'IA suggère automatiquement les correspondances les plus probables'
      },
      {
        title: 'Valider les suggestions',
        description: 'Vérifiez et corrigez les mappings proposés par l\'IA'
      },
      {
        title: 'Appliquer aux feeds',
        description: 'Les mappings sont automatiquement utilisés dans vos feeds marketplace'
      }
    ],
    tips: [
      { text: 'Un mapping précis améliore votre visibilité de 40% sur Google Shopping', type: 'pro' },
      { text: 'Utilisez le mapping IA comme point de départ puis affinez manuellement', type: 'info' }
    ],
    videos: [
      { title: 'Mapping catégories : guide complet', description: 'De la taxonomie Google au feed parfait', youtubeId: 'dQw4w9WgXcQ', duration: '8:00' }
    ],
    faqs: [
      { question: 'Quelles taxonomies sont supportées ?', answer: 'Google Product Taxonomy, Facebook/Meta, Amazon Browse Nodes et les taxonomies marketplace locales.' }
    ],
    academyPath: '/academy'
  },

  ppcFeedLink: {
    featureName: 'PPC Feed Link',
    description: 'Optimisez vos campagnes PPC avec des feeds publicitaires intelligents et automatisés',
    level: 'advanced',
    keyFeatures: ['Feeds PPC', 'Optimisation auto', 'Bid management', 'Performance tracking'],
    steps: [
      {
        title: 'Créer un feed PPC',
        description: 'Sélectionnez la plateforme publicitaire et les produits à promouvoir'
      },
      {
        title: 'Optimiser les attributs',
        description: 'L\'IA optimise titres, descriptions et images pour chaque plateforme pub'
      },
      {
        title: 'Configurer le tracking',
        description: 'Ajoutez les UTMs et paramètres de suivi automatiquement'
      },
      {
        title: 'Publier et surveiller',
        description: 'Publiez le feed et suivez les performances en temps réel'
      }
    ],
    tips: [
      { text: 'Les titres optimisés pour le PPC diffèrent des titres SEO — incluez le prix et les promos', type: 'pro' },
      { text: 'Excluez les produits avec marge < 20% de vos feeds PPC pour garantir la rentabilité', type: 'warning' }
    ],
    videos: [
      { title: 'PPC Feed Link : premiers pas', description: 'Créez des feeds publicitaires performants', youtubeId: 'dQw4w9WgXcQ', duration: '7:30' }
    ],
    faqs: [
      { question: 'Quelles plateformes PPC sont supportées ?', answer: 'Google Ads, Microsoft Advertising, Facebook/Meta Ads et TikTok Ads.' }
    ],
    academyPath: '/academy'
  },

  contentGeneration: {
    featureName: 'Génération de Contenu IA',
    description: 'Créez vidéos TikTok, posts sociaux et optimisez vos photos produits avec l\'IA',
    level: 'intermediate',
    keyFeatures: ['Vidéos TikTok IA', 'Posts sociaux auto', 'Retouche photo IA', 'Templates créatifs'],
    steps: [
      {
        title: 'Choisir le type de contenu',
        description: 'Sélectionnez entre vidéo, image ou texte selon votre objectif',
        detailedInstructions: [
          'L\'onglet "Vidéos" permet de générer des clips TikTok/Reels à partir de vos produits',
          'L\'onglet "Images" optimise vos photos produits (fond, retouche, mise en scène)',
          'L\'onglet "Textes" génère descriptions, posts sociaux et scripts publicitaires'
        ]
      },
      {
        title: 'Configurer les paramètres',
        description: 'Ajustez ton, style, format et durée selon votre audience cible',
        detailedInstructions: [
          'Choisissez le ton : professionnel, décontracté, urgent, luxe...',
          'Définissez le format : carré (Instagram), vertical (TikTok/Reels), horizontal (YouTube)',
          'Sélectionnez la durée pour les vidéos : 15s, 30s ou 60s'
        ]
      },
      {
        title: 'Générer et prévisualiser',
        description: 'L\'IA crée le contenu en quelques secondes — prévisualisez avant de publier'
      },
      {
        title: 'Exporter et publier',
        description: 'Téléchargez ou publiez directement sur vos réseaux sociaux'
      }
    ],
    tips: [
      { text: 'Les vidéos de 15-30s avec un hook dans les 3 premières secondes performent 3x mieux', type: 'pro' },
      { text: 'Vérifiez toujours le rendu final — l\'IA peut parfois générer des artefacts visuels', type: 'warning' },
      { text: 'Réutilisez vos meilleurs contenus comme templates pour accélérer la production', type: 'info' }
    ],
    videos: [
      { title: 'Créer une vidéo TikTok en 2 minutes', description: 'Du produit au clip viral avec l\'IA', youtubeId: 'dQw4w9WgXcQ', duration: '5:20' },
      { title: 'Optimiser vos photos produits', description: 'Fond blanc, mise en scène et retouche automatique', youtubeId: 'dQw4w9WgXcQ', duration: '4:15' }
    ],
    faqs: [
      { question: 'Combien de contenus puis-je générer ?', answer: 'Le nombre dépend de vos crédits IA. Chaque génération consomme entre 1 et 5 crédits selon la complexité.' },
      { question: 'Puis-je utiliser les contenus commercialement ?', answer: 'Oui, tous les contenus générés vous appartiennent et peuvent être utilisés librement à des fins commerciales.' }
    ],
    academyPath: '/academy'
  },

  storeSync: {
    featureName: 'Centre de Synchronisation',
    description: 'Orchestrez la synchronisation de vos données en temps réel avec toutes vos boutiques',
    level: 'intermediate',
    keyFeatures: ['Sync temps réel', 'Multi-boutiques', 'File d\'attente', 'Logs détaillés'],
    steps: [
      {
        title: 'Vérifier les connexions',
        description: 'Assurez-vous que toutes vos boutiques sont connectées et actives',
        detailedInstructions: [
          'Le tableau de bord affiche le statut de chaque boutique connectée',
          'Les icônes vertes indiquent une connexion active, rouges une erreur',
          'Cliquez sur "Reconnecter" pour résoudre les problèmes de connexion'
        ]
      },
      {
        title: 'Lancer une synchronisation',
        description: 'Synchronisez manuellement ou configurez la sync automatique',
        detailedInstructions: [
          'Cliquez sur "Sync complète" pour synchroniser toutes les données',
          'Utilisez "Sync module" pour synchroniser uniquement produits, commandes ou stocks',
          'La sync automatique peut être configurée toutes les 15min, 1h ou 4h'
        ]
      },
      {
        title: 'Surveiller la file d\'attente',
        description: 'Suivez les éléments en attente de synchronisation'
      },
      {
        title: 'Consulter les logs',
        description: 'Analysez l\'historique complet des synchronisations passées'
      }
    ],
    tips: [
      { text: 'Planifiez les syncs complètes pendant les heures creuses pour éviter les conflits', type: 'pro' },
      { text: 'En cas d\'erreur répétée, vérifiez vos clés API dans les paramètres de la boutique', type: 'warning' },
      { text: 'La sync incrémentale (module par module) est 5x plus rapide que la sync complète', type: 'info' }
    ],
    videos: [
      { title: 'Synchronisation multi-boutiques', description: 'Gérez 5+ boutiques sans effort', youtubeId: 'dQw4w9WgXcQ', duration: '6:00' }
    ],
    faqs: [
      { question: 'À quelle fréquence les données sont-elles synchronisées ?', answer: 'Par défaut toutes les heures. Vous pouvez configurer une fréquence de 15min à 24h selon votre plan.' },
      { question: 'Que faire si la sync échoue ?', answer: 'Vérifiez les logs d\'erreur, reconnectez la boutique et relancez. Si le problème persiste, contactez le support.' }
    ],
    academyPath: '/academy'
  },

  stores: {
    featureName: 'Boutiques Connectées',
    description: 'Gérez toutes vos boutiques e-commerce depuis un tableau de bord centralisé',
    level: 'beginner',
    keyFeatures: ['Multi-plateformes', 'Connexion 1-clic', 'Monitoring', 'Sync automatique'],
    steps: [
      {
        title: 'Connecter une boutique',
        description: 'Cliquez sur "Connecter une boutique" et suivez le wizard',
        detailedInstructions: [
          'Choisissez votre plateforme : Shopify, WooCommerce, PrestaShop, etc.',
          'Renseignez l\'URL de votre boutique et les identifiants API',
          'L\'assistant teste automatiquement la connexion et importe vos données'
        ]
      },
      {
        title: 'Vérifier la connexion',
        description: 'Le statut doit afficher "Connecté" avec une icône verte'
      },
      {
        title: 'Synchroniser les données',
        description: 'Lancez la première synchronisation pour importer produits et commandes'
      },
      {
        title: 'Configurer les paramètres',
        description: 'Ajustez la fréquence de sync et les données à synchroniser'
      }
    ],
    tips: [
      { text: 'Commencez par connecter votre boutique principale, puis ajoutez les secondaires', type: 'info' },
      { text: 'Gardez vos clés API en sécurité — ne les partagez jamais', type: 'warning' },
      { text: 'Les boutiques connectées bénéficient de la mise à jour automatique des stocks en temps réel', type: 'pro' }
    ],
    videos: [
      { title: 'Connecter Shopify en 2 minutes', description: 'Guide pas-à-pas pour lier votre boutique Shopify', youtubeId: 'dQw4w9WgXcQ', duration: '3:30' }
    ],
    faqs: [
      { question: 'Combien de boutiques puis-je connecter ?', answer: 'Le nombre dépend de votre plan : Standard 1 boutique, Pro 3 boutiques, Ultra Pro illimité.' },
      { question: 'La connexion est-elle sécurisée ?', answer: 'Oui, nous utilisons OAuth 2.0 et les clés API sont chiffrées côté serveur.' }
    ],
    academyPath: '/academy'
  },

  research: {
    featureName: 'Veille & Recherche',
    description: 'Découvrez les produits gagnants, analysez la concurrence et suivez les tendances',
    level: 'beginner',
    keyFeatures: ['Produits gagnants', 'Analyse concurrence', 'Tendances marché', 'Score produit'],
    steps: [
      {
        title: 'Explorer les produits gagnants',
        description: 'Parcourez les produits tendance sélectionnés par l\'IA',
        detailedInstructions: [
          'La page d\'accueil affiche les produits les plus performants du moment',
          'Chaque produit affiche un score basé sur : tendance, marge, demande, concurrence',
          'Filtrez par catégorie, marge minimum ou volume de recherche'
        ]
      },
      {
        title: 'Rechercher par mot-clé',
        description: 'Trouvez des produits spécifiques dans toutes les sources',
        detailedInstructions: [
          'La barre de recherche interroge simultanément 6+ sources de données',
          'Les résultats incluent volume de recherche Google, tendance et estimations de ventes',
          'Sauvegardez vos recherches pour recevoir des alertes sur les nouvelles opportunités'
        ]
      },
      {
        title: 'Analyser une niche',
        description: 'Étudiez en profondeur le potentiel d\'une catégorie de produits'
      },
      {
        title: 'Surveiller les tendances',
        description: 'Suivez l\'évolution des niches et produits dans le temps'
      }
    ],
    tips: [
      { text: 'Les produits avec un score > 75 et une tendance haussière sont vos meilleures opportunités', type: 'pro' },
      { text: 'Diversifiez vos niches — ne misez pas tout sur un seul type de produit', type: 'warning' },
      { text: 'Consultez l\'onglet "Tendances" chaque semaine pour repérer les opportunités émergentes', type: 'info' }
    ],
    videos: [
      { title: 'Trouver un produit gagnant', description: 'Méthodologie complète pour identifier les winners', youtubeId: 'dQw4w9WgXcQ', duration: '9:45' }
    ],
    faqs: [
      { question: 'D\'où viennent les données ?', answer: 'Nous agrégeons des données de AliExpress, Amazon, Google Trends, réseaux sociaux et bases propriétaires.' },
      { question: 'À quelle fréquence les tendances sont-elles mises à jour ?', answer: 'Les scores et tendances sont recalculés quotidiennement.' }
    ],
    academyPath: '/academy'
  },

  printOnDemand: {
    featureName: 'Print on Demand',
    description: 'Créez et vendez des produits personnalisés sans stock grâce au print on demand',
    level: 'intermediate',
    keyFeatures: ['Design IA', 'Catalogue étendu', 'Sans stock', 'Fulfillment auto'],
    steps: [
      {
        title: 'Explorer le catalogue',
        description: 'Parcourez les produits disponibles : t-shirts, mugs, coques, posters...',
        detailedInstructions: [
          'L\'onglet "Catalogue" affiche tous les produits personnalisables disponibles',
          'Chaque produit indique les zones imprimables, tailles et couleurs disponibles',
          'Filtrez par catégorie pour trouver rapidement le support idéal'
        ]
      },
      {
        title: 'Créer un design IA',
        description: 'Décrivez votre design et l\'IA le génère pour vous',
        detailedInstructions: [
          'Saisissez une description du design souhaité dans le champ "Prompt"',
          'Choisissez le style : moderne, vintage, minimaliste, cartoon...',
          'L\'IA génère plusieurs variantes — sélectionnez votre préférée'
        ]
      },
      {
        title: 'Appliquer et prévisualiser',
        description: 'Placez le design sur le produit et vérifiez le rendu en mockup'
      },
      {
        title: 'Publier sur votre boutique',
        description: 'Le produit est créé et les commandes sont traitées automatiquement'
      }
    ],
    tips: [
      { text: 'Les designs simples avec des couleurs contrastées se vendent 40% mieux', type: 'pro' },
      { text: 'Commencez par les t-shirts — c\'est le produit POD avec la meilleure marge', type: 'info' },
      { text: 'Vérifiez les droits d\'auteur avant d\'utiliser des références culturelles dans vos designs', type: 'warning' }
    ],
    videos: [
      { title: 'Lancer votre marque POD', description: 'De l\'idée au premier produit en vente', youtubeId: 'dQw4w9WgXcQ', duration: '8:30' }
    ],
    faqs: [
      { question: 'Qui gère la production et l\'expédition ?', answer: 'Le fournisseur POD gère tout : impression, emballage et expédition. Vous n\'avez aucun stock à gérer.' },
      { question: 'Quelles sont les marges typiques ?', answer: 'Les marges varient de 20% à 50% selon le produit. Les t-shirts offrent généralement 30-40% de marge.' }
    ],
    academyPath: '/academy'
  },

  stockRepricing: {
    featureName: 'Stock Live & Repricing',
    description: 'Synchronisation stock temps réel et repricing automatique pour optimiser vos marges',
    level: 'advanced',
    keyFeatures: ['Sync stock temps réel', 'Repricing auto', 'Historique prix', 'Alertes stock'],
    steps: [
      {
        title: 'Configurer la synchronisation stock',
        description: 'Connectez vos sources de données pour un stock toujours à jour',
        detailedInstructions: [
          'Allez dans l\'onglet "Configuration" pour lier vos fournisseurs',
          'Définissez la fréquence de vérification : temps réel, 15min, 1h...',
          'Activez les alertes de rupture de stock pour être prévenu immédiatement'
        ]
      },
      {
        title: 'Définir les règles de repricing',
        description: 'Créez des règles pour ajuster automatiquement vos prix',
        detailedInstructions: [
          'L\'onglet "Règles de prix" permet de définir vos stratégies',
          'Règles courantes : marge minimum, alignement concurrence, prix psychologiques',
          'Testez vos règles en mode simulation avant de les activer'
        ]
      },
      {
        title: 'Surveiller l\'historique des prix',
        description: 'Analysez les évolutions de prix fournisseur et vos ajustements'
      },
      {
        title: 'Gérer les alertes',
        description: 'Configurez et consultez vos alertes stock bas et ruptures'
      }
    ],
    tips: [
      { text: 'Le repricing dynamique augmente les marges de 15% en moyenne sur les produits concurrentiels', type: 'pro' },
      { text: 'Définissez toujours un prix plancher pour éviter de vendre à perte', type: 'warning' },
      { text: 'L\'historique des prix vous aide à anticiper les variations saisonnières', type: 'info' }
    ],
    videos: [
      { title: 'Repricing intelligent', description: 'Automatisez vos ajustements de prix pour maximiser les marges', youtubeId: 'dQw4w9WgXcQ', duration: '7:00' }
    ],
    faqs: [
      { question: 'Le repricing peut-il vendre à perte ?', answer: 'Non, si vous configurez un prix plancher ou une marge minimum, le système ne descendra jamais en dessous.' }
    ],
    academyPath: '/academy'
  },

  chromeExtension: {
    featureName: 'Extension Chrome',
    description: 'Importez des produits directement depuis AliExpress, Amazon et autres avec l\'extension',
    level: 'beginner',
    keyFeatures: ['Import 1-clic', 'Calcul marge instant', 'Multi-plateformes', 'Sync automatique'],
    steps: [
      {
        title: 'Installer l\'extension',
        description: 'Téléchargez et installez l\'extension depuis cette page',
        detailedInstructions: [
          'Cliquez sur "Télécharger l\'extension" pour obtenir le fichier ZIP',
          'Ouvrez chrome://extensions dans votre navigateur',
          'Activez le "Mode développeur" et cliquez sur "Charger l\'extension non empaquetée"',
          'Sélectionnez le dossier décompressé de l\'extension'
        ]
      },
      {
        title: 'Connecter votre compte',
        description: 'Générez un token d\'accès et connectez l\'extension à ShopOpti',
        detailedInstructions: [
          'Cliquez sur "Générer un token" dans les paramètres ci-dessous',
          'Copiez le token et collez-le dans le popup de l\'extension',
          'L\'extension se connecte automatiquement à votre compte'
        ]
      },
      {
        title: 'Importer depuis les plateformes',
        description: 'Naviguez sur AliExpress ou Amazon et cliquez sur le bouton d\'import'
      },
      {
        title: 'Configurer les préférences',
        description: 'Ajustez la marge par défaut, la devise et les notifications'
      }
    ],
    tips: [
      { text: 'L\'extension calcule la marge en temps réel en tenant compte des frais de livraison', type: 'pro' },
      { text: 'Gardez l\'extension à jour pour bénéficier des derniers correctifs et fonctionnalités', type: 'info' },
      { text: 'Ne partagez jamais votre token d\'accès — il donne accès complet à votre compte', type: 'warning' }
    ],
    videos: [
      { title: 'Installation de l\'extension', description: 'Guide complet d\'installation pas-à-pas', youtubeId: 'dQw4w9WgXcQ', duration: '4:00' }
    ],
    faqs: [
      { question: 'L\'extension fonctionne-t-elle sur Firefox ?', answer: 'Pour le moment, l\'extension est disponible uniquement sur Chrome et les navigateurs basés sur Chromium (Edge, Brave, Opera).' },
      { question: 'Les données importées sont-elles sécurisées ?', answer: 'Oui, toutes les données transitent en HTTPS et sont stockées de manière chiffrée sur nos serveurs.' }
    ],
    academyPath: '/academy'
  },

  priceRules: {
    featureName: 'Règles de Prix',
    description: 'Définissez des règles de prix automatiques pour optimiser vos marges et rester compétitif',
    level: 'intermediate',
    keyFeatures: ['Règles dynamiques', 'Marge minimum', 'Prix psychologiques', 'Simulation'],
    steps: [
      {
        title: 'Créer une règle de prix',
        description: 'Définissez les conditions et l\'action de votre règle',
        detailedInstructions: [
          'Cliquez sur "Nouvelle règle" pour ouvrir le configurateur',
          'Choisissez le type : marge fixe, pourcentage, alignement, arrondi...',
          'Définissez les conditions d\'application : catégorie, fournisseur, plage de prix'
        ]
      },
      {
        title: 'Configurer les paramètres',
        description: 'Ajustez les seuils, marges et conditions d\'activation',
        detailedInstructions: [
          'Définissez la marge minimum pour ne jamais vendre à perte',
          'Activez les prix psychologiques (ex: 29,99€ au lieu de 30€)',
          'Configurez les exceptions par produit ou catégorie'
        ]
      },
      {
        title: 'Tester en simulation',
        description: 'Prévisualisez l\'impact de la règle avant de l\'activer'
      },
      {
        title: 'Activer et surveiller',
        description: 'Lancez la règle et suivez son impact sur vos marges'
      }
    ],
    tips: [
      { text: 'Les prix psychologiques (.99, .95) augmentent les conversions de 15-20%', type: 'pro' },
      { text: 'Testez toujours en simulation avant d\'activer une règle sur l\'ensemble du catalogue', type: 'warning' },
      { text: 'Combinez plusieurs règles avec des priorités pour une stratégie de pricing sophistiquée', type: 'info' }
    ],
    videos: [
      { title: 'Stratégie de pricing gagnante', description: 'Configurez vos règles pour maximiser les marges', youtubeId: 'dQw4w9WgXcQ', duration: '6:30' }
    ],
    faqs: [
      { question: 'Les règles s\'appliquent-elles rétroactivement ?', answer: 'Oui, quand vous activez une règle, elle recalcule les prix de tous les produits correspondants.' },
      { question: 'Puis-je exclure certains produits ?', answer: 'Oui, vous pouvez définir des exceptions par produit, catégorie ou fournisseur.' }
    ],
    academyPath: '/academy'
  },

  documentation: {
    featureName: 'Centre de Documentation',
    description: 'Accédez à tous les guides, tutoriels et FAQ pour maîtriser chaque module',
    level: 'beginner',
    keyFeatures: ['Guides complets', 'Recherche avancée', 'Par module', 'Niveaux de difficulté'],
    steps: [
      {
        title: 'Rechercher un sujet',
        description: 'Utilisez la barre de recherche pour trouver un guide spécifique',
        detailedInstructions: [
          'La recherche interroge titres, descriptions, FAQ et guides pas-à-pas',
          'Les résultats sont triés par pertinence avec mise en surbrillance',
          'Utilisez des mots-clés spécifiques pour des résultats plus précis'
        ]
      },
      {
        title: 'Explorer par catégorie',
        description: 'Parcourez les guides organisés par module fonctionnel'
      },
      {
        title: 'Suivre un guide pas-à-pas',
        description: 'Chaque module propose un tutoriel étape par étape avec captures'
      },
      {
        title: 'Consulter les FAQ',
        description: 'Trouvez rapidement les réponses aux questions les plus fréquentes'
      }
    ],
    tips: [
      { text: 'Chaque page de l\'application dispose de son propre guide contextuel en haut', type: 'info' },
      { text: 'Les guides sont classés par niveau : débutant, intermédiaire et avancé', type: 'info' }
    ],
    videos: [
      { title: 'Tour de la documentation', description: 'Comment naviguer efficacement dans les guides', youtubeId: 'dQw4w9WgXcQ', duration: '3:00' }
    ],
    faqs: [
      { question: 'Les guides sont-ils mis à jour ?', answer: 'Oui, les guides sont mis à jour à chaque nouvelle fonctionnalité ou changement majeur.' }
    ],
    academyPath: '/academy'
  },

  // ===== LOT 5: Pages restantes =====

  feedOptimization: {
    featureName: 'Optimisation IA des Feeds',
    description: 'Améliorez la qualité de vos flux produits avec l\'intelligence artificielle',
    level: 'intermediate',
    keyFeatures: ['Analyse qualité', 'Optimisation titres/descriptions', 'Score feed', 'Recommandations IA'],
    steps: [
      {
        title: 'Analyser vos produits',
        description: 'Lancez un scan IA pour évaluer la qualité de vos fiches produit',
        detailedInstructions: [
          'Cliquez sur "Analyser" pour scanner jusqu\'à 20 produits',
          'Chaque produit reçoit un score de 0 à 100 basé sur la complétude des données',
          'Les problèmes critiques (titres courts, descriptions manquantes) sont surlignés en rouge'
        ]
      },
      {
        title: 'Consulter les recommandations',
        description: 'L\'IA propose des actions prioritaires classées par impact',
      },
      {
        title: 'Optimiser avec l\'IA',
        description: 'Générez automatiquement des titres et descriptions optimisés',
      },
      {
        title: 'Appliquer les changements',
        description: 'Validez et appliquez les optimisations en un clic'
      }
    ],
    tips: [
      { text: 'Commencez par les produits avec un score < 60 pour un impact maximal', type: 'pro' },
      { text: 'Les titres optimisés contiennent marque + type + attribut clé + taille/couleur', type: 'info' },
      { text: 'Revérifiez toujours les textes générés par l\'IA avant de les appliquer', type: 'warning' }
    ],
    videos: [
      { title: 'Optimiser ses feeds en 5 minutes', description: 'Augmentez vos ventes avec des fiches parfaites', youtubeId: 'dQw4w9WgXcQ', duration: '5:30' }
    ],
    faqs: [
      { question: 'Combien de produits puis-je optimiser ?', answer: 'Vous pouvez analyser 20 produits à la fois et optimiser 5 produits par batch avec l\'IA.' },
      { question: 'Les changements sont-ils réversibles ?', answer: 'Oui, l\'original est conservé et vous pouvez annuler chaque optimisation.' }
    ],
    academyPath: '/academy'
  },

  feedRules: {
    featureName: 'Règles de Feeds',
    description: 'Créez des règles IF/THEN pour transformer automatiquement vos flux produits',
    level: 'advanced',
    keyFeatures: ['Règles IF/THEN', 'Transformations auto', 'Conditions avancées', 'Templates'],
    steps: [
      {
        title: 'Créer une règle',
        description: 'Cliquez sur "Nouvelle règle" pour ouvrir l\'éditeur de règles',
        detailedInstructions: [
          'Définissez la condition IF : champ, opérateur et valeur (ex: SI titre contient "test")',
          'Définissez l\'action THEN : modifier, supprimer, enrichir le champ cible',
          'Testez la règle sur un échantillon avant de l\'activer'
        ]
      },
      {
        title: 'Configurer les conditions',
        description: 'Combinez plusieurs conditions avec ET/OU pour des règles précises'
      },
      {
        title: 'Tester et valider',
        description: 'Prévisualisez l\'impact de la règle sur vos produits existants'
      },
      {
        title: 'Activer et monitorer',
        description: 'Activez la règle et suivez son exécution dans les logs'
      }
    ],
    tips: [
      { text: 'Les règles de nettoyage (suppression HTML, normalisation) sont les plus rentables', type: 'pro' },
      { text: 'Testez toujours sur un petit échantillon avant d\'activer en production', type: 'warning' }
    ],
    videos: [
      { title: 'Règles IF/THEN pour feeds', description: 'Automatisez la transformation de vos flux', youtubeId: 'dQw4w9WgXcQ', duration: '7:00' }
    ],
    faqs: [
      { question: 'Combien de règles puis-je créer ?', answer: 'Illimité. Les règles sont exécutées dans l\'ordre de priorité que vous définissez.' }
    ],
    academyPath: '/academy'
  },

  aiContent: {
    featureName: 'Contenu IA Avancé',
    description: 'Générez des descriptions, titres et contenus SEO automatiquement avec l\'IA',
    level: 'intermediate',
    keyFeatures: ['Descriptions IA', 'Titres optimisés', 'Templates', 'Batch generation'],
    steps: [
      {
        title: 'Choisir un template',
        description: 'Sélectionnez un modèle de contenu adapté à votre niche',
      },
      {
        title: 'Configurer les paramètres',
        description: 'Ajustez le ton, la langue et la longueur du contenu généré'
      },
      {
        title: 'Générer le contenu',
        description: 'L\'IA crée le contenu en quelques secondes à partir de vos données produit'
      },
      {
        title: 'Appliquer et publier',
        description: 'Validez le contenu et appliquez-le à vos fiches produit'
      }
    ],
    tips: [
      { text: 'Les descriptions de 150-300 mots avec des bullets points convertissent le mieux', type: 'pro' },
      { text: 'Utilisez le mode batch pour traiter des dizaines de produits en une fois', type: 'info' }
    ],
    videos: [
      { title: 'Contenu IA pour e-commerce', description: 'Rédaction automatique de fiches produit', youtubeId: 'dQw4w9WgXcQ', duration: '6:00' }
    ],
    faqs: [
      { question: 'Le contenu IA est-il unique ?', answer: 'Oui, chaque génération produit un texte original adapté à votre produit spécifique.' }
    ],
    academyPath: '/academy'
  },

  productAudit: {
    featureName: 'Audit Catalogue',
    description: 'Évaluez la qualité de vos fiches produit avec des scores détaillés et recommandations',
    level: 'intermediate',
    keyFeatures: ['Score global', 'Audit SEO', 'Audit images', 'Recommandations'],
    steps: [
      {
        title: 'Lancer l\'audit',
        description: 'L\'audit analyse automatiquement tous vos produits dès le chargement',
      },
      {
        title: 'Consulter les scores',
        description: 'Chaque produit reçoit un score sur 4 axes : SEO, contenu, images, données'
      },
      {
        title: 'Identifier les priorités',
        description: 'Les produits critiques (score < 40) nécessitent une action immédiate'
      },
      {
        title: 'Corriger et améliorer',
        description: 'Cliquez sur un produit pour voir les recommandations détaillées'
      }
    ],
    tips: [
      { text: 'Visez un score moyen > 70 pour un catalogue de qualité professionnelle', type: 'pro' },
      { text: 'Les images sont le premier critère de conversion — assurez-vous d\'en avoir au moins 3', type: 'info' }
    ],
    videos: [
      { title: 'Audit catalogue complet', description: 'Améliorez la qualité de vos fiches en 10 minutes', youtubeId: 'dQw4w9WgXcQ', duration: '8:00' }
    ],
    faqs: [
      { question: 'Comment est calculé le score ?', answer: 'Le score agrège 4 critères pondérés : titre (≥10 car.), description (≥50 car.), images et complétude des données.' }
    ],
    academyPath: '/academy'
  },

  productScoring: {
    featureName: 'Scoring Produits IA',
    description: 'Analysez et améliorez le score de qualité de vos fiches produits avec l\'IA',
    level: 'intermediate',
    keyFeatures: ['Score IA', 'Analyse multi-critères', 'Suggestions auto', 'Benchmark'],
    steps: [
      {
        title: 'Analyser vos produits',
        description: 'Le scoring IA évalue automatiquement chaque produit de votre catalogue'
      },
      {
        title: 'Comprendre les scores',
        description: 'Chaque score est décomposé en critères : pertinence, complétude, SEO, attractivité'
      },
      {
        title: 'Appliquer les suggestions',
        description: 'L\'IA propose des améliorations concrètes pour chaque critère'
      },
      {
        title: 'Suivre la progression',
        description: 'Comparez vos scores dans le temps pour mesurer vos progrès'
      }
    ],
    tips: [
      { text: 'Un score > 80 place vos produits dans le top 10% des catalogues e-commerce', type: 'pro' },
      { text: 'Le scoring est recalculé à chaque modification — surveillez l\'évolution', type: 'info' }
    ],
    videos: [
      { title: 'Scoring IA expliqué', description: 'Comprenez chaque critère et améliorez vos scores', youtubeId: 'dQw4w9WgXcQ', duration: '5:00' }
    ],
    faqs: [
      { question: 'Le scoring consomme-t-il des crédits IA ?', answer: 'L\'analyse initiale est gratuite. Les suggestions d\'amélioration utilisent des crédits IA.' }
    ],
    academyPath: '/academy'
  },

  orders: {
    featureName: 'Centre de Commandes',
    description: 'Vue unifiée de toutes vos commandes avec gestion avancée et suivi en temps réel',
    level: 'beginner',
    keyFeatures: ['Suivi temps réel', 'Import Shopify', 'Export CSV', 'Auto-Order'],
    steps: [
      {
        title: 'Consulter vos commandes',
        description: 'Le tableau de bord affiche toutes vos commandes avec filtres et recherche',
        detailedInstructions: [
          'Utilisez la barre de recherche pour trouver par numéro ou client',
          'Filtrez par statut : en attente, traitement, expédié, livré',
          'Triez par date ou montant selon vos besoins'
        ]
      },
      {
        title: 'Mettre à jour les statuts',
        description: 'Faites avancer chaque commande dans le workflow en un clic'
      },
      {
        title: 'Importer depuis Shopify',
        description: 'Synchronisez automatiquement vos commandes Shopify'
      },
      {
        title: 'Exporter les données',
        description: 'Exportez vos commandes filtrées en CSV pour vos rapports'
      }
    ],
    tips: [
      { text: 'Activez l\'Auto-Order pour traiter automatiquement les commandes fournisseurs', type: 'pro' },
      { text: 'Importez régulièrement depuis Shopify pour garder vos données synchronisées', type: 'info' }
    ],
    videos: [
      { title: 'Gestion des commandes', description: 'Maîtrisez le centre de commandes en 5 minutes', youtubeId: 'dQw4w9WgXcQ', duration: '5:00' }
    ],
    faqs: [
      { question: 'Puis-je automatiser le traitement ?', answer: 'Oui, l\'onglet Auto-Order permet de configurer le traitement automatique des commandes chez vos fournisseurs.' }
    ],
    academyPath: '/academy'
  },

  bulkOrders: {
    featureName: 'Commandes Groupées',
    description: 'Regroupez vos achats fournisseurs pour optimiser les coûts d\'expédition',
    level: 'intermediate',
    keyFeatures: ['Multi-fournisseurs', 'Optimisation coûts', 'Suivi groupé', 'Rapports'],
    steps: [
      {
        title: 'Créer une commande groupée',
        description: 'Regroupez plusieurs commandes client pour un même fournisseur'
      },
      {
        title: 'Optimiser les lots',
        description: 'L\'IA regroupe automatiquement par fournisseur pour minimiser les frais'
      },
      {
        title: 'Passer les commandes',
        description: 'Validez et envoyez les commandes groupées à chaque fournisseur'
      },
      {
        title: 'Suivre les livraisons',
        description: 'Suivez l\'avancement de chaque lot avec tracking centralisé'
      }
    ],
    tips: [
      { text: 'Regrouper 5+ commandes réduit les frais d\'expédition de 30% en moyenne', type: 'pro' },
      { text: 'Attendez d\'avoir un volume suffisant avant de passer la commande groupée', type: 'info' }
    ],
    videos: [
      { title: 'Commandes groupées', description: 'Économisez sur les frais de port', youtubeId: 'dQw4w9WgXcQ', duration: '4:30' }
    ],
    faqs: [
      { question: 'Quel est le minimum de commandes pour un groupage ?', answer: 'Il n\'y a pas de minimum, mais le bénéfice commence à partir de 3-5 commandes par fournisseur.' }
    ],
    academyPath: '/academy'
  },

  stockManagement: {
    featureName: 'Gestion des Stocks',
    description: 'Gérez votre inventaire multi-entrepôts avec alertes automatiques et suivi temps réel',
    level: 'intermediate',
    keyFeatures: ['Multi-entrepôts', 'Alertes stock bas', 'Mouvements tracés', 'Variantes'],
    steps: [
      {
        title: 'Configurer les entrepôts',
        description: 'Ajoutez vos emplacements de stockage avec capacité et localisation'
      },
      {
        title: 'Suivre les niveaux de stock',
        description: 'Consultez les niveaux en temps réel par produit et par entrepôt'
      },
      {
        title: 'Configurer les alertes',
        description: 'Définissez des seuils d\'alerte pour chaque produit ou catégorie'
      },
      {
        title: 'Enregistrer les mouvements',
        description: 'Tracez chaque entrée, sortie ou transfert de stock'
      }
    ],
    tips: [
      { text: 'Définissez un seuil d\'alerte à 2x le délai de réapprovisionnement moyen', type: 'pro' },
      { text: 'Les mouvements de stock sont journalisés pour l\'audit et la traçabilité', type: 'info' }
    ],
    videos: [
      { title: 'Gestion de stock avancée', description: 'Multi-entrepôts et alertes automatiques', youtubeId: 'dQw4w9WgXcQ', duration: '7:00' }
    ],
    faqs: [
      { question: 'Puis-je gérer des variantes ?', answer: 'Oui, l\'onglet Variantes permet de gérer les stocks par taille, couleur et autres options.' }
    ],
    academyPath: '/academy'
  },

  flashSales: {
    featureName: 'Ventes Flash',
    description: 'Créez l\'urgence et boostez vos ventes avec des offres limitées dans le temps',
    level: 'intermediate',
    keyFeatures: ['Countdown', 'Templates', 'Statistiques', 'Programmation'],
    steps: [
      {
        title: 'Créer une vente flash',
        description: 'Choisissez les produits, le pourcentage de réduction et la durée'
      },
      {
        title: 'Configurer le timing',
        description: 'Programmez la date de début et la durée (2h, 24h, 48h...)'
      },
      {
        title: 'Suivre en temps réel',
        description: 'Surveillez les ventes, le stock restant et le taux de conversion'
      },
      {
        title: 'Analyser les résultats',
        description: 'Consultez le rapport post-vente avec métriques détaillées'
      }
    ],
    tips: [
      { text: 'Les ventes flash de 24h avec -40% ou plus génèrent le meilleur engagement', type: 'pro' },
      { text: 'Prévenez vos abonnés 24h avant par email pour maximiser le trafic', type: 'info' }
    ],
    videos: [
      { title: 'Créer une vente flash qui convertit', description: 'Stratégies pour maximiser vos ventes éclair', youtubeId: 'dQw4w9WgXcQ', duration: '5:00' }
    ],
    faqs: [
      { question: 'Puis-je programmer à l\'avance ?', answer: 'Oui, vous pouvez programmer vos ventes flash jusqu\'à 30 jours à l\'avance.' }
    ],
    academyPath: '/academy'
  },

  marketplace: {
    featureName: 'Hub Marketplace',
    description: 'Gérez tous vos canaux de vente marketplace depuis une interface unique',
    level: 'intermediate',
    keyFeatures: ['Multi-marketplace', 'Sync centralisée', 'Gestion listings', 'Performance'],
    steps: [
      {
        title: 'Connecter une marketplace',
        description: 'Ajoutez vos comptes Amazon, eBay, Cdiscount et autres marketplaces'
      },
      {
        title: 'Publier vos produits',
        description: 'Sélectionnez les produits à publier et configurez les prix par canal'
      },
      {
        title: 'Synchroniser les données',
        description: 'Les stocks et commandes sont synchronisés automatiquement'
      },
      {
        title: 'Analyser les performances',
        description: 'Comparez les ventes et la rentabilité par marketplace'
      }
    ],
    tips: [
      { text: 'Adaptez vos prix par marketplace pour tenir compte des commissions (15-20%)', type: 'pro' },
      { text: 'Commencez par Amazon puis étendez aux autres marketplaces', type: 'info' }
    ],
    videos: [
      { title: 'Vendre sur les marketplaces', description: 'Guide multi-canal pour maximiser vos ventes', youtubeId: 'dQw4w9WgXcQ', duration: '8:00' }
    ],
    faqs: [
      { question: 'Quelles marketplaces sont supportées ?', answer: 'Amazon, eBay, Cdiscount, Rakuten, ManoMano, Fnac et les principales places de marché européennes.' }
    ],
    academyPath: '/academy'
  },

  warehouse: {
    featureName: 'Gestion des Entrepôts',
    description: 'Gérez vos entrepôts et stocks multi-localisations',
    level: 'advanced',
    keyFeatures: ['Multi-localisations', 'Capacité', 'Transferts', 'Alertes'],
    steps: [
      {
        title: 'Ajouter un entrepôt',
        description: 'Renseignez le nom, la localisation et la capacité de stockage'
      },
      {
        title: 'Configurer l\'inventaire',
        description: 'Assignez des produits et définissez les niveaux de stock par entrepôt'
      },
      {
        title: 'Gérer les transferts',
        description: 'Transférez du stock entre entrepôts selon la demande géographique'
      },
      {
        title: 'Surveiller les alertes',
        description: 'Recevez des notifications pour les stocks bas et ruptures'
      }
    ],
    tips: [
      { text: 'Répartissez votre stock selon la demande géographique pour réduire les délais', type: 'pro' },
      { text: 'Un entrepôt par zone de livraison optimise les coûts de 25%', type: 'info' }
    ],
    videos: [
      { title: 'Gestion multi-entrepôts', description: 'Optimisez votre logistique', youtubeId: 'dQw4w9WgXcQ', duration: '6:00' }
    ],
    faqs: [
      { question: 'Puis-je gérer des entrepôts à l\'étranger ?', answer: 'Oui, le système supporte les entrepôts multi-pays avec gestion des devises et réglementations locales.' }
    ],
    academyPath: '/academy'
  },

  notifications: {
    featureName: 'Centre de Notifications',
    description: 'Consultez vos alertes, gérez vos préférences et restez informé en temps réel',
    level: 'beginner',
    keyFeatures: ['Alertes temps réel', 'Catégories', 'Préférences', 'Filtres'],
    steps: [
      {
        title: 'Consulter les notifications',
        description: 'Parcourez toutes vos alertes classées par catégorie et priorité'
      },
      {
        title: 'Filtrer par catégorie',
        description: 'Utilisez les filtres pour voir uniquement commandes, stock, marketing...'
      },
      {
        title: 'Configurer les préférences',
        description: 'Choisissez quels types d\'alertes vous souhaitez recevoir'
      },
      {
        title: 'Marquer et nettoyer',
        description: 'Marquez comme lu ou supprimez les notifications traitées'
      }
    ],
    tips: [
      { text: 'Activez les alertes stock bas et commandes pour ne rien manquer d\'important', type: 'pro' },
      { text: 'Nettoyez régulièrement vos notifications lues pour garder une vue claire', type: 'info' }
    ],
    videos: [
      { title: 'Gérer ses notifications', description: 'Ne manquez plus aucune alerte importante', youtubeId: 'dQw4w9WgXcQ', duration: '3:00' }
    ],
    faqs: [
      { question: 'Puis-je recevoir des alertes par email ?', answer: 'Oui, activez les notifications email dans l\'onglet Préférences pour chaque catégorie.' }
    ],
    academyPath: '/academy'
  },

  // ========== NEW MODULES ==========

  'pre-import-rules': {
    featureName: 'Règles de Pré-Import',
    description: 'Définissez des filtres et règles automatiques avant l\'import dans votre catalogue.',
    level: 'intermediate',
    keyFeatures: ['Filtrage par marge', 'Seuil de stock', 'Auto-catégorisation', 'Mode simulation'],
    steps: [
      { title: 'Accéder aux règles', description: 'Naviguez vers Import > Règles de pré-import' },
      { title: 'Créer une règle', description: 'Définissez le type : marge, stock, catégorie ou pricing' },
      { title: 'Configurer les conditions', description: 'Paramétrez seuils, mots-clés et formules' },
      { title: 'Tester en simulation', description: 'Vérifiez l\'impact sans modifier de données' },
      { title: 'Activer la règle', description: 'Basculez le switch pour appliquer aux prochains imports' }
    ],
    tips: [
      { text: 'Commencez par une règle de marge minimum à 30% pour filtrer les produits non rentables', type: 'pro' },
      { text: 'Testez toujours en mode simulation avant d\'activer une règle en production', type: 'warning' },
      { text: 'Utilisez des priorités en multiples de 10 pour pouvoir insérer des règles entre deux existantes', type: 'info' }
    ],
    videos: [
      { title: 'Pipeline d\'import automatisé', description: 'Créez un pipeline de règles en cascade', youtubeId: 'dQw4w9WgXcQ', duration: '7:00' }
    ],
    faqs: [
      { question: 'Les règles s\'appliquent-elles aux produits existants ?', answer: 'Non, uniquement aux nouveaux imports. Utilisez les règles de catalogue pour les produits existants.' },
      { question: 'Puis-je avoir des règles par fournisseur ?', answer: 'Oui, chaque règle peut être conditionnée par le fournisseur source.' },
      { question: 'Le mode simulation consomme-t-il des crédits ?', answer: 'Non, la simulation est gratuite et illimitée.' }
    ],
    academyPath: '/academy'
  },

  'item-retry': {
    featureName: 'Retry Granulaire par Élément',
    description: 'Relancez individuellement les éléments échoués d\'un job batch.',
    level: 'intermediate',
    keyFeatures: ['Retry individuel', 'Retry en lot', 'Log d\'erreur détaillé', 'Export erreurs'],
    steps: [
      { title: 'Ouvrir le job concerné', description: 'Cliquez sur le job partiellement échoué dans la liste' },
      { title: 'Filtrer les éléments échoués', description: 'Utilisez le filtre Statut: Échoué' },
      { title: 'Analyser les erreurs', description: 'Consultez le message d\'erreur de chaque item' },
      { title: 'Corriger et relancer', description: 'Cliquez Retry sur un item ou Retry All Failed' }
    ],
    tips: [
      { text: 'Analysez la cause d\'erreur avant de retenter — un retry sans correction échouera à nouveau', type: 'warning' },
      { text: 'Quand 10%+ des items échouent avec le même message, c\'est un problème systémique', type: 'pro' },
      { text: 'Exportez la liste des erreurs pour une analyse hors-ligne', type: 'info' }
    ],
    videos: [
      { title: 'Résoudre les erreurs d\'import', description: 'Diagnostic et retry efficace', youtubeId: 'dQw4w9WgXcQ', duration: '4:00' }
    ],
    faqs: [
      { question: 'Combien de fois puis-je retenter un item ?', answer: 'Par défaut 3 tentatives, configurable jusqu\'à 10 dans les paramètres avancés.' },
      { question: 'Le retry est-il facturé ?', answer: 'Non, les retry ne consomment pas de crédits supplémentaires.' }
    ],
    academyPath: '/academy'
  },

  'enrichment-snapshots': {
    featureName: 'Snapshots d\'Enrichissement IA',
    description: 'Comparez les versions avant/après de vos fiches produit enrichies par l\'IA.',
    level: 'advanced',
    keyFeatures: ['Diff côte-à-côte', 'Score qualité', 'Restauration 1-clic', 'Historique complet'],
    steps: [
      { title: 'Accéder aux Snapshots', description: 'Naviguez vers IA > Snapshots d\'enrichissement' },
      { title: 'Sélectionner un snapshot', description: 'Cliquez sur une ligne pour voir le diff complet' },
      { title: 'Comparer avant/après', description: 'Vue côte-à-côte avec changements surlignés' },
      { title: 'Restaurer si nécessaire', description: 'Revenez à la version précédente en un clic' }
    ],
    tips: [
      { text: 'Vérifiez au moins 10% des produits enrichis via les snapshots pour un contrôle qualité', type: 'pro' },
      { text: 'Les icônes de couleur indiquent le type de changement : vert = ajout, orange = modification', type: 'info' },
      { text: 'L\'IA peut parfois produire des résultats inadaptés — un contrôle régulier est essentiel', type: 'warning' }
    ],
    videos: [
      { title: 'Contrôle qualité IA', description: 'Validez vos enrichissements IA efficacement', youtubeId: 'dQw4w9WgXcQ', duration: '5:00' }
    ],
    faqs: [
      { question: 'Les snapshots sont-ils conservés indéfiniment ?', answer: 'Oui, l\'historique complet est conservé sans limite de temps.' },
      { question: 'Puis-je restaurer partiellement ?', answer: 'Oui, vous pouvez restaurer un champ spécifique sans affecter les autres.' }
    ],
    academyPath: '/academy'
  },

  'revenue-forecasting': {
    featureName: 'Prévisions de Revenus',
    description: 'Projetez vos revenus futurs avec 3 scénarios : optimiste, réaliste, pessimiste.',
    level: 'advanced',
    keyFeatures: ['Projections 30-60-90j', '3 scénarios', 'Graphiques interactifs', 'Export PDF'],
    steps: [
      { title: 'Accéder au cockpit financier', description: 'Naviguez vers Analytics > Prévisions de revenus' },
      { title: 'Choisir la période', description: 'Sélectionnez 30, 60 ou 90 jours de projection' },
      { title: 'Analyser les scénarios', description: 'Optimiste (vert), Réaliste (bleu), Pessimiste (orange)' },
      { title: 'Consulter les KPIs', description: 'Revenu projeté, croissance, marge par scénario' },
      { title: 'Exporter ou partager', description: 'Générez un PDF pour vos rapports' }
    ],
    tips: [
      { text: 'Basez vos décisions sur le scénario réaliste, gardez l\'optimiste comme objectif', type: 'pro' },
      { text: 'Les projections deviennent fiables après 3 mois d\'historique de ventes', type: 'info' },
      { text: 'Comparez chaque mois vos prévisions passées avec le réalisé pour calibrer le modèle', type: 'pro' }
    ],
    videos: [
      { title: 'Cockpit financier', description: 'Anticipez vos revenus avec l\'IA', youtubeId: 'dQw4w9WgXcQ', duration: '6:00' }
    ],
    faqs: [
      { question: 'Les prévisions incluent-elles les frais ?', answer: 'Les projections affichent le revenu brut. La marge est calculée séparément.' },
      { question: 'La saisonnalité est-elle prise en compte ?', answer: 'Oui, après 12 mois d\'historique, le modèle intègre les variations saisonnières.' }
    ],
    academyPath: '/academy'
  },

  'image-deduplication': {
    featureName: 'Déduplication d\'Images',
    description: 'Détectez et fusionnez les images dupliquées grâce au hashing perceptuel.',
    level: 'intermediate',
    keyFeatures: ['Hashing perceptuel', 'Score similarité', 'Fusion 1-clic', 'Espace récupéré'],
    steps: [
      { title: 'Accéder à la déduplication', description: 'Naviguez vers Catalogue > Déduplication d\'images' },
      { title: 'Lancer le scan', description: 'Analysez toutes les images du catalogue' },
      { title: 'Ajuster le seuil', description: '95% = quasi-identiques, 80% = très similaires' },
      { title: 'Vérifier les résultats', description: 'Prévisualisation côte-à-côte avec score de similarité' },
      { title: 'Fusionner ou supprimer', description: 'Conservez la meilleure qualité et fusionnez les doublons' }
    ],
    tips: [
      { text: 'Commencez avec un seuil élevé (95%) — les images à ce niveau sont presque toujours de vrais doublons', type: 'pro' },
      { text: 'Un seuil < 75% peut détecter des faux positifs (variantes de couleur)', type: 'warning' },
      { text: 'Scannez après chaque gros import multi-fournisseurs', type: 'info' }
    ],
    videos: [
      { title: 'Nettoyage d\'images', description: 'Éliminez les doublons en 5 minutes', youtubeId: 'dQw4w9WgXcQ', duration: '4:00' }
    ],
    faqs: [
      { question: 'Le scan supprime-t-il automatiquement ?', answer: 'Non, le scan détecte uniquement. Vous confirmez chaque fusion manuellement.' },
      { question: 'Quelle est la différence avec un hash MD5 ?', answer: 'Le pHash détecte les images visuellement similaires même avec des résolutions différentes, contrairement au MD5.' }
    ],
    academyPath: '/academy'
  },

  'domain-registration': {
    featureName: 'Enregistrement de Domaines',
    description: 'Achetez et gérez vos noms de domaine directement depuis ShopOpti+.',
    level: 'beginner',
    keyFeatures: ['Recherche instantanée', '+20 extensions', 'SSL inclus', 'DNS automatique'],
    steps: [
      { title: 'Rechercher un domaine', description: 'Saisissez le nom souhaité dans la barre de recherche' },
      { title: 'Comparer les prix', description: 'Prix de première année vs renouvellement par extension' },
      { title: 'Acheter le domaine', description: 'Sélectionnez et procédez au paiement' },
      { title: 'Configurer les DNS', description: 'DNS préconfigurés pour pointer vers votre boutique' },
      { title: 'Connecter à une boutique', description: 'Assignez le domaine à votre boutique' }
    ],
    tips: [
      { text: 'Les extensions .store et .shop ont un CTR 15% supérieur pour le e-commerce', type: 'pro' },
      { text: 'Activez le renouvellement automatique pour ne pas perdre votre domaine', type: 'warning' },
      { text: 'Protégez votre marque en enregistrant les principales extensions (.com, .fr, .store)', type: 'pro' }
    ],
    videos: [
      { title: 'Votre domaine en 5 min', description: 'Achat et configuration complète', youtubeId: 'dQw4w9WgXcQ', duration: '5:00' }
    ],
    faqs: [
      { question: 'Puis-je transférer un domaine existant ?', answer: 'Oui, le transfert prend 5-7 jours et nécessite le code de transfert de votre registraire.' },
      { question: 'Le SSL est-il inclus ?', answer: 'Oui, un certificat SSL Let\'s Encrypt est provisionné et renouvelé automatiquement.' }
    ],
    academyPath: '/academy'
  },

  'sourcing-agent': {
    featureName: 'Agent de Sourcing IA',
    description: 'Automatisez vos demandes de devis fournisseurs avec l\'intelligence artificielle.',
    level: 'advanced',
    keyFeatures: ['Devis automatisés', 'Relances IA', 'Comparaison multi-fournisseurs', 'Export PDF'],
    steps: [
      { title: 'Créer une requête', description: 'Décrivez le produit avec spécifications et quantités' },
      { title: 'Sélectionner les fournisseurs', description: 'Choisissez ou laissez l\'IA sélectionner les plus pertinents' },
      { title: 'Envoyer les demandes', description: 'L\'IA rédige et envoie les demandes personnalisées' },
      { title: 'Suivre les réponses', description: 'Dashboard avec relances automatiques après 48h' },
      { title: 'Comparer et choisir', description: 'Tableau comparatif par prix, qualité et délai' }
    ],
    tips: [
      { text: 'Plus la description est précise, meilleures seront les réponses fournisseurs', type: 'pro' },
      { text: 'Contactez minimum 3 fournisseurs pour un benchmark prix fiable', type: 'info' },
      { text: 'Les fournisseurs sont plus négociables en mars-avril et septembre', type: 'pro' }
    ],
    videos: [
      { title: 'Sourcing automatisé', description: 'Trouvez les meilleurs prix fournisseurs', youtubeId: 'dQw4w9WgXcQ', duration: '6:00' }
    ],
    faqs: [
      { question: 'L\'IA contacte-t-elle directement les fournisseurs ?', answer: 'L\'IA prépare les messages, vous pouvez prévisualiser et modifier avant l\'envoi.' },
      { question: 'Combien de requêtes par mois ?', answer: 'Pro: 20/mois, Ultra Pro: illimité.' }
    ],
    academyPath: '/academy'
  },

  'webhook-management': {
    featureName: 'Gestion des Webhooks',
    description: 'Connectez ShopOpti+ à vos outils tiers avec des notifications en temps réel.',
    level: 'advanced',
    keyFeatures: ['12 types d\'événements', 'Signature HMAC', 'Outil de test', 'Retry automatique'],
    steps: [
      { title: 'Créer un webhook', description: 'Nommez et renseignez l\'URL de destination' },
      { title: 'Sélectionner les événements', description: 'Cochez : order.*, product.*, stock.*, etc.' },
      { title: 'Configurer la sécurité', description: 'Définissez un secret HMAC pour signer les payloads' },
      { title: 'Tester le webhook', description: 'Envoyez un payload d\'exemple à votre endpoint' },
      { title: 'Activer et monitorer', description: 'Consultez les logs de livraison en temps réel' }
    ],
    tips: [
      { text: 'Validez toujours la signature HMAC côté serveur pour éviter les injections', type: 'warning' },
      { text: 'Votre endpoint doit répondre 200 en < 5 secondes — traitez de manière asynchrone', type: 'pro' },
      { text: 'Utilisez webhook.site pour tester avant de connecter votre vrai endpoint', type: 'info' }
    ],
    videos: [
      { title: 'Intégration Webhooks', description: 'Connectez vos outils en temps réel', youtubeId: 'dQw4w9WgXcQ', duration: '8:00' }
    ],
    faqs: [
      { question: 'Combien de webhooks puis-je créer ?', answer: 'Pro: 5, Ultra Pro: illimité. Chaque webhook peut écouter plusieurs événements.' },
      { question: 'Les retry sont-ils automatiques ?', answer: 'Oui, 3 tentatives avec backoff exponentiel (1min, 5min, 30min).' }
    ],
    academyPath: '/academy'
  },

  'data-export': {
    featureName: 'Centre d\'Export de Données',
    description: 'Exportez vos données en CSV, XLSX, JSON ou XML avec filtres et planification.',
    level: 'beginner',
    keyFeatures: ['4 formats', 'Filtres avancés', 'Export planifié', 'Compression ZIP'],
    steps: [
      { title: 'Choisir le type de données', description: 'Produits, Commandes, Clients ou Analytics' },
      { title: 'Appliquer les filtres', description: 'Date, statut, catégorie ou autre critère' },
      { title: 'Sélectionner le format', description: 'CSV, XLSX, JSON ou XML selon votre besoin' },
      { title: 'Lancer l\'export', description: 'Cliquez Exporter — les gros volumes sont traités en arrière-plan' },
      { title: 'Télécharger', description: 'Le fichier est disponible dans l\'historique (expire après 7 jours)' }
    ],
    tips: [
      { text: 'CSV est le format le plus universel. XLSX si vous utilisez Excel pour l\'analyse.', type: 'info' },
      { text: 'Planifiez des exports récurrents pour vos rapports hebdomadaires', type: 'pro' },
      { text: 'Les exports 100 000+ lignes sont plus rapides en CSV qu\'en XLSX', type: 'info' }
    ],
    videos: [
      { title: 'Exporter ses données', description: 'Guide complet multi-format', youtubeId: 'dQw4w9WgXcQ', duration: '4:00' }
    ],
    faqs: [
      { question: 'Y a-t-il une limite de lignes ?', answer: 'Non, mais les exports 50 000+ lignes sont compressés en ZIP automatiquement.' },
      { question: 'Puis-je choisir les colonnes ?', answer: 'Oui, sélectionnez les colonnes spécifiques pour chaque type de données.' }
    ],
    academyPath: '/academy'
  },

  'notification-preferences': {
    featureName: 'Préférences de Notifications',
    description: 'Contrôlez finement vos alertes par canal et catégorie.',
    level: 'beginner',
    keyFeatures: ['9 catégories', '3 canaux', 'Ne pas déranger', 'Résumé quotidien'],
    steps: [
      { title: 'Accéder aux préférences', description: 'Paramètres > Préférences de notifications' },
      { title: 'Configurer par catégorie', description: 'Activez/désactivez Email, Push, In-App pour chaque catégorie' },
      { title: 'Utiliser les raccourcis', description: '"Tout activer" / "Tout désactiver" par canal' },
      { title: 'Sauvegarder', description: 'Les préférences prennent effet immédiatement' }
    ],
    tips: [
      { text: 'Gardez Commandes, Stock et Sécurité toujours activés sur au moins un canal', type: 'warning' },
      { text: 'Push pour l\'urgent, email pour le suivi, in-app pour l\'historique', type: 'pro' },
      { text: 'Activez le résumé quotidien email pour un récapitulatif chaque matin', type: 'info' }
    ],
    videos: [
      { title: 'Configurer ses alertes', description: 'Ne manquez plus rien d\'important', youtubeId: 'dQw4w9WgXcQ', duration: '3:00' }
    ],
    faqs: [
      { question: 'Les push ne fonctionnent pas', answer: 'Vérifiez les autorisations du navigateur dans les paramètres système.' },
      { question: 'Puis-je configurer des horaires ?', answer: 'Oui, le mode "Ne pas déranger" permet de définir des plages sans push.' }
    ],
    academyPath: '/academy'
  }
}
