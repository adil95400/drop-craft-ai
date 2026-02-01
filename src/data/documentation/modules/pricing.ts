import type { ModuleDocumentation } from '../types';

export const pricingDocumentation: ModuleDocumentation = {
  id: 'pricing',
  slug: 'pricing',
  title: 'Tarification & Repricing',
  subtitle: 'Moteur de prix dynamique et optimisation des marges',
  description: 'Le module Tarification est votre tour de contrôle pour les prix. Définissez des règles de prix statiques, activez le repricing automatique en temps réel, surveillez la concurrence et optimisez vos marges grâce à l\'IA.',
  icon: 'DollarSign',
  category: 'sales',
  routes: ['/pricing', '/pricing/rules', '/pricing/repricing', '/pricing/monitoring', '/pricing/optimization'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 16,
  lastUpdated: '2025-02-01',
  version: '2.5',
  tags: ['prix', 'repricing', 'marges', 'concurrence', 'buy box', 'automatisation'],
  
  overview: {
    purpose: 'Automatiser et optimiser votre stratégie tarifaire. Le module combine règles statiques, repricing dynamique, veille concurrentielle et recommandations IA pour maximiser vos marges tout en restant compétitif.',
    whenToUse: 'Pour définir vos marges par catégorie, ajuster automatiquement les prix selon la concurrence, surveiller les fluctuations du marché ou tester des stratégies de prix.',
    targetAudience: 'Vendeurs multicanaux cherchant à automatiser leurs prix, retailers avec forte pression concurrentielle, agences gérant des stratégies prix complexes.',
    prerequisites: [
      'Avoir des produits avec prix de revient renseigné',
      'Optionnel: connexion aux marketplaces pour le repricing Buy Box'
    ],
    keyFeatures: [
      'Règles de prix IF/THEN illimitées',
      'Repricing automatique Buy Box (Amazon, eBay...)',
      'Veille concurrentielle multi-sources',
      'Calcul marge nette temps réel (frais inclus)',
      'Stratégies pré-configurées (Agressive, Conservatrice, Pénétration)',
      'Historique des prix avec analytics',
      'Optimisation IA basée sur l\'élasticité'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Configurer une marge minimum par catégorie',
      description: 'Vous voulez garantir 25% de marge sur l\'électronique et 40% sur la mode.',
      steps: [
        'Accédez à Tarification > Règles de Prix',
        'Créez une règle: SI catégorie = Électronique, ALORS marge minimum = 25%',
        'Créez une seconde règle pour Mode avec 40%',
        'Activez "Appliquer automatiquement aux nouveaux produits"',
        'Testez sur quelques produits avant validation globale'
      ],
      expectedOutcome: 'Tous vos produits respectent la marge minimum par catégorie.'
    },
    {
      level: 'advanced',
      title: 'Activer le repricing Buy Box sur Amazon',
      description: 'Vous vendez sur Amazon et voulez gagner la Buy Box tout en préservant vos marges.',
      steps: [
        'Accédez à Tarification > Repricing Auto',
        'Connectez votre compte Seller Amazon',
        'Configurez la stratégie "Buy Box - Compétitif"',
        'Définissez le prix plancher (marge min 15%)',
        'Activez la surveillance temps réel'
      ],
      expectedOutcome: 'Taux de Buy Box +35%, ventes +50%, marge préservée.'
    },
    {
      level: 'expert',
      title: 'Optimiser les prix par élasticité IA',
      description: 'L\'IA analyse l\'historique de ventes et ajuste les prix pour maximiser le profit total.',
      steps: [
        'Accédez à Tarification > Optimisation IA',
        'Sélectionnez les produits à optimiser (best-sellers recommandés)',
        'Lancez l\'analyse d\'élasticité (basée sur 30j d\'historique)',
        'Consultez les recommandations: hausses ou baisses suggérées',
        'Validez et appliquez par lots ou individuellement'
      ],
      expectedOutcome: 'Profit total +8-15% via optimisation prix/volume.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Comprendre le hub Tarification',
      description: 'Le hub affiche 4 onglets: Vue d\'ensemble (KPIs), Règles de Prix (statiques), Repricing Auto (dynamique), Veille Prix (concurrence), Optimisation IA.',
      tip: 'Commencez par les règles statiques, puis activez le repricing pour les produits compétitifs.'
    },
    {
      stepNumber: 2,
      title: 'Créer une règle de prix',
      description: 'Cliquez "Nouvelle règle". Définissez les conditions (catégorie, marge, fournisseur...) et l\'action (prix fixe, marge %, arrondi).',
      tip: 'Les règles s\'exécutent dans l\'ordre. Placez les plus spécifiques en premier.',
      warning: 'Une règle trop large peut modifier tous vos prix. Testez avant d\'activer.'
    },
    {
      stepNumber: 3,
      title: 'Configurer le repricing automatique',
      description: 'Choisissez la stratégie: Buy Box (battre le leader), Compétitif (suivre le marché), Marge-based (protéger la marge), Dynamique IA (optimiser).',
      tip: 'Le repricing Buy Box est idéal pour Amazon. Le Compétitif pour les marketplaces avec moins de concurrence.'
    },
    {
      stepNumber: 4,
      title: 'Définir les limites (floor/ceiling)',
      description: 'Le prix plancher garantit votre marge minimum. Le prix plafond évite les hausses excessives qui tuent la demande.',
      tip: 'Floor = coût × (1 + marge_min). Ex: coût 10€, marge min 20% → floor = 12€.',
      warning: 'Sans floor, le repricing peut descendre à 0 marge en cas de guerre de prix.'
    },
    {
      stepNumber: 5,
      title: 'Activer la veille concurrentielle',
      description: 'Ajoutez vos concurrents à surveiller. ShopOpti+ collecte leurs prix quotidiennement et vous alerte sur les écarts significatifs.',
      tip: 'Surveillez 3-5 concurrents directs max pour rester focalisé.'
    },
    {
      stepNumber: 6,
      title: 'Analyser l\'historique des prix',
      description: 'L\'onglet Historique affiche l\'évolution de vos prix et marges. Identifiez les patterns saisonniers et l\'impact de vos ajustements.',
      tip: 'Exportez en CSV pour une analyse approfondie dans Excel/Sheets.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Utilisez l\'arrondi psychologique',
        description: 'Les prix en .99 ou .95 convertissent mieux. Configurez une règle d\'arrondi automatique.',
        impact: 'medium'
      },
      {
        title: 'Différenciez par canal',
        description: 'Appliquez des marges différentes par marketplace. Amazon supporte moins de marge qu\'un site propre.',
        impact: 'high'
      },
      {
        title: 'Protégez vos best-sellers',
        description: 'Évitez le repricing agressif sur vos produits phares. Une baisse de marge de 5% sur 50% du CA = gros manque à gagner.',
        impact: 'high'
      },
      {
        title: 'Testez avant de déployer',
        description: 'Appliquez d\'abord sur 50 produits pendant 1 semaine. Analysez l\'impact avant le rollout global.',
        impact: 'high'
      }
    ],
    pitfalls: [
      {
        title: 'Repricing sans floor',
        description: 'Le repricing peut descendre à marge négative si vous ne configurez pas de prix plancher. Toujours définir un floor.',
        impact: 'high'
      },
      {
        title: 'Ignorer les frais cachés',
        description: 'Commission marketplace, Stripe, emballage, retours... Si non pris en compte, votre marge affichée est fausse.',
        impact: 'high'
      },
      {
        title: 'Repricing trop fréquent',
        description: 'Modifier les prix 10x/jour crée de la confusion et peut être pénalisé par certaines marketplaces. 1-2x/jour suffit.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Les règles ne s\'appliquent pas',
      cause: 'Règle inactive ou conditions non remplies',
      solution: 'Vérifiez que la règle est activée et que les conditions correspondent à vos produits (catégorie exacte, etc.)',
      severity: 'medium'
    },
    {
      symptom: 'Le repricing baisse trop les prix',
      cause: 'Prix plancher non configuré ou trop bas',
      solution: 'Augmentez le floor pour garantir votre marge minimum (recommandé: marge ≥ 15%)',
      severity: 'high'
    },
    {
      symptom: 'Les prix concurrents affichés sont incorrects',
      cause: 'Cache de veille ou produit non mappé correctement',
      solution: 'Forcez une resynchronisation et vérifiez le mapping produit (même SKU/EAN)',
      severity: 'low'
    },
    {
      symptom: 'L\'optimisation IA ne propose rien',
      cause: 'Pas assez d\'historique de ventes (min 30 jours)',
      solution: 'Attendez d\'avoir 30 jours de données de ventes pour une analyse pertinente',
      severity: 'low'
    }
  ],
  
  expertTips: [
    {
      title: 'La stratégie "Pénétration puis remontée"',
      content: 'Pour un nouveau produit, commencez 10% sous le marché pendant 2 semaines pour acquérir du ranking et des avis. Puis remontez progressivement (+2%/semaine) jusqu\'à votre cible.',
      differentiator: 'ShopOpti+ permet de programmer des hausses de prix automatiques différées.'
    },
    {
      title: 'Segmentez vos stratégies par lifecycle',
      content: 'Nouveau produit = pénétration. Best-seller établi = marge max. Fin de vie = liquidation. Appliquez des règles différentes selon le statut.',
      differentiator: 'Les tags de lifecycle sont détectés automatiquement par l\'IA.'
    },
    {
      title: 'Le "Price Anchor" sur votre site propre',
      content: 'Affichez un prix barré 20% plus haut. L\'ancrage psychologique augmente le taux de conversion de 15-25%.',
      differentiator: 'Génération automatique des prix barrés cohérents par règle.'
    }
  ],
  
  callToValue: {
    headline: 'Gagnez 12% de marge sans perdre de ventes',
    description: 'Le moteur de tarification ShopOpti+ optimise en permanence vos prix pour maximiser le profit. Les utilisateurs gagnent en moyenne 12% de marge supplémentaire tout en maintenant ou augmentant leurs volumes.',
    metrics: [
      { label: 'Gain marge moyen', value: '+12%', improvement: '' },
      { label: 'Taux Buy Box Amazon', value: '+35%', improvement: '' },
      { label: 'Temps gestion prix', value: '-80%', improvement: '' }
    ],
    cta: {
      label: 'Optimiser mes prix',
      route: '/pricing'
    }
  },
  
  faqs: [
    {
      question: 'Le repricing est-il compatible avec toutes les marketplaces ?',
      answer: 'Repricing Buy Box: Amazon, eBay. Repricing compétitif: toutes les marketplaces connectées. Pour les autres, utilisez les règles de prix statiques.'
    },
    {
      question: 'À quelle fréquence les prix sont-ils mis à jour ?',
      answer: 'Repricing temps réel: toutes les 15 minutes. Veille concurrentielle: 1x/jour. Règles statiques: à chaque import ou modification.'
    },
    {
      question: 'L\'optimisation IA est-elle fiable ?',
      answer: 'L\'IA base ses recommandations sur votre historique réel de ventes. Plus vous avez de données (30j+), plus les prédictions sont précises. Taux de fiabilité: 85%.'
    }
  ],
  
  relatedModules: ['products', 'suppliers', 'channels', 'analytics'],
  externalResources: [
    { label: 'Guide: Stratégies de prix e-commerce', url: '/academy/pricing-strategies' },
    { label: 'Calculateur de marge', url: '/tools/margin-calculator' }
  ]
};
