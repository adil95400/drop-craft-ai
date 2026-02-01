import type { ModuleDocumentation } from '../types';

export const channelsDocumentation: ModuleDocumentation = {
  id: 'channels',
  slug: 'channels',
  title: 'Boutiques & Canaux',
  subtitle: 'Hub multicanal de publication et synchronisation',
  description: 'Le module Boutiques & Canaux est votre hub de distribution. Connectez vos boutiques e-commerce et marketplaces, publiez vos produits sur 24+ canaux et synchronisez stocks, prix et commandes en temps réel.',
  icon: 'Store',
  category: 'sales',
  routes: ['/stores-channels', '/stores-channels/connect', '/stores-channels/sync', '/stores-channels/mapping'],
  
  minPlan: 'standard',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 18,
  lastUpdated: '2025-02-01',
  version: '3.0',
  tags: ['multicanal', 'marketplaces', 'shopify', 'amazon', 'synchronisation', 'publication'],
  
  overview: {
    purpose: 'Centraliser la gestion de tous vos points de vente numériques. Au lieu de gérer chaque marketplace séparément, ShopOpti+ unifie tout: un catalogue source, distribution multicanale automatique.',
    whenToUse: 'Pour connecter une nouvelle boutique, publier des produits sur de nouveaux canaux, gérer les synchronisations ou résoudre des problèmes de mapping.',
    targetAudience: 'Vendeurs multicanaux, retailers omnicanaux, agences gérant des présences marketplace pour leurs clients.',
    prerequisites: [
      'Avoir un catalogue produits dans ShopOpti+',
      'Disposer des accès API ou admin pour chaque canal à connecter'
    ],
    keyFeatures: [
      '24+ canaux supportés (Shopify, WooCommerce, Amazon, eBay, Etsy...)',
      'Assistant de connexion guidé en 4 étapes',
      'Synchronisation bidirectionnelle (produits, stocks, prix, commandes)',
      'Mapping d\'attributs par canal',
      'Publication sélective ou en masse',
      'Monitoring temps réel des erreurs',
      'Gestion des stocks multi-entrepôts'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Connecter sa boutique Shopify',
      description: 'Vous avez une boutique Shopify et voulez la gérer depuis ShopOpti+.',
      steps: [
        'Accédez à Boutiques & Canaux > Connecter',
        'Sélectionnez "Shopify" dans la liste des plateformes',
        'Entrez l\'URL de votre boutique (.myshopify.com)',
        'Autorisez ShopOpti+ via OAuth (redirection Shopify)',
        'Attendez la synchronisation initiale (5-30min selon le volume)'
      ],
      expectedOutcome: 'Boutique connectée, produits synchronisés, commandes remontant automatiquement.'
    },
    {
      level: 'advanced',
      title: 'Publier sur Amazon depuis ShopOpti+',
      description: 'Vous voulez étendre votre distribution sur Amazon sans gérer Seller Central.',
      steps: [
        'Connectez votre compte Amazon Seller Central',
        'Mappez les catégories ShopOpti+ vers les catégories Amazon',
        'Configurez les attributs obligatoires (ASIN, marque, EAN)',
        'Sélectionnez les produits à publier',
        'Lancez la publication avec pricing adapté'
      ],
      expectedOutcome: 'Produits publiés sur Amazon, gestion des commandes centralisée.'
    },
    {
      level: 'expert',
      title: 'Gérer 10+ canaux avec des règles différentes',
      description: 'Vous vendez sur Shopify, Amazon, eBay, Cdiscount avec des prix et stocks différents par canal.',
      steps: [
        'Connectez tous vos canaux',
        'Créez des règles de pricing par canal (+10% Amazon, -5% eBay...)',
        'Configurez les réserves de stock par canal',
        'Mappez les attributs spécifiques à chaque marketplace',
        'Activez les alertes sur erreurs de synchronisation'
      ],
      expectedOutcome: 'Gestion unifiée avec stratégie différenciée par canal.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Accéder au hub Boutiques & Canaux',
      description: 'Le hub affiche tous vos canaux connectés avec leur statut: vert (synchro OK), orange (warning), rouge (erreur).',
      tip: 'Cliquez sur un canal pour voir les détails de la dernière synchronisation.'
    },
    {
      stepNumber: 2,
      title: 'Connecter un nouveau canal',
      description: 'Cliquez "Ajouter un canal" et sélectionnez la plateforme. L\'assistant en 4 étapes vous guide: connexion → configuration → mapping → validation.',
      tip: 'Préparez vos identifiants API ou admin avant de commencer.'
    },
    {
      stepNumber: 3,
      title: 'Configurer la synchronisation',
      description: 'Choisissez ce qui doit être synchronisé: produits (uni/bidirectionnel), stocks (temps réel ou différé), prix, commandes.',
      tip: 'Pour une première connexion, activez la synchro unidirectionnelle (ShopOpti+ → Canal) pour éviter les surprises.',
      warning: 'La synchro bidirectionnelle peut écraser vos données ShopOpti+ si le canal est la source de vérité.'
    },
    {
      stepNumber: 4,
      title: 'Mapper les attributs',
      description: 'Chaque canal a ses exigences (catégories, attributs, formats). L\'assistant de mapping vous aide à faire correspondre vos données.',
      tip: 'L\'IA suggère des mappings basés sur vos données existantes.'
    },
    {
      stepNumber: 5,
      title: 'Publier les produits',
      description: 'Sélectionnez les produits à publier sur le canal. Vous pouvez publier tout le catalogue ou filtrer par catégorie, marge, stock...',
      tip: 'Commencez par 50 produits pour valider le mapping, puis étendez.'
    },
    {
      stepNumber: 6,
      title: 'Surveiller et corriger les erreurs',
      description: 'L\'onglet Erreurs affiche les produits en échec avec la raison. Corrigez et relancez la publication.',
      tip: 'Les erreurs fréquentes: attribut manquant, image trop petite, catégorie invalide.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Utilisez ShopOpti+ comme source de vérité',
        description: 'Faites toutes vos modifications dans ShopOpti+ et propagez vers les canaux. Évitez de modifier directement dans les marketplaces.',
        impact: 'high'
      },
      {
        title: 'Configurez des alertes de désynchronisation',
        description: 'Un stock désynchronisé = surventes. Soyez alerté immédiatement si la synchro échoue.',
        impact: 'high'
      },
      {
        title: 'Adaptez les prix par canal',
        description: 'Amazon a des commissions plus élevées qu\'Etsy. Ajustez vos prix pour maintenir vos marges.',
        impact: 'high'
      },
      {
        title: 'Testez avant la publication massive',
        description: 'Publiez 10 produits, vérifiez le rendu, corrigez les problèmes, puis étendez.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Synchro bidirectionnelle sans réflexion',
        description: 'Activer la synchro bi-di peut écraser vos données. Définissez clairement quelle source prime.',
        impact: 'high'
      },
      {
        title: 'Ignorer les erreurs de publication',
        description: 'Chaque erreur = produit invisible = ventes perdues. Traitez les erreurs quotidiennement.',
        impact: 'high'
      },
      {
        title: 'Publier sans mapping attributs',
        description: 'Des attributs non mappés = produit mal référencé = visibilité réduite de 80%.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'La connexion au canal échoue',
      cause: 'Credentials invalides, permissions insuffisantes ou API désactivée',
      solution: 'Régénérez vos tokens API dans le dashboard de la marketplace. Vérifiez les permissions requises.',
      severity: 'high'
    },
    {
      symptom: 'Les stocks ne se synchronisent pas',
      cause: 'Synchro désactivée, erreur réseau ou produit non mappé',
      solution: 'Vérifiez les paramètres de synchro. Forcez une resynchronisation manuelle.',
      severity: 'high'
    },
    {
      symptom: 'Produit publié mais invisible sur la marketplace',
      cause: 'Produit en attente de validation marketplace ou attributs incomplets',
      solution: 'Vérifiez le statut dans le dashboard marketplace. Complétez les attributs manquants.',
      severity: 'medium'
    },
    {
      symptom: 'Les commandes ne remontent pas',
      cause: 'Webhook mal configuré ou synchro commandes désactivée',
      solution: 'Vérifiez la configuration webhook dans les paramètres du canal.',
      severity: 'high'
    }
  ],
  
  expertTips: [
    {
      title: 'La stratégie "Test & Scale"',
      content: 'Pour chaque nouvelle marketplace, commencez avec 20 produits pendant 2 semaines. Analysez les performances, optimisez, puis déployez 200, puis 2000.',
      differentiator: 'ShopOpti+ permet de créer des "cohortes de test" avec suivi de performance isolé.'
    },
    {
      title: 'Différenciez par valeur ajoutée',
      content: 'Ne vendez pas le même produit au même prix partout. Bundlez sur votre site, vendez à l\'unité sur Amazon, proposez des variantes exclusives sur Etsy.',
      differentiator: 'Créez des variantes virtuelles par canal sans dupliquer les produits.'
    },
    {
      title: 'Optimisez le mapping par canal',
      content: 'Les algorithmes marketplace valorisent la complétude des fiches. Plus d\'attributs = meilleur ranking. Investissez du temps dans le mapping.',
      differentiator: 'Notre analyseur de mapping indique votre score de complétude par canal.'
    }
  ],
  
  callToValue: {
    headline: 'Vendez partout depuis un seul endroit',
    description: 'Le hub multicanal ShopOpti+ vous donne accès à 24+ marketplaces depuis une interface unique. Plus besoin de jongler entre Seller Central, Shopify Admin et eBay. Un catalogue, une distribution mondiale.',
    metrics: [
      { label: 'Canaux supportés', value: '24+', improvement: '' },
      { label: 'Temps gestion multicanal', value: '-70%', improvement: '' },
      { label: 'Erreurs de stock', value: '< 0.1%', improvement: '-95%' }
    ],
    cta: {
      label: 'Connecter mes boutiques',
      route: '/stores-channels'
    }
  },
  
  faqs: [
    {
      question: 'Quels canaux sont supportés ?',
      answer: 'Boutiques: Shopify, WooCommerce, PrestaShop, Magento, Wix, BigCommerce. Marketplaces: Amazon, eBay, Etsy, TikTok Shop, Google Shopping, Meta Commerce, Cdiscount, Fnac, Rakuten. Et plus encore.'
    },
    {
      question: 'La synchronisation est-elle temps réel ?',
      answer: 'Stocks et commandes: quasi temps réel (< 5 min). Produits: sur demande ou planifiée (1-4x/jour). Configurable par canal.'
    },
    {
      question: 'Puis-je connecter plusieurs comptes du même canal ?',
      answer: 'Oui, vous pouvez connecter plusieurs boutiques Shopify ou plusieurs comptes Amazon. Chacun est géré séparément.'
    }
  ],
  
  relatedModules: ['products', 'orders', 'pricing', 'analytics'],
  externalResources: [
    { label: 'Guide: Stratégie multicanale', url: '/academy/multichannel-strategy' },
    { label: 'Comparatif marketplaces', url: '/resources/marketplace-comparison' }
  ]
};
