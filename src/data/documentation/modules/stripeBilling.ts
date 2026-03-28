import type { ModuleDocumentation } from '../types';

export const stripeBillingDocumentation: ModuleDocumentation = {
  id: 'stripe-billing',
  slug: 'stripe-billing',
  title: 'Abonnements & Facturation',
  subtitle: 'Gestion des plans tarifaires Stripe',
  description: 'Gérez votre abonnement, consultez vos factures et suivez votre consommation de quotas directement depuis ShopOpti+.',
  icon: 'CreditCard',
  category: 'enterprise',
  routes: ['/settings/billing', '/pricing'],
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced'],
  estimatedReadTime: 8,
  lastUpdated: '2026-03-28',
  version: '1.0.0',
  tags: ['billing', 'stripe', 'abonnement', 'facturation', 'quotas'],
  overview: {
    purpose: 'Permettre aux utilisateurs de souscrire à un plan, gérer leur abonnement et surveiller leur consommation de quotas pour optimiser leur utilisation de la plateforme.',
    whenToUse: 'Pour changer de plan, consulter vos factures ou vérifier vos limites de quotas.',
    targetAudience: 'Tous les utilisateurs ShopOpti+ souhaitant gérer leur abonnement.',
    prerequisites: ['Un compte ShopOpti+ actif'],
    keyFeatures: [
      '3 plans tarifaires (Standard 29€, Pro 49€, Ultra Pro 99€)',
      'Période d\'essai gratuite de 14 jours',
      'Paiement sécurisé via Stripe Checkout',
      'Suivi des quotas en temps réel',
      'Alertes de consommation (10% et 5% restants)',
      'Historique de facturation complet',
      'Upgrade/downgrade instantané'
    ]
  },
  useCases: [
    {
      level: 'beginner',
      title: 'Souscrire au plan Pro',
      description: 'Passez du plan Standard au plan Pro pour débloquer les fonctionnalités avancées.',
      steps: ['Aller dans Paramètres > Facturation', 'Cliquer sur "Changer de plan"', 'Sélectionner le plan Pro', 'Compléter le paiement Stripe'],
      expectedOutcome: 'Accès immédiat aux fonctionnalités Pro avec quotas augmentés.'
    },
    {
      level: 'intermediate',
      title: 'Surveiller sa consommation',
      description: 'Vérifiez vos quotas restants pour anticiper un éventuel dépassement.',
      steps: ['Aller dans Paramètres > Facturation', 'Consulter la section Quotas', 'Configurer les alertes si nécessaire'],
      expectedOutcome: 'Vision claire de votre consommation avec alertes configurées.'
    }
  ],
  stepByStep: [
    { stepNumber: 1, title: 'Accéder à la facturation', description: 'Naviguez vers Paramètres > Facturation pour voir votre plan actuel.' },
    { stepNumber: 2, title: 'Choisir un plan', description: 'Comparez les plans Standard, Pro et Ultra Pro et leurs fonctionnalités respectives.' },
    { stepNumber: 3, title: 'Paiement sécurisé', description: 'Vous êtes redirigé vers Stripe Checkout pour un paiement sécurisé. Vos données bancaires ne transitent jamais par ShopOpti+.', tip: 'La période d\'essai de 14 jours ne nécessite pas de carte bancaire.' },
    { stepNumber: 4, title: 'Confirmation', description: 'Après paiement, votre plan est activé instantanément et vos quotas sont mis à jour.' }
  ],
  bestPractices: {
    recommendations: [
      { title: 'Profitez de l\'essai gratuit', description: 'Testez toutes les fonctionnalités pendant 14 jours avant de vous engager.', impact: 'high' },
      { title: 'Surveillez vos quotas', description: 'Configurez les alertes à 10% restant pour anticiper un upgrade.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Dépassement de quotas', description: 'Certaines fonctionnalités sont bloquées quand le quota est atteint. Pensez à upgrader ou attendre le renouvellement.', impact: 'high' }
    ]
  },
  troubleshooting: [
    { symptom: 'Le paiement échoue', cause: 'Carte refusée ou problème réseau.', solution: 'Vérifiez les informations de votre carte ou essayez un autre moyen de paiement.', severity: 'high' },
    { symptom: 'Mon plan n\'est pas mis à jour', cause: 'Le webhook Stripe n\'a pas encore été traité.', solution: 'Attendez quelques minutes. Si le problème persiste, contactez le support.', severity: 'medium' },
    { symptom: 'Quota affiché incorrect', cause: 'Décalage entre la consommation et le rafraîchissement.', solution: 'Rechargez la page. Les quotas se mettent à jour en temps réel.', severity: 'low' }
  ],
  expertTips: [
    { title: 'Plan annuel', content: 'Les plans annuels offrent une réduction significative par rapport au paiement mensuel.' }
  ],
  callToValue: {
    headline: 'Choisissez le plan adapté à votre business',
    description: 'Des plans flexibles qui évoluent avec votre activité, de la découverte à l\'entreprise.',
    metrics: [
      { label: 'Essai gratuit', value: '14 jours' },
      { label: 'Plans disponibles', value: '3' },
      { label: 'À partir de', value: '29€/mois' }
    ]
  },
  faqs: [
    { question: 'Puis-je annuler à tout moment ?', answer: 'Oui, vous pouvez annuler votre abonnement à tout moment. Vous conservez l\'accès jusqu\'à la fin de la période payée.' },
    { question: 'Que se passe-t-il après l\'essai gratuit ?', answer: 'Vous passez automatiquement au plan gratuit limité. Aucun prélèvement sans votre accord.' },
    { question: 'Les factures sont-elles disponibles ?', answer: 'Oui, toutes vos factures sont accessibles dans Paramètres > Facturation > Historique.' }
  ],
  relatedModules: ['settings'],
};
