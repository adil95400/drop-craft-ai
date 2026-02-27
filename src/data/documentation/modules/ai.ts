import type { ModuleDocumentation } from '../types';

export const aiDocumentation: ModuleDocumentation = {
  id: 'ai',
  slug: 'ai',
  title: 'Intelligence Artificielle',
  subtitle: 'Cerveau IA intégré à chaque module',
  description: 'L\'IA ShopOpti+ n\'est pas un module isolé, c\'est un cerveau intégré à chaque fonctionnalité. Génération de contenu, optimisation SEO, recommandations produits, prédictions de ventes - l\'IA augmente chaque action.',
  icon: 'Brain',
  category: 'automation',
  routes: ['/ai', '/ai/content', '/ai/optimization', '/ai/assistant'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced'],
  estimatedReadTime: 15,
  lastUpdated: '2025-02-01',
  version: '3.0',
  tags: ['ia', 'génération', 'optimisation', 'contenu', 'seo', 'prédictions'],
  
  overview: {
    purpose: 'Augmenter vos capacités avec l\'intelligence artificielle. L\'IA génère du contenu de qualité, optimise vos fiches produits, prédit les tendances et vous assiste dans toutes vos décisions.',
    whenToUse: 'À chaque fois que vous créez ou modifiez du contenu, quand vous analysez des données, quand vous cherchez des recommandations d\'optimisation.',
    targetAudience: 'Tous les utilisateurs cherchant à gagner du temps et améliorer la qualité de leur contenu et de leurs décisions.',
    prerequisites: [
      'Aucun prérequis technique - l\'IA est intégrée nativement',
      'Les crédits IA sont inclus dans chaque plan'
    ],
    keyFeatures: [
      'Génération de descriptions produits SEO-optimisées',
      'Réécriture et amélioration de textes existants',
      'Traduction automatique multilingue',
      'Suggestions d\'attributs et catégories',
      'Analyse de qualité et scoring',
      'Prédictions de ventes et tendances',
      'Assistant conversationnel'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Générer une description produit',
      description: 'Vous avez un produit sans description et voulez en créer une rapidement.',
      steps: [
        'Ouvrez la fiche produit',
        'Cliquez sur "Générer avec IA" à côté du champ description',
        'L\'IA analyse le titre, les images et attributs',
        'Une description SEO-optimisée est générée en 5 secondes',
        'Relisez, ajustez si besoin, validez'
      ],
      expectedOutcome: 'Description professionnelle en 30 secondes au lieu de 10 minutes.'
    },
    {
      level: 'intermediate',
      title: 'Optimiser 100 fiches produits en masse',
      description: 'Votre catalogue a des descriptions pauvres et vous voulez tout améliorer.',
      steps: [
        'Accédez à IA > Optimisation en masse',
        'Filtrez les produits (score qualité < 70)',
        'Sélectionnez les champs à optimiser (description, titre, attributs)',
        'Lancez l\'optimisation par lots de 50',
        'Validez les résultats par échantillonnage'
      ],
      expectedOutcome: '100 fiches optimisées en 30 minutes. Score qualité moyen +25 points.'
    },
    {
      level: 'advanced',
      title: 'Utiliser l\'assistant IA pour l\'analyse',
      description: 'Vous voulez comprendre pourquoi vos ventes baissent sur une catégorie.',
      steps: [
        'Ouvrez l\'assistant IA (icône chat en bas à droite)',
        'Demandez: "Analyse les ventes de la catégorie Électronique ce mois"',
        'L\'IA croise les données: ventes, stocks, prix, concurrence, saisonnalité',
        'Recevez un rapport avec insights et recommandations actionnables'
      ],
      expectedOutcome: 'Analyse qui prendrait 2h faite en 2 minutes avec des actions claires.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Comprendre où l\'IA est disponible',
      description: 'L\'icône ✨ indique les champs où l\'IA peut intervenir. Elle est présente dans: fiches produits, imports, pricing, analytics, support.',
      tip: 'Cherchez l\'icône étincelle - c\'est le bouton pour déclencher l\'IA.'
    },
    {
      stepNumber: 2,
      title: 'Générer du contenu',
      description: 'Cliquez sur ✨ à côté d\'un champ texte. L\'IA génère du contenu basé sur le contexte (autres champs, images, catégorie).',
      tip: 'Plus vous fournissez de contexte (titre précis, attributs), meilleur est le résultat.'
    },
    {
      stepNumber: 3,
      title: 'Personnaliser le ton et le style',
      description: 'Dans Paramètres > IA, configurez votre ton par défaut: professionnel, décontracté, luxe, technique...',
      tip: 'Créez des presets par catégorie de produits.'
    },
    {
      stepNumber: 4,
      title: 'Utiliser l\'enrichissement en masse',
      description: 'Pour de gros volumes, utilisez IA > Batch. Sélectionnez les produits, les champs à enrichir, et lancez. L\'IA traite en arrière-plan.',
      tip: 'Planifiez les gros batchs la nuit pour des performances optimales.',
      warning: 'Chaque enrichissement consomme des crédits. Vérifiez votre quota avant.'
    },
    {
      stepNumber: 5,
      title: 'Consulter l\'assistant',
      description: 'L\'assistant IA répond à vos questions en langage naturel. Il a accès à toutes vos données et peut générer des rapports, des analyses, des recommandations.',
      tip: 'Soyez précis dans vos questions. "Analyse mes ventes" est vague. "Quels sont mes 10 produits les plus rentables ce trimestre ?" est précis.'
    },
    {
      stepNumber: 6,
      title: 'Exploiter les prédictions',
      description: 'L\'IA prédit: ventes futures (J+7, J+30), risques de rupture, tendances marché. Consultez le dashboard IA pour les insights.',
      tip: 'Les prédictions sont plus fiables avec 30+ jours d\'historique.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Fournissez du contexte riche',
        description: 'Un titre complet + attributs renseignés = génération de qualité. Titre vague = résultat générique.',
        impact: 'high'
      },
      {
        title: 'Relisez toujours',
        description: 'L\'IA est puissante mais pas infaillible. Une relecture rapide évite les erreurs factuelles.',
        impact: 'high'
      },
      {
        title: 'Utilisez les templates de prompt',
        description: 'Créez des instructions personnalisées pour votre secteur. Ex: "Inclure les certifications bio pour les produits alimentaires."',
        impact: 'medium'
      },
      {
        title: 'Combinez IA et règles',
        description: 'L\'IA génère, les règles appliquent. Ex: IA génère la description, une règle ajoute automatiquement les mentions légales.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Faire confiance aveuglément',
        description: 'L\'IA peut halluciner des caractéristiques ou des prix. Validez les informations factuelles.',
        impact: 'high'
      },
      {
        title: 'Utiliser l\'IA sur des données incomplètes',
        description: 'Garbage in, garbage out. Si votre titre est "Produit 123", l\'IA ne fera pas de miracle.',
        impact: 'medium'
      },
      {
        title: 'Ignorer les crédits',
        description: 'Chaque génération consomme des crédits. Surveillez votre consommation pour ne pas tomber à 0 en milieu de mois.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'La génération est de mauvaise qualité',
      cause: 'Contexte insuffisant (titre vague, pas d\'attributs)',
      solution: 'Enrichissez le titre et les attributs avant de régénérer',
      severity: 'medium'
    },
    {
      symptom: 'L\'IA génère des informations incorrectes',
      cause: 'L\'IA peut "halluciner" sur des spécificités techniques',
      solution: 'Vérifiez et corrigez manuellement. Utilisez des templates avec contraintes.',
      severity: 'medium'
    },
    {
      symptom: 'Les crédits sont épuisés',
      cause: 'Consommation élevée ou plan insuffisant',
      solution: 'Upgradez votre plan ou attendez le renouvellement mensuel',
      severity: 'medium'
    },
    {
      symptom: 'La traduction est incorrecte',
      cause: 'Termes techniques ou argot mal interprétés',
      solution: 'Utilisez l\'option "Vocabulaire métier" pour définir vos termes spécifiques',
      severity: 'low'
    }
  ],
  
  expertTips: [
    {
      title: 'Créez une "bible de marque" IA',
      content: 'Documentez votre ton, vos valeurs, vos mots-clés à utiliser/éviter. Intégrez dans les instructions système. L\'IA générera du contenu aligné avec votre brand.',
      differentiator: 'Instructions système personnalisables par utilisateur.'
    },
    {
      title: 'Utilisez l\'IA pour la veille concurrentielle',
      content: 'Demandez à l\'assistant: "Compare mes prix avec [concurrent] sur la catégorie X". L\'IA analyse et synthétise.',
      differentiator: 'L\'assistant a accès aux données de veille prix intégrées.'
    },
    {
      title: 'Automatisez l\'enrichissement des imports',
      content: 'Configurez: tout nouveau produit importé est automatiquement enrichi par l\'IA. Zero intervention manuelle pour le contenu de base.',
      differentiator: 'Workflow IA natif dans le pipeline d\'import.'
    }
  ],
  
  callToValue: {
    headline: 'L\'IA qui travaille pour vous 24/7',
    description: 'L\'IA ShopOpti+ génère du contenu de qualité en quelques secondes, optimise vos fiches produits et vous donne des insights actionnables. C\'est comme avoir un expert e-commerce disponible en permanence.',
    metrics: [
      { label: 'Temps création fiche', value: '30 sec', improvement: '-95%' },
      { label: 'Score qualité moyen', value: '+25 pts', improvement: '' },
      { label: 'Crédits inclus/mois', value: '1000+', improvement: '' }
    ],
    cta: {
      label: 'Explorer l\'IA',
      route: '/ai'
    }
  },
  
  faqs: [
    {
      question: 'Combien de crédits IA ai-je ?',
      answer: 'Standard: 100/mois. Pro: 1000/mois. Ultra Pro: 10000/mois. Une génération de description = 1 crédit. Un batch de 100 = 100 crédits.'
    },
    {
      question: 'Quel modèle IA est utilisé ?',
      answer: 'ShopOpti+ utilise les derniers modèles OpenAI (GPT-5, GPT-5-mini) via le gateway Lovable AI. Le meilleur modèle est sélectionné automatiquement.'
    },
    {
      question: 'Mes données sont-elles utilisées pour entraîner l\'IA ?',
      answer: 'Non. Vos données sont utilisées uniquement pour générer vos contenus. Elles ne sont pas partagées ni utilisées pour l\'entraînement.'
    }
  ],
  
  relatedModules: ['products', 'automation', 'analytics', 'marketing'],
  externalResources: [
    { label: 'Guide: Prompts efficaces', url: '/academy/ai-prompts' },
    { label: 'Templates de génération', url: '/templates/ai-content' }
  ]
};
