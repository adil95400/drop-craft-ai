import type { ModuleDocumentation } from '../types';

export const marketingDocumentation: ModuleDocumentation = {
  id: 'marketing',
  slug: 'marketing',
  title: 'Marketing & CRM',
  subtitle: 'Acquisition, fidélisation et communication client',
  description: 'Le module Marketing centralise toutes vos actions d\'acquisition et de fidélisation. CRM complet, SEO manager, gestion des publicités, email marketing, coupons et programmes de fidélité.',
  icon: 'Megaphone',
  category: 'marketing',
  routes: ['/marketing', '/marketing/crm', '/marketing/seo', '/marketing/ads', '/marketing/email', '/marketing/loyalty'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced'],
  estimatedReadTime: 18,
  lastUpdated: '2025-02-01',
  version: '2.0',
  tags: ['marketing', 'crm', 'seo', 'publicité', 'email', 'fidélisation', 'coupons'],
  
  overview: {
    purpose: 'Centraliser toutes les actions marketing e-commerce: acquisition de nouveaux clients, rétention des existants, optimisation SEO et gestion des campagnes publicitaires.',
    whenToUse: 'Pour gérer vos contacts clients, lancer des campagnes email, optimiser le SEO de vos fiches produits, créer des coupons ou programmes de fidélité.',
    targetAudience: 'Responsables marketing e-commerce, fondateurs gérant leur acquisition, agences marketing.',
    prerequisites: [
      'Avoir des clients/commandes dans le système',
      'Optionnel: compte publicitaire pour les intégrations Ads'
    ],
    keyFeatures: [
      'CRM complet avec segmentation automatique',
      'SEO manager avec scoring et recommandations',
      'Intégration Google Ads, Meta Ads, TikTok Ads',
      'Email marketing avec templates et automation',
      'Gestion des coupons et codes promo',
      'Programme de fidélité configurable',
      'Récupération de paniers abandonnés'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Segmenter sa base client',
      description: 'Vous voulez identifier vos meilleurs clients pour leur proposer des offres exclusives.',
      steps: [
        'Accédez à Marketing > CRM',
        'Consultez les segments automatiques (VIP, Réguliers, Nouveaux, Inactifs)',
        'Créez un segment personnalisé: "Plus de 500€ dépensés ET actif derniers 90 jours"',
        'Exportez ou ciblez ce segment dans vos campagnes'
      ],
      expectedOutcome: 'Segmentation précise pour des campagnes ciblées à fort ROI.'
    },
    {
      level: 'intermediate',
      title: 'Lancer une campagne email promotionnelle',
      description: 'Vous voulez envoyer une promo de -20% à vos clients VIP.',
      steps: [
        'Accédez à Marketing > Email',
        'Créez une nouvelle campagne',
        'Sélectionnez le segment "VIP"',
        'Choisissez un template promo et personnalisez',
        'Planifiez l\'envoi et lancez'
      ],
      expectedOutcome: 'Email envoyé à vos VIP avec tracking des ouvertures et clics.'
    },
    {
      level: 'advanced',
      title: 'Récupérer les paniers abandonnés',
      description: 'Vous perdez des ventes car les clients abandonnent leurs paniers.',
      steps: [
        'Accédez à Marketing > Automation',
        'Activez le workflow "Panier abandonné"',
        'Personnalisez les emails (timing, contenu, réduction incitative)',
        'Testez sur vous-même',
        'Activez et monitorez les récupérations'
      ],
      expectedOutcome: 'Récupération de 10-15% des paniers abandonnés.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Explorer le hub Marketing',
      description: 'Le hub affiche vos KPIs marketing: taux de conversion, LTV, taux de rétention. Les onglets donnent accès aux sous-modules.',
      tip: 'Commencez par le CRM pour comprendre votre base client.'
    },
    {
      stepNumber: 2,
      title: 'Gérer le CRM',
      description: 'Le CRM liste tous vos clients avec leur historique d\'achat, score RFM (Récence, Fréquence, Montant) et segment.',
      tip: 'Le score RFM est calculé automatiquement. Utilisez-le pour prioriser vos actions.'
    },
    {
      stepNumber: 3,
      title: 'Optimiser le SEO produits',
      description: 'Le SEO Manager analyse vos fiches et donne un score. Pour chaque produit, des recommandations sont fournies: longueur titre, mots-clés, meta description.',
      tip: 'Focalisez sur les produits à fort potentiel et score SEO faible.'
    },
    {
      stepNumber: 4,
      title: 'Créer un coupon',
      description: 'Accédez à Coupons > Nouveau. Définissez le type (% ou fixe), les conditions (panier min, produits éligibles) et la durée.',
      tip: 'Utilisez des codes uniques traçables pour mesurer l\'efficacité de chaque canal.',
      warning: 'Un coupon sans date d\'expiration peut être partagé indéfiniment.'
    },
    {
      stepNumber: 5,
      title: 'Configurer l\'email marketing',
      description: 'Connectez votre domaine pour l\'envoi d\'emails. Créez des templates réutilisables. Configurez les automations (bienvenue, anniversaire, inactif).',
      tip: 'Authentifiez votre domaine (SPF, DKIM) pour une meilleure délivrabilité.'
    },
    {
      stepNumber: 6,
      title: 'Lancer un programme de fidélité',
      description: 'Définissez les règles: points par euro dépensé, seuils de récompenses, avantages par palier.',
      tip: 'Commencez simple: 1 point = 1€, 100 points = 5€ de réduction.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Segmentez finement',
        description: 'Un message personnalisé convertit 3x mieux qu\'un message générique. Créez des segments précis.',
        impact: 'high'
      },
      {
        title: 'Automatisez les workflows clés',
        description: 'Email de bienvenue, anniversaire, panier abandonné, réactivation. Ces 4 workflows génèrent 80% du ROI email.',
        impact: 'high'
      },
      {
        title: 'Testez vos objets d\'email',
        description: 'L\'objet détermine l\'ouverture. Faites des A/B tests systématiques.',
        impact: 'medium'
      },
      {
        title: 'Trackez chaque action',
        description: 'UTM sur chaque lien, code promo par canal. Mesurez ce qui fonctionne.',
        impact: 'high'
      }
    ],
    pitfalls: [
      {
        title: 'Spammer sa base',
        description: 'Trop d\'emails = désinscriptions. Maximum 1 email promo/semaine, sauf segments très engagés.',
        impact: 'high'
      },
      {
        title: 'Ignorer les inactifs',
        description: 'Les clients inactifs 6+ mois coûtent cher à réactiver. Nettoyez régulièrement.',
        impact: 'medium'
      },
      {
        title: 'Coupons non limités',
        description: 'Un coupon sans limite peut être abusé. Définissez toujours une limite d\'utilisation.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Les emails arrivent en spam',
      cause: 'Domaine non authentifié ou réputation email faible',
      solution: 'Configurez SPF, DKIM, DMARC. Nettoyez votre liste des bounces.',
      severity: 'high'
    },
    {
      symptom: 'Le coupon ne s\'applique pas',
      cause: 'Conditions non remplies (panier min, produits exclus) ou coupon expiré',
      solution: 'Vérifiez les conditions du coupon et la date de validité.',
      severity: 'medium'
    },
    {
      symptom: 'Les segments sont vides',
      cause: 'Pas de données client ou critères trop restrictifs',
      solution: 'Vérifiez que les commandes remontent correctement. Élargissez les critères.',
      severity: 'low'
    },
    {
      symptom: 'Le panier abandonné ne se déclenche pas',
      cause: 'Email client non capturé ou workflow désactivé',
      solution: 'L\'email doit être capturé avant abandon. Vérifiez le statut du workflow.',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'Le framework RFM pour la segmentation',
      content: 'Récence × Fréquence × Montant. Scorez chaque client de 1 à 5 sur chaque axe. Les 555 sont vos champions, les 111 sont à réactiver ou abandonner.',
      differentiator: 'Scoring RFM automatique avec recommandations d\'action par segment.'
    },
    {
      title: 'L\'effet de la personnalisation',
      content: 'Un email avec prénom + produits recommandés basés sur l\'historique a un taux de clic 4x supérieur.',
      differentiator: 'Personnalisation dynamique native dans les templates email.'
    },
    {
      title: 'Le "win-back" avant de lâcher',
      content: 'Avant de supprimer un inactif, tentez une séquence win-back: offre agressive, dernière chance, goodbye. Vous récupérez 5-10%.',
      differentiator: 'Séquence win-back pré-configurée et optimisée.'
    }
  ],
  
  callToValue: {
    headline: 'Transformez vos visiteurs en clients fidèles',
    description: 'Le module Marketing vous donne tous les outils pour acquérir, convertir et fidéliser. Les utilisateurs voient leur LTV augmenter de 35% en moyenne grâce à la segmentation et l\'automation.',
    metrics: [
      { label: 'Augmentation LTV', value: '+35%', improvement: '' },
      { label: 'Taux récupération panier', value: '12%', improvement: '' },
      { label: 'ROI email marketing', value: '42x', improvement: '' }
    ],
    cta: {
      label: 'Explorer Marketing',
      route: '/marketing'
    }
  },
  
  faqs: [
    {
      question: 'Puis-je importer ma base client existante ?',
      answer: 'Oui, importez via CSV avec mapping des champs. Les clients existants seront fusionnés sur l\'email.'
    },
    {
      question: 'Combien d\'emails puis-je envoyer ?',
      answer: 'Pro: 10 000 emails/mois. Ultra Pro: 100 000 emails/mois. Au-delà, tarification au volume.'
    },
    {
      question: 'Les coupons fonctionnent-ils sur toutes les plateformes ?',
      answer: 'Les coupons ShopOpti+ se synchronisent avec Shopify et WooCommerce. Pour les autres marketplaces, utilisez leurs systèmes natifs.'
    }
  ],
  
  relatedModules: ['analytics', 'orders', 'channels', 'automation'],
  externalResources: [
    { label: 'Guide: Email marketing e-commerce', url: '/academy/email-marketing' },
    { label: 'Templates email', url: '/templates/email' }
  ]
};
