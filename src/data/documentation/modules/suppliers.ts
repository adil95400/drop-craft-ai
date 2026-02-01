import type { ModuleDocumentation } from '../types';

export const suppliersDocumentation: ModuleDocumentation = {
  id: 'suppliers',
  slug: 'suppliers',
  title: 'Fournisseurs & Sourcing B2B',
  subtitle: 'Connecteurs B2B et optimisation des marges',
  description: 'Le module Fournisseurs centralise votre réseau d\'approvisionnement. Connectez-vous directement aux grossistes (AliExpress, CJ Dropshipping, 1688, Alibaba), comparez les fournisseurs par fiabilité et optimisez vos marges en temps réel.',
  icon: 'Truck',
  category: 'sourcing',
  routes: ['/suppliers', '/suppliers/my', '/suppliers/catalog', '/suppliers/engine', '/suppliers/b2b'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 20,
  lastUpdated: '2025-02-01',
  version: '3.0',
  tags: ['fournisseurs', 'sourcing', 'b2b', 'dropshipping', 'aliexpress', 'cj', 'marges', 'fiabilité'],
  
  overview: {
    purpose: 'Professionnaliser votre sourcing en centralisant tous vos fournisseurs, en automatisant les comparaisons et en maximisant vos marges grâce à des analyses en temps réel.',
    whenToUse: 'Pour ajouter un nouveau fournisseur, comparer des alternatives pour un produit, analyser la fiabilité de votre supply chain ou négocier des conditions.',
    targetAudience: 'Dropshippers cherchant les meilleurs prix, retailers optimisant leurs achats, agences gérant le sourcing pour plusieurs clients.',
    prerequisites: [
      'Plan Pro ou Ultra Pro',
      'Avoir des produits à sourcer',
      'Optionnel: clés API fournisseurs pour connexion directe'
    ],
    keyFeatures: [
      'Connecteurs B2B natifs (AliExpress, CJ, 1688, Alibaba, Temu, Spocket)',
      'Scoring de fiabilité multi-critères (délai, qualité, stock, prix)',
      'Comparateur de marges nettes en temps réel',
      'Calcul automatique des frais (Stripe, plateforme, TVA)',
      'Alertes sur variations de prix ou ruptures',
      'Historique des commandes fournisseurs',
      'Négociation assistée avec templates'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Connecter son premier fournisseur B2B',
      description: 'Vous passez du sourcing manuel au sourcing automatisé avec un connecteur direct.',
      steps: [
        'Accédez à Fournisseurs > Moteur > B2B Sourcing',
        'Sélectionnez votre plateforme (ex: CJ Dropshipping)',
        'Entrez vos identifiants API (fournis par CJ)',
        'Testez la connexion',
        'Importez votre premier produit depuis le catalogue fournisseur'
      ],
      expectedOutcome: 'Accès direct au catalogue de 500 000+ produits avec prix actualisés.'
    },
    {
      level: 'advanced',
      title: 'Comparer 5 fournisseurs pour optimiser les marges',
      description: 'Vous vendez un produit populaire et cherchez la meilleure source pour maximiser votre profit.',
      steps: [
        'Accédez à Fournisseurs > Catalogue Unifié',
        'Recherchez le produit par nom ou image',
        'Consultez le tableau comparatif (prix, délai, score fiabilité)',
        'Analysez la marge nette après frais (Stripe, commission, TVA)',
        'Sélectionnez le fournisseur optimal et liez-le au produit'
      ],
      expectedOutcome: '+5-15% de marge en choisissant le meilleur fournisseur.'
    },
    {
      level: 'expert',
      title: 'Gérer un portefeuille multi-fournisseurs avec SLA',
      description: 'Vous gérez 50+ fournisseurs et devez garantir des niveaux de service à vos clients.',
      steps: [
        'Accédez à Fournisseurs > Mes Fournisseurs',
        'Configurez des SLA par fournisseur (délai max, taux de qualité min)',
        'Activez les alertes sur non-respect des SLA',
        'Consultez le dashboard de performance fournisseurs',
        'Automatisez le switch vers backup en cas de défaillance'
      ],
      expectedOutcome: 'Taux de livraison à temps > 95%, réclamations clients < 2%.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Accéder au module Fournisseurs',
      description: 'Cliquez sur "Fournisseurs" dans le menu principal. Le hub affiche une vue d\'ensemble: fournisseurs actifs, performance globale, alertes.',
      tip: 'L\'onglet "Moteur" regroupe toutes les fonctionnalités avancées.'
    },
    {
      stepNumber: 2,
      title: 'Ajouter un fournisseur manuel',
      description: 'Cliquez sur "Ajouter" et remplissez les informations: nom, contact, conditions (MOQ, délais, modes de paiement).',
      tip: 'Même sans API, centralisez vos fournisseurs pour le suivi.'
    },
    {
      stepNumber: 3,
      title: 'Connecter un fournisseur B2B (API)',
      description: 'Dans Moteur > B2B Sourcing, sélectionnez la plateforme. Entrez vos credentials API. ShopOpti+ synchronise automatiquement le catalogue.',
      tip: 'Les credentials sont chiffrés et stockés de façon sécurisée.',
      warning: 'Certaines plateformes (1688) nécessitent une vérification d\'entreprise.'
    },
    {
      stepNumber: 4,
      title: 'Utiliser le catalogue unifié',
      description: 'Le catalogue unifié agrège tous vos fournisseurs connectés. Recherchez par mot-clé, catégorie ou image. Les résultats affichent prix comparés.',
      tip: 'Utilisez la recherche par image pour trouver le même produit chez différents fournisseurs.'
    },
    {
      stepNumber: 5,
      title: 'Analyser les marges nettes',
      description: 'Le comparateur calcule automatiquement: prix d\'achat + frais Stripe (2.9%) + commission plateforme + TVA = coût réel. Marge nette = Prix vente - Coût réel.',
      tip: 'Configurez vos taux de commission par marketplace dans Paramètres > Tarification.'
    },
    {
      stepNumber: 6,
      title: 'Consulter le score de fiabilité',
      description: 'Chaque fournisseur a un score 0-100 basé sur: délai de livraison (30%), qualité produit (25%), stabilité prix (20%), exactitude stock (15%), communication (10%).',
      tip: 'Un score < 70 = risque élevé. Privilégiez les fournisseurs 80+.'
    },
    {
      stepNumber: 7,
      title: 'Lier un fournisseur à un produit',
      description: 'Depuis la fiche produit, cliquez sur "Fournisseur" et sélectionnez parmi vos fournisseurs. Vous pouvez définir un fournisseur principal et un backup.',
      tip: 'Le switch automatique vers backup se déclenche si le principal est en rupture.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Diversifiez vos sources',
        description: 'Ne dépendez jamais à 100% d\'un seul fournisseur. Ayez toujours 2-3 alternatives pour vos best-sellers.',
        impact: 'high'
      },
      {
        title: 'Vérifiez les fournisseurs avant de commander',
        description: 'Passez une commande test (10 unités) avant de vous engager. Évaluez délai réel, qualité packaging, communication.',
        impact: 'high'
      },
      {
        title: 'Négociez à partir de 100 commandes/mois',
        description: 'Les fournisseurs offrent des remises volume significatives (-10 à -30%) au-delà d\'un certain volume.',
        impact: 'medium'
      },
      {
        title: 'Surveillez les variations de prix',
        description: 'Activez les alertes sur +10% de hausse. Les fournisseurs ajustent souvent les prix sans prévenir.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Choisir uniquement sur le prix',
        description: 'Le moins cher n\'est pas le meilleur. Un fournisseur à +15% mais fiable coûte moins cher qu\'un fournisseur cheap avec 20% de retours.',
        impact: 'high'
      },
      {
        title: 'Ignorer les délais de livraison',
        description: 'Un délai AliExpress de 45 jours tue votre expérience client. Privilégiez les fournisseurs avec stock EU/US.',
        impact: 'high'
      },
      {
        title: 'Ne pas mettre à jour les coûts',
        description: 'Vos marges affichées sont fausses si les prix fournisseurs ont changé. Resynchronisez régulièrement.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'La connexion API échoue',
      cause: 'Credentials invalides ou compte fournisseur non vérifié',
      solution: 'Vérifiez vos API keys dans le dashboard fournisseur. Assurez-vous que votre compte est vérifié (KYC)',
      severity: 'high'
    },
    {
      symptom: 'Les prix ne correspondent pas au site fournisseur',
      cause: 'Cache ou devise incorrecte',
      solution: 'Forcez une resynchronisation et vérifiez la devise configurée (USD par défaut)',
      severity: 'medium'
    },
    {
      symptom: 'Le catalogue fournisseur est vide',
      cause: 'Synchronisation en cours ou problème d\'API',
      solution: 'Attendez la fin de la synchro initiale (peut prendre 1h pour gros catalogues). Vérifiez les logs d\'erreur',
      severity: 'medium'
    },
    {
      symptom: 'Le score de fiabilité est à N/A',
      cause: 'Pas assez de données historiques (< 10 commandes)',
      solution: 'Le score s\'affine après 10+ commandes. En attendant, vérifiez les avis externes',
      severity: 'low'
    },
    {
      symptom: 'Les marges calculées semblent incorrectes',
      cause: 'Frais de plateforme non configurés ou TVA non prise en compte',
      solution: 'Vérifiez vos paramètres de tarification: commissions marketplace, taux TVA, frais Stripe',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'La stratégie "Good-Better-Best"',
      content: 'Pour chaque catégorie produit, ayez 3 niveaux de fournisseurs: économique (marge max), standard (équilibré), premium (qualité max). Adaptez selon le positionnement client.',
      differentiator: 'ShopOpti+ permet de taguer les fournisseurs par tier et de les assigner automatiquement selon le prix de vente.'
    },
    {
      title: 'Négociez le shipped price',
      content: 'Le prix produit n\'est rien sans le coût de livraison. Négociez des forfaits livraison ou du shipping inclus au-delà d\'un certain volume.',
      differentiator: 'Notre calculateur intègre le shipping dans la comparaison de marges.'
    },
    {
      title: 'Utilisez le scoring comme levier de négociation',
      content: 'Montrez à vos fournisseurs leur score vs concurrents. "Votre score fiabilité est 72, mon alternative est à 89. Que proposez-vous pour m\'inciter à rester ?"',
      differentiator: 'Les rapports de performance fournisseurs sont exportables en PDF pour vos négociations.'
    },
    {
      title: 'Automatisez le switch de fournisseur',
      content: 'Configurez des règles: si stock principal < 5 ET backup disponible, alors router vers backup. Vous ne perdez jamais une vente pour rupture.',
      differentiator: 'Le moteur de règles s\'exécute en temps réel à chaque commande entrante.'
    }
  ],
  
  callToValue: {
    headline: 'Transformez votre sourcing en avantage compétitif',
    description: 'Le module Fournisseurs vous donne une visibilité totale sur votre supply chain. En optimisant vos sources et vos marges, vous gagnez en moyenne 12% de rentabilité sur chaque commande.',
    metrics: [
      { label: 'Gain marge moyen', value: '+12%', improvement: '' },
      { label: 'Temps comparaison fournisseurs', value: '2 min', improvement: '-90%' },
      { label: 'Taux de rupture évitées', value: '95%', improvement: '' }
    ],
    cta: {
      label: 'Gérer mes fournisseurs',
      route: '/suppliers'
    }
  },
  
  faqs: [
    {
      question: 'Quels fournisseurs B2B sont supportés ?',
      answer: 'Connecteurs natifs: AliExpress, CJ Dropshipping, Alibaba, 1688, Temu (bêta), Spocket. Fournisseurs locaux EU (France, Allemagne, Espagne) via API générique ou import manuel.'
    },
    {
      question: 'Comment fonctionne le scoring de fiabilité ?',
      answer: 'Score 0-100 calculé sur: délai moyen vs annoncé (30%), taux de conformité qualité (25%), stabilité des prix (20%), exactitude du stock (15%), réactivité support (10%). Minimum 10 commandes pour un score fiable.'
    },
    {
      question: 'Puis-je passer des commandes directement depuis ShopOpti+ ?',
      answer: 'Oui pour les fournisseurs connectés via API (CJ, Spocket). Pour les autres, ShopOpti+ génère les bons de commande et vous les transmettez au fournisseur.'
    },
    {
      question: 'Le module fonctionne-t-il pour les fournisseurs locaux ?',
      answer: 'Oui, ajoutez n\'importe quel fournisseur manuellement. Vous perdez la synchro catalogue automatique mais conservez le suivi des performances et le calcul des marges.'
    }
  ],
  
  relatedModules: ['products', 'import', 'orders', 'pricing'],
  externalResources: [
    { label: 'Guide: Négocier avec les fournisseurs', url: '/academy/supplier-negotiation' },
    { label: 'Checklist validation fournisseur', url: '/templates/supplier-checklist' },
    { label: 'API Documentation - Fournisseurs', url: '/developers/api/suppliers' }
  ]
};
