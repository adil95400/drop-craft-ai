import type { ModuleDocumentation } from '../types';

export const analyticsDocumentation: ModuleDocumentation = {
  id: 'analytics',
  slug: 'analytics',
  title: 'Analytics & Business Intelligence',
  subtitle: 'Insights actionables et décisions data-driven',
  description: 'Le module Analytics transforme vos données brutes en insights actionnables. Tableaux de bord personnalisables, analytics prédictive, veille concurrentielle et rapports automatisés pour piloter votre croissance.',
  icon: 'BarChart3',
  category: 'analytics',
  routes: ['/analytics', '/analytics/dashboards', '/analytics/reports', '/analytics/predictions'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 16,
  lastUpdated: '2025-02-01',
  version: '2.5',
  tags: ['analytics', 'bi', 'rapports', 'kpi', 'prédictions', 'veille'],
  
  overview: {
    purpose: 'Donner une visibilité complète sur la performance de votre activité e-commerce. Comprendre ce qui fonctionne, ce qui ne fonctionne pas, et prédire les tendances futures.',
    whenToUse: 'Quotidiennement pour surveiller les KPIs, hebdomadairement pour les analyses de tendances, mensuellement pour les rapports stratégiques.',
    targetAudience: 'Dirigeants, responsables e-commerce, analystes, et tout utilisateur cherchant à baser ses décisions sur les données.',
    prerequisites: [
      'Avoir des données historiques (ventes, stocks, trafic)',
      'Au moins 30 jours d\'historique pour les prédictions'
    ],
    keyFeatures: [
      'Tableaux de bord personnalisables drag & drop',
      '50+ métriques trackées automatiquement',
      'Analytics prédictive (ventes, stocks, tendances)',
      'Veille concurrentielle multi-sources',
      'Rapports automatisés planifiables',
      'Alertes sur seuils et anomalies',
      'Export multi-format (PDF, Excel, API)'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Créer un dashboard de suivi quotidien',
      description: 'Vous voulez un tableau de bord avec vos KPIs essentiels visibles en un coup d\'œil.',
      steps: [
        'Accédez à Analytics > Dashboards',
        'Cliquez "Nouveau dashboard"',
        'Glissez-déposez les widgets: CA du jour, Commandes, Marge, Top produits',
        'Configurez chaque widget (période, comparaison)',
        'Sauvegardez et définissez comme dashboard par défaut'
      ],
      expectedOutcome: 'Dashboard personnalisé accessible en 1 clic chaque matin.'
    },
    {
      level: 'advanced',
      title: 'Configurer des rapports automatiques',
      description: 'Votre direction veut un rapport hebdomadaire sans que vous y pensiez.',
      steps: [
        'Accédez à Analytics > Rapports',
        'Créez un nouveau rapport avec les sections souhaitées',
        'Configurez la planification: chaque lundi à 9h',
        'Ajoutez les destinataires email',
        'Activez l\'envoi automatique'
      ],
      expectedOutcome: 'Rapport envoyé automatiquement chaque semaine sans intervention.'
    },
    {
      level: 'expert',
      title: 'Exploiter l\'analytics prédictive',
      description: 'Vous voulez anticiper vos ventes et stocks pour les 30 prochains jours.',
      steps: [
        'Accédez à Analytics > Prédictions',
        'Sélectionnez la métrique (ventes, stock, marge)',
        'Choisissez l\'horizon (7j, 30j, 90j)',
        'Analysez les courbes de prédiction avec intervalles de confiance',
        'Exportez les prévisions pour votre planning'
      ],
      expectedOutcome: 'Anticipation des besoins en stock et des pics de ventes.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Naviguer dans le hub Analytics',
      description: 'Le hub affiche un dashboard par défaut avec les métriques clés. Les onglets permettent d\'accéder aux dashboards personnalisés, rapports et prédictions.',
      tip: 'Personnalisez le dashboard par défaut pour voir ce qui compte pour vous.'
    },
    {
      stepNumber: 2,
      title: 'Créer un dashboard',
      description: 'Cliquez "Nouveau dashboard", donnez un nom, puis glissez-déposez les widgets depuis la bibliothèque. Redimensionnez et arrangez comme vous voulez.',
      tip: 'Créez des dashboards par thème: Ventes, Stocks, Marketing, Qualité.'
    },
    {
      stepNumber: 3,
      title: 'Configurer un widget',
      description: 'Chaque widget est configurable: métrique affichée, période, comparaison (vs période précédente, vs objectif), type de visualisation.',
      tip: 'Utilisez les comparaisons pour voir les tendances d\'un coup d\'œil.'
    },
    {
      stepNumber: 4,
      title: 'Analyser les données',
      description: 'Cliquez sur un widget pour explorer les données. Filtrez par produit, catégorie, canal. Identifiez les patterns.',
      tip: 'Les anomalies (pics, chutes) sont surlignées automatiquement.'
    },
    {
      stepNumber: 5,
      title: 'Générer un rapport',
      description: 'Accédez à Rapports, sélectionnez un template ou créez from scratch. Ajoutez les sections, configurez les filtres, générez.',
      tip: 'Les templates sectoriels (mode, électro...) incluent les KPIs pertinents.',
      warning: 'Les gros rapports (1 an de données) peuvent prendre plusieurs minutes.'
    },
    {
      stepNumber: 6,
      title: 'Configurer les alertes',
      description: 'Dans Paramètres > Alertes Analytics, définissez des seuils. Ex: "Alerte si CA quotidien < 80% de la moyenne 7j".',
      tip: 'Combinez plusieurs conditions pour éviter les faux positifs.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Définissez vos KPIs prioritaires',
        description: 'Ne trackez pas 50 métriques. Identifiez les 5-7 KPIs qui comptent vraiment pour votre business.',
        impact: 'high'
      },
      {
        title: 'Comparez toujours à une période de référence',
        description: 'Un CA de 10k€ n\'a pas de sens seul. Comparez à la semaine dernière, au mois dernier, à l\'année dernière.',
        impact: 'high'
      },
      {
        title: 'Automatisez les rapports récurrents',
        description: 'Si vous générez le même rapport chaque semaine, planifiez-le. Vous récupérez du temps.',
        impact: 'medium'
      },
      {
        title: 'Partagez les dashboards avec l\'équipe',
        description: 'La data ne doit pas être silotée. Partagez les dashboards pertinents avec chaque membre.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Vanity metrics',
        description: 'Le nombre de visiteurs impressionne mais ne paie pas les factures. Focalisez sur les métriques business: marge, conversion, LTV.',
        impact: 'high'
      },
      {
        title: 'Analyse sans action',
        description: 'Découvrir un problème sans agir = perte de temps. Chaque insight doit mener à une action.',
        impact: 'high'
      },
      {
        title: 'Trop de dashboards',
        description: '20 dashboards = aucun dashboard. Consolidez et gardez uniquement ceux que vous consultez vraiment.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Les données semblent incorrectes',
      cause: 'Délai de synchronisation ou filtres mal configurés',
      solution: 'Vérifiez la date de dernière synchro et les filtres actifs. Forcez une actualisation.',
      severity: 'medium'
    },
    {
      symptom: 'Le dashboard est lent à charger',
      cause: 'Trop de widgets ou période trop longue',
      solution: 'Réduisez le nombre de widgets ou la période analysée. Utilisez des widgets agrégés.',
      severity: 'low'
    },
    {
      symptom: 'Les prédictions sont incohérentes',
      cause: 'Pas assez d\'historique ou données trop volatiles',
      solution: 'Attendez d\'avoir 60+ jours d\'historique. Les prédictions s\'améliorent avec le temps.',
      severity: 'low'
    },
    {
      symptom: 'Le rapport ne s\'envoie pas',
      cause: 'Email incorrect ou quota d\'envoi atteint',
      solution: 'Vérifiez les adresses destinataires et le quota email dans Paramètres.',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'Le framework "Insight → Action → Résultat"',
      content: 'Chaque analyse doit suivre ce flow: 1) Qu\'est-ce que je vois ? 2) Qu\'est-ce que ça implique ? 3) Quelle action je prends ? 4) Comment je mesure le résultat ?',
      differentiator: 'Nos rapports incluent une section "Actions recommandées" générée par IA.'
    },
    {
      title: 'Cohort analysis pour la LTV',
      content: 'Ne regardez pas juste le CA global. Analysez par cohorte (clients acquis en janvier, février...) pour comprendre la vraie valeur client.',
      differentiator: 'Analyse de cohortes automatique avec visualisation dédiée.'
    },
    {
      title: 'Alertes intelligentes',
      content: 'Au lieu d\'alertes sur seuils fixes, utilisez les alertes sur anomalies statistiques. L\'IA détecte les écarts anormaux vs pattern habituel.',
      differentiator: 'Détection d\'anomalies ML intégrée.'
    }
  ],
  
  callToValue: {
    headline: 'Prenez des décisions basées sur les données',
    description: 'Le module Analytics transforme vos données en insights actionnables. Plus de feeling, plus de suppositions: chaque décision est basée sur des faits. Les entreprises data-driven croissent 30% plus vite.',
    metrics: [
      { label: 'Métriques trackées', value: '50+', improvement: '' },
      { label: 'Temps analyse', value: '-80%', improvement: '' },
      { label: 'Décisions basées data', value: '100%', improvement: '' }
    ],
    cta: {
      label: 'Explorer Analytics',
      route: '/analytics'
    }
  },
  
  faqs: [
    {
      question: 'D\'où viennent les données ?',
      answer: 'Les données proviennent de vos boutiques connectées, de vos imports, et des actions dans ShopOpti+. Tout est consolidé automatiquement.'
    },
    {
      question: 'Quelle est la précision des prédictions ?',
      answer: 'Avec 30+ jours d\'historique, la précision est de 85-92% sur J+7. Elle diminue sur les horizons plus longs. L\'intervalle de confiance est toujours affiché.'
    },
    {
      question: 'Puis-je exporter les données brutes ?',
      answer: 'Oui, export CSV/Excel disponible sur chaque widget et rapport. L\'API permet aussi d\'accéder aux données programmatiquement.'
    }
  ],
  
  relatedModules: ['dashboard', 'products', 'orders', 'marketing'],
  externalResources: [
    { label: 'Guide: KPIs e-commerce essentiels', url: '/academy/ecommerce-kpis' },
    { label: 'Templates de dashboards', url: '/templates/dashboards' }
  ]
};
