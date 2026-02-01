import type { ModuleDocumentation } from '../types';

export const settingsDocumentation: ModuleDocumentation = {
  id: 'settings',
  slug: 'settings',
  title: 'Paramètres & Configuration',
  subtitle: 'Personnalisez ShopOpti+ selon vos besoins',
  description: 'Le module Paramètres vous permet de configurer tous les aspects de ShopOpti+: profil utilisateur, équipe, facturation, sécurité, notifications et préférences générales.',
  icon: 'Settings',
  category: 'enterprise',
  routes: ['/settings', '/settings/profile', '/settings/team', '/settings/billing', '/settings/security', '/settings/notifications'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate'],
  estimatedReadTime: 10,
  lastUpdated: '2025-02-01',
  version: '1.5',
  tags: ['paramètres', 'profil', 'équipe', 'facturation', 'sécurité'],
  
  overview: {
    purpose: 'Configurer ShopOpti+ pour qu\'il corresponde à votre façon de travailler. Gérer votre compte, votre équipe et vos abonnements.',
    whenToUse: 'Au démarrage pour la configuration initiale, puis ponctuellement pour ajouter des membres d\'équipe, modifier la facturation ou ajuster les notifications.',
    targetAudience: 'Tous les utilisateurs, en particulier les administrateurs de compte.',
    prerequisites: [
      'Être connecté à un compte ShopOpti+'
    ],
    keyFeatures: [
      'Gestion du profil et préférences',
      'Gestion d\'équipe avec rôles granulaires',
      'Facturation et historique des paiements',
      'Sécurité: 2FA, sessions, audit logs',
      'Notifications personnalisables',
      'Import/export de configuration'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Configurer son profil',
      description: 'Vous venez de créer votre compte et voulez personnaliser vos informations.',
      steps: [
        'Accédez à Paramètres > Profil',
        'Renseignez nom, email, photo',
        'Configurez vos préférences (langue, timezone, devise)',
        'Sauvegardez'
      ],
      expectedOutcome: 'Profil complet et préférences adaptées.'
    },
    {
      level: 'intermediate',
      title: 'Ajouter un membre d\'équipe',
      description: 'Vous embauchez et voulez donner accès à un collaborateur.',
      steps: [
        'Accédez à Paramètres > Équipe',
        'Cliquez "Inviter un membre"',
        'Entrez l\'email et sélectionnez le rôle (Admin, Éditeur, Lecteur)',
        'Personnalisez les permissions si nécessaire',
        'Envoyez l\'invitation'
      ],
      expectedOutcome: 'Collaborateur invité, accès accordé selon le rôle.'
    },
    {
      level: 'intermediate',
      title: 'Activer la double authentification',
      description: 'Vous voulez sécuriser votre compte contre les accès non autorisés.',
      steps: [
        'Accédez à Paramètres > Sécurité',
        'Cliquez "Activer 2FA"',
        'Scannez le QR code avec votre app authenticator',
        'Entrez le code de vérification',
        'Sauvegardez les codes de secours'
      ],
      expectedOutcome: 'Compte sécurisé par double authentification.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Accéder aux paramètres',
      description: 'Cliquez sur l\'icône engrenage en bas du menu latéral, ou sur votre avatar puis "Paramètres".',
      tip: 'Les paramètres sont aussi accessibles via /settings dans l\'URL.'
    },
    {
      stepNumber: 2,
      title: 'Gérer le profil',
      description: 'L\'onglet Profil permet de modifier vos informations personnelles, photo, préférences de langue et fuseau horaire.',
      tip: 'Utilisez une photo reconnaissable pour que votre équipe vous identifie facilement.'
    },
    {
      stepNumber: 3,
      title: 'Configurer l\'équipe',
      description: 'L\'onglet Équipe liste tous les membres. Vous pouvez inviter, modifier les rôles ou révoquer les accès.',
      tip: 'Les rôles prédéfinis couvrent 90% des cas. Créez des rôles personnalisés pour les besoins spécifiques.',
      warning: 'Révoquez immédiatement les accès des employés qui quittent l\'entreprise.'
    },
    {
      stepNumber: 4,
      title: 'Gérer la facturation',
      description: 'L\'onglet Facturation affiche votre plan actuel, la prochaine échéance, l\'historique des factures et les moyens de paiement.',
      tip: 'Téléchargez vos factures en PDF pour votre comptabilité.'
    },
    {
      stepNumber: 5,
      title: 'Renforcer la sécurité',
      description: 'L\'onglet Sécurité permet d\'activer 2FA, voir les sessions actives, consulter les logs d\'audit et gérer les clés API.',
      tip: 'Consultez régulièrement les sessions actives pour détecter des accès suspects.'
    },
    {
      stepNumber: 6,
      title: 'Personnaliser les notifications',
      description: 'L\'onglet Notifications permet de choisir quelles alertes recevoir par email, push ou dans l\'app.',
      tip: 'Désactivez les notifications non essentielles pour réduire le bruit.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Activez la 2FA',
        description: 'La double authentification bloque 99% des tentatives de piratage. Activez-la immédiatement.',
        impact: 'high'
      },
      {
        title: 'Principe du moindre privilège',
        description: 'Donnez à chaque membre uniquement les accès dont il a besoin. Un stagiaire n\'a pas besoin d\'être Admin.',
        impact: 'high'
      },
      {
        title: 'Auditez régulièrement',
        description: 'Consultez les logs d\'audit mensuellement. Identifiez les comportements anormaux.',
        impact: 'medium'
      },
      {
        title: 'Maintenez les moyens de paiement à jour',
        description: 'Une carte expirée = interruption de service. Mettez à jour avant l\'expiration.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Partager son compte',
        description: 'Chaque utilisateur doit avoir son propre compte. Le partage = perte de traçabilité.',
        impact: 'high'
      },
      {
        title: 'Ignorer les codes de secours 2FA',
        description: 'Si vous perdez votre phone et n\'avez pas les codes de secours, vous perdez l\'accès à votre compte.',
        impact: 'high'
      },
      {
        title: 'Ne jamais révoquer les anciens membres',
        description: 'Un ex-employé avec accès = faille de sécurité majeure.',
        impact: 'high'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Impossible de se connecter après activation 2FA',
      cause: 'Code incorrect ou décalage horaire sur le téléphone',
      solution: 'Synchronisez l\'heure de votre téléphone. Utilisez un code de secours si nécessaire.',
      severity: 'high'
    },
    {
      symptom: 'L\'invitation d\'équipe n\'arrive pas',
      cause: 'Email en spam ou adresse incorrecte',
      solution: 'Vérifiez les spams du destinataire. Renvoyez l\'invitation.',
      severity: 'low'
    },
    {
      symptom: 'Le paiement est refusé',
      cause: 'Carte expirée, limite atteinte ou blocage bancaire',
      solution: 'Mettez à jour la carte ou contactez votre banque.',
      severity: 'high'
    },
    {
      symptom: 'Impossible de supprimer un membre',
      cause: 'C\'est le dernier admin du compte',
      solution: 'Nommez un autre admin avant de supprimer.',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'SSO pour les grandes équipes',
      content: 'Avec Ultra Pro, activez le SSO (Google Workspace, Okta, Azure AD). Simplifiez l\'onboarding et centralisez la gestion des accès.',
      differentiator: 'SAML et OIDC supportés pour tous les providers majeurs.'
    },
    {
      title: 'Audit logs pour la conformité',
      content: 'Les logs d\'audit sont conservés 2 ans et exportables. Utile pour les audits RGPD ou certifications.',
      differentiator: 'Export structuré avec filtres avancés.'
    },
    {
      title: 'Rôles personnalisés',
      content: 'Créez des rôles sur mesure: "Gestionnaire catalogue" avec accès produits mais pas commandes, par exemple.',
      differentiator: 'Permissions granulaires sur chaque module et action.'
    }
  ],
  
  callToValue: {
    headline: 'Configurez ShopOpti+ en 5 minutes',
    description: 'Une configuration initiale bien faite vous fait gagner des heures par la suite. Sécurisez votre compte, invitez votre équipe et personnalisez vos préférences.',
    metrics: [
      { label: 'Temps de configuration', value: '5 min', improvement: '' },
      { label: 'Sécurité avec 2FA', value: '+99%', improvement: '' },
      { label: 'Rôles disponibles', value: '10+', improvement: '' }
    ],
    cta: {
      label: 'Accéder aux paramètres',
      route: '/settings'
    }
  },
  
  faqs: [
    {
      question: 'Combien de membres puis-je inviter ?',
      answer: 'Standard: 3 membres. Pro: 10 membres. Ultra Pro: illimité.'
    },
    {
      question: 'Puis-je changer de plan à tout moment ?',
      answer: 'Oui, upgrade instantané. Downgrade à la prochaine échéance de facturation.'
    },
    {
      question: 'Comment récupérer mon compte si je perds l\'accès 2FA ?',
      answer: 'Utilisez un code de secours, ou contactez le support avec vérification d\'identité (48h).'
    }
  ],
  
  relatedModules: ['integrations', 'enterprise'],
  externalResources: [
    { label: 'Guide de sécurité', url: '/academy/security-best-practices' },
    { label: 'FAQ facturation', url: '/support/billing-faq' }
  ]
};
