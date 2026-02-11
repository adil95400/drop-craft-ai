import type { ModuleDocumentation } from '../types';

export const revenueForecastingDocumentation: ModuleDocumentation = {
  id: 'revenueForecasting',
  slug: 'revenue-forecasting',
  title: 'Prévisions de Revenus',
  subtitle: 'Cockpit financier et projections IA',
  description: 'Projetez vos revenus futurs avec des scénarios optimiste, réaliste et pessimiste. Analysez vos tendances et prenez des décisions éclairées grâce aux prévisions IA.',
  icon: 'TrendingUp',
  category: 'analytics',
  routes: ['/analytics/forecasting'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 10,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['prévisions', 'revenus', 'forecasting', 'finance', 'projections', 'ia'],
  
  overview: {
    purpose: 'Le module de Prévisions de Revenus utilise l\'IA pour projeter vos futurs revenus en analysant l\'historique de ventes, les tendances saisonnières et les métriques du catalogue.',
    whenToUse: 'Pour planifier vos achats, budgets marketing et objectifs de croissance. Consultez les projections avant chaque décision financière.',
    targetAudience: 'Gérants de boutiques, directeurs financiers et agences qui pilotent la stratégie commerciale.',
    prerequisites: ['Avoir au moins 30 jours d\'historique de ventes', 'Avoir une boutique connectée avec des commandes'],
    keyFeatures: [
      'Projections à 30, 60 et 90 jours',
      'Scénarios optimiste, réaliste et pessimiste',
      'Graphiques interactifs avec Recharts',
      'KPIs clés : revenu projeté, croissance, marge',
      'Analyse des tendances saisonnières',
      'Alertes sur les risques financiers',
      'Export PDF pour les rapports investisseurs',
      'Comparaison prévisions vs réalisé'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Planifier le budget marketing',
      description: 'Utilisez les projections de revenus pour déterminer votre budget publicitaire optimal.',
      steps: ['Consultez la projection 30 jours', 'Identifiez le revenu réaliste attendu', 'Allouez 10-15% en budget marketing'],
      expectedOutcome: 'Budget marketing aligné avec les projections de revenus pour un ROI optimal.'
    },
    {
      level: 'advanced',
      title: 'Préparer un rapport investisseur',
      description: 'Générez un rapport de prévisions professionnel avec les 3 scénarios.',
      steps: ['Sélectionnez la période 90 jours', 'Activez les 3 scénarios', 'Exportez en PDF avec les graphiques'],
      expectedOutcome: 'Rapport financier professionnel avec projections sourcées prêt pour les investisseurs.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Accéder au cockpit financier', description: 'Naviguez vers Analytics > Prévisions de revenus.', tip: 'Le cockpit est aussi accessible depuis le Dashboard en cliquant sur le KPI "Revenu projeté".' },
    { stepNumber: 2, title: 'Choisir la période de projection', description: 'Sélectionnez 30, 60 ou 90 jours selon votre besoin de planification.' },
    { stepNumber: 3, title: 'Analyser les scénarios', description: 'Le graphique affiche 3 courbes : optimiste (vert), réaliste (bleu), pessimiste (orange).', tip: 'Le scénario réaliste est basé sur la tendance linéaire. L\'optimiste ajoute +20% et le pessimiste -15%.' },
    { stepNumber: 4, title: 'Consulter les KPIs', description: 'Les cartes en bas affichent les métriques clés de chaque scénario.' },
    { stepNumber: 5, title: 'Exporter ou partager', description: 'Utilisez le bouton "Exporter" pour générer un PDF ou partager avec votre équipe.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Privilégiez le scénario réaliste', description: 'Basez vos décisions sur le scénario réaliste, gardez l\'optimiste comme objectif et le pessimiste comme plan B.', impact: 'high' },
      { title: 'Comparez prévisions vs réalisé', description: 'Chaque mois, comparez vos prévisions passées avec le réalisé pour calibrer le modèle.', impact: 'high' }
    ],
    pitfalls: [
      { title: 'Se baser uniquement sur l\'optimiste', description: 'Le scénario optimiste est un objectif, pas une certitude. Les décisions budgétaires doivent se baser sur le réaliste.', impact: 'high' },
      { title: 'Ignorer la saisonnalité', description: 'Les projections sans contexte saisonnier peuvent être trompeuses (Black Friday, été...).', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Les projections semblent irréalistes', cause: 'Historique de ventes trop court (< 30 jours) ou anomalie dans les données', solution: 'Attendez d\'avoir 30+ jours d\'historique ou excluez les anomalies (grosse commande unique)', severity: 'medium' },
    { symptom: 'Le graphique ne s\'affiche pas', cause: 'Aucune donnée de ventes disponible', solution: 'Connectez une boutique et synchronisez vos commandes', severity: 'high' }
  ],
  
  expertTips: [
    { title: 'La règle des 3 mois', content: 'Les projections deviennent fiables après 3 mois d\'historique. Avant, utilisez-les comme indicateur de tendance, pas comme prédiction ferme.', differentiator: 'ShopOpti+ intègre la saisonnalité automatiquement après 12 mois de données.' }
  ],
  
  callToValue: {
    headline: 'Anticipez vos revenus avec 85% de précision',
    description: 'Les projections IA vous donnent une visibilité claire sur votre avenir financier, permettant des décisions stratégiques éclairées.',
    metrics: [
      { label: 'Précision projection', value: '85%', improvement: 'Après 3 mois de données' },
      { label: 'Visibilité', value: '90 jours', improvement: 'En avance' }
    ],
    cta: { label: 'Voir mes projections', route: '/analytics/forecasting' }
  },
  
  faqs: [
    { question: 'Les prévisions incluent-elles les frais ?', answer: 'Les projections affichent le revenu brut. La marge est calculée séparément en déduisant les coûts fournisseur et frais marketplace.' },
    { question: 'La saisonnalité est-elle prise en compte ?', answer: 'Oui, après 12 mois d\'historique, le modèle intègre automatiquement les variations saisonnières.' }
  ],
  
  relatedModules: ['analytics', 'dashboard', 'pricing'],
};
