import type { ModuleDocumentation } from '../types';

export const returnsAutomationDocumentation: ModuleDocumentation = {
  id: 'returns-automation',
  slug: 'returns-automation',
  title: 'Automatisation des Retours',
  subtitle: 'Gestion RMA et remboursements automatisés',
  description: 'Automatisez le traitement des retours, échanges et remboursements avec un workflow en 5 étapes et un suivi RMA complet.',
  icon: 'RotateCcw',
  category: 'automation',
  routes: ['/automation/supply-chain', '/orders'],
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 10,
  lastUpdated: '2026-03-28',
  version: '1.0.0',
  tags: ['retours', 'rma', 'remboursement', 'échange', 'automatisation'],
  overview: {
    purpose: 'Simplifier et accélérer le traitement des retours clients en automatisant la création de RMA, l\'évaluation des demandes et le suivi des remboursements.',
    whenToUse: 'Dès qu\'un client demande un retour, un échange ou un remboursement sur une commande.',
    targetAudience: 'Vendeurs traitant plus de 50 commandes/mois et souhaitant réduire le temps de gestion des retours.',
    prerequisites: ['Plan Pro ou Ultra Pro', 'Module Commandes configuré'],
    keyFeatures: [
      'Numéro RMA généré automatiquement',
      'Workflow en 5 étapes (Demande → Évaluation → Approbation → Réception → Résolution)',
      'Règles d\'auto-approbation configurables',
      'Calcul automatique du remboursement',
      'Suivi du statut en temps réel',
      'Notifications client automatiques',
      'Dashboard de métriques retours'
    ]
  },
  useCases: [
    {
      level: 'intermediate',
      title: 'Traiter un retour standard',
      description: 'Un client demande un retour pour un produit défectueux.',
      steps: ['Le client soumet sa demande via le formulaire', 'Le système génère un RMA automatiquement', 'L\'IA évalue la demande et suggère une action', 'Le vendeur approuve ou modifie', 'Le remboursement est déclenché après réception'],
      expectedOutcome: 'Retour traité en moins de 24h avec remboursement automatique.'
    },
    {
      level: 'advanced',
      title: 'Auto-approbation des petits retours',
      description: 'Configurez des règles pour approuver automatiquement les retours sous un certain montant.',
      steps: ['Aller dans Automatisation > Retours > Règles', 'Créer une règle "Auto-approuver si montant < 30€"', 'Activer la règle'],
      expectedOutcome: 'Les retours de faible valeur sont traités instantanément sans intervention.'
    }
  ],
  stepByStep: [
    { stepNumber: 1, title: 'Configurer les politiques de retour', description: 'Définissez vos conditions de retour (délai, motifs acceptés, produits exclus) dans Automatisation > Retours.' },
    { stepNumber: 2, title: 'Activer le workflow automatique', description: 'Activez le workflow en 5 étapes pour standardiser le traitement de chaque demande.', tip: 'Vous pouvez personnaliser chaque étape du workflow.' },
    { stepNumber: 3, title: 'Configurer les notifications', description: 'Paramétrez les emails automatiques envoyés au client à chaque changement de statut.' },
    { stepNumber: 4, title: 'Définir les règles d\'auto-approbation', description: 'Créez des règles pour traiter automatiquement les cas simples (montant faible, client fidèle).', tip: 'Commencez avec des seuils conservateurs et ajustez selon votre taux d\'abus.' },
    { stepNumber: 5, title: 'Surveiller les métriques', description: 'Le dashboard retours affiche le taux de retour, le temps moyen de traitement et le coût total.' }
  ],
  bestPractices: {
    recommendations: [
      { title: 'Délai de retour clair', description: 'Affichez clairement votre politique de retour (30 jours recommandé) pour réduire les litiges.', impact: 'high' },
      { title: 'Auto-approbation progressive', description: 'Commencez par auto-approuver les retours < 20€, puis augmentez le seuil selon votre expérience.', impact: 'medium' },
      { title: 'Suivi des motifs', description: 'Analysez les motifs de retour pour identifier et corriger les problèmes récurrents.', impact: 'high' }
    ],
    pitfalls: [
      { title: 'Seuil d\'auto-approbation trop élevé', description: 'Un seuil trop élevé peut entraîner des abus. Surveillez le taux de retour.', impact: 'high' },
      { title: 'Notifications insuffisantes', description: 'Les clients insatisfaits contactent le support si ils ne reçoivent pas de mises à jour régulières.', impact: 'medium' }
    ]
  },
  troubleshooting: [
    { symptom: 'Le RMA n\'est pas généré', cause: 'La commande n\'est pas dans un statut compatible (doit être "livrée" ou "expédiée").', solution: 'Vérifiez le statut de la commande. Seules les commandes livrées peuvent faire l\'objet d\'un retour.', severity: 'medium' },
    { symptom: 'Le remboursement n\'est pas déclenché', cause: 'Le workflow attend la confirmation de réception du produit retourné.', solution: 'Confirmez la réception dans le tableau de bord retours pour déclencher le remboursement.', severity: 'medium' },
    { symptom: 'Le client ne reçoit pas les emails', cause: 'La configuration email n\'est pas finalisée.', solution: 'Vérifiez les paramètres de notifications dans Automatisation > Retours > Notifications.', severity: 'low' }
  ],
  expertTips: [
    { title: 'Analyse des tendances', content: 'Utilisez le dashboard retours pour identifier les produits avec un taux de retour anormal (>5%) et les retirer de votre catalogue.' },
    { title: 'Réconciliation fournisseur', content: 'Activez la réconciliation automatique pour détecter les écarts entre les retours client et les remboursements fournisseur.' }
  ],
  callToValue: {
    headline: 'Réduisez de 80% le temps de traitement des retours',
    description: 'L\'automatisation des retours transforme un processus manuel fastidieux en un workflow efficace et transparent.',
    metrics: [
      { label: 'Temps de traitement', value: '< 24h', improvement: '-80%' },
      { label: 'Satisfaction client', value: '+35%' },
      { label: 'Coût de gestion', value: '-60%' }
    ]
  },
  faqs: [
    { question: 'Puis-je personnaliser les motifs de retour ?', answer: 'Oui, vous pouvez définir vos propres motifs (défectueux, mauvaise taille, changement d\'avis, etc.) dans les paramètres.' },
    { question: 'Le remboursement est-il automatique ?', answer: 'Le remboursement peut être automatique (après réception confirmée) ou manuel selon votre configuration.' },
    { question: 'Y a-t-il un suivi pour le client ?', answer: 'Oui, le client reçoit des notifications à chaque étape du processus de retour.' }
  ],
  relatedModules: ['orders', 'automation', 'suppliers'],
};
