import type { ModuleDocumentation } from '../types';

export const integrationsDocumentation: ModuleDocumentation = {
  id: 'integrations',
  slug: 'integrations',
  title: 'Intégrations & API',
  subtitle: 'Connectez ShopOpti+ à votre écosystème',
  description: 'Le module Intégrations vous permet de connecter ShopOpti+ à tous vos outils: comptabilité, ERP, marketing, logistique. L\'API ouverte permet aussi de créer vos propres intégrations.',
  icon: 'Plug',
  category: 'enterprise',
  routes: ['/integrations', '/integrations/marketplace', '/integrations/api', '/settings/api'],
  
  minPlan: 'standard',
  targetLevels: ['advanced', 'expert'],
  estimatedReadTime: 15,
  lastUpdated: '2025-02-01',
  version: '2.0',
  tags: ['api', 'webhooks', 'integrations', 'connecteurs', 'automatisation'],
  
  overview: {
    purpose: 'Connecter ShopOpti+ à l\'ensemble de votre stack technologique. Synchronisez vos données avec votre comptabilité, ERP, outils marketing et logistique.',
    whenToUse: 'Pour connecter un nouvel outil, configurer des webhooks, ou utiliser l\'API pour des intégrations personnalisées.',
    targetAudience: 'Développeurs, intégrateurs, responsables IT, agences techniques.',
    prerequisites: [
      'Selon les intégrations, des comptes sur les outils cibles',
      'Pour l\'API: connaissances techniques REST/JSON'
    ],
    keyFeatures: [
      '50+ intégrations pré-configurées',
      'API REST complète avec documentation OpenAPI',
      'Webhooks entrants et sortants',
      'SDK JavaScript et Python',
      'Extension Chrome ShopOpti+',
      'Zapier et Make (Integromat) natifs',
      'Logs et monitoring des appels'
    ]
  },
  
  useCases: [
    {
      level: 'advanced',
      title: 'Connecter sa comptabilité',
      description: 'Vous voulez synchroniser automatiquement vos ventes avec votre logiciel comptable.',
      steps: [
        'Accédez à Intégrations > Comptabilité',
        'Sélectionnez votre logiciel (Pennylane, QuickBooks...)',
        'Autorisez la connexion via OAuth',
        'Mappez les comptes et les taxes',
        'Activez la synchronisation automatique'
      ],
      expectedOutcome: 'Écritures comptables générées automatiquement à chaque vente.'
    },
    {
      level: 'expert',
      title: 'Créer une intégration personnalisée via API',
      description: 'Vous voulez connecter ShopOpti+ à un outil interne non supporté.',
      steps: [
        'Accédez à Paramètres > API',
        'Générez une clé API avec les scopes nécessaires',
        'Consultez la documentation OpenAPI',
        'Développez votre intégration (REST + Webhooks)',
        'Testez en environnement sandbox puis production'
      ],
      expectedOutcome: 'Intégration sur mesure fonctionnelle et maintenue.'
    },
    {
      level: 'advanced',
      title: 'Automatiser avec Zapier',
      description: 'Vous voulez créer des workflows inter-applications sans coder.',
      steps: [
        'Recherchez "ShopOpti" dans Zapier',
        'Choisissez un trigger (nouvelle commande, nouveau produit...)',
        'Connectez votre compte ShopOpti+ via API key',
        'Ajoutez les actions dans vos autres apps',
        'Activez le Zap'
      ],
      expectedOutcome: 'Automatisation cross-app sans développement.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Explorer le marketplace d\'intégrations',
      description: 'Le marketplace liste toutes les intégrations disponibles par catégorie: comptabilité, ERP, marketing, logistique, CRM...',
      tip: 'Utilisez la recherche pour trouver rapidement votre outil.'
    },
    {
      stepNumber: 2,
      title: 'Connecter une intégration native',
      description: 'Cliquez sur l\'intégration souhaitée, suivez l\'assistant de connexion. La plupart utilisent OAuth pour une connexion sécurisée.',
      tip: 'Ayez vos identifiants de l\'outil cible à portée de main.'
    },
    {
      stepNumber: 3,
      title: 'Configurer les webhooks sortants',
      description: 'Accédez à Paramètres > Webhooks. Ajoutez une URL cible et sélectionnez les événements à écouter.',
      tip: 'Testez avec un outil comme webhook.site pour vérifier la réception.',
      warning: 'Les URLs webhook doivent être HTTPS et accessibles publiquement.'
    },
    {
      stepNumber: 4,
      title: 'Générer une clé API',
      description: 'Accédez à Paramètres > API > Nouvelle clé. Définissez un nom, les scopes (permissions) et la durée de validité.',
      tip: 'Créez des clés séparées par application. Révoquez celles non utilisées.',
      warning: 'La clé n\'est affichée qu\'une fois. Stockez-la de façon sécurisée.'
    },
    {
      stepNumber: 5,
      title: 'Consulter la documentation API',
      description: 'La doc OpenAPI est accessible dans Paramètres > API > Documentation. Elle liste tous les endpoints, paramètres et exemples.',
      tip: 'Utilisez Postman ou Insomnia pour tester les endpoints avant de coder.'
    },
    {
      stepNumber: 6,
      title: 'Monitorer les appels',
      description: 'L\'onglet Logs affiche tous les appels API entrants/sortants avec statut, durée et payload.',
      tip: 'Filtrez par statut d\'erreur pour identifier rapidement les problèmes.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Utilisez des scopes minimaux',
        description: 'Ne donnez à chaque clé API que les permissions strictement nécessaires. Principe du moindre privilège.',
        impact: 'high'
      },
      {
        title: 'Renouvelez les clés régulièrement',
        description: 'Rotation des clés tous les 90 jours maximum. Une clé compromise = accès total.',
        impact: 'high'
      },
      {
        title: 'Gérez les erreurs webhook',
        description: 'Implémentez une logique de retry côté récepteur. ShopOpti+ retry 3 fois avec backoff.',
        impact: 'medium'
      },
      {
        title: 'Utilisez les environnements',
        description: 'Clé sandbox pour le développement, clé production pour le live. Ne mélangez jamais.',
        impact: 'high'
      }
    ],
    pitfalls: [
      {
        title: 'Clé API dans le code',
        description: 'Ne commitez jamais une clé API dans git. Utilisez des variables d\'environnement.',
        impact: 'high'
      },
      {
        title: 'Ignorer les rate limits',
        description: 'L\'API a des limites (1000 req/min). Implémentez un backoff exponentiel.',
        impact: 'medium'
      },
      {
        title: 'Webhooks non sécurisés',
        description: 'Validez la signature des webhooks entrants. Ne faites pas confiance au payload sans vérification.',
        impact: 'high'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'L\'intégration ne se connecte pas',
      cause: 'Credentials incorrects ou permissions insuffisantes sur l\'outil cible',
      solution: 'Vérifiez vos identifiants et les permissions accordées dans l\'outil cible.',
      severity: 'high'
    },
    {
      symptom: 'Les webhooks ne sont pas reçus',
      cause: 'URL incorrecte, firewall bloquant ou HTTPS invalide',
      solution: 'Testez l\'URL avec curl. Vérifiez les logs firewall. Assurez un certificat SSL valide.',
      severity: 'medium'
    },
    {
      symptom: 'Erreur 401 sur l\'API',
      cause: 'Clé API invalide, expirée ou scope insuffisant',
      solution: 'Régénérez la clé avec les bons scopes. Vérifiez la date d\'expiration.',
      severity: 'medium'
    },
    {
      symptom: 'Rate limit atteint',
      cause: 'Trop de requêtes en peu de temps',
      solution: 'Implémentez un cache et un backoff exponentiel. Optimisez vos appels.',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'Webhooks > Polling',
      content: 'Au lieu de poller l\'API toutes les minutes, abonnez-vous aux webhooks. Plus efficace, plus rapide, moins cher.',
      differentiator: 'Webhooks disponibles sur 30+ événements avec signature HMAC.'
    },
    {
      title: 'Idempotence des appels',
      content: 'Rendez vos intégrations idempotentes. Un même webhook reçu 2 fois ne doit pas créer de doublon.',
      differentiator: 'Chaque webhook inclut un ID unique pour la déduplication.'
    },
    {
      title: 'Monitoring proactif',
      content: 'Configurez des alertes sur les erreurs API. Un pic d\'erreurs 4xx/5xx indique un problème à investiguer.',
      differentiator: 'Dashboard monitoring avec alertes configurables.'
    }
  ],
  
  callToValue: {
    headline: 'Connectez ShopOpti+ à tout votre écosystème',
    description: 'Les intégrations éliminent la double saisie et les erreurs de synchronisation. Votre stack technologique devient un tout cohérent, avec ShopOpti+ au centre.',
    metrics: [
      { label: 'Intégrations natives', value: '50+', improvement: '' },
      { label: 'Temps synchro comptable', value: '-95%', improvement: '' },
      { label: 'Uptime API', value: '99.9%', improvement: '' }
    ],
    cta: {
      label: 'Explorer les intégrations',
      route: '/integrations'
    }
  },
  
  faqs: [
    {
      question: 'L\'API est-elle gratuite ?',
      answer: 'Oui, l\'accès API est inclus dans tous les plans. Les limites varient: Standard: 1000 req/h, Pro: 10000 req/h, Ultra Pro: 100000 req/h.'
    },
    {
      question: 'Y a-t-il un SDK ?',
      answer: 'Oui, SDK officiels en JavaScript/TypeScript et Python. Packages npm et PyPI disponibles.'
    },
    {
      question: 'Puis-je créer une app publique ?',
      answer: 'Oui, contactez-nous pour le programme partenaires et la publication sur notre marketplace.'
    }
  ],
  
  relatedModules: ['automation', 'settings', 'enterprise'],
  externalResources: [
    { label: 'Documentation API', url: '/developers/api' },
    { label: 'SDK JavaScript', url: '/developers/sdk/javascript' },
    { label: 'Programme partenaires', url: '/partners' }
  ]
};
