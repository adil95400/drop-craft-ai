import type { ModuleDocumentation } from '../types';

export const enterpriseDocumentation: ModuleDocumentation = {
  id: 'enterprise',
  slug: 'enterprise',
  title: 'Enterprise & Administration',
  subtitle: 'Fonctionnalités avancées pour les grandes organisations',
  description: 'Le module Enterprise offre des fonctionnalités avancées pour les grandes organisations: multi-tenant, monitoring plateforme, conformité, et administration centralisée.',
  icon: 'Building2',
  category: 'enterprise',
  routes: ['/enterprise', '/enterprise/monitoring', '/enterprise/compliance', '/enterprise/admin'],
  
  minPlan: 'ultra_pro',
  targetLevels: ['expert'],
  estimatedReadTime: 20,
  lastUpdated: '2025-02-01',
  version: '2.0',
  tags: ['enterprise', 'multi-tenant', 'monitoring', 'conformité', 'administration'],
  
  overview: {
    purpose: 'Fournir les outils nécessaires aux grandes organisations pour gérer ShopOpti+ à l\'échelle: multi-comptes, monitoring centralisé, conformité réglementaire et administration avancée.',
    whenToUse: 'Pour les organisations avec plusieurs équipes, des exigences de conformité strictes ou un besoin de monitoring centralisé.',
    targetAudience: 'Directeurs IT, responsables conformité, administrateurs plateforme, grandes agences.',
    prerequisites: [
      'Plan Ultra Pro',
      'Au moins 10+ utilisateurs ou besoins de conformité'
    ],
    keyFeatures: [
      'Multi-tenant avec isolation des données',
      'Console d\'administration centralisée',
      'Monitoring et observabilité avancés',
      'Conformité RGPD, SOC2, ISO 27001',
      'Audit logs étendus (2 ans)',
      'SLA garanti 99.9%',
      'Support dédié et CSM'
    ]
  },
  
  useCases: [
    {
      level: 'expert',
      title: 'Déployer une architecture multi-tenant',
      description: 'Vous êtes une agence gérant 50 clients et voulez une isolation stricte des données.',
      steps: [
        'Contactez votre CSM pour activer le mode multi-tenant',
        'Créez des workspaces par client',
        'Configurez les permissions inter-workspaces',
        'Déployez les utilisateurs par workspace',
        'Activez le billing séparé si nécessaire'
      ],
      expectedOutcome: 'Chaque client dans son espace isolé, gestion centralisée.'
    },
    {
      level: 'expert',
      title: 'Configurer le monitoring centralisé',
      description: 'Vous voulez surveiller la santé de tous vos comptes depuis une console unique.',
      steps: [
        'Accédez à Enterprise > Monitoring',
        'Activez les métriques agrégées',
        'Configurez les alertes globales (uptime, erreurs, performance)',
        'Intégrez avec votre stack observabilité (Datadog, New Relic...)',
        'Créez des dashboards exécutifs'
      ],
      expectedOutcome: 'Visibilité totale sur la santé de la plateforme.'
    },
    {
      level: 'expert',
      title: 'Préparer un audit de conformité',
      description: 'Vous devez prouver votre conformité RGPD ou SOC2 à un auditeur.',
      steps: [
        'Accédez à Enterprise > Conformité',
        'Générez le rapport de conformité RGPD/SOC2',
        'Exportez les audit logs de la période concernée',
        'Consultez les certifications ShopOpti+ (ISO 27001, SOC2 Type II)',
        'Fournissez le package à l\'auditeur'
      ],
      expectedOutcome: 'Audit passé avec documentation complète.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Accéder à la console Enterprise',
      description: 'La console Enterprise est accessible via le menu principal pour les comptes Ultra Pro. Elle donne une vue d\'ensemble de tous vos workspaces.',
      tip: 'Seuls les Super Admins ont accès à la console Enterprise.'
    },
    {
      stepNumber: 2,
      title: 'Gérer les workspaces',
      description: 'Créez des workspaces pour isoler les données par client, équipe ou projet. Chaque workspace a ses propres utilisateurs, produits et paramètres.',
      tip: 'Utilisez une convention de nommage claire: [Client]-[Région]-[Type].'
    },
    {
      stepNumber: 3,
      title: 'Configurer le SSO',
      description: 'Intégrez votre provider d\'identité (Okta, Azure AD, Google Workspace) pour un login unifié et sécurisé.',
      tip: 'Le SSO facilite l\'onboarding et centralise la gestion des accès.',
      warning: 'Testez le SSO sur un petit groupe avant le rollout global.'
    },
    {
      stepNumber: 4,
      title: 'Activer le monitoring avancé',
      description: 'Configurez les métriques à collecter, les seuils d\'alerte et les intégrations avec vos outils d\'observabilité.',
      tip: 'Commencez par les métriques critiques: uptime, erreurs 5xx, latence P99.'
    },
    {
      stepNumber: 5,
      title: 'Générer les rapports de conformité',
      description: 'Les rapports pré-formatés couvrent RGPD, SOC2, ISO 27001. Ils incluent les politiques, contrôles et preuves.',
      tip: 'Générez un rapport mensuel pour le suivi continu.'
    },
    {
      stepNumber: 6,
      title: 'Gérer les contrats et SLA',
      description: 'Votre CSM dédié gère les contrats, SLA et escalades. Contactez-le pour toute demande spécifique.',
      tip: 'Le SLA garanti est 99.9% uptime avec crédits en cas de non-respect.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Isolation stricte des données',
        description: 'En multi-tenant, assurez-vous qu\'aucun utilisateur ne peut accéder aux données d\'un autre workspace.',
        impact: 'high'
      },
      {
        title: 'Monitoring proactif',
        description: 'Ne réagissez pas aux problèmes, anticipez-les. Configurez des alertes sur les tendances, pas juste les seuils.',
        impact: 'high'
      },
      {
        title: 'Conformité continue',
        description: 'La conformité n\'est pas un one-shot. Auditez mensuellement, pas annuellement.',
        impact: 'high'
      },
      {
        title: 'Documentation des processus',
        description: 'Documentez tous les processus d\'administration. Évite les single points of failure humains.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Trop de Super Admins',
        description: 'Limitez les Super Admins au strict nécessaire. Plus il y en a, plus le risque est élevé.',
        impact: 'high'
      },
      {
        title: 'Ignorer les alertes monitoring',
        description: 'Si vous configurez des alertes mais ne les traitez pas, autant ne pas les avoir.',
        impact: 'high'
      },
      {
        title: 'Conformité sans formation',
        description: 'Les outils de conformité ne servent à rien si les équipes ne sont pas formées.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Le SSO ne fonctionne pas',
      cause: 'Configuration incorrecte ou certificat expiré',
      solution: 'Vérifiez la configuration SAML/OIDC. Renouvelez les certificats si expirés.',
      severity: 'high'
    },
    {
      symptom: 'Les métriques ne remontent pas dans Datadog',
      cause: 'Clé API incorrecte ou firewall bloquant',
      solution: 'Vérifiez la clé API et les règles firewall. Testez la connexion.',
      severity: 'medium'
    },
    {
      symptom: 'Workspace non accessible',
      cause: 'Utilisateur non assigné au workspace ou workspace désactivé',
      solution: 'Vérifiez les assignations utilisateur et le statut du workspace.',
      severity: 'medium'
    },
    {
      symptom: 'Rapport de conformité incomplet',
      cause: 'Données manquantes ou période trop courte',
      solution: 'Assurez-vous d\'avoir au moins 30 jours de données pour un rapport significatif.',
      severity: 'low'
    }
  ],
  
  expertTips: [
    {
      title: 'Infrastructure as Code',
      content: 'Gérez votre configuration ShopOpti+ via Terraform ou notre API de configuration. Versionnez et auditez chaque changement.',
      differentiator: 'Provider Terraform officiel disponible.'
    },
    {
      title: 'Disaster Recovery Testing',
      content: 'Testez votre plan de reprise d\'activité trimestriellement. ShopOpti+ supporte la restauration à un point dans le temps (PITR).',
      differentiator: 'RTO < 4h, RPO < 1h garanti contractuellement.'
    },
    {
      title: 'Custom SLA',
      content: 'Pour les besoins critiques, des SLA personnalisés sont négociables: 99.99% uptime, support 24/7/365.',
      differentiator: 'Contrats sur mesure pour les grands comptes.'
    }
  ],
  
  callToValue: {
    headline: 'ShopOpti+ à l\'échelle enterprise',
    description: 'Les fonctionnalités Enterprise permettent aux grandes organisations de déployer ShopOpti+ avec la sécurité, la conformité et l\'observabilité requises. Vos équipes travaillent sereinement, vous gardez le contrôle.',
    metrics: [
      { label: 'SLA garanti', value: '99.9%', improvement: '' },
      { label: 'Certifications', value: 'SOC2, ISO', improvement: '' },
      { label: 'Rétention audit logs', value: '2 ans', improvement: '' }
    ],
    cta: {
      label: 'Contacter un CSM',
      route: '/enterprise/contact'
    }
  },
  
  faqs: [
    {
      question: 'Qu\'est-ce que le multi-tenant ?',
      answer: 'Le multi-tenant permet de créer des espaces (workspaces) complètement isolés au sein d\'un même contrat. Idéal pour les agences gérant plusieurs clients.'
    },
    {
      question: 'ShopOpti+ est-il conforme RGPD ?',
      answer: 'Oui, ShopOpti+ est conforme RGPD. Nous fournissons un DPA (Data Processing Agreement), des outils d\'export/suppression des données, et hébergeons en Europe.'
    },
    {
      question: 'Quel est le processus pour obtenir SOC2 ?',
      answer: 'ShopOpti+ est certifié SOC2 Type II. Nous fournissons notre rapport SOC2 sur demande (NDA requis).'
    }
  ],
  
  relatedModules: ['settings', 'integrations', 'analytics'],
  externalResources: [
    { label: 'Security Whitepaper', url: '/enterprise/security' },
    { label: 'Contacter les ventes Enterprise', url: '/enterprise/contact' }
  ]
};
