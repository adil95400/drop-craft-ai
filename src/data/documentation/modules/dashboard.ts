import type { ModuleDocumentation } from '../types';

export const dashboardDocumentation: ModuleDocumentation = {
  id: 'dashboard',
  slug: 'dashboard',
  title: 'Dashboard & Command Center',
  subtitle: 'Centre de pilotage business intelligent',
  description: 'Le Dashboard ShopOpti+ est votre centre de contrôle unifié. Il consolide tous vos KPIs critiques, vous alerte sur les actions prioritaires et vous guide vers les décisions les plus impactantes grâce à l\'IA.',
  icon: 'LayoutDashboard',
  category: 'core',
  routes: ['/dashboard', '/'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced'],
  estimatedReadTime: 8,
  lastUpdated: '2025-02-01',
  version: '2.0',
  tags: ['kpi', 'analytics', 'alertes', 'productivité', 'command-center'],
  
  overview: {
    purpose: 'Le Dashboard centralise toutes les informations critiques de votre activité e-commerce en un seul écran. Il vous permet de prendre des décisions éclairées en temps réel sans naviguer entre plusieurs outils.',
    whenToUse: 'Consultez le Dashboard quotidiennement en début de journée pour prioriser vos actions, et régulièrement pour surveiller la santé de votre catalogue et l\'évolution de vos métriques.',
    targetAudience: 'Tous les utilisateurs ShopOpti+, du débutant qui découvre ses premiers KPIs au gestionnaire multi-boutiques qui pilote son empire.',
    prerequisites: [
      'Avoir au moins une boutique connectée',
      'Avoir importé des produits dans le catalogue'
    ],
    keyFeatures: [
      'KPIs en temps réel (CA, commandes, marge, taux de conversion)',
      'Score de santé catalogue avec recommandations IA',
      'Alertes prioritaires classées par impact business',
      'Actions rapides contextuelles',
      'Vue consolidée multi-boutiques',
      'Widgets personnalisables'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Comprendre ses métriques de base',
      description: 'En tant que nouveau vendeur, vous voulez comprendre rapidement la performance de votre boutique sans vous perdre dans des tableaux complexes.',
      steps: [
        'Accédez au Dashboard via le menu principal',
        'Observez les 4 KPIs principaux en haut de page',
        'Cliquez sur chaque carte pour voir le détail',
        'Consultez le score de santé catalogue (objectif: 80%+)'
      ],
      expectedOutcome: 'Vous comprenez en 30 secondes si votre journée est bonne ou si des actions sont nécessaires.'
    },
    {
      level: 'intermediate',
      title: 'Analyser les tendances et anticiper',
      description: 'Vous gérez une boutique établie et souhaitez identifier les tendances pour anticiper les ruptures de stock ou les baisses de performance.',
      steps: [
        'Consultez les graphiques d\'évolution sur 7/30 jours',
        'Identifiez les produits en tendance haussière',
        'Repérez les alertes de stock faible',
        'Configurez des seuils d\'alerte personnalisés'
      ],
      expectedOutcome: 'Vous anticipez les problèmes 48h avant qu\'ils n\'impactent vos ventes.'
    },
    {
      level: 'advanced',
      title: 'Piloter un portefeuille multi-boutiques',
      description: 'En tant qu\'agence ou gestionnaire multi-comptes, vous avez besoin d\'une vue consolidée de toutes vos boutiques.',
      steps: [
        'Activez la vue "Toutes les boutiques"',
        'Comparez les performances par boutique',
        'Identifiez les boutiques sous-performantes',
        'Priorisez les actions par impact global'
      ],
      expectedOutcome: 'Vous gérez 10+ boutiques avec la même efficacité qu\'une seule.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Accéder au Dashboard',
      description: 'Cliquez sur "Dashboard" dans le menu latéral gauche ou accédez directement à la page d\'accueil après connexion.',
      tip: 'Le Dashboard est votre page d\'accueil par défaut. Vous pouvez modifier ce paramètre dans les réglages.'
    },
    {
      stepNumber: 2,
      title: 'Interpréter les KPIs principaux',
      description: 'Les 4 cartes en haut affichent: Chiffre d\'affaires, Nombre de commandes, Marge brute et Taux de conversion. Les flèches indiquent l\'évolution vs période précédente.',
      tip: 'Une flèche verte ↑ = amélioration. Rouge ↓ = dégradation. Cliquez pour voir le détail.'
    },
    {
      stepNumber: 3,
      title: 'Consulter le score de santé catalogue',
      description: 'Le score de santé (0-100) évalue la qualité globale de votre catalogue: titres, descriptions, images, attributs. L\'IA suggère les actions prioritaires.',
      tip: 'Un score > 80 = catalogue optimisé. < 60 = actions urgentes requises.',
      warning: 'Un score faible impacte directement votre visibilité sur les marketplaces.'
    },
    {
      stepNumber: 4,
      title: 'Traiter les alertes prioritaires',
      description: 'Les alertes sont classées par sévérité (critique, warning, info) et impact business. Traitez toujours les rouges en premier.',
      tip: 'Cliquez sur "Résoudre" pour accéder directement à l\'action corrective.'
    },
    {
      stepNumber: 5,
      title: 'Personnaliser vos widgets',
      description: 'Cliquez sur l\'icône ⚙️ pour ajouter, supprimer ou réorganiser les widgets selon vos besoins.',
      tip: 'Créez des dashboards personnalisés par objectif (ventes, sourcing, qualité).'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Consultez le Dashboard chaque matin',
        description: 'Prenez 5 minutes pour scanner vos KPIs et alertes. Cette habitude vous fait gagner 2h de réaction sur les problèmes.',
        impact: 'high'
      },
      {
        title: 'Configurez des alertes personnalisées',
        description: 'Définissez des seuils adaptés à votre activité (ex: alerte si CA < 500€/jour ou stock < 10 unités).',
        impact: 'high'
      },
      {
        title: 'Utilisez les filtres de période',
        description: 'Comparez vos performances sur différentes périodes pour identifier les tendances saisonnières.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Ignorer les alertes jaunes',
        description: 'Les warnings deviennent souvent des critiques en 48-72h. Traitez-les avant qu\'ils n\'escaladent.',
        impact: 'high'
      },
      {
        title: 'Se focaliser uniquement sur le CA',
        description: 'Le chiffre d\'affaires seul est trompeur. Surveillez aussi la marge et le taux de retour.',
        impact: 'medium'
      },
      {
        title: 'Négliger le score de santé catalogue',
        description: 'Un score < 60 signifie que vos produits sont mal référencés sur les marketplaces.',
        impact: 'high'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Les KPIs affichent 0€',
      cause: 'Aucune boutique n\'est connectée ou la synchronisation n\'est pas active',
      solution: 'Allez dans Boutiques & Canaux > Connecter une boutique et vérifiez le statut de synchronisation',
      severity: 'high'
    },
    {
      symptom: 'Le score de santé ne se met pas à jour',
      cause: 'Le calcul du score est effectué toutes les 6 heures',
      solution: 'Cliquez sur "Actualiser le score" pour forcer un recalcul immédiat',
      severity: 'low'
    },
    {
      symptom: 'Les alertes ne correspondent pas à ma boutique',
      cause: 'Les seuils par défaut ne sont pas adaptés à votre volume',
      solution: 'Personnalisez vos seuils d\'alerte dans Paramètres > Notifications',
      severity: 'medium'
    },
    {
      symptom: 'Les données semblent retardées',
      cause: 'La synchronisation avec les marketplaces a un délai de 15-60 minutes',
      solution: 'Vérifiez l\'horodatage "Dernière synchro" et forcez une actualisation si besoin',
      severity: 'low'
    }
  ],
  
  expertTips: [
    {
      title: 'Le ratio 80/20 des alertes',
      content: 'Les vendeurs performants traitent 80% des alertes critiques dans les 2 premières heures de la journée. Ce ratio garantit que les problèmes majeurs ne s\'accumulent jamais.',
      differentiator: 'ShopOpti+ classe automatiquement vos alertes par impact business, pas juste par sévérité technique.'
    },
    {
      title: 'La règle des 3 clics',
      content: 'Depuis le Dashboard, vous devez pouvoir résoudre n\'importe quel problème en 3 clics maximum. Utilisez les "Actions rapides" plutôt que de naviguer manuellement.',
      differentiator: 'Notre IA pré-sélectionne l\'action la plus probable et vous y conduit directement.'
    },
    {
      title: 'Benchmark votre score de santé',
      content: 'Un score de 85+ vous place dans le top 10% des vendeurs. À 90+, vous maximisez votre visibilité algorithmique sur toutes les marketplaces.',
      differentiator: 'ShopOpti+ compare votre score à la moyenne de votre secteur et vous indique votre rang.'
    }
  ],
  
  callToValue: {
    headline: 'Gagnez 2h par jour grâce au pilotage centralisé',
    description: 'Le Dashboard ShopOpti+ élimine le temps perdu à naviguer entre 5+ outils. En consolidant toutes vos données critiques et en priorisant automatiquement vos actions, vous récupérez en moyenne 2h de productivité quotidienne.',
    metrics: [
      { label: 'Temps gagné', value: '2h/jour', improvement: '+40% productivité' },
      { label: 'Réactivité alertes', value: '< 1h', improvement: '-80% incidents' },
      { label: 'Score santé moyen', value: '87%', improvement: '+25% visibilité' }
    ],
    cta: {
      label: 'Accéder au Dashboard',
      route: '/dashboard'
    }
  },
  
  faqs: [
    {
      question: 'À quelle fréquence les données sont-elles actualisées ?',
      answer: 'Les KPIs sont mis à jour toutes les 15 minutes pour les ventes et commandes. Le score de santé catalogue est recalculé toutes les 6 heures, ou sur demande.',
      relatedLinks: [
        { label: 'Configurer la synchronisation', url: '/settings/sync' }
      ]
    },
    {
      question: 'Puis-je créer plusieurs dashboards ?',
      answer: 'Oui, avec le plan Pro et supérieur, vous pouvez créer des dashboards personnalisés par objectif (ventes, qualité, sourcing) et les partager avec votre équipe.'
    },
    {
      question: 'Comment fonctionne le score de santé ?',
      answer: 'Le score évalue 12 critères: complétude des titres (10%), qualité des descriptions (15%), présence d\'images HD (20%), attributs renseignés (15%), catégorisation (10%), prix cohérents (10%), stock à jour (10%), variantes correctes (5%), SEO (5%).'
    }
  ],
  
  relatedModules: ['products', 'analytics', 'orders', 'catalog'],
  externalResources: [
    { label: 'Webinaire: Maîtriser le Dashboard', url: '/academy/dashboard-mastery' },
    { label: 'Template de reporting', url: '/templates/dashboard-report' }
  ]
};
