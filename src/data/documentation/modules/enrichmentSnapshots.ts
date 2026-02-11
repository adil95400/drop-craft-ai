import type { ModuleDocumentation } from '../types';

export const enrichmentSnapshotsDocumentation: ModuleDocumentation = {
  id: 'enrichmentSnapshots',
  slug: 'enrichment-snapshots',
  title: 'Snapshots d\'Enrichissement IA',
  subtitle: 'Historique et diff du contenu généré par l\'IA',
  description: 'Comparez les versions avant/après de vos fiches produit enrichies par l\'IA. Visualisez chaque modification, restaurez une version antérieure et suivez l\'évolution de la qualité.',
  icon: 'GitCompare',
  category: 'catalog',
  routes: ['/ai/snapshots'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 8,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['ia', 'enrichissement', 'versioning', 'diff', 'snapshots', 'contenu'],
  
  overview: {
    purpose: 'Les Snapshots d\'Enrichissement gardent une trace complète de chaque modification IA sur vos fiches produit. Comparez avant/après, mesurez l\'amélioration du score qualité et restaurez une version précédente si nécessaire.',
    whenToUse: 'Après avoir utilisé l\'IA pour enrichir vos produits (titres, descriptions, attributs). Consultez les snapshots pour valider les modifications ou revenir en arrière.',
    targetAudience: 'Gestionnaires de catalogue qui veulent un contrôle qualité sur les modifications IA et un historique auditable.',
    prerequisites: ['Avoir des produits dans le catalogue', 'Avoir utilisé l\'enrichissement IA au moins une fois'],
    keyFeatures: [
      'Vue diff côte-à-côte (avant/après)',
      'Score qualité avant et après enrichissement',
      'Historique complet de chaque modification',
      'Restauration en un clic vers une version antérieure',
      'Filtre par date, produit ou type de modification',
      'Statistiques d\'amélioration globales',
      'Export de l\'historique des modifications'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Valider un enrichissement batch',
      description: 'Vous avez enrichi 100 produits en batch. Vérifiez que les résultats sont de qualité.',
      steps: ['Ouvrez les Snapshots d\'enrichissement', 'Filtrez par date du batch', 'Comparez avant/après sur un échantillon', 'Validez ou restaurez les produits problématiques'],
      expectedOutcome: 'Vous avez un contrôle qualité complet sur les modifications IA sans vérifier chaque produit manuellement.'
    },
    {
      level: 'advanced',
      title: 'Mesurer l\'impact de l\'IA',
      description: 'Quantifiez l\'amélioration moyenne du score qualité apportée par l\'enrichissement IA.',
      steps: ['Consultez les statistiques globales', 'Comparez les scores avant/après par catégorie', 'Identifiez les types de contenu où l\'IA excelle'],
      expectedOutcome: 'Données quantifiées pour optimiser votre stratégie d\'enrichissement IA.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Accéder aux Snapshots', description: 'Naviguez vers IA > Snapshots d\'enrichissement dans le menu.', tip: 'Vous pouvez aussi accéder aux snapshots depuis la fiche produit > onglet "Historique".' },
    { stepNumber: 2, title: 'Sélectionner un snapshot', description: 'Cliquez sur une ligne de l\'historique pour voir le diff complet.', tip: 'Les icônes de couleur indiquent le type de changement : vert = ajout, orange = modification, rouge = suppression.' },
    { stepNumber: 3, title: 'Comparer avant/après', description: 'La vue diff affiche côte-à-côte le contenu original et enrichi avec les changements surlignés.' },
    { stepNumber: 4, title: 'Restaurer si nécessaire', description: 'Cliquez "Restaurer" pour revenir à la version précédente d\'un champ spécifique.', warning: 'La restauration écrase la version actuelle. Elle sera visible dans l\'historique comme un nouveau snapshot.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Vérifier un échantillon de 10%', description: 'Après un batch d\'enrichissement, vérifiez au moins 10% des produits via les snapshots.', impact: 'high' },
      { title: 'Suivre les scores qualité', description: 'Comparez les scores avant/après pour mesurer objectivement l\'impact de l\'IA.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Ne jamais vérifier les résultats IA', description: 'L\'IA peut parfois produire des résultats inadaptés. Un contrôle régulier est essentiel.', impact: 'high' },
      { title: 'Restaurer sans comprendre', description: 'Avant de restaurer, comprenez pourquoi l\'IA a fait ce changement.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Aucun snapshot disponible', cause: 'Aucun enrichissement IA n\'a été effectué', solution: 'Lancez un enrichissement IA depuis le catalogue ou la page IA', severity: 'low' },
    { symptom: 'Le diff ne montre aucun changement', cause: 'Le contenu original et enrichi sont identiques', solution: 'L\'IA n\'a pas jugé nécessaire de modifier ce contenu. Le score était déjà élevé.', severity: 'low' }
  ],
  
  expertTips: [
    { title: 'Audit qualité automatisé', content: 'Configurez une alerte quand le score qualité post-enrichissement baisse de plus de 5 points. Cela signifie que l\'IA a peut-être dégradé le contenu.', differentiator: 'ShopOpti+ est le seul outil à proposer un diff visuel et une restauration en un clic pour le contenu IA.' }
  ],
  
  callToValue: {
    headline: 'Contrôlez à 100% la qualité de vos enrichissements IA',
    description: 'Les snapshots vous donnent une transparence totale sur les modifications IA avec la possibilité de restaurer instantanément.',
    metrics: [
      { label: 'Score qualité moyen', value: '+23 pts', improvement: 'Après enrichissement' },
      { label: 'Taux de restauration', value: '< 5%', improvement: 'IA de qualité' }
    ],
    cta: { label: 'Voir les snapshots', route: '/ai/snapshots' }
  },
  
  faqs: [
    { question: 'Les snapshots sont-ils conservés indéfiniment ?', answer: 'Oui, l\'historique complet est conservé sans limite de temps.' },
    { question: 'Puis-je restaurer partiellement ?', answer: 'Oui, vous pouvez restaurer un champ spécifique (titre seulement, description seulement) sans affecter les autres.' }
  ],
  
  relatedModules: ['ai', 'products', 'catalog'],
};
