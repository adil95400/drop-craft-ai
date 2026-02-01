import type { ModuleDocumentation } from '../types';

export const ordersDocumentation: ModuleDocumentation = {
  id: 'orders',
  slug: 'orders',
  title: 'Commandes & Fulfillment',
  subtitle: 'Centre de gestion des commandes multicanal',
  description: 'Le module Commandes centralise toutes vos commandes provenant de vos différents canaux de vente. Gérez le traitement, l\'expédition, le suivi et les retours depuis une interface unifiée.',
  icon: 'ShoppingCart',
  category: 'sales',
  routes: ['/orders', '/orders/processing', '/orders/shipping', '/orders/tracking', '/orders/returns'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced'],
  estimatedReadTime: 14,
  lastUpdated: '2025-02-01',
  version: '2.0',
  tags: ['commandes', 'fulfillment', 'expédition', 'suivi', 'retours', 'automatisation'],
  
  overview: {
    purpose: 'Centraliser et automatiser le traitement des commandes de tous vos canaux de vente. Une vue unifiée pour traiter, expédier, suivre et gérer les retours sans jongler entre 10 interfaces.',
    whenToUse: 'Quotidiennement pour traiter les nouvelles commandes, générer les étiquettes d\'expédition, informer les clients et gérer les cas particuliers (retours, remboursements).',
    targetAudience: 'Tout vendeur e-commerce, du solo-preneur au responsable logistique d\'une équipe de 10 personnes.',
    prerequisites: [
      'Au moins une boutique connectée générant des commandes',
      'Optionnel: compte transporteur pour l\'auto-génération d\'étiquettes'
    ],
    keyFeatures: [
      'Vue unifiée multi-boutiques',
      'Tri automatique par priorité (délai, valeur, problème)',
      'Génération d\'étiquettes multi-transporteurs',
      'Auto-order vers fournisseurs dropshipping',
      'Suivi temps réel avec notifications client',
      'Gestion des retours et remboursements',
      'Automatisation par règles (status, tags, assignation)'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Traiter ses premières commandes',
      description: 'Vous recevez vos premières commandes et devez les expédier correctement.',
      steps: [
        'Accédez à Commandes dans le menu principal',
        'Les nouvelles commandes sont en statut "À traiter"',
        'Cliquez sur une commande pour voir les détails',
        'Préparez le colis avec les produits commandés',
        'Cliquez "Marquer comme expédié" et entrez le numéro de suivi'
      ],
      expectedOutcome: 'Commande traitée, client notifié automatiquement.'
    },
    {
      level: 'intermediate',
      title: 'Automatiser l\'expédition avec les transporteurs',
      description: 'Vous avez 50+ commandes/jour et voulez générer les étiquettes automatiquement.',
      steps: [
        'Accédez à Paramètres > Transporteurs',
        'Connectez vos comptes (Colissimo, Mondial Relay, DHL...)',
        'Créez des règles d\'attribution: poids < 500g → Lettre Suivie, sinon → Colissimo',
        'Sélectionnez les commandes à expédier',
        'Cliquez "Générer étiquettes" - elles se créent en masse'
      ],
      expectedOutcome: '50 étiquettes générées en 2 minutes au lieu de 30.'
    },
    {
      level: 'advanced',
      title: 'Configurer l\'auto-order dropshipping',
      description: 'Vos commandes doivent être automatiquement passées auprès de vos fournisseurs.',
      steps: [
        'Accédez à Commandes > Automatisation',
        'Activez "Auto-order vers fournisseur"',
        'Mappez chaque produit à son fournisseur',
        'Configurez les règles (délai max avant auto-order, validation requise ou non)',
        'Testez sur quelques commandes avant l\'activation globale'
      ],
      expectedOutcome: 'Commandes passées au fournisseur en < 1h, sans intervention manuelle.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Naviguer dans le centre de commandes',
      description: 'La vue principale affiche toutes vos commandes avec filtres par statut, canal, date, client. Les onglets permettent de passer rapidement entre les étapes du workflow.',
      tip: 'Utilisez la recherche par numéro de commande ou email client pour un accès direct.'
    },
    {
      stepNumber: 2,
      title: 'Comprendre les statuts',
      description: 'À traiter → En préparation → Expédié → Livré. Les problèmes (retour, litige) ont un statut séparé visible en orange/rouge.',
      tip: 'Personnalisez vos statuts dans Paramètres > Workflow pour matcher votre processus.'
    },
    {
      stepNumber: 3,
      title: 'Traiter une commande',
      description: 'Ouvrez la commande, vérifiez les produits et l\'adresse. Préparez le colis. Passez en "En préparation" pour éviter les doublons en équipe.',
      tip: 'Activez les alertes sonores pour ne jamais rater une nouvelle commande.',
      warning: 'Vérifiez toujours l\'adresse. Les erreurs de livraison coûtent cher.'
    },
    {
      stepNumber: 4,
      title: 'Générer une étiquette d\'expédition',
      description: 'Cliquez "Créer étiquette", sélectionnez le transporteur (ou laissez la règle automatique décider), imprimez et collez sur le colis.',
      tip: 'Investissez dans une imprimante thermique pour des étiquettes pro et rapides.'
    },
    {
      stepNumber: 5,
      title: 'Suivre les expéditions',
      description: 'L\'onglet Suivi affiche l\'état temps réel de chaque colis. Les problèmes (retard, incident) sont surlignés.',
      tip: 'Configurez des alertes client automatiques à chaque changement de statut.'
    },
    {
      stepNumber: 6,
      title: 'Gérer un retour',
      description: 'Quand un client demande un retour, créez la demande depuis la commande. Générez l\'étiquette retour, suivez la réception, déclenchez le remboursement.',
      tip: 'Proposez le bon d\'achat plutôt que le remboursement - taux de rétention +30%.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Traitez les commandes en 24h',
        description: 'Les clients attendent une expédition rapide. 24h max entre commande et envoi. Idéal: J+0 pour les commandes avant 14h.',
        impact: 'high'
      },
      {
        title: 'Automatisez les notifications',
        description: 'Email à chaque étape: confirmation, expédition, livraison. Les clients veulent être informés, pas surpris.',
        impact: 'high'
      },
      {
        title: 'Préparez vos étiquettes en masse',
        description: 'Ne générez pas les étiquettes une par une. Sélectionnez toutes les commandes du jour et générez en un clic.',
        impact: 'medium'
      },
      {
        title: 'Ayez un process retour fluide',
        description: 'Un retour bien géré = client fidélisé. Pré-imprimez des étiquettes retour et incluez-les dans chaque colis.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Oublier de mettre à jour les statuts',
        description: 'Un statut "En préparation" depuis 3 jours génère des tickets support. Mettez à jour en temps réel.',
        impact: 'high'
      },
      {
        title: 'Ignorer les alertes de stock',
        description: 'Vendre un produit en rupture = annulation + client mécontent. Surveillez les alertes stock.',
        impact: 'high'
      },
      {
        title: 'Utiliser un seul transporteur',
        description: 'Diversifiez pour éviter les surcharges saisonnières et optimiser les coûts selon le poids/destination.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Les commandes ne remontent pas',
      cause: 'Synchronisation marketplace désactivée ou en erreur',
      solution: 'Vérifiez la connexion dans Boutiques & Canaux. Relancez la synchronisation.',
      severity: 'high'
    },
    {
      symptom: 'L\'étiquette générée a une mauvaise adresse',
      cause: 'Adresse client mal formatée ou incomplète',
      solution: 'Éditez l\'adresse manuellement avant de générer l\'étiquette. Contactez le client si nécessaire.',
      severity: 'medium'
    },
    {
      symptom: 'Le suivi n\'est pas mis à jour',
      cause: 'Délai de propagation transporteur (jusqu\'à 24h) ou numéro de suivi invalide',
      solution: 'Vérifiez le format du numéro de suivi. Attendez 24h. Contactez le transporteur si persistant.',
      severity: 'low'
    },
    {
      symptom: 'L\'auto-order ne se déclenche pas',
      cause: 'Produit non mappé à un fournisseur ou fournisseur déconnecté',
      solution: 'Vérifiez le mapping produit→fournisseur et le statut de connexion API.',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'La règle du "batch processing"',
      content: 'Ne traitez pas les commandes au fil de l\'eau. Fixez 2 créneaux/jour (9h et 14h) pour tout traiter en masse. Plus efficace et moins d\'erreurs.',
      differentiator: 'ShopOpti+ groupe automatiquement les commandes par transporteur et destination.'
    },
    {
      title: 'Pré-négociez vos tarifs transporteurs',
      content: 'Au-delà de 100 colis/mois, négociez des remises. -15% à -30% possible avec un contrat annuel.',
      differentiator: 'Notre module Comparateur affiche les économies potentielles par transporteur.'
    },
    {
      title: 'Utilisez les règles d\'assignation',
      content: 'Assignez automatiquement les commandes par canal ou région à différents membres d\'équipe. Parallélisez le travail.',
      differentiator: 'Assignation automatique basée sur des règles personnalisables.'
    }
  ],
  
  callToValue: {
    headline: 'Traitez 3x plus de commandes sans embaucher',
    description: 'Le centre de commandes ShopOpti+ automatise 70% des tâches répétitives: génération d\'étiquettes, notifications, suivi, auto-order. Une personne gère ce qui en nécessitait trois.',
    metrics: [
      { label: 'Temps traitement commande', value: '2 min', improvement: '-75%' },
      { label: 'Commandes traitées/heure', value: '30+', improvement: '+200%' },
      { label: 'Taux d\'erreur expédition', value: '< 0.5%', improvement: '-90%' }
    ],
    cta: {
      label: 'Gérer mes commandes',
      route: '/orders'
    }
  },
  
  faqs: [
    {
      question: 'Quels transporteurs sont supportés ?',
      answer: 'France: Colissimo, Chronopost, Mondial Relay, Relais Colis, DPD, GLS. International: DHL, UPS, FedEx, TNT. Intégration générique pour les autres via API.'
    },
    {
      question: 'Puis-je gérer des commandes manuelles ?',
      answer: 'Oui, créez une commande manuelle pour les ventes hors-ligne (téléphone, boutique physique). Elle sera traitée comme les autres.'
    },
    {
      question: 'Comment fonctionne l\'auto-order dropshipping ?',
      answer: 'Quand une commande arrive, ShopOpti+ la transmet automatiquement au fournisseur mappé (CJ, Spocket...) avec l\'adresse client. Le fournisseur expédie directement.'
    }
  ],
  
  relatedModules: ['suppliers', 'channels', 'automation', 'analytics'],
  externalResources: [
    { label: 'Guide: Optimiser sa logistique', url: '/academy/logistics-optimization' },
    { label: 'Comparateur tarifs transporteurs', url: '/tools/shipping-calculator' }
  ]
};
