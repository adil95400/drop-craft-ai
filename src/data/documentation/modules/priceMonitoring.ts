import type { ModuleDocumentation } from '../types';

export const priceMonitoringDocumentation: ModuleDocumentation = {
  id: 'price-monitoring',
  slug: 'price-monitoring',
  title: 'Monitoring des Prix Concurrents',
  subtitle: 'Veille tarifaire et repricing automatique',
  description: 'Surveillez les prix de vos concurrents en temps réel et ajustez automatiquement vos tarifs pour rester compétitif tout en protégeant vos marges.',
  icon: 'TrendingUp',
  category: 'analytics',
  routes: ['/pricing', '/analytics'],
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 10,
  lastUpdated: '2026-03-28',
  version: '1.0.0',
  tags: ['pricing', 'monitoring', 'concurrents', 'repricing', 'marge'],
  overview: {
    purpose: 'Détecter automatiquement les variations de prix chez les fournisseurs et concurrents pour ajuster vos tarifs en temps réel et maximiser vos marges.',
    whenToUse: 'Pour maintenir votre compétitivité tarifaire sur les marketplaces et protéger vos marges contre les fluctuations du marché.',
    targetAudience: 'Vendeurs opérant sur plusieurs marketplaces avec un catalogue de plus de 50 produits.',
    prerequisites: ['Plan Pro ou Ultra Pro', 'Au moins un fournisseur lié'],
    keyFeatures: [
      'Suivi automatique des prix fournisseurs (toutes les 15 min)',
      'Détection des baisses de prix significatives (>10%)',
      'Repricing multi-stratégie (Buy Box, marge, dynamique)',
      'Score de confiance pour bloquer les mises à jour incertaines',
      'P&L industriel (coûts plateforme, shipping, pub, TVA)',
      'Alertes en temps réel sur les variations',
      'Fallback automatique vers un fournisseur moins cher'
    ]
  },
  useCases: [
    {
      level: 'intermediate',
      title: 'Configurer le repricing automatique',
      description: 'Définissez une stratégie de repricing qui ajuste vos prix en fonction des variations fournisseurs.',
      steps: ['Aller dans Pricing > Règles', 'Créer une règle de type "Marge minimum"', 'Définir le seuil minimum (ex: 25%)', 'Activer la mise à jour automatique'],
      expectedOutcome: 'Vos prix s\'ajustent automatiquement tout en respectant votre marge minimum.'
    },
    {
      level: 'advanced',
      title: 'Basculer automatiquement de fournisseur',
      description: 'Quand un fournisseur alternatif propose un prix 10%+ inférieur, le système bascule automatiquement.',
      steps: ['Lier plusieurs fournisseurs à un produit', 'Activer le fallback automatique', 'Configurer le seuil de déclenchement'],
      expectedOutcome: 'Réduction automatique des coûts d\'achat avec audit trail complet.'
    }
  ],
  stepByStep: [
    { stepNumber: 1, title: 'Activer la synchronisation prix', description: 'Dans Fournisseurs > Sync, activez la surveillance automatique des prix pour vos produits liés.' },
    { stepNumber: 2, title: 'Configurer les seuils', description: 'Définissez le pourcentage minimum de variation qui déclenche une alerte (par défaut: 5%).', tip: 'Un seuil trop bas génère beaucoup de notifications.' },
    { stepNumber: 3, title: 'Créer des règles de repricing', description: 'Dans Pricing > Règles, créez vos stratégies (marge fixe, Buy Box, dynamique).' },
    { stepNumber: 4, title: 'Configurer les alertes', description: 'Choisissez de recevoir les notifications par email, in-app ou webhook.' },
    { stepNumber: 5, title: 'Monitorer le dashboard', description: 'Le dashboard Pricing affiche en temps réel les variations détectées et les actions prises.' }
  ],
  bestPractices: {
    recommendations: [
      { title: 'Marge minimum de sécurité', description: 'Définissez toujours une marge minimum de 5% pour éviter de vendre à perte après frais.', impact: 'high' },
      { title: 'Multi-fournisseurs', description: 'Liez au moins 2 fournisseurs par produit phare pour bénéficier du fallback automatique.', impact: 'high' },
      { title: 'Scoring de confiance', description: 'Activez le score de confiance pour bloquer les mises à jour basées sur des données obsolètes.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Repricing trop agressif', description: 'Un repricing sans marge minimum peut entraîner des ventes à perte.', impact: 'high' },
      { title: 'Ignorer les frais additionnels', description: 'Le prix fournisseur seul ne suffit pas : intégrez shipping, pub et commissions.', impact: 'high' }
    ]
  },
  troubleshooting: [
    { symptom: 'Les prix ne se mettent pas à jour', cause: 'Le score de confiance est trop bas ou la marge nette < 5%.', solution: 'Vérifiez les conditions de blocage dans le dashboard Pricing et ajustez les seuils.', severity: 'medium' },
    { symptom: 'Trop de notifications', cause: 'Seuil de variation trop bas.', solution: 'Augmentez le seuil minimum à 10% pour réduire le bruit.', severity: 'low' },
    { symptom: 'Fallback fournisseur non déclenché', cause: 'Le fournisseur alternatif n\'est pas lié correctement.', solution: 'Vérifiez le mapping multi-fournisseurs dans Fournisseurs > Liens produits.', severity: 'medium' }
  ],
  expertTips: [
    { title: 'P&L complet', content: 'Utilisez le calculateur P&L intégré (coût + fees 5% + shipping + pub + TVA) pour des marges réalistes.' },
    { title: 'Saisonnalité', content: 'Ajustez vos stratégies de repricing selon les saisons. Les marges peuvent être réduites en période de forte demande.' }
  ],
  callToValue: {
    headline: 'Ne perdez plus de marge sur des prix obsolètes',
    description: 'Le monitoring automatique détecte les variations en temps réel et protège vos marges.',
    metrics: [
      { label: 'Fréquence de vérification', value: '15 min' },
      { label: 'Amélioration marge moyenne', value: '+12%' },
      { label: 'Temps de réaction', value: '< 1 min' }
    ]
  },
  faqs: [
    { question: 'Le repricing est-il vraiment automatique ?', answer: 'Oui, une fois les règles configurées, le système ajuste les prix sans intervention. Vous pouvez aussi choisir le mode "review" pour valider manuellement.' },
    { question: 'Puis-je exclure certains produits ?', answer: 'Oui, les règles de pricing supportent des filtres par catégorie, marque ou produit individuel.' },
    { question: 'Y a-t-il un historique des changements de prix ?', answer: 'Oui, chaque modification est tracée dans l\'audit log avec l\'ancien et le nouveau prix.' }
  ],
  relatedModules: ['pricing', 'suppliers', 'analytics'],
};
