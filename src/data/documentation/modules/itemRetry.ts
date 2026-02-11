import type { ModuleDocumentation } from '../types';

export const itemRetryDocumentation: ModuleDocumentation = {
  id: 'itemRetry',
  slug: 'item-retry',
  title: 'Retry Granulaire par Élément',
  subtitle: 'Reprise fine des tâches échouées',
  description: 'Relancez individuellement les éléments échoués au sein d\'un job batch, sans avoir à relancer l\'ensemble du traitement.',
  icon: 'RefreshCcw',
  category: 'automation',
  routes: ['/import/item-retry'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced'],
  estimatedReadTime: 6,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['retry', 'batch', 'erreurs', 'granulaire', 'reprise'],
  
  overview: {
    purpose: 'Quand un job batch échoue partiellement (import, publication, sync), le Retry Granulaire permet de relancer uniquement les éléments en erreur, économisant du temps et des ressources.',
    whenToUse: 'Après un job batch qui a partiellement échoué. Au lieu de tout relancer, identifiez et relancez seulement les items problématiques.',
    targetAudience: 'Vendeurs qui gèrent des imports en volume et doivent résoudre les erreurs efficacement.',
    prerequisites: ['Avoir exécuté au moins un job batch (import, publication, sync)'],
    keyFeatures: [
      'Vue détaillée de chaque item d\'un job',
      'Filtre par statut : succès, échec, en attente',
      'Retry individuel par élément',
      'Retry en lot des éléments échoués',
      'Log d\'erreur détaillé par item',
      'Export de la liste des erreurs',
      'Historique des tentatives de retry'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Corriger un import partiel',
      description: 'Sur 500 produits importés, 23 ont échoué. Identifiez la cause et relancez uniquement ces 23.',
      steps: ['Ouvrez le job en erreur', 'Filtrez sur "Échoué"', 'Consultez le message d\'erreur de chaque item', 'Corrigez la cause et cliquez "Retry"'],
      expectedOutcome: 'Les 23 produits sont importés sans relancer les 477 déjà réussis.'
    },
    {
      level: 'advanced',
      title: 'Diagnostic d\'erreurs récurrentes',
      description: 'Identifiez un pattern dans les erreurs pour prévenir les prochains échecs.',
      steps: ['Exportez la liste des erreurs', 'Analysez les causes communes', 'Corrigez la source (données fournisseur)', 'Relancez en lot'],
      expectedOutcome: 'Les imports suivants ont un taux de succès de 99%+.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Ouvrir le job concerné', description: 'Depuis la liste des jobs, cliquez sur le job partiellement échoué.', tip: 'Les jobs avec des erreurs affichent un badge orange avec le nombre d\'échecs.' },
    { stepNumber: 2, title: 'Filtrer les éléments échoués', description: 'Utilisez le filtre "Statut: Échoué" pour n\'afficher que les items en erreur.', tip: 'Vous pouvez aussi trier par message d\'erreur pour regrouper les causes identiques.' },
    { stepNumber: 3, title: 'Consulter les détails d\'erreur', description: 'Chaque item affiche son message d\'erreur, le timestamp et le nombre de tentatives.', warning: 'Certaines erreurs nécessitent une correction manuelle avant retry (données manquantes, format invalide).' },
    { stepNumber: 4, title: 'Relancer individuellement ou en lot', description: 'Cliquez "Retry" sur un item ou "Retry All Failed" pour relancer tous les échecs.', tip: 'Le retry en lot est plus rapide mais ne corrige pas les erreurs de données.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Analyser avant de relancer', description: 'Comprenez la cause d\'erreur avant de retry — un retry sans correction échouera à nouveau.', impact: 'high' },
      { title: 'Exporter les erreurs', description: 'Exportez la liste pour une analyse hors-ligne et partagez avec votre fournisseur si nécessaire.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Retry en boucle', description: 'Relancer sans corriger la cause produit les mêmes erreurs. Analysez d\'abord.', impact: 'high' },
      { title: 'Ignorer les erreurs mineures', description: 'Des erreurs "mineures" accumulées dégradent la qualité du catalogue.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Le retry échoue à nouveau', cause: 'La cause racine n\'a pas été corrigée', solution: 'Lisez le message d\'erreur détaillé et corrigez les données source avant de retenter', severity: 'high' },
    { symptom: 'Le bouton Retry est grisé', cause: 'Le nombre maximum de tentatives est atteint', solution: 'Contactez le support ou augmentez la limite dans les paramètres avancés', severity: 'medium' }
  ],
  
  expertTips: [
    { title: 'Pattern d\'erreurs', content: 'Quand 10%+ des items échouent avec le même message, c\'est un problème systémique (format fournisseur, champ manquant). Corrigez à la source plutôt que de retry individuellement.', differentiator: 'L\'export CSV des erreurs permet une analyse rapide des patterns.' }
  ],
  
  callToValue: {
    headline: 'Résolvez les erreurs d\'import 5x plus vite',
    description: 'Le retry granulaire élimine le besoin de relancer des jobs entiers. Ciblez uniquement les éléments en erreur pour une résolution rapide.',
    metrics: [
      { label: 'Temps de résolution', value: '5x plus rapide', improvement: 'vs relancer tout' },
      { label: 'Taux de succès post-retry', value: '97%', improvement: 'Après correction' }
    ],
    cta: { label: 'Voir les jobs', route: '/import/item-retry' }
  },
  
  faqs: [
    { question: 'Combien de fois puis-je retenter un item ?', answer: 'Par défaut 3 tentatives. Configurable dans les paramètres avancés jusqu\'à 10.' },
    { question: 'Le retry est-il facturé ?', answer: 'Non, les retry ne consomment pas de crédits supplémentaires.' }
  ],
  
  relatedModules: ['import', 'automation', 'catalog'],
};
